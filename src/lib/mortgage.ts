/**
 * Single source of truth for mortgage math and defaults.
 * Used by /calculator-credit (CreditSimulator) and the compact
 * calculator on property pages.
 */

/** Default annual interest rate (%) for mortgage credit. */
export const DEFAULT_MORTGAGE_RATE = 6.5;
/** Default down payment share (%) used for property page prefill. */
export const DEFAULT_DOWN_PAYMENT_PCT = 15;
/** Default term in years used for property page prefill. */
export const DEFAULT_TERM_YEARS = 30;

export interface MortgageInput {
  /** Property price, in the display currency. */
  price: number;
  /** Down payment, percent of price. */
  downPaymentPct: number;
  /** Term in years. */
  years: number;
  /** Annual interest rate, percent. */
  interestRate: number;
}

export interface MortgageResult {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
}

/** Standard annuity formula. Returns 0 for degenerate inputs. */
export function monthlyPayment(loan: number, years: number, annualRatePct: number): number {
  const n = Math.round(years * 12);
  if (!(loan > 0) || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return loan / n;
  return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function computeMortgage({ price, downPaymentPct, years, interestRate }: MortgageInput): MortgageResult {
  const p = Math.max(0, price || 0);
  const downPayment = (p * Math.max(0, downPaymentPct || 0)) / 100;
  const loanAmount = Math.max(0, p - downPayment);
  const monthly = monthlyPayment(loanAmount, years, interestRate);
  const n = Math.round(years * 12);
  const totalPaid = monthly * n;
  return {
    downPayment,
    loanAmount,
    monthlyPayment: monthly,
    totalInterest: Math.max(0, totalPaid - loanAmount),
    totalPaid,
  };
}

export const formatEur = (value: number): string =>
  `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(Math.round(value || 0))} €`;

export const MORTGAGE_DISCLAIMER =
  "Calcul orientativ. Nu reprezintă o ofertă de creditare. Rata finală depinde de banca aleasă, de dobânda acordată și de analiza financiară.";
