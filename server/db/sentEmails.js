import { getPool } from "./pool.js";

function fromRow(r) {
  return {
    id: r.id,
    companyId: r.company_id,
    companyName: r.company_name,
    toEmail: r.to_email,
    subject: r.subject,
    body: r.body,
    sentAt: r.sent_at,
  };
}

function requirePool() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

// Append-only: no update/delete by design (see schema.sql). Test sends never
// come through here -- only letters actually sent to a company.
export async function insertSentEmail({ companyId, companyName, toEmail, subject, body }) {
  await requirePool().query(
    "INSERT INTO sent_emails (company_id, company_name, to_email, subject, body, sent_at) VALUES (?, ?, ?, ?, ?, ?)",
    [companyId, companyName, toEmail, subject, body, new Date().toISOString()]
  );
}

export async function listSentEmails(companyId) {
  const pool = requirePool();
  const [rows] = companyId
    ? await pool.query("SELECT * FROM sent_emails WHERE company_id = ? ORDER BY sent_at DESC", [companyId])
    : await pool.query("SELECT * FROM sent_emails ORDER BY sent_at DESC");
  return rows.map(fromRow);
}
