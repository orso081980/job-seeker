import type { MouseEvent } from "react";
import Logo from "./Logo";
import Button from "../ui/Button";
import ScreenshotsButton from "./ScreenshotsButton";

export default function Header({
  companyCount,
  jobCount,
  authed,
  page,
  onGoHome,
  onGridClick,
  onKanbanClick,
  onProgressClick,
  onSourcingClick,
  onQueryClick,
  onLogout,
  onLoginClick,
  onScreenshotsDone,
}: {
  companyCount: number;
  jobCount: number;
  authed: boolean;
  page: "companies-grid" | "companies-kanban" | "progress" | "sourcing" | "query";
  onGoHome: (e: MouseEvent) => void;
  onGridClick: () => void;
  onKanbanClick: () => void;
  onProgressClick: () => void;
  onSourcingClick: () => void;
  onQueryClick: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onScreenshotsDone: () => void;
}) {
  const navCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-gray-100 text-ink-900 dark:bg-white/10 dark:text-canvas-100"
        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-ink-950/90">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <a href="/" onClick={onGoHome} className="mr-2 inline-flex w-fit">
              <Logo />
            </a>
            <nav className="hidden items-center gap-1 sm:flex">
              <span className="px-2 text-sm font-medium text-gray-400 dark:text-gray-500">
                Companies
              </span>
              <button onClick={onGridClick} className={navCls(page === "companies-grid")}>
                Grid
              </button>
              <button onClick={onKanbanClick} className={navCls(page === "companies-kanban")}>
                Kanban
              </button>
              <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-white/10" aria-hidden="true" />
              <button onClick={onProgressClick} className={navCls(page === "progress")}>
                Progress
              </button>
              <button onClick={onSourcingClick} className={navCls(page === "sourcing")}>
                Source companies
              </button>
              <button onClick={onQueryClick} className={navCls(page === "query")}>
                Query
              </button>
            </nav>
          </div>
          {authed ? (
            <div className="flex items-center gap-3">
              <ScreenshotsButton onDone={onScreenshotsDone} />
              <Button variant="ghost" size="xs" onClick={onLogout}>
                Logged in as admin · Log out
              </Button>
            </div>
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
