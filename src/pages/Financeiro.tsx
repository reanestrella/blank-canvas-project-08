import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Target,
  Calendar,
  Loader2,
  MoreHorizontal,
  Users,
  Heart,
} from "lucide-react";
import { useFinancial, CreateTransactionData } from "@/hooks/useFinancial";
import { useTithers } from "@/hooks/useTithers";
import { TransactionModal } from "@/components/modals/TransactionModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { TithersTable } from "@/components/financial/TithersTable";
import { TithersChart } from "@/components/financial/TithersChart";
import { FinancialAccountsTab, FinancialCampaignsTab } from "@/components/financial/FinancialAccountsCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialTransaction } from "@/hooks/useFinancial";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<"receita" | "despesa">("receita");
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();
  const [deletingTransaction, setDeletingTransaction] = useState<FinancialTransaction | null>(null);

  const { profile } = useAuth();
  const churchId = profile?.church_id;

  const {
    transactions,
    categories,
    isLoading,
    totalIncome,
    totalExpense,
    balance,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinancial(churchId || undefined);

  const {
    tithers,
    months,
    monthlyTotals,
    stats: titherStats,
    isLoading: loadingTithers,
  } = useTithers(churchId || undefined);

  const stats = [
    {
      title: "Saldo Atual",
      value: `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: balance >= 0 ? "Positivo" : "Negativo",
      changeType: balance >= 0 ? "positive" : "negative",
      icon: PiggyBank,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Entradas (Total)",
      value: `R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: "Receitas",
      changeType: "positive",
      icon: TrendingUp,
      color: "bg-success/10 text-success",
    },
    {
      title: "Saídas (Total)",
      value: `R$ ${totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: "Despesas",
      changeType: "negative",
      icon: TrendingDown,
      color: "bg-destructive/10 text-destructive",
    },
    {
      title: "Transações",
      value: transactions.length.toString(),
      change: "Total",
      changeType: "neutral",
      icon: Target,
      color: "bg-secondary/10 text-secondary",
    },
  ];

  const handleOpenNewTransaction = (type: "receita" | "despesa") => {
    setEditingTransaction(undefined);
    setDefaultTransactionType(type);
    setTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setDefaultTransactionType(transaction.type);
    setTransactionModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setTransactionModalOpen(open);
    if (!open) {
      setEditingTransaction(undefined);
    }
  };

  const handleCreateTransaction = async (data: CreateTransactionData) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    return createTransaction({ ...data, church_id: churchId });
  };

  const handleUpdateTransaction = async (data: CreateTransactionData) => {
    if (!editingTransaction) return { data: null, error: new Error("No transaction to edit") };
    return updateTransaction(editingTransaction.id, data);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">
              Gestão financeira transparente da sua igreja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Relatório
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleOpenNewTransaction("despesa")}
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
            <Button 
              className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleOpenNewTransaction("receita")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.title} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.changeType === "positive" ? "text-success" : 
                    stat.changeType === "negative" ? "text-destructive" : "text-muted-foreground"
                  }`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions">Movimentações</TabsTrigger>
            <TabsTrigger value="tithers">Dizimistas</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Últimas Movimentações</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("transactions")}>
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <PiggyBank className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma transação</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece registrando sua primeira transação.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleOpenNewTransaction("despesa")}>
                        Nova Despesa
                      </Button>
                      <Button onClick={() => handleOpenNewTransaction("receita")}>
                        Nova Receita
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.type === "receita"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {tx.type === "receita" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.transaction_date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold ${
                            tx.type === "receita" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {tx.type === "receita" ? "+" : "-"}R$ {Number(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Todas as Movimentações</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <PiggyBank className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma transação</h3>
                    <p className="text-muted-foreground">
                      Registre sua primeira transação para começar.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {new Date(tx.transaction_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">{tx.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                tx.type === "receita"
                                  ? "bg-success/20 text-success"
                                  : "bg-destructive/20 text-destructive"
                              }
                            >
                              {tx.type === "receita" ? "Entrada" : "Saída"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              tx.type === "receita" ? "text-success" : "text-destructive"
                            }`}
                          >
                            {tx.type === "receita" ? "+" : "-"}R$ {Number(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditTransaction(tx)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeletingTransaction(tx)}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tithers Tab */}
          <TabsContent value="tithers" className="space-y-6 mt-6">
            {/* Tithers Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Dizimistas</p>
                    <p className="text-2xl font-bold mt-1">{titherStats.totalTithers}</p>
                    <p className="text-xs mt-1 text-muted-foreground">Nos últimos 12 meses</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total em Dízimos</p>
                    <p className="text-2xl font-bold mt-1">
                      R$ {titherStats.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs mt-1 text-success">Acumulado do ano</p>
                  </div>
                  <div className="p-3 rounded-xl bg-success/10 text-success">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média por Dizimista</p>
                    <p className="text-2xl font-bold mt-1">
                      R$ {titherStats.averagePerTither.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">Anual</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dizimistas Regulares</p>
                    <p className="text-2xl font-bold mt-1">{titherStats.regularTithers}</p>
                    <p className="text-xs mt-1 text-muted-foreground">6+ meses de contribuição</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 text-accent-foreground">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {loadingTithers ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Chart */}
                <TithersChart data={monthlyTotals} />

                {/* Table */}
                <TithersTable tithers={tithers} months={months} />
              </>
            )}
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="mt-6">
            {churchId && <FinancialAccountsTab churchId={churchId} />}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-6">
            {churchId && <FinancialCampaignsTab churchId={churchId} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={transactionModalOpen}
        onOpenChange={handleCloseModal}
        transaction={editingTransaction}
        categories={categories}
        defaultType={defaultTransactionType}
        churchId={churchId || ""}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        title="Excluir Transação"
        description={`Tem certeza que deseja excluir "${deletingTransaction?.description}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTransaction(deletingTransaction!.id)}
      />
    </AppLayout>
  );
}
