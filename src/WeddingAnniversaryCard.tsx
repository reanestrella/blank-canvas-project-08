import { Heart, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  id: string;
  full_name: string;
  wedding_date: string | null;
  photo_url: string | null;
}

interface WeddingAnniversaryCardProps {
  anniversariesThisMonth: Member[];
  anniversariesThisWeek: Member[];
}

export function WeddingAnniversaryCard({ 
  anniversariesThisMonth, 
  anniversariesThisWeek 
}: WeddingAnniversaryCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getYearsMarried = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    return now.getFullYear() - date.getFullYear();
  };

  const renderList = (members: Member[], emptyMessage: string) => {
    if (members.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Heart className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.photo_url || ""} />
              <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {getYearsMarried(member.wedding_date!)} anos
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {formatDate(member.wedding_date!)}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-destructive" />
          Bodas de Casamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="month" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="month" className="text-xs">
              Mês ({anniversariesThisMonth.length})
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              Semana ({anniversariesThisWeek.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            {renderList(anniversariesThisMonth, "Nenhum aniversário de casamento este mês")}
          </TabsContent>
          <TabsContent value="week">
            {renderList(anniversariesThisWeek, "Nenhum aniversário de casamento esta semana")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
