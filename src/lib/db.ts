import { neon } from "@neondatabase/serverless";

import { getDatabaseMode } from "@/lib/db/mode";

let client: ReturnType<typeof neon> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  return databaseUrl;
}

function getNeonClient() {
  if (!client) {
    client = neon(getDatabaseUrl());
  }

  return client;
}

export { getDatabaseMode, getDefaultReviewerName, isDatabaseConfigured } from "@/lib/db/mode";

function neonSql(strings: TemplateStringsArray, ...params: unknown[]) {
  return getNeonClient()(strings, ...params);
}

async function sqliteSql(strings: TemplateStringsArray, ...params: unknown[]) {
  const { sqliteSql: run } = await import("@/lib/db/sqlite");
  return run(strings, ...params);
}

export function sql(strings: TemplateStringsArray, ...params: unknown[]) {
  if (getDatabaseMode() === "sqlite") {
    return sqliteSql(strings, ...params);
  }

  return neonSql(strings, ...params);
}

let schemaPromise: Promise<void> | null = null;

async function ensurePostgresSchema() {
  const db = getNeonClient();

  await db.transaction([
    neonSql`
      CREATE TABLE IF NOT EXISTS linkedin_captures (
        id TEXT PRIMARY KEY,
        source_url TEXT NOT NULL,
        profile_text TEXT NOT NULL,
        extracted_fields JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    neonSql`
      CREATE TABLE IF NOT EXISTS product_tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    neonSql`
      ALTER TABLE product_tags
      ADD COLUMN IF NOT EXISTS color TEXT;
    `,
    neonSql`
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
    `,
    neonSql`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        company_name TEXT,
        email TEXT,
        phone_number TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        reddit_url TEXT,
        resume TEXT,
        notes TEXT,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    neonSql`
      ALTER TABLE people
      ADD COLUMN IF NOT EXISTS company_name TEXT;
    `,
    neonSql`
      ALTER TABLE people
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `,
    neonSql`
      ALTER TABLE people
      ADD COLUMN IF NOT EXISTS resume TEXT;
    `,
    neonSql`
      CREATE TABLE IF NOT EXISTS person_product_tags (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        product_tag_id INTEGER NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
        is_icp BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (person_id, product_tag_id)
      );
    `,
    neonSql`
      CREATE TABLE IF NOT EXISTS message_turns (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        outbound_message TEXT NOT NULL,
        response_message TEXT,
        responded BOOLEAN NOT NULL DEFAULT FALSE,
        sent_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    neonSql`
      CREATE TABLE IF NOT EXISTS outreach_drafts (
        id SERIAL PRIMARY KEY,
        review_date DATE NOT NULL,
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
        approved_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        scheduled_by TEXT,
        research_links JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    neonSql`
      ALTER TABLE outreach_drafts
      ADD COLUMN IF NOT EXISTS research_links JSONB NOT NULL DEFAULT '[]'::jsonb;
    `,
    neonSql`
      CREATE INDEX IF NOT EXISTS idx_outreach_drafts_review_date ON outreach_drafts(review_date);
    `,
    neonSql`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
    neonSql`
      DROP TRIGGER IF EXISTS people_set_updated_at ON people;
    `,
    neonSql`
      CREATE TRIGGER people_set_updated_at
      BEFORE UPDATE ON people
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at();
    `
  ]);
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        if (getDatabaseMode() === "sqlite") {
          const { ensureSqliteSchema } = await import("@/lib/db/sqlite");
          await ensureSqliteSchema();
        } else {
          await ensurePostgresSchema();
        }
      } catch (error) {
        schemaPromise = null;
        throw error;
      }
    })();
  }

  await schemaPromise;
}
