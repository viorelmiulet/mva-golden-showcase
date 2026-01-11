import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { User, Clock } from "lucide-react";

interface EmailContact {
  id: string;
  email: string;
  name: string | null;
  last_used_at: string;
  use_count: number;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const EmailAutocomplete = ({
  value,
  onChange,
  placeholder = "email@example.com",
  className,
}: EmailAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch email contacts
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

  // Filter contacts based on search query
  const filteredContacts = contacts?.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(query) ||
      (contact.name && contact.name.toLowerCase().includes(query))
    );
  }).slice(0, 8) || [];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchQuery(newValue);
    setIsOpen(newValue.length > 0 && filteredContacts.length > 0);
  };

  // Handle contact selection
  const handleSelectContact = (contact: EmailContact) => {
    onChange(contact.email);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Handle focus
  const handleFocus = () => {
    if (value.length > 0 || searchQuery.length > 0) {
      setSearchQuery(value);
      setIsOpen(filteredContacts.length > 0);
    } else if (contacts && contacts.length > 0) {
      // Show recent contacts even without typing
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when value changes
  useEffect(() => {
    if (value && contacts) {
      setSearchQuery(value);
      const hasMatches = contacts.some(c => 
        c.email.toLowerCase().includes(value.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(value.toLowerCase()))
      );
      if (hasMatches && document.activeElement === inputRef.current) {
        setIsOpen(true);
      }
    }
  }, [value, contacts]);

  // Extract display name from email
  const getDisplayName = (contact: EmailContact) => {
    if (contact.name) return contact.name;
    // Extract name from email like "John Doe <john@example.com>"
    if (contact.email.includes('<')) {
      return contact.email.split('<')[0].trim();
    }
    return null;
  };

  const showSuggestions = isOpen && (filteredContacts.length > 0 || (contacts && contacts.length > 0 && !searchQuery));
  const displayContacts = searchQuery ? filteredContacts : contacts?.slice(0, 5) || [];

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn("bg-white/5 border-white/10", className)}
        autoComplete="off"
      />
      
      {showSuggestions && displayContacts.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 py-1 bg-[hsl(220,30%,12%)] border border-white/10 rounded-lg shadow-xl max-h-64 overflow-y-auto"
        >
          {!searchQuery && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 border-b border-white/5">
              <Clock className="h-3 w-3" />
              Contacte recente
            </div>
          )}
          {displayContacts.map((contact) => {
            const displayName = getDisplayName(contact);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectContact(contact)}
                className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-gold text-xs font-medium shrink-0">
                  {contact.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {displayName && (
                    <p className="text-sm font-medium truncate">{displayName}</p>
                  )}
                  <p className={cn(
                    "truncate",
                    displayName ? "text-xs text-muted-foreground" : "text-sm"
                  )}>
                    {contact.email.includes('<') 
                      ? contact.email.match(/<(.+)>/)?.[1] || contact.email
                      : contact.email
                    }
                  </p>
                </div>
                {contact.use_count > 1 && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {contact.use_count}×
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
