"use client";

import { useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";

export function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Month and Year string
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  // Generate 7 days of current week based on currentDate (Monday = 0)
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <article className="rounded-[32px] border border-line bg-surface p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-line">
        <button
          type="button"
          onClick={handlePrevWeek}
          aria-label="Previous week"
          className="grid size-8 place-items-center rounded-full bg-canvas border border-line text-ink hover:bg-surface transition-colors"
        >
          <ArrowLeft01Icon size={16} color="currentColor" />
        </button>

        <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
          {monthName} {year}
        </h3>

        <button
          type="button"
          onClick={handleNextWeek}
          aria-label="Next week"
          className="grid size-8 place-items-center rounded-full bg-canvas border border-line text-ink hover:bg-surface transition-colors"
        >
          <ArrowRight01Icon size={16} color="currentColor" />
        </button>
      </div>

      {/* Weekday Strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pt-3">
        {weekDays.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const activeToday = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? "bg-accent text-white dark:text-black font-bold shadow-sm scale-[1.03]"
                  : "hover:bg-canvas text-ink/70 hover:text-ink"
              }`}
            >
              <span className={`text-[11px] sm:text-xs font-semibold ${isSelected ? "text-white/90 dark:text-black/80" : "text-muted"}`}>
                {dayLabels[idx]}
              </span>
              <span className="text-sm sm:text-base font-extrabold mt-1">
                {day.getDate()}
              </span>

              {/* Activity indicator / Daily attendance dot */}
              <div className="h-1 mt-1 flex items-center justify-center">
                {activeToday ? (
                  <span className={`size-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-accent"}`} />
                ) : isSelected ? (
                  <span className="size-1 rounded-full bg-white/70 dark:bg-black/70" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
