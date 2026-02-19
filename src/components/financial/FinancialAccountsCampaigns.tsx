import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Wallet,
  Building,
  PiggyBank,
  Target,
  Calendar,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { useFinancialAccounts, FinancialAccount, FinancialCampaign, CreateAccountData, CreateCampaignData } from "@/hooks/useFinancialAccounts";

interface FinancialAccountsTabProps {
  churchId: string;
}

const accountTypeLabels: Record<FinancialAccount["account_type"], { label: string; icon: typeof Wallet }> = {
  carteira: { label: "Carteira", icon: Wallet },
  conta_bancaria: { label: "Conta Bancária", icon: Building },
  poupanca: { label: "Poupança", icon: PiggyBank },
  outro: { label: "Outro", icon: Target },
};

export function FinancialAccountsTab({ churchId }: FinancialAccountsTabProps) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [formData, setFormData] = useState<CreateAccountData>({
    name: "",
    account_type: "carteira",
    bank_name: "",
    initial_balance: 0,
  });

  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useFinancialAccounts(churchId);

  const handleOpenNew = () => {
    setEditingAccount(null);
    setFormData({ name: "", account_type: "carteira", bank_name: "", initial_balance: 0 });
    setAccountModalOpen(true);
  };

  const handleOpenEdit = (account: FinancialAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      bank_name: account.bank_name || "",
      initial_balance: account.initial_balance,
    });
    setAccountModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    if (editingAccount) {
      await updateAccount(editingAccount.id, formData);
    } else {
      await createAccount(formData);
    }
    setAccountModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contas Financeiras</h3>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma conta cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie contas para organizar suas finanças.
            </p>
            <Button onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const config = accountTypeLabels[account.account_type];
            const Icon = config.icon;
            return (
              <Card key={account.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(account)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {account.bank_name && (
                    <p className="text-sm text-muted-foreground mb-2">{account.bank_name}</p>
                  )}
                  <p className="text-2xl font-bold">
                    R$ {Number(account.current_balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Account Modal */}
      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Conta *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Caixa Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.account_type}
                onValueChange={(v: FinancialAccount["account_type"]) =>
                  setFormData({ ...formData, account_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeLabels).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.account_type === "conta_bancaria" && (
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Nome do banco"
                />
              </div>
            )}
            {!editingAccount && (
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingAccount ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FinancialCampaignsTabProps {
  churchId: string;
}

export function FinancialCampaignsTab({ churchId }: FinancialCampaignsTabProps) {
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FinancialCampaign | null>(null);
  const [formData, setFormData] = useState<CreateCampaignData>({
    name: "",
    description: "",
    goal_amount: 0,
    start_date: "",
    end_date: "",
  });

  const { campaigns, isLoading, createCampaign, updateCampaign, deleteCampaign } = useFinancialAccounts(churchId);

  const handleOpenNew = () => {
    setEditingCampaign(null);
    setFormData({ name: "", description: "", goal_amount: 0, start_date: "", end_date: "" });
    setCampaignModalOpen(true);
  };

  const handleOpenEdit = (campaign: FinancialCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      goal_amount: campaign.goal_amount || 0,
      start_date: campaign.start_date || "",
      end_date: campaign.end_date || "",
    });
    setCampaignModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    if (editingCampaign) {
      await updateCampaign(editingCampaign.id, formData);
    } else {
      await createCampaign(formData);
    }
    setCampaignModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campanhas Financeiras</h3>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {activeCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma campanha ativa</h3>
            <p className="text-muted-foreground mb-4">
              Crie campanhas para arrecadações específicas.
            </p>
            <Button onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCampaigns.map((campaign) => {
            const progress = campaign.goal_amount
              ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
              : 0;
            return (
              <Card key={campaign.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(campaign)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCampaign(campaign.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span>Arrecadado:</span>
                    <span className="font-semibold text-success">
                      R$ {Number(campaign.current_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {campaign.goal_amount && campaign.goal_amount > 0 && (
                    <>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(0)}% da meta</span>
                        <span>Meta: R$ {Number(campaign.goal_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  {(campaign.start_date || campaign.end_date) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {campaign.start_date && new Date(campaign.start_date).toLocaleDateString("pt-BR")}
                      {campaign.start_date && campaign.end_date && " - "}
                      {campaign.end_date && new Date(campaign.end_date).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Campaign Modal */}
      <Dialog open={campaignModalOpen} onOpenChange={setCampaignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Missões 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da campanha..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.goal_amount}
                onChange={(e) => setFormData({ ...formData, goal_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingCampaign ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
