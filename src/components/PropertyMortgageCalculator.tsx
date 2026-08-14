import { useMemo, useState } from "react";
import {
  DEFAULT_DOWN_PAYMENT_PCT,
  DEFAULT_MORTGAGE_RATE,
  DEFAULT_TERM_YEARS,
  MORTGAGE_DISCLAIMER,
  computeMortgage,
  formatEur,
} from "@/lib/mortgage";

interface Props {
  price: number;
  className?: string;
}

/**
 * Compact mortgage estimate for property pages.
 * Collapsed line is rendered server-side; the controls hydrate after.
 */
const PropertyMortgageCalculator = ({ price, className = "" }: Props) => {
  const [open, setOpen] = useState(false);
  const [downPct, setDownPct] = useState(DEFAULT_DOWN_PAYMENT_PCT);
  const [years, setYears] = useState(DEFAULT_TERM_YEARS);
  const [rate, setRate] = useState(DEFAULT_MORTGAGE_RATE);

  const result = useMemo(
    () => computeMortgage({ price, downPaymentPct: downPct, years, interestRate: rate }),
    [price, downPct, years, rate]
  );

  if (!price || price <= 0) return null;

  const fieldClass =
    "w-full h-9 px-2 border border-stone rounded-sm bg-transparent text-body text-foreground tabular-nums";

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-body text-foreground">
          Rată estimată:{" "}
          <span className="tabular-nums font-medium">{formatEur(result.monthlyPayment)}</span>
          <span className="text-muted-foreground">/lună</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-small text-brass underline shrink-0"
        >
          {open ? "Închide" : "Calculează"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-spec text-muted-foreground">AVANS %</span>
              <input
                type="number"
                min={0}
                max={90}
                value={downPct}
                onChange={(e) => setDownPct(Math.min(90, Math.max(0, Number(e.target.value))))}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-spec text-muted-foreground">ANI</span>
              <input
                type="number"
                min={1}
                max={35}
                value={years}
                onChange={(e) => setYears(Math.min(35, Math.max(1, Number(e.target.value))))}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-spec text-muted-foreground">DOBÂNDĂ %</span>
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Math.min(20, Math.max(0, Number(e.target.value))))}
                className={fieldClass}
              />
            </label>
          </div>

          <dl className="space-y-2">
            <div className="flex items-baseline justify-between gap-4 py-2 border-b border-stone">
              <dt className="text-spec text-muted-foreground">RATĂ LUNARĂ</dt>
              <dd className="text-body text-foreground tabular-nums">{formatEur(result.monthlyPayment)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2 border-b border-stone">
              <dt className="text-spec text-muted-foreground">DOBÂNDĂ TOTALĂ</dt>
              <dd className="text-body text-foreground tabular-nums">{formatEur(result.totalInterest)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2 border-b border-stone">
              <dt className="text-spec text-muted-foreground">TOTAL DE PLATĂ</dt>
              <dd className="text-body text-foreground tabular-nums">{formatEur(result.totalPaid)}</dd>
            </div>
          </dl>
        </div>
      )}

      <p className="text-small text-muted-foreground mt-3">{MORTGAGE_DISCLAIMER}</p>
    </div>
  );
};

export default PropertyMortgageCalculator;
