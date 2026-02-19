import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
}

interface MemberAutocompleteProps {
  churchId: string;
  value?: string;
  onChange: (memberId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function MemberAutocomplete({
  churchId,
  value,
  onChange,
  placeholder = "Digite 3 letras para buscar...",
  className,
}: MemberAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load selected member name when value changes
  useEffect(() => {
    if (value && !selectedName) {
      const fetchMember = async () => {
        const { data } = await supabase
          .from("members")
          .select("id, full_name, phone")
          .eq("id", value)
          .single();
        if (data) {
          setSelectedName(data.full_name);
          setQuery(data.full_name);
        }
      };
      fetchMember();
    } else if (!value) {
      setSelectedName("");
      setQuery("");
    }
  }, [value]);

  // Search members when query changes (min 3 characters)
  useEffect(() => {
    if (query.length >= 3 && query !== selectedName) {
      const searchMembers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("members")
          .select("id, full_name, phone")
          .eq("church_id", churchId)
          .ilike("full_name", `%${query}%`)
          .limit(10);

        if (!error && data) {
          setMembers(data);
          setIsOpen(data.length > 0);
        }
        setIsLoading(false);
      };
      
      const debounce = setTimeout(searchMembers, 300);
      return () => clearTimeout(debounce);
    } else {
      setMembers([]);
      setIsOpen(false);
    }
  }, [query, churchId, selectedName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: Member) => {
    setQuery(member.full_name);
    setSelectedName(member.full_name);
    onChange(member.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedName("");
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value === "") {
            setSelectedName("");
            onChange(null);
          }
        }}
        placeholder={placeholder}
        className="w-full"
      />
      {isLoading && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
              onClick={() => handleSelect(member)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {member.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-sm">{member.full_name}</p>
                {member.phone && (
                  <p className="text-xs text-muted-foreground">{member.phone}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {query && value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg"
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
}
