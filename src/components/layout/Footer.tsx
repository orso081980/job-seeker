import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-6 dark:border-white/10 dark:bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <Logo size={22} />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} Job Prospects · A personal outreach tracker
        </p>
      </div>
    </footer>
  );
}
