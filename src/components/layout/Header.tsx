import type { MouseEvent } from "react";
import Logo from "./Logo";
import Button from "../ui/Button";

export default function Header({
  companyCount,
  jobCount,
  authed,
  onGoHome,
  onLogout,
  onLoginClick,
}: {
  companyCount: number;
  jobCount: number;
  authed: boolean;
  onGoHome: (e: MouseEvent) => void;
  onLogout: () => void;
  onLoginClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-ink-950/90">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <a href="/" onClick={onGoHome} className="inline-flex w-fit">
            <Logo />
          </a>
          {authed ? (
            <Button variant="ghost" size="xs" onClick={onLogout}>
              Logged in as admin · Log out
            </Button>
          ) : (
            <Button variant="ghostBrand" size="xs" onClick={onLoginClick}>
              Log in
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {companyCount} companies tracked · {jobCount} with an open job posting
        </p>
      </div>
    </header>
  );
}
