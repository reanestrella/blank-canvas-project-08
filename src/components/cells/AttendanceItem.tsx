import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check } from "lucide-react";

interface AttendanceItemProps {
  memberName: string;
  isPresent: boolean;
  onToggle: () => void;
}

export const AttendanceItem = memo(function AttendanceItem({ memberName, isPresent, onToggle }: AttendanceItemProps) {
  const initials = (memberName || "?")
    .split(" ")
    .map((n) => n?.[0] ?? "")
    .join("")
    .slice(0, 2) || "?";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`flex items-center gap-3 p-3 min-h-[44px] rounded-lg border transition-all text-left cursor-pointer select-none ${
        isPresent
          ? "bg-success/10 border-success/30 hover:bg-success/20"
          : "bg-muted/30 border-transparent hover:bg-muted/50"
      }`}
    >
      <div
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isPresent
            ? "bg-success border-success text-success-foreground"
            : "border-muted-foreground/30 bg-background"
        }`}
      >
        {isPresent && <Check className="w-3 h-3" />}
      </div>
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
});
