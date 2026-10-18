"""Database layer (SQLite for the prototype; the schema moves to PostgreSQL as is).

Safety rules enforced by the DATABASE itself, not only by app code:
  * blocks, mutation_events, anchors and audit_log are append-only (no UPDATE / DELETE)
  * a new block must extend its plot's chain exactly (right seq AND right prev hash)
"""
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS plots(
  plot_id TEXT PRIMARY KEY, mouza TEXT NOT NULL, owner TEXT NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0, area_decimal REAL NOT NULL,
  khas INTEGER NOT NULL DEFAULT 0, acquisition INTEGER NOT NULL DEFAULT 0,
  court_case INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS blocks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plot_id TEXT NOT NULL, seq INTEGER NOT NULL, kind TEXT NOT NULL, deed_no TEXT NOT NULL,
  frm TEXT NOT NULL, "to" TEXT NOT NULL, ts INTEGER NOT NULL,
  doc_hash TEXT NOT NULL, doc TEXT NOT NULL, price_bdt INTEGER NOT NULL,
  office_id TEXT NOT NULL, prev TEXT NOT NULL, hash TEXT NOT NULL UNIQUE, sig TEXT NOT NULL,
  UNIQUE(plot_id, seq));

CREATE TABLE IF NOT EXISTS mutations(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tracking_id TEXT NOT NULL UNIQUE,
  plot_id TEXT NOT NULL, deed_hash TEXT NOT NULL UNIQUE, state TEXT NOT NULL,
  checks TEXT NOT NULL, created_ts INTEGER NOT NULL, updated_ts INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS mutation_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT, mutation_id INTEGER NOT NULL,
  state TEXT NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS survey_records(
  plot_id TEXT NOT NULL, survey TEXT NOT NULL, khatian_no TEXT NOT NULL,
  holder TEXT NOT NULL, area_decimal REAL NOT NULL, PRIMARY KEY(plot_id, survey));

CREATE TABLE IF NOT EXISTS liens(
  id INTEGER PRIMARY KEY AUTOINCREMENT, plot_id TEXT NOT NULL, bank TEXT NOT NULL,
  amount_bdt INTEGER NOT NULL, ts INTEGER NOT NULL,
  released INTEGER NOT NULL DEFAULT 0, released_ts INTEGER);

CREATE TABLE IF NOT EXISTS anchors(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL,
  merkle_root TEXT NOT NULL, block_count INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS alerts(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, plot_id TEXT NOT NULL,
  code TEXT NOT NULL, level TEXT NOT NULL, detail TEXT NOT NULL, actor TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, actor TEXT NOT NULL,
  action TEXT NOT NULL, plot_id TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '');

CREATE INDEX IF NOT EXISTS idx_blocks_plot ON blocks(plot_id, seq);
CREATE INDEX IF NOT EXISTS idx_blocks_dochash ON blocks(doc_hash);
"""

APPEND_ONLY = ("blocks", "mutation_events", "anchors", "audit_log")

TRIGGERS = [
    f"""CREATE TRIGGER IF NOT EXISTS {t}_no_update BEFORE UPDATE ON {t}
        BEGIN SELECT RAISE(ABORT, '{t} is append-only'); END;"""
    for t in APPEND_ONLY
] + [
    f"""CREATE TRIGGER IF NOT EXISTS {t}_no_delete BEFORE DELETE ON {t}
        BEGIN SELECT RAISE(ABORT, '{t} is append-only'); END;"""
    for t in APPEND_ONLY
] + [
    """CREATE TRIGGER IF NOT EXISTS blocks_chain_guard BEFORE INSERT ON blocks
       WHEN NEW.seq != COALESCE((SELECT MAX(seq) FROM blocks WHERE plot_id = NEW.plot_id), 0) + 1
         OR NEW.prev != COALESCE((SELECT hash FROM blocks WHERE plot_id = NEW.plot_id
                                  ORDER BY seq DESC LIMIT 1), 'GENESIS')
       BEGIN SELECT RAISE(ABORT, 'chain guard: block does not extend the chain'); END;""",
]

TRIGGER_NAMES = [f"{t}_no_{op}" for t in APPEND_ONLY for op in ("update", "delete")] + ["blocks_chain_guard"]


def connect(path: str = ":memory:") -> sqlite3.Connection:
    con = sqlite3.connect(path, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    for t in TRIGGERS:
        con.execute(t)
    con.commit()
    return con
