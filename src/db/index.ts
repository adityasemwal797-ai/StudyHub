import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";

/**
 * Database resolution order:
 *  1. DATABASE_URL is set        → real Postgres via node-postgres (production).
 *  2. Otherwise                  → embedded PGlite (real Postgres in WASM, in-memory)
 *                                  with tables auto-created and seeded with a few
 *                                  starter resources, so the app always boots.
 */

const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

export type Database =
  | ReturnType<typeof drizzlePg>
  | ReturnType<typeof drizzlePglite>;

const globalForDb = globalThis as typeof globalThis & {
  __pool?: Pool;
  __pglite?: PGlite;
  __pgliteReady?: Promise<void>;
};

const SEED_SQL = `
CREATE TABLE IF NOT EXISTS resources (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  url text,
  description text,
  category varchar(100) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS planner_tasks (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'pending' NOT NULL,
  due_date varchar(20),
  created_at timestamp DEFAULT now() NOT NULL
);
INSERT INTO resources (title, type, url, description, category)
SELECT * FROM (VALUES
  ('NCERT Class 10 Science (Complete)', 'book', 'https://ncert.nic.in/textbook/textbook.htm', 'Official NCERT textbook, chapters 1-16 with diagrams. Must-read for CBSE Boards.', 'ncert'),
  ('NCERT Class 10 Mathematics', 'book', 'https://ncert.nic.in/textbook/textbook.htm', 'Real numbers to trigonometry — the whole NCERT Maths syllabus with exercises.', 'ncert'),
  ('NCERT Class 12 Physics Part 1', 'book', 'https://ncert.nic.in/textbook/textbook.htm', 'Electrostatics, magnetism, optics and modern physics full text.', 'ncert'),
  ('Last 10 Years Board Question Papers', 'link', 'https://cbseacademic.nic.in/SQP_CLASSX_2020-21.html', 'Solved previous-year papers with marking scheme. Best exam practice.', 'exams'),
  ('Handwritten Chemistry Notes — Organic', 'file', NULL, 'Concise reaction maps, named reactions and mnemonics for Organic Chemistry.', 'notes'),
  ('Khan Academy — All Subjects', 'link', 'https://www.khanacademy.org', 'Free video lessons and practice for Maths, Science and more.', 'study'),
  ('Physics Wallah — One Shot Lectures', 'link', 'https://www.youtube.com/@PhysicsWallah', 'Full-chapter one-shot revision videos in Hindi and English.', 'study'),
  ('English Grammar for Boards', 'file', NULL, 'Quick revision sheets: tenses, clauses, transformation of sentences.', 'notes')
) AS seed(title, type, url, description, category)
WHERE NOT EXISTS (SELECT 1 FROM resources);
`;

function createPglite() {
  if (!globalForDb.__pglite) {
    globalForDb.__pglite = new PGlite();
    globalForDb.__pgliteReady = globalForDb.__pglite.exec(SEED_SQL).then(() => undefined);
  }
  return globalForDb.__pglite;
}

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;
  if (IS_BUILD) {
    // Build-time only: routes are not executed, return a stub that errors clearly.
    throw new Error("Database is not available during build");
  }
  if (process.env.DATABASE_URL) {
    if (!globalForDb.__pool) {
      globalForDb.__pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    _db = drizzlePg(globalForDb.__pool);
  } else {
    const client = createPglite();
    _db = drizzlePglite(client);
  }
  return _db;
}

/** Wait for the embedded database schema/seed to be ready (no-op with DATABASE_URL). */
export async function dbReady(): Promise<void> {
  if (IS_BUILD) return;
  getDb();
  if (globalForDb.__pgliteReady) await globalForDb.__pgliteReady;
}

/** Lazily-initialised drizzle instance — safe to import anywhere. */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const target = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(target) : value;
  },
}) as Database;

/** Backwards-compatible export: the underlying Pool (only with DATABASE_URL set). */
export const pool = IS_BUILD ? undefined : process.env.DATABASE_URL ? (getDb(), globalForDb.__pool) : undefined;
