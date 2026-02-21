import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";

export function UpcomingEvents() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { events, isLoading } = useEvents(churchId || undefined);

  // Only future events
  const today = new Date().toISOString().split("T")[0];
  const upcoming = events
    .filter(e => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Próximos Eventos</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Próximos Eventos</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum evento próximo. Crie eventos no módulo de Eventos.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-secondary" />
        <h3 className="text-lg font-semibold">Próximos Eventos</h3>
      </div>
      <div className="space-y-4">
        {upcoming.map((event) => {
          const date = new Date(event.event_date + "T12:00:00");
          return (
            <div
              key={event.id}
              className="flex gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center min-w-[50px] p-2 rounded-lg bg-background">
                <span className="text-xs text-muted-foreground uppercase">
                  {date.toLocaleDateString("pt-BR", { month: "short" })}
                </span>
                <span className="text-xl font-bold">{date.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{event.title}</h4>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  {event.event_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {event.event_time}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
