import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Member } from "@/hooks/useMembers";

const DEMO_COVERS = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=340&fit=crop",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=340&fit=crop",
];

const courseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  track: z.string().optional(),
  teacher_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  cover_image_url: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  name: string;
  description: string | null;
  track: string | null;
  teacher_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  cover_image_url?: string | null;
}

interface CourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
  members: Member[];
  onSubmit: (data: Partial<Course>) => Promise<{ data: Course | null; error: any }>;
}

export function CourseModal({ open, onOpenChange, course, members, onSubmit }: CourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      description: "",
      track: "",
      teacher_id: "",
      start_date: "",
      end_date: "",
      cover_image_url: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: course?.name || "",
        description: course?.description || "",
        track: course?.track || "none",
        teacher_id: course?.teacher_id || "none",
        start_date: course?.start_date || "",
        end_date: course?.end_date || "",
        cover_image_url: course?.cover_image_url || "",
      });
    }
  }, [open, course, form]);

  const handleSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        name: data.name,
        description: data.description || null,
        track: data.track && data.track !== "none" ? data.track : null,
        teacher_id: data.teacher_id && data.teacher_id !== "none" ? data.teacher_id : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        cover_image_url: data.cover_image_url || null,
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

  const teacherCandidates = members.filter(m => 
    m.spiritual_status === "lider" || m.spiritual_status === "discipulador"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{course ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          <DialogDescription>
            {course
              ? "Edite as informações do curso."
              : "Preencha os dados para criar um novo curso."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Curso *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fundamentos da Fé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objetivo do curso" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="track"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trilha</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a trilha" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="novo_convertido">Novo Convertido</SelectItem>
                      <SelectItem value="discipulado">Discipulado</SelectItem>
                      <SelectItem value="lideranca">Liderança</SelectItem>
                      <SelectItem value="ebd">EBD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem professor definido</SelectItem>
                      {teacherCandidates.map((member) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capa do Curso</FormLabel>
                  <FormControl>
                    <Input placeholder="URL da imagem de capa" {...field} />
                  </FormControl>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {DEMO_COVERS.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => form.setValue("cover_image_url", url)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-video ${
                          field.value === url ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <img src={url} alt={`Capa ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {field.value && (
                    <div className="mt-2 rounded-lg overflow-hidden border aspect-video max-w-[200px]">
                      <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {course ? "Salvar" : "Criar Curso"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
