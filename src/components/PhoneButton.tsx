import { useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const PhoneButton = () => {
  const location = useLocation();
  
  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href="tel:+40767941512"
          className="group fixed bottom-20 right-4 z-50 flex items-center justify-center w-14 h-14 bg-primary text-black rounded-full shadow-lg transition-all duration-300 active:scale-95 touch-manipulation hover:scale-110 hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:rotate-[15deg]"
          aria-label="Sună-ne acum"
        >
          {/* Phone Icon */}
          <svg 
            viewBox="0 0 24 24" 
            className="h-7 w-7 fill-current transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-[15deg]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></span>
          
          {/* Hover glow ring */}
          <span className="absolute inset-[-4px] rounded-full border-2 border-primary opacity-0 group-hover:opacity-60 group-hover:animate-[ping_1.5s_ease-out_infinite] transition-opacity duration-300"></span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-primary text-primary-foreground border-none">
        Sună-ne
      </TooltipContent>
    </Tooltip>
  );
};

export default PhoneButton;
