import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Church,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
  Crown,
  Check,
  Smartphone,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Building,
  MapPin,
  Edit,
} from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";
import { useCongregations } from "@/hooks/useCongregations";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InviteUserModal } from "@/components/modals/InviteUserModal";
import { CongregationModal } from "@/components/modals/CongregationModal";
import type { Congregation, CreateCongregationData } from "@/hooks/useCongregations";

const plans = [
  {
    name: "Free",
    price: "Grátis",
    current: true,
    features: ["Até 50 membros", "1 célula", "Secretaria básica", "Meu App básico"],
    limitations: ["Sem relatórios avançados", "Sem financeiro completo", "Suporte por email"],
  },
  {
    name: "Igreja Pequena",
    price: "R$ 49/mês",
    current: false,
    recommended: true,
    features: ["Membros ilimitados", "Células ilimitadas", "Financeiro completo", "Ensino & Discipulado", "Relatórios completos", "Suporte prioritário"],
  },
  {
    name: "Igreja Média",
    price: "R$ 99/mês",
    current: false,
    features: ["Tudo do plano anterior", "Relatórios avançados", "Indicadores espirituais", "Múltiplos líderes", "API de integração", "Suporte dedicado"],
  },
];

const roleLabels: Record<string, string> = {
  pastor: "Administrador",
  tesoureiro: "Tesoureiro(a)",
  secretario: "Secretário(a)",
  lider_celula: "Líder de Célula",
  lider_ministerio: "Líder de Ministério",
  consolidacao: "Consolidação",
  membro: "Membro",
};

export default function Configuracoes() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [congregationModalOpen, setCongregationModalOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState<Congregation | undefined>();
  
  // Church form state
  const [churchName, setChurchName] = useState("");
  const [churchCnpj, setChurchCnpj] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [churchPhone, setChurchPhone] = useState("");
  const [churchAddress, setChurchAddress] = useState("");
  
  const { profile, refreshChurch } = useAuth();
  const { toast } = useToast();
  const churchId = profile?.church_id;
  const { invitations, isLoading, createInvitation, deleteInvitation, getInviteLink } = useInvitations();
  const { congregations, isLoading: loadingCongregations, createCongregation, updateCongregation } = useCongregations(churchId || undefined);
  const { church, isLoading: loadingChurch, isSaving, updateChurch } = useChurchSettings();

  // Initialize form with church data
  useEffect(() => {
    if (church) {
      setChurchName(church.name || "");
      setChurchCnpj(church.cnpj || "");
      setChurchEmail(church.email || "");
      setChurchPhone(church.phone || "");
      setChurchAddress(church.address || "");
    }
  }, [church]);

  const handleSaveChurch = async () => {
    const result = await updateChurch({
      name: churchName,
      cnpj: churchCnpj || undefined,
      email: churchEmail || undefined,
      phone: churchPhone || undefined,
      address: churchAddress || undefined,
    });

    if (!result.error) {
      // Refresh church in AuthContext to update header/sidebar
      await refreshChurch();
    }
  };

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(getInviteLink(token));
    toast({
      title: "Link copiado!",
      description: "O link de convite foi copiado para a área de transferência.",
    });
  };

  const handleOpenEditCongregation = (congregation: Congregation) => {
    setEditingCongregation(congregation);
    setCongregationModalOpen(true);
  };

  const handleCloseCongregationModal = (open: boolean) => {
    setCongregationModalOpen(open);
    if (!open) {
      setEditingCongregation(undefined);
    }
  };

  const handleCongregationSubmit = async (data: CreateCongregationData) => {
    if (editingCongregation) {
      return updateCongregation(editingCongregation.id, data);
    }
    return createCongregation(data);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie sua igreja e preferências do sistema</p>
        </div>

        <Tabs defaultValue="church">
          <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
            <TabsTrigger value="church" className="gap-2">
              <Church className="w-4 h-4" />
              <span className="hidden sm:inline">Igreja</span>
            </TabsTrigger>
            <TabsTrigger value="filiais" className="gap-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Filiais</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="church" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Igreja</CardTitle>
                <CardDescription>Dados principais da sua igreja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingChurch ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="churchName">Nome da Igreja</Label>
                        <Input 
                          id="churchName" 
                          value={churchName}
                          onChange={(e) => setChurchName(e.target.value)}
                          placeholder="Nome da sua igreja"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input 
                          id="cnpj" 
                          value={churchCnpj}
                          onChange={(e) => setChurchCnpj(e.target.value)}
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={churchEmail}
                          onChange={(e) => setChurchEmail(e.target.value)}
                          placeholder="contato@igreja.com.br"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          value={churchPhone}
                          onChange={(e) => setChurchPhone(e.target.value)}
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input 
                          id="address" 
                          value={churchAddress}
                          onChange={(e) => setChurchAddress(e.target.value)}
                          placeholder="Rua, número - Bairro - Cidade/UF"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveChurch} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filiais" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Filiais / Congregações
                </CardTitle>
                <CardDescription>
                  Gerencie as filiais e congregações da sua igreja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  setEditingCongregation(undefined);
                  setCongregationModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Filial
                </Button>

                {loadingCongregations ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : congregations.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {congregations.map((congregation) => (
                      <div key={congregation.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{congregation.name}</p>
                              {congregation.is_main && (
                                <Badge variant="secondary" className="text-xs">Sede</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {[congregation.address, congregation.city, congregation.state]
                                .filter(Boolean)
                                .join(", ") || "Endereço não informado"}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditCongregation(congregation)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 p-8 text-center text-muted-foreground">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma filial cadastrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Convidar Usuários</CardTitle>
                <CardDescription>Envie convites para novos usuários com funções específicas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setInviteModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Usuário
                </Button>

                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : invitations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-sm">Convites Pendentes</h4>
                    {invitations.filter(i => !i.used_at).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{roleLabels[inv.role]}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Expira: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleCopyLink(inv.token)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteInvitation(inv.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Funções e Permissões
                </CardTitle>
                <CardDescription>Configure as permissões por função</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <div key={role} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <span>{label}</span>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Configure como você deseja receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: "Novos membros", desc: "Notificar quando novos membros forem cadastrados", checked: true },
                  { title: "Relatórios de célula", desc: "Notificar quando células enviarem relatórios", checked: true },
                  { title: "Movimentações financeiras", desc: "Alertas sobre dízimos e ofertas", checked: true },
                  { title: "Eventos e escalas", desc: "Lembretes de eventos e escalas de serviço", checked: true },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.checked} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.name} className={`relative ${plan.recommended ? "border-secondary shadow-lg" : plan.current ? "border-primary" : ""}`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-secondary text-secondary-foreground">Recomendado</Badge>
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Plano Atual</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold mt-2">{plan.price}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-success" />
                          {feature}
                        </li>
                      ))}
                      {plan.limitations?.map((limitation) => (
                        <li key={limitation} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4 flex items-center justify-center">-</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full mt-6 ${plan.recommended ? "gradient-accent text-secondary-foreground" : ""}`} variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                      {plan.current ? "Plano Atual" : "Fazer Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSubmit={createInvitation}
        getInviteLink={getInviteLink}
        congregations={congregations}
        churchId={churchId || undefined}
      />

      {churchId && (
        <CongregationModal
          open={congregationModalOpen}
          onOpenChange={handleCloseCongregationModal}
          congregation={editingCongregation}
          onSubmit={handleCongregationSubmit}
          churchId={churchId}
        />
      )}
    </AppLayout>
  );
}
