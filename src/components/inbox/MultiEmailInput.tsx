import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X, Clock } from "lucide-react";

interface EmailContact {
  id: string;
  email: string;
  name: string | null;
  last_used_at: string;
  use_count: number;
}

interface MultiEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Email validation regex
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const MultiEmailInput = ({
  value,
  onChange,
  placeholder = "email@example.com",
  className,
}: MultiEmailInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse emails from value string
  const emails = value ? value.split(',').map(e => e.trim()).filter(Boolean) : [];

  // Fetch email contacts for autocomplete
  const { data: contacts } = useQuery({
    queryKey: ['email-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_contacts')
        .select('*')
        .order('last_used_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as EmailContact[];
    }
  });

  // Filter contacts based on input and exclude already added emails
  const filteredContacts = contacts?.filter(contact => {
    const query = inputValue.toLowerCase();
    const emailLower = contact.email.toLowerCase();
    const isMatch = emailLower.includes(query) || 
      (contact.name && contact.name.toLowerCase().includes(query));
    const isNotAdded = !emails.some(e => e.toLowerCase() === emailLower);
    return isMatch && isNotAdded;
  }).slice(0, 6) || [];

  // Add email to list
  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    
    // Check if already exists
    if (emails.some(e => e.toLowerCase() === trimmedEmail.toLowerCase())) {
      setInputValue("");
      return;
    }

    const newEmails = [...emails, trimmedEmail];
    onChange(newEmails.join(', '));
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Remove email from list
  const removeEmail = (indexToRemove: number) => {
    const newEmails = emails.filter((_, idx) => idx !== indexToRemove);
    onChange(newEmails.join(', '));
  };

  // Handle input keydown
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email when backspace on empty input
      removeEmail(emails.length - 1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen && filteredContacts.length > 0) {
      e.preventDefault();
      // Focus first suggestion
      const firstButton = dropdownRef.current?.querySelector('button');
      firstButton?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    // Check if pasted text contains multiple emails (comma or semicolon separated)
    if (pastedText.includes(',') || pastedText.includes(';')) {
      e.preventDefault();
      const pastedEmails = pastedText
        .split(/[,;]/)
        .map(email => email.trim())
        .filter(email => email && isValidEmail(email));
      
      if (pastedEmails.length > 0) {
        const newEmails = [...emails, ...pastedEmails];
        onChange([...new Set(newEmails)].join(', ')); // Remove duplicates
        setInputValue("");
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Auto-add email if comma or semicolon is typed
    if (newValue.includes(',') || newValue.includes(';')) {
      const parts = newValue.split(/[,;]/);
      const emailToAdd = parts[0].trim();
      if (emailToAdd) {
        addEmail(emailToAdd);
      }
      setInputValue(parts.slice(1).join('').trim());
    } else {
      setInputValue(newValue);
      setIsOpen(newValue.length > 0 && filteredContacts.length > 0);
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (inputValue.length > 0 || (contacts && contacts.length > 0)) {
      setIsOpen(true);
    }
  };

  // Handle blur - add email if valid
  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (inputValue.trim() && isValidEmail(inputValue)) {
        addEmail(inputValue);
      }
    }, 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display name from contact
  const getDisplayName = (contact: EmailContact) => {
    if (contact.name) return contact.name;
    if (contact.email.includes('<')) {
      return contact.email.split('<')[0].trim();
    }
    return null;
  };

  const showSuggestions = isOpen && filteredContacts.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-1 p-1.5 min-h-[40px] rounded-md border bg-muted/30 border-border cursor-text",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Email Tags */}
        {emails.map((email, idx) => (
          <span
            key={idx}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors",
              isValidEmail(email) 
                ? "bg-gold/20 text-gold border border-gold/30" 
                : "bg-destructive/20 text-destructive border border-destructive/30"
            )}
          >
            <span className="max-w-[150px] truncate">{email}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(idx);
              }}
              className="hover:bg-white/10 rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={emails.length === 0 ? placeholder : "Adaugă altă adresă..."}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          autoComplete="off"
        />
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 py-1 bg-[hsl(220,30%,12%)] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {!inputValue && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 border-b border-white/5">
              <Clock className="h-3 w-3" />
              Contacte recente
            </div>
          )}
          {filteredContacts.map((contact) => {
            const displayName = getDisplayName(contact);
            const emailAddress = contact.email.includes('<') 
              ? contact.email.match(/<(.+)>/)?.[1] || contact.email
              : contact.email;
            
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => addEmail(emailAddress)}
                className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-gold text-xs font-medium shrink-0">
                  {emailAddress.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {displayName && (
                    <p className="text-sm font-medium truncate">{displayName}</p>
                  )}
                  <p className={cn(
                    "truncate",
                    displayName ? "text-xs text-muted-foreground" : "text-sm"
                  )}>
                    {emailAddress}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Helper text */}
      {emails.length > 0 && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {emails.length} {emails.length === 1 ? 'adresă' : 'adrese'} • Apasă Enter sau virgulă pentru a adăuga
        </p>
      )}
    </div>
  );
};
