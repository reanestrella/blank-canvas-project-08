import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AttendanceItemProps {
  memberName: string;
  isPresent: boolean;
  onToggle: () => void;
}

export function AttendanceItem({ memberName, isPresent, onToggle }: AttendanceItemProps) {
  const initials = (memberName || "?")
    .split(" ")
    .map((n) => n?.[0] ?? "")
    .join("")
    .slice(0, 2) || "?";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`flex items-center gap-3 p-2 rounded-lg border transition-all text-left cursor-pointer select-none ${
        isPresent
          ? "bg-success/10 border-success/30 hover:bg-success/20"
          : "bg-muted/30 border-transparent hover:bg-muted/50"
      }`}
    >
      <Checkbox checked={isPresent} tabIndex={-1} className="pointer-events-none" />
      <Avatar className="w-7 h-7">
        <AvatarFallback
          className={`text-xs ${isPresent ? "bg-success text-success-foreground" : "bg-muted"}`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className={`text-sm truncate ${isPresent ? "font-medium" : ""}`}>
        {memberName}
      </span>
    </div>
  );
}
