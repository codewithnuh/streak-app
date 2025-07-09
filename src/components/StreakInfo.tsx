import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
interface StreakInfoProps {
  currentStreak: number;
  targetDays: number;
  onUpdateGoal: (newTarget: number) => Promise<void>;
  onMarkToday: () => Promise<void>;
  todayCompleted: boolean;
  userId: string;
}

export const StreakInfo: React.FC<StreakInfoProps> = ({
  currentStreak,
  targetDays,
  onUpdateGoal,
  onMarkToday,
  todayCompleted,
  userId,
}) => {
  const [newTarget, setNewTarget] = useState(targetDays.toString());
  useEffect(() => {
    setNewTarget(targetDays.toString());
  }, [targetDays]);

  const handleGoalSave = async () => {
    const target = parseInt(newTarget, 10);
    if (!isNaN(target) && target > 0) {
      await onUpdateGoal(target);
      toast("Goal updated successfully!");
    } else {
      toast("Please enter a valid positive number for your goal.");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Streak Progress</CardTitle>
        <CardDescription>Keep up the great work!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">
              Current Streak: {currentStreak} days
            </p>
            <p className="text-md text-muted-foreground">
              Target: {targetDays} days
            </p>
          </div>
          {!todayCompleted ? (
            <Button
              onClick={onMarkToday}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Mark Today
            </Button>
          ) : (
            <Button disabled className="bg-green-600">
              Today Completed!
            </Button>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Set Streak Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Your Streak Goal</DialogTitle>
              <DialogDescription>
                How many consecutive days do you want to achieve your streak?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target" className="text-right">
                  Target Days
                </Label>
                <Input
                  id="target"
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleGoalSave}>Save Goal</Button>
          </DialogContent>
        </Dialog>
        <div className="text-sm text-muted-foreground mt-4">
          User ID: <span className="font-mono break-all">{userId}</span>
        </div>
      </CardContent>
    </Card>
  );
};
