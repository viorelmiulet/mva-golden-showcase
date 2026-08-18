import { useState, type FormEvent } from "react";
import { submitContactForm } from "@/lib/publicForms.functions";
import { useToast } from "@/hooks/use-toast";
import { usePlausible } from "@/hooks/usePlausible";
import { useGA4 } from "@/hooks/useGA4";
import { trackConversion, CONVERSION_EVENTS } from "@/lib/analytics/conversions";

/** Single universal enquiry form used everywhere on the site. */
export const CONTACT_REASONS = [
  { value: "cumpar", label: "Vreau să cumpăr o proprietate" },
  { value: "inchiriez", label: "Vreau să închiriez o proprietate" },
  { value: "vand", label: "Vreau să vând o proprietate" },
  { value: "inchiriez-proprietatea", label: "Vreau să închiriez proprietatea mea" },
  { value: "colaborare", label: "Vreau să colaborez cu MVA Imobiliare" },
  { value: "vizionare", label: "Vreau o vizionare" },
  { value: "informatii", label: "Vreau mai multe informații despre o proprietate" },
  { value: "alta", label: "Altă solicitare" },
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number]["value"];

export interface UniversalContactFormProps {
  /** Preselected reason (from a CTA). */
  reason?: ContactReason;
  /** Property URL or ID attached automatically. */
  propertyRef?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

const field =
  "h-12 w-full rounded-sm border border-border bg-white px-3 text-base text-foreground focus-visible:outline-hidden";
const labelClass = "text-spec text-muted-foreground mb-1.5 block";

const BUDGETS = ["sub 60.000 €", "60.000 – 100.000 €", "100.000 – 150.000 €", "peste 150.000 €"];
const TYPES = ["Garsonieră", "Apartament", "Casă / vilă", "Teren", "Spațiu comercial"];

const UniversalContactForm = ({ reason, propertyRef, compact, onSuccess }: UniversalContactFormProps) => {
  const { toast } = useToast();
  const { trackContact } = usePlausible();
  const { trackContact: trackGA4Contact } = useGA4();

  const [values, setValues] = useState({
    reason: (reason ?? "") as string,
    nume: "",
    telefon: "",
    email: "",
    mesaj: "",
    proprietate: propertyRef ?? "",
    tip: "",
    buget: "",
    camere: "",
    zona: "",
    suprafata: "",
    zi: "",
  });
  const [sending, setSending] = useState(false);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const isBuy = values.reason === "cumpar" || values.reason === "inchiriez";
  const isSell = values.reason === "vand" || values.reason === "inchiriez-proprietatea";
  const isViewing = values.reason === "vizionare";
  const showPropertyRef = isViewing || values.reason === "informatii" || !!propertyRef;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const reasonLabel =
        CONTACT_REASONS.find((r) => r.value === values.reason)?.label || "Solicitare generală";
      const extra: string[] = [];
      if (values.tip) extra.push(`Tip proprietate: ${values.tip}`);
      if (values.buget) extra.push(`Buget: ${values.buget}`);
      if (values.camere) extra.push(`Camere: ${values.camere}`);
      if (values.zona) extra.push(`Zonă: ${values.zona}`);
      if (values.suprafata) extra.push(`Suprafață aproximativă: ${values.suprafata} mp`);
      if (values.zi) extra.push(`Zi preferată: ${values.zi}`);
      if (values.proprietate) extra.push(`Proprietate: ${values.proprietate}`);

      const mesaj = [`Solicitare: ${reasonLabel}`, ...extra, "", values.mesaj || "—"].join("\n");

      await submitContactForm({
        data: {
          nume: values.nume,
          prenume: "",
          email: values.email,
          telefon: values.telefon,
          mesaj,
        },
      });

      trackContact("form", "universal_form");
      trackGA4Contact("form");
      trackConversion(CONVERSION_EVENTS.contactFormSubmit, { source: values.reason || "general" });

      toast({ title: "Solicitare trimisă", description: "Te contactăm în cel mai scurt timp." });
      setValues((s) => ({ ...s, nume: "", telefon: "", email: "", mesaj: "" }));
      onSuccess?.();
    } catch (err: unknown) {
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <label htmlFor="uc-reason" className={labelClass}>CUM TE PUTEM AJUTA?</label>
        <select
          id="uc-reason"
          className={field}
          value={values.reason}
          onChange={(e) => set("reason", e.target.value)}
          required
        >
          <option value="">Alege motivul solicitării</option>
          {CONTACT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {isBuy && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="uc-tip" className={labelClass}>TIP</label>
            <select id="uc-tip" className={field} value={values.tip} onChange={(e) => set("tip", e.target.value)}>
              <option value="">Oricare</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="uc-buget" className={labelClass}>BUGET</label>
            <select id="uc-buget" className={field} value={values.buget} onChange={(e) => set("buget", e.target.value)}>
              <option value="">Nedefinit</option>
              {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="uc-camere" className={labelClass}>CAMERE</label>
            <select id="uc-camere" className={field} value={values.camere} onChange={(e) => set("camere", e.target.value)}>
              <option value="">Oricâte</option>
              {["1", "2", "3", "4+"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {isSell && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="uc-tip2" className={labelClass}>TIP</label>
            <select id="uc-tip2" className={field} value={values.tip} onChange={(e) => set("tip", e.target.value)}>
              <option value="">Alege</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="uc-zona" className={labelClass}>ZONĂ</label>
            <input id="uc-zona" className={field} value={values.zona} onChange={(e) => set("zona", e.target.value)} />
          </div>
          <div>
            <label htmlFor="uc-supr" className={labelClass}>SUPRAFAȚĂ (MP)</label>
            <input id="uc-supr" inputMode="numeric" className={field} value={values.suprafata} onChange={(e) => set("suprafata", e.target.value)} />
          </div>
        </div>
      )}

      {isViewing && (
        <div>
          <label htmlFor="uc-zi" className={labelClass}>ZI PREFERATĂ</label>
          <input id="uc-zi" type="date" className={field} value={values.zi} onChange={(e) => set("zi", e.target.value)} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="uc-nume" className={labelClass}>NUME</label>
          <input id="uc-nume" name="name" autoComplete="name" className={field} value={values.nume} onChange={(e) => set("nume", e.target.value)} required />
        </div>
        <div>
          <label htmlFor="uc-tel" className={labelClass}>TELEFON</label>
          <input id="uc-tel" type="tel" autoComplete="tel" className={field} value={values.telefon} onChange={(e) => set("telefon", e.target.value)} required />
        </div>
        <div>
          <label htmlFor="uc-email" className={labelClass}>EMAIL</label>
          <input id="uc-email" type="email" autoComplete="email" className={field} value={values.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
      </div>

      {showPropertyRef && (
        <div>
          <label htmlFor="uc-prop" className={labelClass}>LINK / ID PROPRIETATE (OPȚIONAL)</label>
          <input id="uc-prop" className={field} value={values.proprietate} onChange={(e) => set("proprietate", e.target.value)} />
        </div>
      )}

      <div>
        <label htmlFor="uc-mesaj" className={labelClass}>MESAJ (OPȚIONAL)</label>
        <textarea
          id="uc-mesaj"
          rows={compact ? 3 : 4}
          className="w-full rounded-sm border border-border bg-white p-3 text-base text-foreground resize-none focus-visible:outline-hidden"
          value={values.mesaj}
          onChange={(e) => set("mesaj", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="h-12 w-full sm:w-auto rounded-sm bg-brass px-8 text-small font-semibold uppercase tracking-wide text-ink transition-colors duration-200 hover:bg-brass-light disabled:opacity-60"
      >
        {sending ? "Se trimite…" : "Trimite solicitarea"}
      </button>
    </form>
  );
};

export default UniversalContactForm;
