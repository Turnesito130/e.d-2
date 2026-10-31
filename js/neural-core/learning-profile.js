// E.D.-2 · Perfil de aprendizaje local y editable.
// El dato TDA se conserva solo en el dispositivo: no se sincroniza ni se envía a servicios externos.
// Las adaptaciones son preferencias configurables, no inferencias clínicas.

const KEY = "ed2_learning_profile_v1";
const DEFAULTS = Object.freeze({
  label: "TDA",
  accommodations: {
    shortSections: true,
    oneTaskAtATime: true,
    clearStepByStep: true,
    conciseInstructions: true,
    progressMarkers: true,
    optionalBreakReminders: true,
    recapAtEnd: true
  },
  breakAfterMinutes: 20,
  preferredExplanation: "clara-y-paso-a-paso"
});

function safeStorage(storage) {
  return storage && typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" ? storage : null;
}

export function createLearningProfile(overrides = {}) {
  const accommodations = { ...DEFAULTS.accommodations, ...(overrides.accommodations || {}) };
  for (const [key, value] of Object.entries(accommodations)) {
    if (!(key in DEFAULTS.accommodations) || typeof value !== "boolean") {
      throw new TypeError("Preferencia de aprendizaje no válida: " + key);
    }
  }
  const breakAfterMinutes = overrides.breakAfterMinutes ?? DEFAULTS.breakAfterMinutes;
  if (!Number.isInteger(breakAfterMinutes) || breakAfterMinutes < 5 || breakAfterMinutes > 90) {
    throw new RangeError("El intervalo de descanso debe estar entre 5 y 90 minutos");
  }
  return {
    version: 1,
    label: "TDA",
    accommodations,
    breakAfterMinutes,
    preferredExplanation: "clara-y-paso-a-paso"
  };
}

export function loadLearningProfile(storage = globalThis.localStorage) {
  const target = safeStorage(storage);
  if (!target) return createLearningProfile();
  try {
    const raw = target.getItem(KEY);
    return raw ? createLearningProfile(JSON.parse(raw)) : createLearningProfile();
  } catch {
    return createLearningProfile();
  }
}

export function saveLearningProfile(profile, storage = globalThis.localStorage) {
  const target = safeStorage(storage);
  if (!target) return { saved: false, reason: "local-storage-unavailable" };
  const clean = createLearningProfile(profile);
  target.setItem(KEY, JSON.stringify(clean));
  return { saved: true, profile: clean, location: "this-device-only" };
}

export function deleteLearningProfile(storage = globalThis.localStorage) {
  const target = safeStorage(storage);
  if (!target) return false;
  target.removeItem(KEY);
  return true;
}

// Convierte una explicación en pasos breves sin alterar el contenido académico.
// La división es estructural; no diagnostica ni decide qué puede atender el estudiante.
export function formatStudySteps(steps, profile = createLearningProfile()) {
  if (!Array.isArray(steps) || steps.some(step => typeof step !== "string" || !step.trim())) {
    throw new TypeError("Se necesita una lista de pasos de texto no vacíos");
  }
  const prefs = createLearningProfile(profile).accommodations;
  const normalized = steps.map(step => step.trim());
  if (!prefs.shortSections) return [{ title: "Explicación", steps: normalized }];
  const sections = [];
  const size = prefs.oneTaskAtATime ? 1 : 3;
  for (let i = 0; i < normalized.length; i += size) {
    sections.push({
      title: prefs.progressMarkers ? `Parte ${sections.length + 1} de ${Math.ceil(normalized.length / size)}` : "Parte",
      steps: normalized.slice(i, i + size)
    });
  }
  return sections;
}

export function buildStudyPromptGuidance(profile = createLearningProfile()) {
  const p = createLearningProfile(profile);
  const a = p.accommodations;
  const guidance = [];
  if (a.conciseInstructions) guidance.push("Usa instrucciones breves y concretas.");
  if (a.shortSections) guidance.push("Divide el contenido en bloques cortos.");
  if (a.oneTaskAtATime) guidance.push("Presenta una tarea cada vez y espera a que el estudiante avance.");
  if (a.clearStepByStep) guidance.push("Explica el procedimiento paso a paso, sin saltos.");
  if (a.progressMarkers) guidance.push("Indica el progreso y qué se ha completado.");
  if (a.optionalBreakReminders) guidance.push(`Ofrece, sin imponer, una pausa tras ${p.breakAfterMinutes} minutos.`);
  if (a.recapAtEnd) guidance.push("Termina con un resumen breve y una sola pregunta para comprobar comprensión.");
  return { learnerLabel: "TDA", guidance, privacy: "local-only-by-default" };
}

export const LEARNING_PROFILE_KEY = KEY;
