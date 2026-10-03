import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { getSqlitePath } from "@/lib/db/mode";

let database: Database.Database | null = null;

function getDatabase() {
  if (!database) {
    const filePath = path.resolve(process.cwd(), getSqlitePath());
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    database = new Database(filePath);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
  }

  return database;
}

function buildQuery(strings: TemplateStringsArray, params: unknown[]) {
  let query = strings[0];

  for (let index = 0; index < params.length; index += 1) {
    query += `?${strings[index + 1]}`;
  }

  return query;
}

export function sqliteSql(strings: TemplateStringsArray, ...params: unknown[]) {
  const db = getDatabase();
  const query = buildQuery(strings, params);
  const statement = db.prepare(query);

  const firstChunk = strings[0].trimStart().toUpperCase();

  if (firstChunk.startsWith("SELECT") || firstChunk.startsWith("WITH")) {
    return Promise.resolve(statement.all(...params));
  }

  if (firstChunk.startsWith("INSERT") && query.toUpperCase().includes("RETURNING")) {
    const info = statement.run(...params);
    const tableMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
    const table = tableMatch?.[1];

    if (table && info.lastInsertRowid) {
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
      return Promise.resolve(row ? [row] : [{ id: info.lastInsertRowid }]);
    }

    return Promise.resolve([{ id: info.lastInsertRowid }]);
  }

  const info = statement.run(...params);
  return Promise.resolve([{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }]);
}

export async function ensureSqliteSchema() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_captures (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      profile_text TEXT NOT NULL,
      extracted_fields TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone_number TEXT,
      linkedin_url TEXT,
      twitter_url TEXT,
      reddit_url TEXT,
      resume TEXT,
      notes TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS person_product_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      product_tag_id INTEGER NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
      is_icp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (person_id, product_tag_id)
    );

    CREATE TABLE IF NOT EXISTS message_turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      outbound_message TEXT NOT NULL,
      response_message TEXT,
      responded INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL,
      responded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS outreach_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_date TEXT NOT NULL,
      person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      recipient_name TEXT NOT NULL,
      recipient_company TEXT,
      channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin')),
      subject TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'scheduled', 'sent')),
      approved_by TEXT,
      approved_subject TEXT,
      approved_body TEXT,
      approved_at TEXT,
      scheduled_at TEXT,
      scheduled_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_outreach_drafts_review_date ON outreach_drafts(review_date);
  `);

  db.prepare(
    `
      UPDATE product_tags
      SET color = CASE MOD(id - 1, 8)
        WHEN 0 THEN '#7dd3fc'
        WHEN 1 THEN '#86efac'
        WHEN 2 THEN '#f9a8d4'
        WHEN 3 THEN '#fca5a5'
        WHEN 4 THEN '#c4b5fd'
        WHEN 5 THEN '#fdba74'
        WHEN 6 THEN '#93c5fd'
        ELSE '#fcd34d'
      END
      WHERE color IS NULL OR color = '';
    `
  ).run();
}
