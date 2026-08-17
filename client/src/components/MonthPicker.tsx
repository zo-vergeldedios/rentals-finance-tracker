import { MONTH_NAMES, shiftMonth } from "../utils";

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthPicker({ year, month, onChange }: Props) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="month-picker">
      <button
        type="button"
        className="btn icon"
        onClick={() => onChange(prev.year, prev.month)}
        aria-label="Previous month"
      >
        &larr;
      </button>
      <span className="month-label">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        type="button"
        className="btn icon"
        onClick={() => onChange(next.year, next.month)}
        aria-label="Next month"
      >
        &rarr;
      </button>
    </div>
  );
}
