import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEvents, CreateEventData } from "@/hooks/useEvents";
import { EventModal } from "@/components/modals/EventModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/hooks/useEvents";

export default function Eventos() {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents(churchId || undefined);

  const handleCreateEvent = async (data: Partial<Event>) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    const createData: CreateEventData & { church_id: string } = {
      title: data.title || "",
      description: data.description || undefined,
      event_date: data.event_date || "",
      event_time: data.event_time || undefined,
      location: data.location || undefined,
      max_participants: data.max_participants || undefined,
      is_public: data.is_public ?? true,
      church_id: churchId,
    };
    return createEvent(createData);
  };

  const handleUpdateEvent = async (data: Partial<Event>) => {
    if (!editingEvent) return { data: null, error: new Error("No event to edit") };
    return updateEvent(editingEvent.id, data);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setEventModalOpen(open);
    if (!open) {
      setEditingEvent(undefined);
    }
  };

  // Filter upcoming events
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Eventos & Calendário</h1>
            <p className="text-muted-foreground">
              Gerencie eventos, inscrições e comunicados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button 
              className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                setEditingEvent(undefined);
                setEventModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            <p className="text-sm text-muted-foreground">Próximos Eventos</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">Total de Eventos</p>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Próximos Eventos</h2>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum evento próximo</h3>
                <p className="text-muted-foreground mb-4">
                  Crie um novo evento para começar.
                </p>
                <Button onClick={() => setEventModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Evento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[60px] p-3 rounded-xl bg-primary/5">
                        <span className="text-xs text-muted-foreground uppercase">
                          {new Date(event.event_date).toLocaleDateString("pt-BR", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {new Date(event.event_date).getDate()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString("pt-BR", {
                            weekday: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              {event.is_public && (
                                <Badge variant="outline" className="text-xs">
                                  Público
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(event)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>Gerenciar inscrições</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeletingEvent(event)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          {event.event_time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {event.event_time}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          )}
                          {event.max_participants && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {event.max_participants} vagas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        open={eventModalOpen}
        onOpenChange={handleCloseModal}
        event={editingEvent}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        title="Excluir Evento"
        description={`Tem certeza que deseja excluir "${deletingEvent?.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteEvent(deletingEvent!.id)}
      />
    </AppLayout>
  );
}
