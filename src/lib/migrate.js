/* Migration alter Speicherstände auf das aktuelle Datenmodell */

import { uid } from "./utils.js";
import { EXERCISE_META, LIBRARY_DEFAULT, PLAN_COLORS } from "./constants.js";

/* Theme-Studio-Voreinstellung: null-Accent = Modus-Standard (m/f/neutral) */
export const DEFAULT_THEME_CFG = {
  accent: null, // null | "mono" | Hex
  gradient: true,
  glow: true,
  glass: false,
  radius: "round", // round | sharp
  motion: "full", // full | reduced
  density: "cozy", // cozy | compact
  font: "grotesk", // grotesk | mono
};

export const DEFAULT_SETTINGS = {
  autoRest: true,
  restSeconds: 90,
  sound: true,
  haptics: true,
  weeklyGoal: 3,
  theme: "dark",
  waterGoal: 0, // 0 = aus, sonst ml/Tag
  kcalGoal: 0, // 0 = aus, sonst kcal/Tag
  themeCfg: { ...DEFAULT_THEME_CFG },
};

export const DEFAULT_PROFILE = {
  heightCm: "",
  weightKg: "",
  weightLog: [],
  gender: null,
  age: "",
  goal: null,
  level: null,
  daysPerWeek: 3,
  equipment: [],
  duration: 45,
  onboarded: false,
};

// Altes Split-System -> dynamische Pläne
export function migrateToPlans(parsed, settings) {
  if (parsed.plans && parsed.library) return parsed;
  const library = LIBRARY_DEFAULT.map((e) => ({ ...e }));
  (parsed.exercises || []).forEach((name) => {
    if (!library.some((l) => l.name === name)) {
      library.push({
        id: "custom-" + uid(),
        name,
        muscle: null,
        zone: null,
        zone2: null,
        equipment: "",
        custom: true,
      });
    }
  });
  const rest = settings?.restSeconds || 90;
  const byGroup = (group) =>
    Object.entries(EXERCISE_META)
      .filter(([, m]) => m.group === group)
      .sort((a, b) => (a[1].order || 99) - (b[1].order || 99))
      .map(([name, m]) => ({
        exerciseId: library.find((l) => l.name === name)?.id,
        sets: 3,
        reps: m.reps === "6–10" ? 8 : 10,
        weight: null,
        rest,
      }));
  const okPlan = {
    id: "plan-" + uid(),
    name: "Oberkörper",
    color: PLAN_COLORS[0],
    icon: "▲",
    description: "",
    days: [],
    exercises: byGroup("Oberkörper"),
  };
  const ukPlan = {
    id: "plan-" + uid(),
    name: "Unterkörper",
    color: PLAN_COLORS[2],
    icon: "▼",
    description: "",
    days: [],
    exercises: byGroup("Unterkörper"),
  };
  const split = parsed.split;
  if (split?.mode === "week" && split.days) {
    Object.entries(split.days).forEach(([day, unit]) => {
      if (unit === "ok") okPlan.days.push(day);
      else if (unit === "uk") ukPlan.days.push(day);
      else if (unit === "gk") okPlan.days.push(day);
    });
  }
  return {
    ...parsed,
    library,
    plans: [okPlan, ukPlan],
    activePlanId: okPlan.id,
  };
}

// Neue Bibliothekseinträge (z.B. Glute-Übungen) in bestehende Stände mergen
export function mergeLibrary(existing) {
  const names = new Set((existing || []).map((e) => e.name));
  const added = LIBRARY_DEFAULT.filter((e) => !names.has(e.name));
  return added.length ? [...existing, ...added.map((e) => ({ ...e }))] : existing;
}

// Frischer Zustand: volle Bibliothek, aber KEINE vorgefertigten Pläne.
// Pläne entstehen ausschließlich durch Onboarding oder den Nutzer selbst.
export function freshState() {
  return {
    logs: [],
    library: LIBRARY_DEFAULT.map((e) => ({ ...e })),
    plans: [],
    activePlanId: null,
    wellness: {},
    profile: { ...DEFAULT_PROFILE },
    settings: { ...DEFAULT_SETTINGS },
  };
}

// Kompletter Ladepfad: parse -> Defaults -> Migrationen
export function hydrate(parsed) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(parsed.settings || {}),
    themeCfg: { ...DEFAULT_THEME_CFG, ...(parsed.settings?.themeCfg || {}) },
  };
  const migrated = migrateToPlans(parsed, settings);
  return {
    ...migrated,
    library: mergeLibrary(migrated.library),
    wellness: migrated.wellness || {},
    profile: { ...DEFAULT_PROFILE, ...(migrated.profile || {}) },
    settings,
  };
}
