import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { DbSchema, EditableColumns, QueryResult, QueryRow } from "../../types";
import { api } from "../../api/client";
import Button from "../ui/Button";

const STARTER_SQL = "SELECT * FROM companies";
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500];

const QUICK_QUERIES: { label: string; sql: string }[] = [
  { label: "All companies", sql: "SELECT * FROM companies ORDER BY company" },
  {
    label: "All sourced companies",
    sql: "SELECT * FROM sourced_companies ORDER BY company",
  },
  {
    label: "Companies by status",
    sql: "SELECT status, COUNT(*) AS total\nFROM companies\nGROUP BY status\nORDER BY total DESC",
  },
  {
    label: "Open job postings",
    sql: "SELECT company, city, job_url\nFROM companies\nWHERE has_job_posting = 1",
  },
];

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function columnType(schema: DbSchema | null, table: string, column: string): string {
  return schema?.[table]?.find((c) => c.name === column)?.type ?? "varchar";
}

type CellPos = { rowId: string; column: string };

export default function QueryPage() {
  const [sql, setSql] = useState(STARTER_SQL);
  const [schema, setSchema] = useState<DbSchema | null>(null);
  const [editableColumns, setEditableColumns] = useState<EditableColumns | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<"table" | "json">("table");
  const [pageSize, setPageSize] = useState(50);
  // The query actually behind the current results, so editing the textarea
  // doesn't change what Prev/Next paginate through until Run is pressed again.
  const [activeSql, setActiveSql] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline cell editor: staged (unsaved) edits per row id, the one cell
  // currently rendered as an input, per-row save state, and per-row errors.
  const [pendingEdits, setPendingEdits] = useState<Record<string, QueryRow>>({});
  const [editingCell, setEditingCell] = useState<CellPos | null>(null);
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [flashRowId, setFlashRowId] = useState<string | null>(null);

  useEffect(() => {
    api.dbSchema().then(setSchema).catch(() => setSchema(null));
    api.queryEditableColumns().then(setEditableColumns).catch(() => setEditableColumns(null));
  }, []);

  const run = async (query: string, targetPage = 0, sizeOverride?: number) => {
    const trimmed = query.trim();
    if (!trimmed || running) return;
    if (Object.keys(pendingEdits).length > 0) {
      const ok = window.confirm("You have unsaved edits that haven't been saved yet. Discard them and continue?");
      if (!ok) return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await api.runQuery(trimmed, {
        page: targetPage,
        pageSize: sizeOverride ?? pageSize,
      });
      setResult(res);
      setActiveSql(trimmed);
      setPageSize(res.pageSize);
      setPendingEdits({});
      setRowErrors({});
      setEditingCell(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setRunning(false);
    }
  };

  const changePageSize = (size: number) => {
    if (activeSql) run(activeSql, 0, size);
    else setPageSize(size);
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setSql((s) => `${s}${text}`);
      return;
    }
    const start = el.selectionStart ?? sql.length;
    const end = el.selectionEnd ?? sql.length;
    const next = `${sql.slice(0, start)}${text}${sql.slice(end)}`;
    setSql(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run(sql);
    }
  };

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard?.writeText(JSON.stringify(result.rows, null, 2)).catch(() => {});
  };

  const table = result?.editableTable ?? null;
  const editableColSet = table ? new Set(editableColumns?.[table] ?? []) : null;

  const stageEdit = (rowId: string, column: string, value: unknown) => {
    setPendingEdits((p) => ({ ...p, [rowId]: { ...p[rowId], [column]: value } }));
  };

  const discardRow = (rowId: string) => {
    setPendingEdits((p) => {
      const next = { ...p };
      delete next[rowId];
      return next;
    });
    setRowErrors((e) => {
      const next = { ...e };
      delete next[rowId];
      return next;
    });
    if (editingCell?.rowId === rowId) setEditingCell(null);
  };

  const saveRow = async (rowId: string) => {
    const patch = pendingEdits[rowId];
    if (!patch || !table) return;
    setSavingRowIds((s) => new Set(s).add(rowId));
    setRowErrors((e) => {
      const next = { ...e };
      delete next[rowId];
      return next;
    });
    try {
      const coerced: QueryRow = {};
      for (const [column, value] of Object.entries(patch)) {
        const type = columnType(schema, table, column);
        if (type === "int" || type === "bigint" || type === "decimal") {
          const n = Number(value);
          if (Number.isNaN(n)) throw new Error(`"${column}" must be a number`);
          coerced[column] = n;
        } else {
          coerced[column] = value;
        }
      }
      const { row } = await api.updateQueryRow(table, rowId, coerced);
      setResult((r) => (r ? { ...r, rows: r.rows.map((rr) => (String(rr.id) === rowId ? row : rr)) } : r));
      discardRow(rowId);
      setFlashRowId(rowId);
      setTimeout(() => setFlashRowId((cur) => (cur === rowId ? null : cur)), 900);
    } catch (e) {
      setRowErrors((er) => ({ ...er, [rowId]: e instanceof Error ? e.message : "Save failed" }));
    } finally {
      setSavingRowIds((s) => {
        const next = new Set(s);
        next.delete(rowId);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row">
      {/* Schema browser + presets */}
      <aside className="w-full shrink-0 space-y-4 lg:w-64">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Quick queries
          </h2>
          <div className="flex flex-col gap-1">
            {QUICK_QUERIES.map((q) => (
              <button
                key={q.label}
                onClick={() => setSql(q.sql)}
                className="rounded-lg px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tables
          </h2>
          {!schema && <p className="text-sm text-gray-400">Loading schema…</p>}
          {schema && (
            <div className="space-y-3">
              {Object.entries(schema).map(([tbl, columns]) => (
                <div key={tbl}>
                  <button
                    onClick={() => setSql(`SELECT *\nFROM ${tbl}`)}
                    className="rounded-lg px-2 py-1 text-left font-mono text-sm font-medium text-ink-800 hover:bg-gray-100 dark:text-canvas-100 dark:hover:bg-white/10"
                  >
                    {tbl}
                  </button>
                  <div className="mt-1 flex flex-wrap gap-1 px-2">
                    {columns.map((col) => (
                      <button
                        key={col.name}
                        title={col.type}
                        onClick={() => insertAtCursor(col.name)}
                        className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500 hover:bg-brand-100 hover:text-brand-700 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-brand-900/30 dark:hover:text-brand-200"
                      >
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Editor + results */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            rows={6}
            placeholder="SELECT * FROM companies LIMIT 50"
            className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 font-mono text-sm text-ink-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5 dark:text-canvas-100 dark:focus:ring-brand-900/40"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Read-only · SELECT / SHOW / DESCRIBE / EXPLAIN only · results are paginated
              automatically · ⌘/Ctrl+Enter to run
            </p>
            <Button size="sm" onClick={() => run(sql)} disabled={running}>
              {running ? "Running…" : "Run query"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {result.paginated
                  ? `${result.rows.length} of ${result.totalRows} row${result.totalRows === 1 ? "" : "s"}`
                  : `${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`}
                {table && view === "table" && (
                  <span className="ml-2 text-brand-600 dark:text-brand-300">
                    · click a cell to edit
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                {view === "json" && (
                  <Button variant="text" size="xs" onClick={copyJson}>
                    Copy JSON
                  </Button>
                )}
                <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
                  {(["table", "json"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                        view === v
                          ? "bg-gray-100 text-ink-900 dark:bg-white/10 dark:text-canvas-100"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {result.rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No rows returned.</p>
            ) : view === "table" ? (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-ink-900">
                    <tr>
                      {result.columns.map((col) => (
                        <th
                          key={col}
                          className="whitespace-nowrap border-b border-gray-200 px-3 py-2 font-mono text-xs font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400"
                        >
                          {col}
                        </th>
                      ))}
                      {table && (
                        <th className="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => {
                      const rowId = table ? String(row.id) : String(i);
                      const rowEdits = pendingEdits[rowId];
                      const isDirty = Boolean(rowEdits && Object.keys(rowEdits).length > 0);
                      const isSaving = savingRowIds.has(rowId);
                      const rowError = rowErrors[rowId];

                      return (
                        <tr
                          key={rowId}
                          className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 ${
                            flashRowId === rowId ? "animate-row-flash" : ""
                          }`}
                        >
                          {result.columns.map((col) => {
                            const raw = row[col];
                            const isEditable = Boolean(table && editableColSet?.has(col));
                            const dirty = rowEdits && col in rowEdits;
                            const displayValue = dirty ? rowEdits[col] : raw;
                            const isEditingThis =
                              editingCell?.rowId === rowId && editingCell.column === col;

                            if (isEditingThis) {
                              const type = columnType(schema, table ?? "", col);
                              if (type === "tinyint") {
                                return (
                                  <td key={col} className="px-3 py-1.5 align-top">
                                    <input
                                      type="checkbox"
                                      autoFocus
                                      checked={Boolean(Number(displayValue))}
                                      onChange={(e) => stageEdit(rowId, col, e.target.checked)}
                                      onBlur={() => setEditingCell(null)}
                                    />
                                  </td>
                                );
                              }
                              return (
                                <td key={col} className="px-3 py-1">
                                  <input
                                    autoFocus
                                    type={type === "int" ? "number" : "text"}
                                    value={formatCell(displayValue) === "NULL" ? "" : String(displayValue ?? "")}
                                    onChange={(e) => stageEdit(rowId, col, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") setEditingCell(null);
                                      if (e.key === "Escape") {
                                        setPendingEdits((p) => {
                                          const next = { ...p };
                                          if (next[rowId]) {
                                            const { [col]: _drop, ...rest } = next[rowId];
                                            if (Object.keys(rest).length === 0) delete next[rowId];
                                            else next[rowId] = rest;
                                          }
                                          return next;
                                        });
                                        setEditingCell(null);
                                      }
                                    }}
                                    className="w-full min-w-[6rem] rounded-md border border-brand-400 bg-white px-1.5 py-0.5 font-mono text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:bg-ink-900 dark:text-canvas-100"
                                  />
                                </td>
                              );
                            }

                            const text = formatCell(displayValue);
                            return (
                              <td
                                key={col}
                                title={text.length > 60 ? text : undefined}
                                onClick={() => isEditable && setEditingCell({ rowId, column: col })}
                                className={`max-w-xs truncate px-3 py-1.5 align-top font-mono text-xs ${
                                  displayValue === null || displayValue === undefined
                                    ? "italic text-gray-400"
                                    : "text-ink-800 dark:text-canvas-100"
                                } ${
                                  isEditable
                                    ? "cursor-pointer hover:ring-1 hover:ring-inset hover:ring-brand-300"
                                    : ""
                                } ${dirty ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                              >
                                {text}
                              </td>
                            );
                          })}
                          {table && (
                            <td className="px-3 py-1.5 align-top">
                              {isDirty && (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="xs"
                                    onClick={() => saveRow(rowId)}
                                    disabled={isSaving}
                                    className="whitespace-nowrap"
                                  >
                                    {isSaving ? "Saving…" : "Save"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => discardRow(rowId)}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                  {rowError && (
                                    <span className="text-xs text-red-600 dark:text-red-400">{rowError}</span>
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="max-h-[65vh] overflow-auto p-3 font-mono text-xs text-ink-800 dark:text-canvas-100">
                {JSON.stringify(result.rows, null, 2)}
              </pre>
            )}

            {result.paginated && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    disabled={running}
                    className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs dark:border-white/10 dark:bg-white/5 dark:text-canvas-100"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {result.page + 1} of {result.totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={running || result.page <= 0}
                      onClick={() => activeSql && run(activeSql, result.page - 1)}
                    >
                      ← Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={running || result.page >= result.totalPages - 1}
                      onClick={() => activeSql && run(activeSql, result.page + 1)}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
