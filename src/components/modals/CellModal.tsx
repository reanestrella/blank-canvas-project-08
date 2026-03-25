import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Cell, CreateCellData } from "@/hooks/useCells";
import type { Member } from "@/hooks/useMembers";

const cellSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  leader_id: z.string().optional().or(z.literal("")),
  supervisor_id: z.string().optional().or(z.literal("")),
  network: z.string().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  day_of_week: z.string().optional().or(z.literal("")),
  time: z.string().optional().or(z.literal("")),
  maps_link: z.string().optional().or(z.literal("")),
});

type CellFormData = z.infer<typeof cellSchema>;

interface CellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell?: Cell;
  members: Member[];
  onSubmit: (data: CreateCellData) => Promise<{ data: Cell | null; error: any }>;
}

export function CellModal({ open, onOpenChange, cell, members, onSubmit }: CellModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Reset state when cell changes or modal opens
  const resetForCell = () => {
    setCoverPreview(cell?.cover_image_url || null);
    setCoverFile(null);
    form.reset({
      name: cell?.name || "",
      leader_id: cell?.leader_id || "",
      supervisor_id: cell?.supervisor_id || "",
      network: cell?.network || "",
      address: cell?.address || "",
      day_of_week: cell?.day_of_week || "",
      time: cell?.time || "",
      maps_link: cell?.maps_link || "",
    });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | undefined> => {
    if (!coverFile) return cell?.cover_image_url || undefined;
    const ext = coverFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("cell-covers").upload(path, coverFile, { upsert: true });
    if (error) { console.error("Cover upload error:", error); return undefined; }
    const { data: urlData } = supabase.storage.from("cell-covers").getPublicUrl(path);
    return urlData.publicUrl;
  };
  
  const form = useForm<CellFormData>({
    resolver: zodResolver(cellSchema),
    defaultValues: {
      name: "",
      leader_id: "",
      supervisor_id: "",
      network: "",
      address: "",
      day_of_week: "",
      time: "",
      maps_link: "",
    },
  });

  // Reset form whenever modal opens or cell changes
  useState(() => { resetForCell(); });
  // Also reset when `open` transitions to true
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    resetForCell();
  }
  if (open !== prevOpen) setPrevOpen(open);

  const handleSubmit = async (data: CellFormData) => {
    setIsSubmitting(true);
    try {
      const coverUrl = await uploadCover();
      const cleanedData: CreateCellData = {
        name: data.name,
        leader_id: data.leader_id || undefined,
        supervisor_id: data.supervisor_id || undefined,
        network: data.network || undefined,
        address: data.address || undefined,
        day_of_week: data.day_of_week || undefined,
        time: data.time || undefined,
        maps_link: data.maps_link || undefined,
        cover_image_url: coverUrl,
      };
      
      const result = await onSubmit(cleanedData);
      if (!result.error) {
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members who can be leaders
  const leaderCandidates = members.filter(
    (m) => m.spiritual_status === "lider" || m.spiritual_status === "discipulador"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{cell ? "Editar Célula" : "Nova Célula"}</DialogTitle>
          <DialogDescription>
            {cell
              ? "Edite as informações da célula."
              : "Preencha as informações para criar uma nova célula."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Célula *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Célula Vida Nova" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <FormLabel>Imagem de Capa</FormLabel>
              <div className="flex items-center gap-4">
                {coverPreview ? (
                  <img src={coverPreview} alt="Capa" className="w-24 h-16 object-cover rounded-md border" />
                ) : (
                  <div className="w-24 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><Upload className="w-4 h-4 mr-1" /> Upload</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="network"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rede</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                    value={field.value || "_none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rede" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Selecione a rede</SelectItem>
                      <SelectItem value="homens">Homens</SelectItem>
                      <SelectItem value="mulheres">Mulheres</SelectItem>
                      <SelectItem value="jovens">Jovens</SelectItem>
                      <SelectItem value="kids">Kids</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leader_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Líder</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Sem líder definido</SelectItem>
                        {leaderCandidates.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supervisor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Sem supervisor definido</SelectItem>
                        {leaderCandidates.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Local de reunião" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maps_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do Google Maps</FormLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Semana</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Selecione o dia</SelectItem>
                        <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                        <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                        <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                        <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                        <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                        <SelectItem value="Sábado">Sábado</SelectItem>
                        <SelectItem value="Domingo">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {cell ? "Salvar" : "Criar Célula"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
