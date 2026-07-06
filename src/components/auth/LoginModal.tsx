import { useState } from "react";
import Modal from "../ui/Modal";
import Label from "../ui/Label";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginModal({
  onClose,
  onLoggedIn,
  login,
}: {
  onClose: () => void;
  onLoggedIn: () => void;
  login: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      onLoggedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal className="max-w-sm" onBackdropClick={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">
          Admin log in
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close ✕
        </Button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
