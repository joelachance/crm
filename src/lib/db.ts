import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }

  return databaseUrl;
}

function getClient() {
  if (!client) {
    client = neon(getDatabaseUrl());
  }

  return client;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function sql(strings: TemplateStringsArray, ...params: unknown[]) {
  return getClient()(strings, ...params);
}

let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  const db = getClient();

  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        await db.transaction([
          sql`
            CREATE TABLE IF NOT EXISTS linkedin_captures (
              id TEXT PRIMARY KEY,
              source_url TEXT NOT NULL,
              profile_text TEXT NOT NULL,
              extracted_fields JSONB NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `,
          sql`
            CREATE TABLE IF NOT EXISTS product_tags (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              color TEXT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `,
          sql`
            ALTER TABLE product_tags
            ADD COLUMN IF NOT EXISTS color TEXT;
          `,
          sql`
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
          sql`
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
          sql`
            ALTER TABLE people
            ADD COLUMN IF NOT EXISTS company_name TEXT;
          `,
          sql`
            ALTER TABLE people
            ADD COLUMN IF NOT EXISTS notes TEXT;
          `,
          sql`
            ALTER TABLE people
            ADD COLUMN IF NOT EXISTS resume TEXT;
          `,
          sql`
            CREATE TABLE IF NOT EXISTS person_product_tags (
              id SERIAL PRIMARY KEY,
              person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
              product_tag_id INTEGER NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
              is_icp BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              UNIQUE (person_id, product_tag_id)
            );
          `,
          sql`
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
          sql`
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
          `,
          sql`
            DROP TRIGGER IF EXISTS people_set_updated_at ON people;
          `,
          sql`
            CREATE TRIGGER people_set_updated_at
            BEFORE UPDATE ON people
            FOR EACH ROW
            EXECUTE PROCEDURE set_updated_at();
          `
        ]);
      } catch (error) {
        schemaPromise = null;
        throw error;
      }
    })();
  }

  await schemaPromise;
}
