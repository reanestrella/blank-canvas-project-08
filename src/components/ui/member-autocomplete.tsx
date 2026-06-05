import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, X, Loader2 } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

interface MemberAutocompleteProps {
  churchId: string;
  value?: string;
  onChange: (memberId: string | null) => void;
  /** Called with the full member object when one is selected */
  onSelectMember?: (member: Member | null) => void;
  placeholder?: string;
  className?: string;
  /** When true, shows "Create new member" action when no match is found */
  allowCreate?: boolean;
}

export function MemberAutocomplete({
  churchId,
  value,
  onChange,
  onSelectMember,
  placeholder = "Digite 3 letras para buscar...",
  className,
  allowCreate = false,
}: MemberAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (value && !selectedName) {
      const fetchMember = async () => {
        const { data } = await supabase
          .from("members").select("id, full_name, phone, email").eq("id", value).single();
        if (data) {
          setSelectedName(data.full_name);
          setQuery(data.full_name);
        }
      };
      fetchMember();
    } else if (!value) {
      setSelectedName(""); setQuery("");
    }
  }, [value]);

  useEffect(() => {
    if (query.length >= 3 && query !== selectedName) {
      const search = async () => {
        setIsLoading(true);
        const { data } = await supabase
          .from("members").select("id, full_name, phone, email")
          .eq("church_id", churchId).ilike("full_name", `%${query}%`).limit(10);
        setMembers(data || []);
        setIsOpen(true);
        setIsLoading(false);
      };
      const t = setTimeout(search, 300);
      return () => clearTimeout(t);
    } else {
      setMembers([]); setIsOpen(false);
    }
  }, [query, churchId, selectedName]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (m: Member) => {
    setQuery(m.full_name); setSelectedName(m.full_name);
    onChange(m.id);
    onSelectMember?.(m);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery(""); setSelectedName(""); onChange(null); onSelectMember?.(null); setIsOpen(false);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.from("members").insert({
        church_id: churchId,
        full_name: name,
        spiritual_status: "visitante",
        is_active: true,
      }).select("id, full_name, phone, email").single();
      if (error) throw error;
      toast({ title: "Dizimista criado", description: `${data.full_name} foi adicionado como visitante.` });
      handleSelect(data as Member);
    } catch (e: any) {
      toast({ title: "Erro ao criar", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const exactMatch = members.some((m) => m.full_name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value === "") { setSelectedName(""); onChange(null); }
        }}
        placeholder={placeholder}
        className="w-full pr-8"
      />
      {isLoading && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {query && (
        <button type="button" onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      )}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {members.map((m) => (
            <button key={m.id} type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
              onClick={() => handleSelect(m)}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-sm">{m.full_name}</p>
                {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
              </div>
            </button>
          ))}
          {allowCreate && query.trim().length >= 3 && !exactMatch && (
            <button type="button" onClick={handleCreate} disabled={creating}
              className="w-full px-3 py-2 text-left hover:bg-primary/5 border-t transition-colors flex items-center gap-3 text-primary">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span className="text-sm">Criar dizimista "{query.trim()}"</span>
            </button>
          )}
          {!allowCreate && members.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum membro encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
