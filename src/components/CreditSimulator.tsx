import { useState, useMemo, useCallback, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CreditSimulator.css';

type CreditType = 'ipotecar' | 'personal';
type Currency = 'RON' | 'EUR';
type RateType = 'fixa' | 'variabila';
type TableView = 'lunar' | 'anual';

const CreditSimulator = () => {
  const [creditType, setCreditType] = useState<CreditType>('ipotecar');
  const [currency, setCurrency] = useState<Currency>('RON');
  const [propertyValue, setPropertyValue] = useState(300000);
  const [downPaymentPct, setDownPaymentPct] = useState(15);
  const [years, setYears] = useState(25);
  const [interestRate, setInterestRate] = useState(6.5);
  const [rateType, setRateType] = useState<RateType>('fixa');
  const [extraCosts, setExtraCosts] = useState(0);
  const [tableView, setTableView] = useState<TableView>('lunar');

  // Local string states for editable inputs (prevents clamping while typing)
  const [inputValue, setInputValue] = useState(String(propertyValue));
  const [inputDown, setInputDown] = useState(String(downPaymentPct));
  const [inputYears, setInputYears] = useState(String(years));
  const [inputRate, setInputRate] = useState(String(interestRate));
  const [inputExtra, setInputExtra] = useState(String(extraCosts));

  // Sync local inputs when values change from sliders or type switches
  useEffect(() => { setInputValue(String(propertyValue)); }, [propertyValue]);
  useEffect(() => { setInputDown(String(downPaymentPct)); }, [downPaymentPct]);
  useEffect(() => { setInputYears(String(years)); }, [years]);
  useEffect(() => { setInputRate(String(interestRate)); }, [interestRate]);
  useEffect(() => { setInputExtra(String(extraCosts)); }, [extraCosts]);

  const isPersonal = creditType === 'personal';

  const limits = useMemo(() => {
    if (isPersonal) {
      return {
        valMin: currency === 'RON' ? 5000 : 1000,
        valMax: currency === 'RON' ? 250000 : 50000,
        valStep: currency === 'RON' ? 1000 : 500,
        yrMin: 1, yrMax: 10,
        rateMin: 5, rateMax: 25,
      };
    }
    return {
      valMin: currency === 'RON' ? 50000 : 10000,
      valMax: currency === 'RON' ? 2000000 : 500000,
      valStep: currency === 'RON' ? 5000 : 1000,
      yrMin: 5, yrMax: 35,
      rateMin: 1, rateMax: 20,
    };
  }, [isPersonal, currency]);

  // Clamp values when switching types
  const clampedValue = Math.min(Math.max(propertyValue, limits.valMin), limits.valMax);
  const clampedYears = Math.min(Math.max(years, limits.yrMin), limits.yrMax);
  const clampedRate = Math.min(Math.max(interestRate, limits.rateMin), limits.rateMax);
  const effectiveDownPct = isPersonal ? 0 : downPaymentPct;

  const calc = useMemo(() => {
    const P = clampedValue;
    const dp = (P * effectiveDownPct) / 100;
    const loan = P - dp;
    const n = clampedYears * 12;
    const r = clampedRate / 100 / 12;

    let monthly = 0;
    if (r > 0 && n > 0) {
      monthly = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else if (n > 0) {
      monthly = loan / n;
    }

    const totalExtra = extraCosts * n;
    const totalPaid = monthly * n + totalExtra;
    const totalInterest = monthly * n - loan;
    const ltv = P > 0 ? ((P - dp) / P) * 100 : 0;

    // Amortization
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = loan;
    for (let i = 1; i <= n; i++) {
      const intPart = balance * r;
      const prinPart = monthly - intPart;
      balance = Math.max(0, balance - prinPart);
      schedule.push({ month: i, payment: monthly, principal: prinPart, interest: intPart, balance });
    }

    // Annual summary
    const annual: { year: number; principal: number; interest: number; balance: number }[] = [];
    for (let y = 1; y <= clampedYears; y++) {
      const yearRows = schedule.filter(s => Math.ceil(s.month / 12) === y);
      const yPrin = yearRows.reduce((a, b) => a + b.principal, 0);
      const yInt = yearRows.reduce((a, b) => a + b.interest, 0);
      const lastBal = yearRows.length > 0 ? yearRows[yearRows.length - 1].balance : 0;
      annual.push({ year: y, principal: yPrin, interest: yInt, balance: lastBal });
    }

    // Interest percentage of total
    const interestPct = totalPaid > 0 ? (totalInterest / totalPaid) * 100 : 0;

    return { loan, dp, monthly, totalInterest, totalPaid, totalExtra, ltv, schedule, annual, interestPct };
  }, [clampedValue, effectiveDownPct, clampedYears, clampedRate, extraCosts]);

  const fmt = (v: number) => {
    return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v));
  };

  const fmtShort = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
    return fmt(v);
  };

  // Donut chart
  const circumference = 2 * Math.PI * 60;
  const principalPct = calc.totalPaid > 0 ? (calc.loan / calc.totalPaid) * 100 : 0;
  const interestPct = calc.totalPaid > 0 ? (calc.totalInterest / calc.totalPaid) * 100 : 0;
  const extraPct = calc.totalPaid > 0 ? (calc.totalExtra / calc.totalPaid) * 100 : 0;

  const seg1 = (principalPct / 100) * circumference;
  const seg2 = (interestPct / 100) * circumference;
  const seg3 = (extraPct / 100) * circumference;

  // Bar chart - max payment for scaling
  const maxAnnualPayment = Math.max(...calc.annual.map(a => a.principal + a.interest), 1);

  // LTV color
  const ltvColor = calc.ltv <= 60 ? 'var(--cs-green)' : calc.ltv <= 80 ? 'var(--cs-gold)' : 'var(--cs-red)';

  const handleCreditTypeChange = (type: CreditType) => {
    setCreditType(type);
    if (type === 'personal') {
      setPropertyValue(currency === 'RON' ? 50000 : 10000);
      setYears(5);
      setInterestRate(9);
    } else {
      setPropertyValue(currency === 'RON' ? 300000 : 60000);
      setYears(25);
      setInterestRate(6.5);
    }
  };

  const handleCurrencyChange = (cur: Currency) => {
    const ratio = cur === 'EUR' ? 1 / 5 : 5;
    setCurrency(cur);
    setPropertyValue(Math.round(propertyValue * ratio));
    setExtraCosts(Math.round(extraCosts * ratio));
  };
  const removeDiacritics = (text: string) =>
    text.replace(/[ăâ]/g, 'a').replace(/[ÂĂ]/g, 'A')
        .replace(/[î]/g, 'i').replace(/[Î]/g, 'I')
        .replace(/[șş]/g, 's').replace(/[ȘŞ]/g, 'S')
        .replace(/[țţ]/g, 't').replace(/[ȚŢ]/g, 'T');

  const downloadPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const d = removeDiacritics;

    // Title
    doc.setFontSize(18);
    doc.text(d('Scadentar Credit - MVA Imobiliare'), pageW / 2, 20, { align: 'center' });

    // Summary
    doc.setFontSize(11);
    const summaryY = 32;
    const tipCredit = isPersonal ? 'Nevoi Personale' : 'Ipotecar';
    const lines = [
      d(`Tip credit: ${tipCredit}  |  Moneda: ${currency}`),
      d(`${isPersonal ? 'Suma imprumut' : 'Valoare proprietate'}: ${fmt(clampedValue)} ${currency}`) +
        (isPersonal ? '' : d(`  |  Avans: ${effectiveDownPct}% (${fmt(calc.dp)} ${currency})`)),
      d(`Suma creditata: ${fmt(calc.loan)} ${currency}  |  Perioada: ${clampedYears} ani  |  Dobanda: ${clampedRate.toFixed(1)}%/an (${rateType === 'fixa' ? 'Fixa' : 'Variabila IRCC'})`),
      d(`Rata lunara: ${fmt(calc.monthly)} ${currency}  |  Total dobanda: ${fmt(calc.totalInterest)} ${currency}  |  Cost total: ${fmt(calc.totalPaid)} ${currency}`),
    ];
    lines.forEach((line, i) => {
      doc.text(line, 14, summaryY + i * 7);
    });

    // Monthly table
    const startY = summaryY + lines.length * 7 + 8;
    doc.setFontSize(13);
    doc.text(d('Plan Amortizare Lunar'), 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Luna', 'Rata', 'Principal', d('Dobanda'), d('Sold ramas')]],
      body: calc.schedule.map((r) => [
        `${r.month}`,
        `${fmt(r.payment)} ${currency}`,
        `${fmt(r.principal)} ${currency}`,
        `${fmt(r.interest)} ${currency}`,
        `${fmt(r.balance)} ${currency}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [201, 168, 76], textColor: [10, 12, 15], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 240] },
      margin: { left: 14, right: 14 },
    });

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        d(`Generat de MVA Imobiliare — mvaimobiliare.ro | contact@mvaimobiliare.ro | 0767.941.512 | Pagina ${i}/${pageCount}`),
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`scadentar-credit-${tipCredit.toLowerCase().replace(/\s/g, '-')}-${clampedYears}ani.pdf`);
  }, [calc, currency, clampedValue, clampedYears, clampedRate, effectiveDownPct, isPersonal, rateType]);

  return (
    <div className="credit-sim">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="cs-badge">
          <span>Instrument Financiar</span>
        </div>
        <h1>Simulator Credit <em>Ipotecar</em></h1>
        <p className="cs-subtitle">Calculați rata lunară, dobânda totală și planul de amortizare</p>
      </header>

      {/* Selector Bar */}
      <div className="selector-bar">
        <div className="selector-group">
          <button className={`sel-btn ${creditType === 'ipotecar' ? 'active' : ''}`} onClick={() => handleCreditTypeChange('ipotecar')}>
            🏠 Credit Ipotecar
          </button>
          <button className={`sel-btn ${creditType === 'personal' ? 'active' : ''}`} onClick={() => handleCreditTypeChange('personal')}>
            👤 Nevoi Personale
          </button>
        </div>
        <div className="currency-toggle">
          <button className={`cur-btn ${currency === 'RON' ? 'active' : ''}`} onClick={() => handleCurrencyChange('RON')}>RON</button>
          <button className={`cur-btn ${currency === 'EUR' ? 'active' : ''}`} onClick={() => handleCurrencyChange('EUR')}>EUR</button>
        </div>
      </div>

      {/* Input Cards */}
      <div className="cs-grid">
        {/* Parameters Card */}
        <div className="cs-card">
          <div className="card-title">
            <span className="icon">📐</span> Parametri Credit
          </div>

          {isPersonal && (
            <div className="notice">
              💡 Creditul de nevoi personale nu necesită avans sau garanție imobiliară. Suma, perioada și dobânda diferă față de creditul ipotecar.
            </div>
          )}

          {/* Property Value */}
          <div className="field">
            <div className="field-header">
              <span className="field-label">{isPersonal ? 'Sumă împrumut' : 'Valoare proprietate'}</span>
              <div className="field-value-input">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => { const v = Number(inputValue) || limits.valMin; setPropertyValue(v); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="inline-number-input"
                />
                <span>{currency}</span>
              </div>
            </div>
            <input
              type="range"
              min={limits.valMin}
              max={limits.valMax}
              step={limits.valStep}
              value={clampedValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>{fmtShort(limits.valMin)}</span>
              <span>{fmtShort(limits.valMax)}</span>
            </div>
          </div>

          {/* Down Payment - only for ipotecar */}
          {!isPersonal && (
            <div className="field">
              <div className="field-header">
                <span className="field-label">
                  Avans <span className="info-tip" title="Loan-to-Value: raportul dintre credit și valoarea proprietății">i</span>
                </span>
                <div className="field-value-input">
                  <input type="text" inputMode="numeric" value={inputDown}
                    onChange={(e) => setInputDown(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => { const v = Math.min(80, Math.max(5, Number(inputDown) || 5)); setDownPaymentPct(v); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="inline-number-input inline-number-sm" />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min={5} max={80} step={1}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              />
              <div className="range-labels"><span>5%</span><span>80%</span></div>
              <div className="ltv-bar">
                <div className="ltv-fill" style={{ width: `${calc.ltv}%`, background: ltvColor }} />
              </div>
              <div className="ltv-info">
                <span>LTV: {calc.ltv.toFixed(0)}%</span>
                <span>Avans: {fmt(calc.dp)} {currency}</span>
              </div>
            </div>
          )}

          {/* Period */}
          <div className="field">
            <div className="field-header">
              <span className="field-label">Perioadă</span>
              <div className="field-value-input">
                <input type="text" inputMode="numeric" value={inputYears}
                  onChange={(e) => setInputYears(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => { const v = Number(inputYears) || limits.yrMin; setYears(v); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="inline-number-input inline-number-sm" />
                <span>ani</span>
              </div>
            </div>
            <input
              type="range"
              min={limits.yrMin} max={limits.yrMax} step={1}
              value={clampedYears}
              onChange={(e) => setYears(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>{limits.yrMin} ani</span>
              <span>{limits.yrMax} ani</span>
            </div>
          </div>
        </div>

        {/* Interest & Options Card */}
        <div className="cs-card">
          <div className="card-title">
            <span className="icon">📊</span> Dobândă & Opțiuni
          </div>

          {/* Interest Rate */}
          <div className="field">
            <div className="field-header">
              <span className="field-label">Rată dobândă anuală</span>
              <div className="field-value-input">
                <input type="text" inputMode="decimal" value={inputRate}
                  onChange={(e) => setInputRate(e.target.value.replace(/[^0-9.]/g, ''))}
                  onBlur={() => { const v = Number(inputRate) || limits.rateMin; setInterestRate(v); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="inline-number-input" />
                <span>% / an</span>
              </div>
            </div>
            <input
              type="range"
              min={limits.rateMin} max={limits.rateMax} step={0.1}
              value={clampedRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
            <div className="range-labels"><span>{limits.rateMin}%</span><span>{limits.rateMax}%</span></div>
          </div>

          {/* Rate Type */}
          <div className="field">
            <div className="field-header">
              <span className="field-label">Tip dobândă</span>
            </div>
            <div className="pills">
              <button className={`pill ${rateType === 'fixa' ? 'active' : ''}`} onClick={() => setRateType('fixa')}>Fixă</button>
              <button className={`pill ${rateType === 'variabila' ? 'active' : ''}`} onClick={() => setRateType('variabila')}>Variabilă (IRCC)</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--cs-muted)', marginTop: 10, lineHeight: 1.6 }}>
              {rateType === 'fixa'
                ? 'Rata fixă rămâne constantă pe toată durata creditului — predictibilitate maximă.'
                : 'Rata variabilă se ajustează periodic conform indicelui IRCC + marja băncii.'}
            </p>
          </div>

          {/* Extra Costs */}
          <div className="field">
            <div className="field-header">
              <span className="field-label">Costuri suplimentare / lună</span>
              <div className="field-value-input">
                <input type="text" inputMode="numeric" value={inputExtra}
                  onChange={(e) => setInputExtra(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => { setExtraCosts(Number(inputExtra) || 0); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="inline-number-input" />
                <span>{currency}</span>
              </div>
            </div>
            <input
              type="range"
              min={0} max={currency === 'RON' ? 2000 : 400} step={currency === 'RON' ? 50 : 10}
              value={extraCosts}
              onChange={(e) => setExtraCosts(Number(e.target.value))}
            />
            <div className="range-labels"><span>0</span><span>{currency === 'RON' ? '2.000' : '400'} {currency}</span></div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="results-card">
        <div className="results-grid">
          <div className="result-item">
            <div className="result-label">Rată lunară</div>
            <div className="result-value highlight">
              {fmt(calc.monthly)}
              <small>{currency} / lună</small>
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">Total dobândă</div>
            <div className="result-value">
              {fmt(calc.totalInterest)}
              <small>{currency}</small>
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">Cost total credit</div>
            <div className="result-value green">
              {fmt(calc.totalPaid)}
              <small>{currency}</small>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-section">
          <div className="donut-wrap">
            <svg viewBox="0 0 160 160" width="160" height="160">
              {/* Principal */}
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--cs-green)" strokeWidth="16"
                strokeDasharray={`${seg1} ${circumference - seg1}`} strokeDashoffset="0" />
              {/* Interest */}
              <circle cx="80" cy="80" r="60" fill="none" stroke="var(--cs-gold)" strokeWidth="16"
                strokeDasharray={`${seg2} ${circumference - seg2}`} strokeDashoffset={`${-seg1}`} />
              {/* Extra */}
              {seg3 > 0 && (
                <circle cx="80" cy="80" r="60" fill="none" stroke="var(--cs-blue)" strokeWidth="16"
                  strokeDasharray={`${seg3} ${circumference - seg3}`} strokeDashoffset={`${-(seg1 + seg2)}`} />
              )}
            </svg>
            <div className="donut-center">
              <span className="donut-pct">{calc.interestPct.toFixed(0)}%</span>
              <span className="donut-lbl">dobândă</span>
            </div>
          </div>
          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--cs-green)' }} />
              <div className="legend-text">
                Principal (suma împrumutată)
                <strong>{fmt(calc.loan)} {currency}</strong>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: 'var(--cs-gold)' }} />
              <div className="legend-text">
                Dobândă totală
                <strong>{fmt(calc.totalInterest)} {currency}</strong>
              </div>
            </div>
            {calc.totalExtra > 0 && (
              <div className="legend-item">
                <div className="legend-dot" style={{ background: 'var(--cs-blue)' }} />
                <div className="legend-text">
                  Costuri extra
                  <strong>{fmt(calc.totalExtra)} {currency}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ marginTop: 32 }}>
          <div className="field-label" style={{ marginBottom: 8 }}>Evoluție rată anuală</div>
          <div className="bar-chart">
            {calc.annual.map((a) => (
              <div key={a.year} className="bar-group" title={`An ${a.year}: Principal ${fmt(a.principal)} / Dobândă ${fmt(a.interest)}`}>
                <div className="bar" style={{ height: `${(a.principal / maxAnnualPayment) * 100}%`, background: 'var(--cs-green)' }} />
                <div className="bar" style={{ height: `${(a.interest / maxAnnualPayment) * 100}%`, background: 'var(--cs-gold)' }} />
              </div>
            ))}
          </div>
          <div className="bar-legend">
            <span><span className="bar-legend-dot" style={{ background: 'var(--cs-green)' }} />Principal</span>
            <span><span className="bar-legend-dot" style={{ background: 'var(--cs-gold)' }} />Dobândă</span>
          </div>
        </div>
      </div>

      {/* Download Button - prominent */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 8px' }}>
        <button className="btn-sm download-main" onClick={downloadPDF} style={{
          padding: '14px 32px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          📥 Descarcă Scadențar PDF
        </button>
      </div>

      {/* Amortization Table */}
      <div className="table-card">
        <div className="table-header">
          <div className="card-title" style={{ marginBottom: 0 }}>
            <span className="icon">📋</span> Plan Amortizare
          </div>
          <div className="table-actions">
            <button className={`btn-sm ${tableView === 'lunar' ? 'active' : ''}`} onClick={() => setTableView('lunar')}>Lunar</button>
            <button className={`btn-sm ${tableView === 'anual' ? 'active' : ''}`} onClick={() => setTableView('anual')}>Anual</button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Perioadă</th>
                <th>Rată</th>
                <th>Principal</th>
                <th>Dobândă</th>
                <th>Sold rămas</th>
              </tr>
            </thead>
            <tbody>
              {tableView === 'lunar'
                ? calc.schedule.map((row) => (
                    <tr key={row.month}>
                      <td>Luna {row.month}</td>
                      <td>{fmt(row.payment)} {currency}</td>
                      <td className="td-principal">{fmt(row.principal)} {currency}</td>
                      <td className="td-dobanda">{fmt(row.interest)} {currency}</td>
                      <td>{fmt(row.balance)} {currency}</td>
                    </tr>
                  ))
                : calc.annual.map((row) => (
                    <tr key={row.year}>
                      <td>Anul {row.year}</td>
                      <td>{fmt(row.principal + row.interest)} {currency}</td>
                      <td className="td-principal">{fmt(row.principal)} {currency}</td>
                      <td className="td-dobanda">{fmt(row.interest)} {currency}</td>
                      <td>{fmt(row.balance)} {currency}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditSimulator;
