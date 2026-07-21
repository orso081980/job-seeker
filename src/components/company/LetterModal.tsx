import { useEffect, useState } from "react";
import type { Company } from "../../types";
import { api } from "../../api/client";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";

export default function LetterModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const result = await api.generateLetter(company.id);
      setAnalysis(result.analysis);
      setLetter(result.letter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate letter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const copyLetter = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
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
            <Textarea rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} />
          </>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
            Regenerate
          </Button>
          <Button size="sm" onClick={copyLetter} disabled={loading || !letter}>
            {copied ? "Copied!" : "Copy letter"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
