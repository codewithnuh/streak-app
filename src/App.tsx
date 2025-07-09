import React, { useState, useEffect, useCallback } from "react";

import {
  openIndexedDB,
  getStreaksFromIDB,
  getGoalFromIDB,
  putStreakInIDB,
  putGoalInIDB,
} from "@/lib/indexeddb";
import { ThemeProvider } from "next-themes";
import { toast, Toaster } from "sonner";
import { ModeToggle } from "./components/ModeToggle";
import { StreakInfo } from "./components/StreakInfo";
import { startOfDay, isSameDay } from "./lib/streak-utils";
import { StreakBar } from "./components/Streak-bar";

// --- Type Definitions ---
interface StreakData {
  id: string;
  date: Date;
  isCompleted: boolean;
}

interface GoalData {
  id: string;
  targetDays: number;
  currentStreakDays: number;
  lastStreakUpdate: Date | null;
}

// --- Main App Component ---
export default function App() {
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [userId] = useState<string>("local-user"); // Using a static ID for local IndexedDB

  // --- IndexedDB Initialization and Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      try {
        await openIndexedDB(); // Ensure DB is open
        const fetchedStreaks = await getStreaksFromIDB();
        setStreaks(fetchedStreaks);

        let fetchedGoal = await getGoalFromIDB();
        if (!fetchedGoal) {
          fetchedGoal = {
            id: "userGoal",
            targetDays: 60,
            currentStreakDays: 0,
            lastStreakUpdate: null,
          };
          await putGoalInIDB(fetchedGoal);
        }
        setGoal(fetchedGoal);

        const todayStartOfDay = startOfDay(new Date());
        const todayStreak = fetchedStreaks.find((s) =>
          isSameDay(s.date, todayStartOfDay)
        );
        setTodayCompleted(!!todayStreak?.isCompleted);
      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        toast("Storage error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // --- Streak Calculation Logic ---
  const calculateCurrentStreak = useCallback(
    (allStreaks: StreakData[], lastUpdate: Date | null): number => {
      const todayStartOfDay = startOfDay(new Date());

      const completedStreaks = [...allStreaks]
        .filter((s) => s.isCompleted)
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort ascending

      if (completedStreaks.length === 0) {
        return 0;
      }

      let currentStreakCount = 0;
      let lastCompletedDate: Date | null = null;

      for (let i = completedStreaks.length - 1; i >= 0; i--) {
        const streakDate = startOfDay(completedStreaks[i].date);

        if (i === completedStreaks.length - 1) {
          if (isSameDay(streakDate, todayStartOfDay)) {
            currentStreakCount = 1;
          } else {
            const yesterday = new Date(todayStartOfDay);
            yesterday.setDate(todayStartOfDay.getDate() - 1);
            if (isSameDay(streakDate, yesterday)) {
              currentStreakCount = 1;
            } else {
              return 0;
            }
          }
        } else {
          if (lastCompletedDate) {
            const expectedPreviousDay = new Date(lastCompletedDate);
            expectedPreviousDay.setDate(lastCompletedDate.getDate() - 1);
            if (isSameDay(streakDate, expectedPreviousDay)) {
              currentStreakCount++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        lastCompletedDate = streakDate;
      }

      const todayStreak = allStreaks.find((s) =>
        isSameDay(s.date, todayStartOfDay)
      );
      if (!todayStreak?.isCompleted && currentStreakCount > 0 && lastUpdate) {
        const yesterday = new Date(todayStartOfDay);
        yesterday.setDate(todayStartOfDay.getDate() - 1);
        if (isSameDay(lastUpdate, yesterday)) {
          return 0;
        }
      }

      return currentStreakCount;
    },
    []
  );

  // --- Update Goal in IndexedDB ---
  const updateGoalInDB = useCallback(
    async (
      targetDays: number,
      currentStreakDays: number,
      lastUpdate: Date | null
    ) => {
      try {
        const updatedGoal: GoalData = {
          id: "userGoal",
          targetDays,
          currentStreakDays,
          lastStreakUpdate: lastUpdate,
        };
        await putGoalInIDB(updatedGoal);
        setGoal(updatedGoal); // Update local state
      } catch (error) {
        console.error("Error updating goal in IndexedDB:", error);
        toast("Failed to update your streak goal in local storage.");
      }
    },
    [toast]
  );

  // --- Handle Marking Today's Streak ---
  const handleMarkToday = async () => {
    setLoading(true);
    const today = startOfDay(new Date());
    try {
      const existingStreak = streaks.find((s) => isSameDay(s.date, today));

      const newStreakData: StreakData = {
        id: existingStreak ? existingStreak.id : Date.now().toString(), // Use existing ID or generate new
        date: today,
        isCompleted: true,
      };

      await putStreakInIDB(newStreakData);

      // Update local streaks state
      setStreaks((prevStreaks) => {
        const updated = prevStreaks.filter((s) => !isSameDay(s.date, today));
        return [...updated, newStreakData];
      });
      setTodayCompleted(true);

      if (goal) {
        // Recalculate streak immediately after marking today
        const updatedStreaksForCalc = [
          ...streaks.filter((s) => !isSameDay(s.date, today)),
          newStreakData,
        ];
        const newCalculatedStreak = calculateCurrentStreak(
          updatedStreaksForCalc,
          today
        );
        await updateGoalInDB(goal.targetDays, newCalculatedStreak, today);
      }

      toast("You've successfully completed today's streak.");
    } catch (error) {
      console.error("Error marking today:", error);
      toast("Failed to mark today's streak in local storage.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Updating Goal Target ---
  const handleUpdateGoal = async (newTarget: number) => {
    if (goal) {
      await updateGoalInDB(
        newTarget,
        goal.currentStreakDays,
        goal.lastStreakUpdate
      );
    }
  };

  // --- Recalculate Streak and Handle Reset Logic (after streaks/goal state changes) ---
  useEffect(() => {
    if (streaks.length > 0 && goal && !loading) {
      const todayStartOfDay = startOfDay(new Date());
      const yesterdayStartOfDay = new Date(todayStartOfDay);
      yesterdayStartOfDay.setDate(todayStartOfDay.getDate() - 1);

      const todayStreakRecord = streaks.find((s) =>
        isSameDay(s.date, todayStartOfDay)
      );
      const yesterdayStreakRecord = streaks.find((s) =>
        isSameDay(s.date, yesterdayStartOfDay)
      );

      const lastUpdateDate = goal.lastStreakUpdate
        ? startOfDay(goal.lastStreakUpdate)
        : null;

      let newCalculatedStreak = calculateCurrentStreak(
        streaks,
        goal.lastStreakUpdate
      );

      if (goal.currentStreakDays > 0) {
        // Case 1: Today is not completed, and last update was yesterday.
        if (
          !todayStreakRecord?.isCompleted &&
          lastUpdateDate &&
          isSameDay(lastUpdateDate, yesterdayStartOfDay)
        ) {
          console.log("Streak missed! Resetting streak to 0.");
          toast("You missed a day. Your streak has been reset to 0.");
          newCalculatedStreak = 0;
        }
        // Case 2: A gap was detected by calculateCurrentStreak (e.g., missed multiple days, or past day marked incomplete)
        // Only reset if the calculated streak is less than the current stored streak, and today isn't completed.
        if (
          newCalculatedStreak < goal.currentStreakDays &&
          !todayStreakRecord?.isCompleted
        ) {
          console.log("Gap detected in streak. Resetting to 0.");
          toast("A gap was detected in your streak. Resetting to 0.");
          newCalculatedStreak = 0;
        }
      }

      // Only update if the calculated streak is truly different from the stored one
      if (newCalculatedStreak !== goal.currentStreakDays) {
        updateGoalInDB(
          goal.targetDays,
          newCalculatedStreak,
          goal.lastStreakUpdate
        );
      }
    } else if (
      goal &&
      streaks.length === 0 &&
      goal.currentStreakDays !== 0 &&
      !loading
    ) {
      // If there are no completed streaks but goal says there's a streak, reset it
      updateGoalInDB(goal.targetDays, 0, null);
    }
  }, [streaks, goal, loading, calculateCurrentStreak, updateGoalInDB, toast]);

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 text-white">
          <p>Loading streak data...</p>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col items-center p-4 dark:bg-gray-900 text-white relative">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <h1 className="text-4xl font-bold mb-8 text-center mt-10">
          Daily Streak Tracker
        </h1>

        {goal && (
          <StreakInfo
            currentStreak={goal.currentStreakDays}
            targetDays={goal.targetDays}
            onUpdateGoal={handleUpdateGoal}
            onMarkToday={handleMarkToday}
            todayCompleted={todayCompleted}
            userId={userId}
          />
        )}

        <div className="w-full max-w-lg mx-auto mt-8">
          <StreakBar streaks={streaks} todayDate={new Date()} />
        </div>
      </div>
    </ThemeProvider>
  );
}
