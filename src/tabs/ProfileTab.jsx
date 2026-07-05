/* Profil: Identitäts-Karte oben, Bearbeitung darunter — keine Einstellungsliste */

import React, { useState, useEffect, useRef } from "react";
import {
  Droplets,
  Apple,
  Palette,
  ChevronRight,
  Zap,
  Award,
  Download,
  Upload,
} from "lucide-react";
import ThemeStudio from "../components/ThemeStudio.jsx";
import { EclipseMark } from "../components/brand.jsx";
import { ToggleRow } from "../components/ui.jsx";
import { todayISO, round1, playSound, buzz, calcStats } from "../lib/utils.js";
import { GOALS, LEVELS, GOAL_NAME, BADGE_DEFS } from "../lib/constants.js";

export default function ProfileTab({ data, update, goTo }) {
  const [height, setHeight] = useState(data.profile.heightCm || "");
  const [weight, setWeight] = useState(data.profile.weightKg || "");
  const [showStudio, setShowStudio] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      update((prev) => {
        const w = Number(weight);
        let weightLog = prev.profile.weightLog || [];
        if (w > 0) {
          const today = todayISO();
          const rest = weightLog.filter((e) => e.date !== today);
          weightLog = [...rest, { date: today, kg: w }].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
        }
        return {
          ...prev,
          profile: { ...prev.profile, heightCm: height, weightKg: weight, weightLog },
        };
      });
    }, 500);
    return () => clearTimeout(t);
  }, [height, weight]); // eslint-disable-line

  const patchProfile = (fields) =>
    update((prev) => ({ ...prev, profile: { ...prev.profile, ...fields } }));
  const patchSettings = (fields) =>
    update((prev) => ({ ...prev, settings: { ...prev.settings, ...fields } }));

  const gender = data.profile.gender;
  const goals = GOALS[gender] || GOALS.m;
  const levelName = LEVELS.find((l) => l.id === data.profile.level)?.name;
  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 && w > 0 ? w / (h * h) : null;
  const stats = calcStats(data.logs, data.settings?.weeklyGoal || 3);
  const earnedBadges = BADGE_DEFS.filter((b) => b.check(stats)).length;
  const hasPlan = (data.plans || []).length > 0;
  const hasWorkout = stats.totalWorkouts > 0;
  const hasRecord = stats.prCount > 0;

  let category = null,
    color = null;
  if (bmi != null) {
    if (bmi < 18.5) {
      category = "Untergewicht";
      color = "var(--info)";
    } else if (bmi < 25) {
      category = "Normalgewicht";
      color = "var(--success)";
    } else if (bmi < 30) {
      category = "Übergewicht";
      color = "var(--warning)";
    } else {
      category = "Adipositas";
      color = "var(--danger)";
    }
  }

  const ranges = [
    { label: "< 18,5", name: "Untergewicht", color: "var(--info)" },
    { label: "18,5 – 24,9", name: "Normalgewicht", color: "var(--success)" },
    { label: "25 – 29,9", name: "Übergewicht", color: "var(--warning)" },
    { label: "≥ 30", name: "Adipositas", color: "var(--danger)" },
  ];

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ironlog-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.logs || !parsed.profile) throw new Error("invalid");
        if (window.confirm("Backup einspielen? Das ersetzt deine aktuellen Daten.")) {
          update(() => parsed);
        }
      } catch {
        window.alert("Diese Datei ist kein gültiges IronLog-Backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="ig-tabpane">
      {/* Identität: wer trainiert hier, für was, auf welchem Level — auf einen Blick */}
      <div className="ig-identity-card">
        <div className="ig-identity-head">
          <span className="ig-identity-avatar">
            <EclipseMark size={26} />
          </span>
          <div className="ig-identity-text">
            <span className="ig-identity-tag">
              {gender === "f" ? "Frauen-Modus" : gender === "m" ? "Männer-Modus" : "Profil"}
            </span>
            <h2>{GOAL_NAME[data.profile.goal] || "Kein Ziel gewählt"}</h2>
            <span className="ig-identity-sub">
              {[levelName, `${data.settings?.weeklyGoal || 3}× / Woche`].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
        <div className="ig-identity-level">
          <span className="ig-identity-level-label">
            <Zap size={12} /> Level {stats.level}
          </span>
          <div className="ig-level-track sm">
            <div className="ig-level-fill" style={{ width: `${stats.levelPct * 100}%` }} />
          </div>
        </div>
        <button className="ig-identity-badges" onClick={() => goTo && goTo("progress")}>
          <Award size={14} />
          <span>{earnedBadges} von {BADGE_DEFS.length} Abzeichen freigeschaltet</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Erste-Schritte-Checkliste: motiviert neue Nutzer statt leere Statistiken
          zu zeigen. Verschwindet von selbst, sobald alle drei erreicht sind. */}
      {(!hasPlan || !hasWorkout || !hasRecord) && (
        <div className="ig-card ig-onboard-checklist">
          <div className="ig-field-label">Erste Schritte</div>
          <button className="ig-check-row" onClick={() => goTo && goTo("plan")} disabled={hasPlan}>
            <span className={"ig-check-dot" + (hasPlan ? " done" : "")}>{hasPlan ? "✓" : ""}</span>
            <span>Trainingsplan erstellen</span>
          </button>
          <button className="ig-check-row" onClick={() => goTo && goTo("workout")} disabled={hasWorkout}>
            <span className={"ig-check-dot" + (hasWorkout ? " done" : "")}>{hasWorkout ? "✓" : ""}</span>
            <span>Erstes Workout absolvieren</span>
          </button>
          <button className="ig-check-row" onClick={() => goTo && goTo("progress")} disabled={hasRecord}>
            <span className={"ig-check-dot" + (hasRecord ? " done" : "")}>{hasRecord ? "✓" : ""}</span>
            <span>Ersten Rekord erreichen</span>
          </button>
        </div>
      )}

      {/* Persönliches: Modus + Alter */}
      <div className="ig-card">
        <div className="ig-field-label">Persönliches</div>
        <div className="ig-set-inputs two">
          <div className="ig-num-field">
            <span>Modus</span>
            <div className="ig-mode-toggle">
              <button
                className={"ig-chip" + (gender === "f" ? " active" : "")}
                onClick={() => patchProfile({ gender: "f" })}
              >
                ♀ Frau
              </button>
              <button
                className={"ig-chip" + (gender === "m" ? " active" : "")}
                onClick={() => patchProfile({ gender: "m" })}
              >
                ♂ Mann
              </button>
            </div>
          </div>
          <label className="ig-num-field">
            <span>Alter</span>
            <input
              type="number"
              inputMode="numeric"
              className="ig-input mono"
              value={data.profile.age || ""}
              onChange={(e) => patchProfile({ age: e.target.value })}
              placeholder="25"
            />
          </label>
        </div>
      </div>

      {/* Ziel & Level: fließt in den Smart-Plan ein */}
      <div className="ig-card">
        <div className="ig-field-label">Trainingsziel</div>
        <div className="ig-picker-chips wrap">
          {goals.map((g) => (
            <button
              key={g.id}
              className={"ig-chip sm" + (data.profile.goal === g.id ? " active" : "")}
              onClick={() => patchProfile({ goal: g.id })}
            >
              {g.icon} {g.name}
            </button>
          ))}
        </div>
        <div className="ig-field-label" style={{ marginTop: 4 }}>Level</div>
        <div className="ig-picker-chips wrap">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={"ig-chip sm" + (data.profile.level === l.id ? " active" : "")}
              onClick={() => patchProfile({ level: l.id })}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="ig-plan-text">
          Ziel & Level fließen in den Smart-Plan ein — neu erstellen kannst du ihn im Plan-Tab.
        </p>
      </div>

      {/* Darstellung */}
      <div className="ig-card">
        <div className="ig-field-label">Darstellung</div>
        <button className="ig-studio-open" onClick={() => setShowStudio(true)}>
          <span className="ig-studio-dot" />
          <span className="ig-studio-text">
            <span className="ig-studio-title">
              <Palette size={14} /> Theme Studio
            </span>
            <span className="ig-studio-sub">
              Farben, Ecken, Glow, Glas, Schrift — bau dein eigenes Theme
            </span>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Einstellungen */}
      <div className="ig-card">
        <div className="ig-field-label">Einstellungen</div>
        <ToggleRow
          checked={data.settings?.sound !== false}
          onChange={(v) => {
            patchSettings({ sound: v });
            if (v) playSound("tap");
          }}
        >
          Sound-Effekte
        </ToggleRow>
        <ToggleRow
          checked={data.settings?.haptics !== false}
          onChange={(v) => {
            patchSettings({ haptics: v });
            if (v) buzz(30);
          }}
        >
          Haptisches Feedback (Vibration)
        </ToggleRow>
        <div className="ig-num-field">
          <span>Wochenziel (Trainingstage)</span>
          <div className="ig-mode-toggle">
            {[2, 3, 4, 5].map((g) => (
              <button
                key={g}
                className={"ig-chip" + ((data.settings?.weeklyGoal || 3) === g ? " active" : "")}
                onClick={() => patchSettings({ weeklyGoal: g })}
              >
                {g}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wellness-Ziele */}
      <div className="ig-card">
        <div className="ig-field-label">Tagesziele (Dashboard)</div>
        <div className="ig-num-field">
          <span>
            <Droplets size={12} style={{ verticalAlign: "-2px" }} /> Wasserziel
          </span>
          <div className="ig-mode-toggle">
            {[0, 1500, 2000, 2500, 3000].map((ml) => (
              <button
                key={ml}
                className={"ig-chip sm" + ((data.settings?.waterGoal || 0) === ml ? " active" : "")}
                onClick={() => patchSettings({ waterGoal: ml })}
              >
                {ml === 0 ? "Aus" : `${ml / 1000} l`}
              </button>
            ))}
          </div>
        </div>
        <div className="ig-num-field">
          <span>
            <Apple size={12} style={{ verticalAlign: "-2px" }} /> Kalorienziel
          </span>
          <div className="ig-mode-toggle">
            {[0, 1800, 2200, 2600, 3000].map((kcal) => (
              <button
                key={kcal}
                className={"ig-chip sm" + ((data.settings?.kcalGoal || 0) === kcal ? " active" : "")}
                onClick={() => patchSettings({ kcalGoal: kcal })}
              >
                {kcal === 0 ? "Aus" : kcal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Körper: Eingabe + BMI + WHO-Referenz in einer Karte statt drei */}
      <div className="ig-card">
        <div className="ig-field-label">Körperdaten</div>
        <div className="ig-set-inputs two">
          <label className="ig-num-field">
            <span>Größe (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              className="ig-input mono"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="178"
            />
          </label>
          <label className="ig-num-field">
            <span>Gewicht (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="ig-input mono"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
            />
          </label>
        </div>

        {bmi == null ? (
          <p className="ig-empty">Trag Größe und Gewicht ein, um deinen BMI zu berechnen.</p>
        ) : (
          <div className="ig-bmi-result">
            <span className="ig-num" style={{ color }}>{round1(bmi)}</span>
            <span className="ig-bmi-cat" style={{ color }}>{category}</span>
            <div className="ig-bmi-bar">
              {ranges.map((r) => (
                <div
                  key={r.name}
                  className="ig-bmi-seg"
                  style={{ background: r.color, opacity: r.name === category ? 1 : 0.35 }}
                />
              ))}
            </div>
          </div>
        )}

        <ul className="ig-range-list compact">
          {ranges.map((r) => (
            <li key={r.name} className="ig-range-row">
              <span className="ig-range-dot" style={{ background: r.color }} />
              <span>{r.name}</span>
              <span className="mono ig-range-val">{r.label}</span>
            </li>
          ))}
        </ul>

        <p className="ig-plan-text">
          Deinen Gewichtsverlauf über Zeit findest du im Verlauf-Tab.
        </p>
      </div>

      {/* Daten: ehrlich nur das, was eine reine Client-App leisten kann — lokales Backup statt vorgetäuschter Cloud-Sync */}
      <div className="ig-card">
        <div className="ig-field-label">Daten</div>
        <p className="ig-plan-text">
          IronLog speichert alles nur auf diesem Gerät. Exportiere regelmäßig ein Backup,
          um beim Gerätewechsel nichts zu verlieren.
        </p>
        <div className="ig-plan-add-row">
          <button className="ig-btn-primary wide ghosted" onClick={exportData}>
            <Download size={15} /> Exportieren
          </button>
          <button className="ig-btn-primary wide ghosted" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> Importieren
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importData(file);
            e.target.value = "";
          }}
        />
      </div>

      {showStudio && (
        <ThemeStudio data={data} update={update} onClose={() => setShowStudio(false)} />
      )}
    </div>
  );
}
