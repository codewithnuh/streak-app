import { cn } from "@/lib/utils";
import moment from "moment";

interface StreakBarProps {
  streaks: { date: Date; isCompleted: boolean }[];
  todayDate: Date;
}

export function StreakBar({ streaks, todayDate }: StreakBarProps) {
  const daysOfWeek = moment.weekdaysShort(); // ["Sun", "Mon", ...]
  const todayMoment = moment(todayDate).startOf("day");

  const getDayStatus = (dayIndex: number) => {
    const dayMoment = todayMoment.clone().weekday(dayIndex);
    const streakForDay = streaks.find((s) =>
      moment(s.date).isSame(dayMoment, "day")
    );

    if (streakForDay) {
      return streakForDay.isCompleted ? "completed" : "missed";
    } else {
      // If today and not marked yet, it's gray. Otherwise, it's just a normal day
      if (dayMoment.isSame(todayMoment, "day")) {
        return "pending"; // Gray for current day if not marked
      }
      return "empty"; // No data for past days
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 p-4 bg-card rounded-lg shadow-sm">
      {daysOfWeek.map((day, index) => {
        const status = getDayStatus(index);
        const isCurrentDay = moment().weekday() === index;

        return (
          <div key={day} className="flex flex-col items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {day.charAt(0)}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                {
                  "bg-green-500 text-white": status === "completed", // Completed streak (green)
                  "bg-red-500 text-white": status === "missed", // Missed streak (red)
                  "bg-orange-500 text-white":
                    status === "pending" && isCurrentDay, // Current day, not marked (orange)
                  "bg-gray-700 text-white":
                    status === "pending" && !isCurrentDay, // Other days, not marked (gray)
                  "bg-gray-800": status === "empty", // No data for past days (dark gray)
                }
              )}
            >
              {/* You could put an icon here if desired */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
