/* Trainingskalender mit Serie & Tages-Details */

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { dayStreak } from "../lib/utils.js";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function StreakCalendar({ logs, today, onClose }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  const now = new Date(today + "T00:00:00");
  now.setMonth(now.getMonth() + monthOffset);
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // 0=Mo
  const daysInMonth = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayLogs = logs.filter((l) => l.date === dateStr);
    cells.push({
      date: dateStr,
      day: d,
      trained: dayLogs.length > 0,
      isToday: dateStr === today,
    });
  }

  const selectedLogs = selectedDate
    ? logs.filter((l) => l.date === selectedDate)
    : [];

  const { streak, bestStreak, totalDays } = dayStreak(logs, today);

  return (
    <div className="ig-card ig-streak-card">
      <div className="ig-streak-header">
        <span className="ig-streak-title">Trainings-Kalender</span>
        {onClose && (
          <button className="ig-icon-btn ghost" onClick={onClose} aria-label="Schließen">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="ig-streak-stats">
        <div className="ig-streak-stat">
          <span className="ig-streak-num">{streak}</span>
          <span className="ig-streak-label">Tage Serie</span>
        </div>
        <div className="ig-streak-stat">
          <span className="ig-streak-num">{bestStreak}</span>
          <span className="ig-streak-label">Beste Serie</span>
        </div>
        <div className="ig-streak-stat">
          <span className="ig-streak-num">{totalDays}</span>
          <span className="ig-streak-label">Tage gesamt</span>
        </div>
      </div>

      <div className="ig-cal-month-nav">
        <button
          className="ig-icon-btn ghost"
          onClick={() => setMonthOffset((o) => o - 1)}
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="ig-cal-month-label">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          className="ig-icon-btn ghost"
          onClick={() => setMonthOffset((o) => o + 1)}
          aria-label="Nächster Monat"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="ig-cal-grid">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((wd) => (
          <div key={wd} className="ig-cal-wd">
            {wd}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={`e${i}`} className="ig-cal-cell empty" />;
          return (
            <button
              key={c.date}
              className={
                "ig-cal-cell" +
                (c.trained ? " trained" : "") +
                (c.isToday ? " today" : "") +
                (selectedDate === c.date ? " selected" : "")
              }
              onClick={() =>
                setSelectedDate(selectedDate === c.date ? null : c.date)
              }
            >
              <span className="ig-cal-day">{c.day}</span>
              {c.trained && <span className="ig-cal-dot" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="ig-cal-detail">
          {selectedLogs.length === 0 ? (
            <p className="ig-empty">Keine Übungen an diesem Tag</p>
          ) : (
            selectedLogs.map((l) => (
              <div key={l.id || l.exercise} className="ig-cal-ex-row">
                <span className="ig-cal-ex-name">{l.exercise}</span>
                <div className="ig-cal-sets-row">
                  {l.sets.map((s, si) => (
                    <span key={si} className="ig-badge dim mono">
                      {s.reps} × {s.weight} kg
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
          {selectedLogs.length > 0 && (
            <div className="ig-cal-vol">
              Volumen:{" "}
              {Math.round(
                selectedLogs.reduce(
                  (v, l) =>
                    v + l.sets.reduce((sv, s) => sv + s.reps * s.weight, 0),
                  0,
                ),
              )}{" "}
              kg
            </div>
          )}
        </div>
      )}
    </div>
  );
}
