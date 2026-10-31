// E.D.-2 · Tutor de estudio local.
// Aplica las preferencias elegidas por el usuario sin alterar el contenido académico.
import { loadLearningProfile, buildStudyPromptGuidance, formatStudySteps } from "./learning-profile.js";

export function createStudySession({ steps, profile, storage } = {}) {
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 50 ||
      steps.some(step => typeof step !== "string" || !step.trim() || step.length > 1000)) {
    throw new TypeError("Se necesita una lista de pasos válida (1 a 50 pasos de texto)");
  }
  const activeProfile = profile ?? loadLearningProfile(storage);
  const sections = formatStudySteps(steps, activeProfile);
  const guidance = buildStudyPromptGuidance(activeProfile);
  return {
    learnerLabel: guidance.learnerLabel,
    sections,
    guidance: guidance.guidance,
    privacy: guidance.privacy,
    totalSteps: steps.length
  };
}

export function formatStudyAnswer({ explanation, steps, profile, storage } = {}) {
  if (typeof explanation !== "string" || !explanation.trim()) {
    throw new TypeError("La explicación debe ser texto no vacío");
  }
  const session = createStudySession({ steps, profile, storage });
  return {
    ...session,
    explanation: explanation.trim()
  };
}
