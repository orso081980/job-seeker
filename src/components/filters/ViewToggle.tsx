export default function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "kanban";
  onChange: (v: "grid" | "kanban") => void;
}) {
  const optionCls = (active: boolean) =>
    `px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-ink-900 text-white dark:bg-white dark:text-ink-950"
        : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
    }`;

  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-white/10">
      <button onClick={() => onChange("grid")} className={optionCls(view === "grid")}>
        Grid
      </button>
      <button onClick={() => onChange("kanban")} className={optionCls(view === "kanban")}>
        Kanban
      </button>
    </div>
  );
}
