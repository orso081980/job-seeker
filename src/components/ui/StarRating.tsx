export default function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) {
  const readOnly = !onChange;
  const cls = size === "sm" ? "text-sm" : "text-lg";
  return (
    <div className={`flex gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(n === value ? 0 : n);
          }}
          className={`leading-none ${
            n <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
          } ${readOnly ? "cursor-default" : "cursor-pointer hover:text-amber-400"}`}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
