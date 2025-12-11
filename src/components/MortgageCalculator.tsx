import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, Euro, Percent, Calendar, TrendingUp } from 'lucide-react';

interface MortgageCalculatorProps {
  defaultPrice?: number;
  className?: string;
}

const MortgageCalculator = ({ defaultPrice = 100000, className = '' }: MortgageCalculatorProps) => {
  const [propertyPrice, setPropertyPrice] = useState(defaultPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(7.5);

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    let monthlyPayment = 0;
    if (monthlyInterestRate > 0) {
      monthlyPayment =
        (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = loanAmount / numberOfPayments;
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  }, [propertyPrice, downPaymentPercent, loanTermYears, interestRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Calculator Credit</CardTitle>
            <CardDescription>Estimează rata lunară pentru creditul tău</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Property Price */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              Prețul proprietății
            </Label>
            <span className="text-sm font-medium text-primary">{formatCurrency(propertyPrice)}</span>
          </div>
          <Input
            type="number"
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(Math.max(0, Number(e.target.value)))}
            className="bg-background"
          />
          <Slider
            value={[propertyPrice]}
            onValueChange={(value) => setPropertyPrice(value[0])}
            min={10000}
            max={500000}
            step={5000}
            className="mt-2"
          />
        </div>

        {/* Down Payment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              Avans
            </Label>
            <span className="text-sm font-medium text-primary">
              {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
            </span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(value) => setDownPaymentPercent(value[0])}
            min={5}
            max={80}
            step={5}
            className="mt-2"
          />
        </div>

        {/* Loan Term */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Perioada creditului
            </Label>
            <span className="text-sm font-medium text-primary">{loanTermYears} ani</span>
          </div>
          <Slider
            value={[loanTermYears]}
            onValueChange={(value) => setLoanTermYears(value[0])}
            min={5}
            max={35}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Dobânda anuală
            </Label>
            <span className="text-sm font-medium text-primary">{interestRate}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={3}
            max={15}
            step={0.1}
            className="mt-2"
          />
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Rata lunară estimată</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(calculations.monthlyPayment)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Suma împrumutată</p>
              <p className="text-sm font-semibold">{formatCurrency(calculations.loanAmount)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total dobândă</p>
              <p className="text-sm font-semibold">{formatCurrency(calculations.totalInterest)}</p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total de plată</p>
            <p className="text-sm font-semibold">{formatCurrency(calculations.totalPayment)}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * Calculul este orientativ și nu reprezintă o ofertă de creditare. Contactează-ne pentru o evaluare personalizată.
        </p>
      </CardContent>
    </Card>
  );
};

export default MortgageCalculator;
