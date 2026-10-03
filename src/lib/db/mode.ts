export type DatabaseMode = "neon" | "sqlite";

export function getDatabaseMode(): DatabaseMode {
  return process.env.DATABASE_URL ? "neon" : "sqlite";
}

/** True when the app can persist data (Neon Postgres or local SQLite file). */
export function isDatabaseConfigured() {
  return true;
}

export function getSqlitePath() {
  return process.env.SQLITE_PATH ?? ".data/era-local.sqlite";
}

export function getDefaultReviewerName() {
  return process.env.REVIEWER_NAME?.trim() || "Joe LaChance";
}
