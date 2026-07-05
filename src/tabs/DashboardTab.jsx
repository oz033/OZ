/* Home: beantwortet in 3 Sekunden — was heute, wann als nächstes, wie starten, wie läuft's.
   Bewusst reduziert: ein Hero ohne Karte, ein CTA, eine Overview-Karte statt vier Einzelkarten,
   ein Rekord-Hinweis statt Dauerpräsenz. Abzeichen/Zitat sind nach Verlauf ausgelagert. */

import React, { useMemo, useState } from "react";
import {
  Play,
  Plus,
  Flame,
  Trophy,
  Target,
  CalendarDays,
  Droplets,
  Apple,
  Zap,
} from "lucide-react";
import { CountUp, MiniRing } from "../components/ui.jsx";
import { EclipseMark } from "../components/brand.jsx";
import StreakCalendar from "../components/StreakCalendar.jsx";
import {
  calcStats,
  dayStreak,
  dailyQuote,
  getTodayPlan,
  isRestDay,
  nextTrainingDay,
  todayISO,
  todayKey,
  estimateDuration,
  lastRecord,
  weightTrend,
  relativeDay,
  fmtDate,
  round1,
} from "../lib/utils.js";
import { DAILY_QUOTES } from "../lib/constants.js";
import { weeklyAdherence, catchUpDay } from "../lib/planGenerator.js";

export default function DashboardTab({ data, update, goTo, onStart }) {
  const [showCal, setShowCal] = useState(false);
  const stats = useMemo(
    () => calcStats(data.logs, data.settings?.weeklyGoal || 3),
    [data.logs, data.settings?.weeklyGoal],
  );
  const plan = getTodayPlan(data);
  const restDay = isRestDay(data);
  const today = todayISO();
  const streak = useMemo(() => dayStreak(data.logs, today), [data.logs, today]);
  const next = useMemo(() => nextTrainingDay(data), [data]);
  const adherence = useMemo(() => weeklyAdherence(data), [data]);
  const catchUp = useMemo(() => catchUpDay(data), [data]);
  const planByIdName = useMemo(() => {
    const m = {};
    (data.library || []).forEach((e) => {
      m[e.id] = e.name;
    });
    return m;
  }, [data.library]);
  const record = useMemo(() => lastRecord(data.logs), [data.logs]);
  const wTrend = useMemo(
    () => weightTrend(data.profile.weightLog),
    [data.profile.weightLog],
  );
  const lastWorkout = useMemo(() => {
    const lastDate = stats.lastDays.find((d) => d !== today) || stats.lastDays[0];
    if (!lastDate || lastDate === today) return null;
    const dayLogs = data.logs.filter((l) => l.date === lastDate);
    const vol = stats.dayVolumes[lastDate] || 0;
    return { date: lastDate, exercises: dayLogs.length, volume: Math.round(vol) };
  }, [stats, data.logs, today]);

  const weeklyGoal = data.settings?.weeklyGoal || 3;
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const trainedToday = !!stats.dayVolumes[today];
  const quote = dailyQuote(DAILY_QUOTES, data.profile.gender);
  const isF = data.profile.gender === "f";
  const duration = plan ? estimateDuration(plan.exercises, data.settings?.restSeconds) : 0;

  // Wellness (Wasser / Kalorien) — nur sichtbar wenn im Profil aktiviert
  const waterGoal = data.settings?.waterGoal || 0;
  const kcalGoal = data.settings?.kcalGoal || 0;
  const wellness = data.wellness?.[today] || {};
  const patchWellness = (fields) =>
    update((prev) => ({
      ...prev,
      wellness: {
        ...(prev.wellness || {}),
        [today]: { ...(prev.wellness?.[today] || {}), ...fields },
      },
    }));

  /* Leerer Zustand: noch kein Training */
  if (stats.totalWorkouts === 0) {
    return (
      <div className="ig-tabpane">
        <div className="ig-home-hero">
          <span className="ig-home-eyebrow">
            <EclipseMark size={16} />
          </span>
          <h1 className="ig-home-title">{greeting}</h1>
          <p className="ig-home-sub">
            {isF
              ? "Dein erster Schritt zu mehr Kraft und Wohlbefinden wartet."
              : "Dein erstes Workout wartet — leg los."}
          </p>
        </div>
        <button className="ig-btn-primary wide xl ig-home-cta" onClick={() => onStart()}>
          <Play size={20} /> Erstes Workout starten
        </button>
        <p className="ig-home-quote">{quote}</p>
      </div>
    );
  }

  return (
    <div className="ig-tabpane">
      {/* Hero: kein Card-Rahmen, große Typografie trägt die Hierarchie */}
      <div className="ig-home-hero">
        <span className="ig-home-eyebrow">
          {trainedToday ? "Erledigt" : restDay ? "Ruhetag" : "Heute"}
        </span>
        <h1 className="ig-home-title">
          {trainedToday
            ? "Stark gemacht."
            : restDay
              ? "Regeneration."
              : plan
                ? plan.name
                : greeting}
        </h1>
        <p className="ig-home-sub">
          {trainedToday
            ? "Training für heute im Kasten — morgen geht's weiter."
            : restDay
              ? next
                ? `Nächstes Training: ${next.date.toLocaleDateString("de-DE", { weekday: "long" })} · ${next.plan.name}`
                : "Kein Plan für heute geplant."
              : plan
                ? `${plan.exercises.length} Übungen · ≈ ${duration} Min`
                : "Leg im Plan-Tab deinen ersten Trainingsplan an."}
        </p>
      </div>

      {/* Primäre Aktion: einzige große CTA der Seite */}
      {!restDay && !trainedToday && plan && (
        <button className="ig-btn-primary wide xl ig-home-cta" onClick={() => onStart()}>
          <Play size={20} /> Workout starten
        </button>
      )}
      {trainedToday && (
        <button className="ig-btn-primary wide ghosted ig-home-cta" onClick={() => goTo("workout")}>
          <Plus size={16} /> Weiteren Satz loggen
        </button>
      )}
      {restDay && plan && !trainedToday && (
        <button className="ig-btn-primary wide ghosted ig-home-cta" onClick={() => onStart()}>
          <Play size={16} /> Trotzdem {plan.name} starten
        </button>
      )}

      {/* Smart Coach: verpasste Einheit nachholen — nur wenn relevant */}
      {adherence && adherence.missed > 0 && !trainedToday && (
        <div className="ig-card ig-nudge">
          <span className="ig-nudge-icon"><Target size={18} /></span>
          <span className="ig-nudge-text">
            Diese Woche {adherence.missed}{" "}
            {adherence.missed === 1 ? "Einheit" : "Einheiten"} verpasst.
            {catchUp
              ? catchUp.key === todayKey()
                ? " Heute ist ein guter Tag zum Nachholen."
                : ` Hol sie am ${catchUp.label} nach.`
              : " Jede Einheit zählt."}
          </span>
        </div>
      )}

      {/* Heutiger Plan im Detail */}
      {plan && !trainedToday && !restDay && plan.exercises.length > 0 && (
        <div className="ig-card ig-today-card">
          <div className="ig-field-label">Reihenfolge heute</div>
          <ol className="ig-today-plan">
            {plan.exercises.map((it, i) => (
              <li key={it.exerciseId + i}>
                <span className="ig-today-plan-num mono">{i + 1}</span>
                <span className="ig-today-plan-name">
                  {planByIdName[it.exerciseId] || "?"}
                </span>
                <span className="ig-today-plan-meta mono">
                  {it.sets} × {it.reps}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Overview: Streak / Wochenziel / Rekorde + Level in EINER Karte statt vier */}
      <div className="ig-card ig-overview">
        <div className="ig-overview-row">
          <button className="ig-overview-col" onClick={() => setShowCal((s) => !s)}>
            <Flame size={17} className="ig-dash-icon" />
            <span className="ig-overview-num mono"><CountUp value={streak.streak} /></span>
            <span className="ig-overview-label">Serie</span>
          </button>
          <div className="ig-overview-divider" />
          <div className="ig-overview-col">
            <Target size={17} className="ig-dash-icon" />
            <span className="ig-overview-num mono">
              {stats.thisWeekDays >= weeklyGoal ? "✓" : `${stats.thisWeekDays}/${weeklyGoal}`}
            </span>
            <span className="ig-overview-label">Woche</span>
          </div>
          <div className="ig-overview-divider" />
          <div className="ig-overview-col">
            <Trophy size={17} className="ig-dash-icon" />
            <span className="ig-overview-num mono"><CountUp value={stats.prCount} /></span>
            <span className="ig-overview-label">Rekorde</span>
          </div>
        </div>
        <div className="ig-overview-level">
          <span className="ig-overview-level-label">
            <Zap size={12} /> Level {stats.level}
          </span>
          <div className="ig-level-track sm">
            <div className="ig-level-fill" style={{ width: `${stats.levelPct * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Persönlicher Rekord: nur zeigen, wenn es einen gibt — echte Motivation statt Füllmaterial */}
      {record && (
        <button className="ig-pr-banner" onClick={() => goTo("progress")}>
          <Trophy size={16} />
          <span className="ig-pr-text">
            Letzter Rekord: <strong>{record.exercise}</strong> {record.weight} kg
          </span>
          <span className="ig-pr-when">{relativeDay(record.date, today)}</span>
        </button>
      )}

      {/* Letztes Workout: eine Zeile, kein Listen-Rückblick */}
      {lastWorkout && (
        <button className="ig-weight-line" onClick={() => goTo("progress")}>
          <span>Letztes Training · {fmtDate(lastWorkout.date)}</span>
          <span className="mono">
            {lastWorkout.exercises} Übungen · {lastWorkout.volume >= 1000 ? `${round1(lastWorkout.volume / 1000)}t` : `${lastWorkout.volume} kg`}
          </span>
        </button>
      )}

      {/* Gewichtstrend: eine Zeile statt Diagramm — Chart lebt im Profil */}
      {wTrend && (
        <button className="ig-weight-line" onClick={() => goTo("profile")}>
          <span>Körpergewicht {wTrend.kg} kg</span>
          <span className={"mono" + (wTrend.diff < 0 ? " pos" : wTrend.diff > 0 ? " neg" : "")}>
            {wTrend.diff > 0 ? "+" : ""}{wTrend.diff} kg
          </span>
        </button>
      )}

      {/* Kalender (aufklappbar, kein Dauerplatz) */}
      {showCal && (
        <StreakCalendar logs={data.logs} today={today} onClose={() => setShowCal(false)} />
      )}
      {!showCal && (
        <button className="ig-cal-open" onClick={() => setShowCal(true)}>
          <CalendarDays size={14} /> Trainingskalender anzeigen
        </button>
      )}

      {/* Wellness: Wasser & Kalorien (nur wenn im Profil aktiviert) */}
      {(waterGoal > 0 || kcalGoal > 0) && (
        <div className="ig-wellness-grid">
          {waterGoal > 0 && (
            <div className="ig-card ig-wellness-card">
              <MiniRing pct={(wellness.water || 0) / waterGoal} color="var(--info)">
                <Droplets size={15} style={{ color: "var(--info)" }} />
              </MiniRing>
              <div className="ig-wellness-body">
                <span className="ig-wellness-num mono">
                  {((wellness.water || 0) / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} l
                </span>
                <span className="ig-dash-label">Wasser</span>
              </div>
              <button
                className="ig-wellness-add"
                onClick={() => patchWellness({ water: (wellness.water || 0) + 250 })}
                aria-label="250 ml Wasser hinzufügen"
              >
                +250
              </button>
            </div>
          )}
          {kcalGoal > 0 && (
            <div className="ig-card ig-wellness-card">
              <MiniRing pct={(wellness.kcal || 0) / kcalGoal} color="var(--success)">
                <Apple size={15} style={{ color: "var(--success)" }} />
              </MiniRing>
              <div className="ig-wellness-body">
                <span className="ig-wellness-num mono">
                  {wellness.kcal || 0} / {kcalGoal}
                </span>
                <span className="ig-dash-label">Kalorien</span>
              </div>
              <button
                className="ig-wellness-add"
                onClick={() => patchWellness({ kcal: (wellness.kcal || 0) + 100 })}
                aria-label="100 kcal hinzufügen"
              >
                +100
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
