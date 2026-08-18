import { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

/**
 * Antet unificat pentru paginile publice — aceeași compoziție ca pe homepage:
 * eyebrow mono/brass, titlu display aliniat la stânga, subtitlu slate.
 */
const PageHero = ({ eyebrow, title, subtitle, children }: PageHeroProps) => (
  <section className="border-b border-stone bg-background py-10 sm:py-14">
    <div className="container mx-auto px-4 lg:px-6">
      {eyebrow && <p className="text-spec text-brass mb-2">{eyebrow}</p>}
      <h1 className="text-display-lg text-foreground max-w-3xl">{title}</h1>
      {subtitle && (
        <p className="text-body text-muted-foreground mt-4 max-w-2xl">{subtitle}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  </section>
);

export default PageHero;
