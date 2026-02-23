import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, Save, MapPin, Phone, Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ProfileEditTab() {
  const { profile, user, church, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setAvatarUrl(profile?.avatar_url || "");
    // Fetch member address if available
    if (profile?.member_id && profile?.church_id) {
      supabase
        .from("members")
        .select("address")
        .eq("id", profile.member_id)
        .single()
        .then(({ data }) => {
          if (data?.address) setAddress(data.address);
        });
    }
  }, [profile]);

  const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;

      await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("user_id", user.id);

      setAvatarUrl(newUrl);
      await refreshUserData();
      toast({ title: "Foto atualizada!" });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Erro", description: err.message || "Falha ao enviar foto.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("user_id", user.id);
      if (error) throw error;

      // Update member address if linked
      if (profile?.member_id) {
        await supabase
          .from("members")
          .update({ address: address.trim() || null })
          .eq("id", profile.member_id);
      }

      await refreshUserData();
      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-lg"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium">{fullName || "Seu nome"}</p>
              <p className="text-sm text-muted-foreground">{church?.name || ""}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Nome completo
              </Label>
              <Input id="profileName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input id="profileEmail" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefone
              </Label>
              <Input id="profilePhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileAddress" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Endereço
              </Label>
              <Input id="profileAddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
