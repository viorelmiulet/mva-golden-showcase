import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const { t } = useLanguage();

  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center flex-wrap gap-2 text-sm">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center text-muted-foreground hover:text-gold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">{t.nav.home}</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gold font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
