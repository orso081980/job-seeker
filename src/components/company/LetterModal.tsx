import { useEffect, useState } from "react";
import type { Company, SentEmail } from "../../types";
import { api } from "../../api/client";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

export default function LetterModal({
  company,
  onClose,
  onUpdate,
}: {
  company: Company;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Company>) => Promise<unknown>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [subject, setSubject] = useState("");
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const [sending, setSending] = useState<"test" | "real" | null>(null);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [history, setHistory] = useState<SentEmail[]>([]);

  const loadHistory = () => {
    api.listSentEmails(company.id).then(setHistory).catch(() => {});
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setSendMessage(null);
    setSendError(null);
    try {
      const result = await api.generateLetter(company.id);
      setAnalysis(result.analysis);
      setSubject(result.subject);
      setLetter(result.letter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate letter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const copyLetter = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
  };

  const sendTest = async () => {
    setSending("test");
    setSendError(null);
    setSendMessage(null);
    try {
      const result = await api.sendLetter(company.id, { subject, letter, test: true });
      setSendMessage(`Test email sent to ${result.to} — check your inbox.`);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send test email");
    } finally {
      setSending(null);
    }
  };

  const sendToCompany = async () => {
    if (!confirm(`Send this email to ${company.contactEmail}? This cannot be undone.`)) return;
    setSending("real");
    setSendError(null);
    setSendMessage(null);
    try {
      const result = await api.sendLetter(company.id, { subject, letter, test: false });
      setSendMessage(`Sent to ${result.to}.`);
      await onUpdate(company.id, { status: "contacted" });
      loadHistory();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal onBackdropClick={onClose} className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Outreach letter — {company.company}
        </h2>
        <Button variant="ghost" size="xs" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Generating…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {analysis && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                {analysis}
              </div>
            )}
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} />
          </>
        )}

        {sendMessage && <p className="text-sm text-green-600">{sendMessage}</p>}
        {sendError && <p className="text-sm text-red-600">{sendError}</p>}

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={generate} disabled={loading || sending !== null}>
            Regenerate
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyLetter} disabled={loading || !letter}>
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={sendTest}
              disabled={loading || sending !== null || !letter}
            >
              {sending === "test" ? "Sending…" : "Send test to myself"}
            </Button>
            <Button
              size="sm"
              onClick={sendToCompany}
              disabled={loading || sending !== null || !letter || !company.contactEmail}
              title={company.contactEmail ? undefined : "This company has no contact email on file"}
            >
              {sending === "real" ? "Sending…" : "Send to company"}
            </Button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="border-t border-gray-200 pt-3 dark:border-white/10">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Previously sent ({history.length})
            </p>
            <ul className="space-y-1">
              {history.map((h) => (
                <li key={h.id} className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(h.sentAt).toLocaleString()} — {h.subject}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
