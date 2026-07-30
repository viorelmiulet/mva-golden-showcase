interface SpecRailProps {
  /** Ordered short strings, e.g. ["2 CAM", "58 MP", "ET 3/8", "2024"] */
  items: (string | number | null | undefined)[];
  className?: string;
}

/**
 * Single-line property spec rail: 2 CAM · 58 MP · ET 3/8 · 2024
 * Never wraps — truncates with ellipsis on overflow.
 */
const SpecRail = ({ items, className }: SpecRailProps) => {
  const values = items
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .map((v) => String(v).trim());

  if (values.length === 0) return null;

  return (
    <p
      className={`text-spec text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ${className ?? ""}`}
      title={values.join(" · ")}
    >
      {values.map((value, index) => (
        <span key={`${value}-${index}`}>
          {index > 0 && <span aria-hidden="true" className="px-2">·</span>}
          {value}
        </span>
      ))}
    </p>
  );
};

export default SpecRail;
export { SpecRail };
