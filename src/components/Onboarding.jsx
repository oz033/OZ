/* Onboarding: Geschlecht → Ziel → Level → Tage → Equipment → Dauer → Körperdaten */

import React, { useState } from "react";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { EclipseMark } from "./brand.jsx";
import {
  GOALS,
  LEVELS,
  EQUIPMENT_OPTIONS,
  DURATIONS,
} from "../lib/constants.js";
import { playSound } from "../lib/utils.js";

const STEPS = ["gender", "goal", "level", "days", "equipment", "duration", "body"];

export default function Onboarding({ profile, onFinish }) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(profile.gender || null);
  const [goal, setGoal] = useState(profile.goal || null);
  const [level, setLevel] = useState(profile.level || null);
  const [daysPerWeek, setDaysPerWeek] = useState(profile.daysPerWeek || 3);
  const [equipment, setEquipment] = useState(
    profile.equipment?.length ? profile.equipment : ["Maschine"],
  );
  const [duration, setDuration] = useState(profile.duration || 45);
  const [age, setAge] = useState(profile.age || "");
  const [height, setHeight] = useState(profile.heightCm || "");
  const [weight, setWeight] = useState(profile.weightKg || "");

  const key = STEPS[step];
  const isFemale = gender === "f";

  const bodyOk =
    Number(age) >= 10 &&
    Number(age) <= 100 &&
    Number(height) >= 100 &&
    Number(height) <= 250 &&
    Number(weight) >= 30 &&
    Number(weight) <= 300;

  const canNext = {
    gender: !!gender,
    goal: !!goal,
    level: !!level,
    days: true,
    equipment: equipment.length > 0,
    duration: true,
    body: bodyOk,
  }[key];

  const next = () => {
    playSound("tap");
    if (step < STEPS.length - 1) setStep(step + 1);
    else
      onFinish({
        gender,
        goal,
        level,
        daysPerWeek,
        equipment,
        duration,
        age: Number(age),
        heightCm: String(height),
        weightKg: String(weight),
      });
  };

  const pick = (setter, value) => {
    setter(value);
    playSound("tap");
  };

  const toggleEquipment = (id) => {
    playSound("tap");
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const titles = {
    gender: ["Willkommen!", "Für wen erstellen wir deinen Plan?"],
    goal: ["Dein Ziel", isFemale ? "Worauf möchtest du dich fokussieren?" : "Was willst du erreichen?"],
    level: ["Dein Level", "Wie viel Erfahrung bringst du mit?"],
    days: ["Trainingstage", "Wie oft pro Woche willst du trainieren?"],
    equipment: ["Equipment", "Was steht dir zur Verfügung?"],
    duration: ["Trainingsdauer", "Wie lange soll eine Einheit dauern?"],
    body: ["Über dich", "Für BMI, Fortschritt & Empfehlungen"],
  };

  return (
    <div className="ig-onboarding" data-mode={gender || "n"}>
      <div className="ig-onb-header">
        <div className="ig-onb-logo">
          <EclipseMark size={30} />
        </div>
        <span className="ig-onb-brand">IRONLOG</span>
      </div>

      <div className="ig-onb-progress">
        <div
          className="ig-onb-progress-fill"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="ig-onb-step" key={key}>
        <h2 className="ig-onb-title">{titles[key][0]}</h2>
        <p className="ig-onb-sub">{titles[key][1]}</p>

        {key === "gender" && (
          <div className="ig-onb-gender-row">
            <button
              className={"ig-onb-gender f" + (gender === "f" ? " active" : "")}
              onClick={() => pick(setGender, "f")}
            >
              <span className="ig-onb-gender-icon">♀</span>
              <span>Frau</span>
              <span className="ig-onb-gender-sub">Gesundheit · Fitness · Wohlbefinden</span>
            </button>
            <button
              className={"ig-onb-gender m" + (gender === "m" ? " active" : "")}
              onClick={() => pick(setGender, "m")}
            >
              <span className="ig-onb-gender-icon">♂</span>
              <span>Mann</span>
              <span className="ig-onb-gender-sub">Muskeln · Kraft · Performance</span>
            </button>
          </div>
        )}

        {key === "goal" && (
          <div className="ig-onb-list">
            {(GOALS[gender] || GOALS.m).map((g) => (
              <button
                key={g.id}
                className={"ig-onb-option" + (goal === g.id ? " active" : "")}
                onClick={() => pick(setGoal, g.id)}
              >
                <span className="ig-onb-option-icon">{g.icon}</span>
                <span className="ig-onb-option-text">
                  <span className="ig-onb-option-name">{g.name}</span>
                  <span className="ig-onb-option-desc">{g.desc}</span>
                </span>
                {goal === g.id && <Check size={18} className="ig-onb-check" />}
              </button>
            ))}
          </div>
        )}

        {key === "level" && (
          <div className="ig-onb-list">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                className={"ig-onb-option" + (level === l.id ? " active" : "")}
                onClick={() => pick(setLevel, l.id)}
              >
                <span className="ig-onb-option-text">
                  <span className="ig-onb-option-name">{l.name}</span>
                  <span className="ig-onb-option-desc">{l.desc}</span>
                </span>
                {level === l.id && <Check size={18} className="ig-onb-check" />}
              </button>
            ))}
          </div>
        )}

        {key === "days" && (
          <div className="ig-onb-days">
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                className={"ig-onb-day" + (daysPerWeek === d ? " active" : "")}
                onClick={() => pick(setDaysPerWeek, d)}
              >
                <span className="ig-onb-day-num">{d}</span>
                <span className="ig-onb-day-label">Tage</span>
              </button>
            ))}
            <p className="ig-onb-hint">
              {daysPerWeek <= 3
                ? "Perfekt für Einstieg & Alltag — Ganzkörper-Fokus."
                : daysPerWeek <= 5
                  ? "Starker Rhythmus — wir splitten Ober- & Unterkörper."
                  : "Volle Woche — Push / Pull / Legs für maximale Frequenz."}
            </p>
          </div>
        )}

        {key === "equipment" && (
          <div className="ig-onb-list">
            {EQUIPMENT_OPTIONS.map((e) => (
              <button
                key={e.id}
                className={
                  "ig-onb-option" + (equipment.includes(e.id) ? " active" : "")
                }
                onClick={() => toggleEquipment(e.id)}
              >
                <span className="ig-onb-option-icon">{e.icon}</span>
                <span className="ig-onb-option-text">
                  <span className="ig-onb-option-name">{e.name}</span>
                </span>
                {equipment.includes(e.id) && (
                  <Check size={18} className="ig-onb-check" />
                )}
              </button>
            ))}
            <p className="ig-onb-hint">Mehrfachauswahl möglich</p>
          </div>
        )}

        {key === "duration" && (
          <div className="ig-onb-days">
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                className={"ig-onb-day wide" + (duration === d.id ? " active" : "")}
                onClick={() => pick(setDuration, d.id)}
              >
                <span className="ig-onb-day-num sm">{d.name}</span>
                <span className="ig-onb-day-label">{d.desc}</span>
              </button>
            ))}
          </div>
        )}

        {key === "body" && (
          <div className="ig-onb-field-grid">
            <label className="ig-num-field">
              Alter
              <input
                className="ig-input center"
                type="number"
                inputMode="numeric"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </label>
            <label className="ig-num-field">
              Größe (cm)
              <input
                className="ig-input center"
                type="number"
                inputMode="numeric"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </label>
            <label className="ig-num-field">
              Gewicht (kg)
              <input
                className="ig-input center"
                type="number"
                inputMode="decimal"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="ig-onb-footer">
        <button className="ig-btn-primary wide xl" disabled={!canNext} onClick={next}>
          {step === STEPS.length - 1 ? (
            <>
              <Sparkles size={18} /> Plan erstellen
            </>
          ) : (
            "Weiter"
          )}
        </button>
        {step > 0 && (
          <button className="ig-onb-back" onClick={() => setStep(step - 1)}>
            <ChevronLeft size={14} /> Zurück
          </button>
        )}
      </div>
    </div>
  );
}
