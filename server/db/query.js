// Backs the admin "Query" page (src/components/query/QueryPage.tsx): lets an
// authenticated admin run ad-hoc read-only SQL against the app's own tables
// and see the raw rows, instead of guessing filters through the UI.
//
// This intentionally only ever allows read statements against an allowlist
// of tables -- `admins` (password hashes) is never queryable from here, and
// nothing that writes, alters, or administers the database is permitted,
// even from within a subquery.
import { getPool } from "./pool.js";

export const QUERYABLE_TABLES = ["companies", "sourced_companies", "sent_emails"];

const STATEMENT_RE = /^(select|with|show|describe|desc|explain)\b/i;
// SHOW/DESCRIBE/EXPLAIN can't be used as a derived table, so only SELECT/WITH
// get real page/offset pagination -- the others just run capped, unpaginated.
const PAGINATABLE_RE = /^(select|with)\b/i;
const BLOCKED_RE =
  /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|replace|call|exec|execute|merge|lock|unlock|set|use|load_file|into\s+outfile|into\s+dumpfile|sleep|benchmark)\b/i;
const ADMINS_TABLE_RE = /\badmins\b/i;
// Matches a LIMIT clause only when it's the very last thing in the query, so
// we can safely strip it and let the pager own paging instead -- an earlier
// LIMIT buried inside a subquery is left untouched.
const TRAILING_LIMIT_RE = /\blimit\s+\d+(?:\s*,\s*\d+|\s+offset\s+\d+)?\s*$/i;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

// Tables the inline cell editor is allowed to write back to. `sent_emails` is
// deliberately excluded even though it's queryable -- it's an append-only
// send log by design (see schema.sql), not an editable record.
export const EDITABLE_QUERY_TABLES = ["companies", "sourced_companies"];

// A result set is only editable when every displayed row maps unambiguously
// to one real row of one editable table: a plain `SELECT ... FROM <table>`
// with no second table (JOIN or comma), no GROUP BY/DISTINCT/UNION collapsing
// rows together, and the `id` primary key actually present in the columns.
function detectEditableTable(sql, columns) {
  if (!/^select\b/i.test(sql)) return null; // CTEs (WITH ...) opt out for simplicity
  if (/\bjoin\b|\bunion\b|\bgroup\s+by\b|\bdistinct\b/i.test(sql)) return null;

  const m = sql.match(/\bfrom\s+`?([a-zA-Z_]\w*)`?\s*([\s\S]*)$/i);
  if (!m) return null;
  const [, table, rest] = m;
  const tableLower = table.toLowerCase();
  if (!EDITABLE_QUERY_TABLES.includes(tableLower)) return null;
  if (/^\s*,/.test(rest)) return null; // comma-joined second table
  if (!columns.some((c) => c.toLowerCase() === "id")) return null;
  return tableLower;
}

// Pulls a trailing top-level ORDER BY off `sql` so it can be re-applied to
// the outer paging query (see below) -- without this, wrapping a query in
// `SELECT * FROM (...) AS page_source LIMIT/OFFSET` doesn't reliably keep the
// admin's requested order, since SQL never guarantees a derived table's row
// order survives without an explicit ORDER BY at the outer level.
// Finds the LAST "order by" in the string (the outermost one, if present --
// nested subqueries with their own ORDER BY sort earlier), then bails out
// (treats the query as having no top-level ORDER BY) if splitting there would
// leave unbalanced parens, i.e. the split actually landed inside a subquery.
function extractTrailingOrderBy(sql) {
  const re = /\border\s+by\b/gi;
  let last = null;
  let m;
  while ((m = re.exec(sql))) last = m;
  if (!last) return { rest: sql, orderBy: null };

  const rest = sql.slice(0, last.index).trim();
  const orderBy = sql.slice(last.index + last[0].length).trim();
  const opens = (rest.match(/\(/g) || []).length;
  const closes = (rest.match(/\)/g) || []).length;
  if (!orderBy || opens !== closes) return { rest: sql, orderBy: null };
  return { rest, orderBy };
}

// Re-reads a single row exactly as stored, for the editor to show the fresh
// value after a save. `table` must already be a validated member of
// EDITABLE_QUERY_TABLES -- never build this from unchecked user input.
export async function fetchRawRow(table, id) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");
  if (!EDITABLE_QUERY_TABLES.includes(table)) throw new Error(`"${table}" is not editable`);
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function runReadOnlyQuery(rawSql, { page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");

  const sql = String(rawSql ?? "").trim().replace(/;+\s*$/, "");
  if (!sql) throw new Error("Query is empty");
  if (sql.includes(";")) throw new Error("Only a single statement is allowed");
  if (!STATEMENT_RE.test(sql)) {
    throw new Error("Only SELECT, WITH, SHOW, DESCRIBE, or EXPLAIN queries are allowed");
  }
  if (BLOCKED_RE.test(sql)) {
    throw new Error("Query contains a keyword that isn't allowed in this tool");
  }
  if (ADMINS_TABLE_RE.test(sql)) {
    throw new Error('The "admins" table is not queryable from this tool');
  }

  if (!PAGINATABLE_RE.test(sql)) {
    // SHOW/DESCRIBE/EXPLAIN don't accept a LIMIT clause at all in MySQL
    // syntax, and their result sets (table/column lists, query plans) are
    // inherently small, so there's nothing to cap here.
    const [rows, fields] = await pool.query(sql);
    const rowList = Array.isArray(rows) ? rows : [];
    const columns = fields?.map((f) => f.name) ?? (rowList[0] ? Object.keys(rowList[0]) : []);
    return {
      columns,
      rows: rowList,
      page: 0,
      pageSize: rowList.length,
      totalRows: rowList.length,
      totalPages: 1,
      paginated: false,
      editableTable: null,
    };
  }

  // Whatever the query does (joins, GROUP BY, ORDER BY, ...), treat it as a
  // data source and page over it -- this works regardless of whether the
  // admin wrote their own LIMIT, which we strip so our OFFSET actually moves.
  const size = Math.min(Math.max(1, Math.trunc(Number(pageSize)) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const base = sql.replace(TRAILING_LIMIT_RE, "").trim();

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM (${base}) AS count_source`);
  const totalRows = Number(total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const safePage = Math.min(Math.max(0, Math.trunc(Number(page)) || 0), totalPages - 1);
  const offset = safePage * size;

  const { rest: innerForPaging, orderBy } = extractTrailingOrderBy(base);
  const orderClause = orderBy ? ` ORDER BY ${orderBy}` : "";
  const [rows, fields] = await pool.query(
    `SELECT * FROM (${innerForPaging}) AS page_source${orderClause} LIMIT ${size} OFFSET ${offset}`
  );
  const rowList = Array.isArray(rows) ? rows : [];
  const columns = fields?.map((f) => f.name) ?? (rowList[0] ? Object.keys(rowList[0]) : []);
  const editableTable = detectEditableTable(sql, columns);
  return {
    columns,
    rows: rowList,
    page: safePage,
    pageSize: size,
    totalRows,
    totalPages,
    paginated: true,
    editableTable,
  };
}

export async function listSchema() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");

  const [rows] = await pool.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name IN (?)
     ORDER BY table_name, ordinal_position`,
    [QUERYABLE_TABLES]
  );

  const byTable = {};
  for (const table of QUERYABLE_TABLES) byTable[table] = [];
  for (const r of rows) {
    (byTable[r.table_name] ??= []).push({ name: r.column_name, type: r.data_type });
  }
  return byTable;
}
