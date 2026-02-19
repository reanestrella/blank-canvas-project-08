import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const events = [
  {
    id: 1,
    title: "Culto de Domingo",
    date: "21 Jan",
    time: "09:00",
    location: "Templo Principal",
    attendees: 150,
    type: "worship",
  },
  {
    id: 2,
    title: "Reunião de Líderes",
    date: "22 Jan",
    time: "19:30",
    location: "Sala de Reuniões",
    attendees: 25,
    type: "meeting",
  },
  {
    id: 3,
    title: "Encontro de Casais",
    date: "27 Jan",
    time: "18:00",
    location: "Salão Social",
    attendees: 40,
    type: "event",
  },
  {
    id: 4,
    title: "Escola Bíblica",
    date: "28 Jan",
    time: "09:00",
    location: "Salas de Aula",
    attendees: 80,
    type: "education",
  },
];

const typeColors = {
  worship: "bg-secondary/10 text-secondary border-secondary/30",
  meeting: "bg-primary/10 text-primary border-primary/30",
  event: "bg-info/10 text-info border-info/30",
  education: "bg-success/10 text-success border-success/30",
};

const typeLabels = {
  worship: "Culto",
  meeting: "Reunião",
  event: "Evento",
  education: "Ensino",
};

export function UpcomingEvents() {
  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Próximos Eventos</h3>
        </div>
        <button className="text-sm text-secondary hover:underline font-medium">
          Ver calendário
        </button>
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center min-w-[50px] p-2 rounded-lg bg-background">
              <span className="text-xs text-muted-foreground uppercase">
                {event.date.split(" ")[1]}
              </span>
              <span className="text-xl font-bold">{event.date.split(" ")[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold truncate">{event.title}</h4>
                <Badge
                  variant="outline"
                  className={typeColors[event.type as keyof typeof typeColors]}
                >
                  {typeLabels[event.type as keyof typeof typeLabels]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {event.attendees} confirmados
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
