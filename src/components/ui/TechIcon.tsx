import type { TechIconData } from "../../utils/techIcons";

export default function TechIcon({ icon, size = 14 }: { icon: TechIconData; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={`#${icon.hex}`}
      role="img"
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}
