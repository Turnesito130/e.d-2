import assert from "node:assert/strict";
import {
  createLearningProfile, saveLearningProfile, loadLearningProfile,
  deleteLearningProfile, formatStudySteps, buildStudyPromptGuidance
} from "./learning-profile.js";

const memory = new Map();
const storage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key)
};
const profile = createLearningProfile();
assert.equal(profile.label, "TDA");
assert.equal(profile.accommodations.oneTaskAtATime, true);
assert.equal(saveLearningProfile(profile, storage).saved, true);
assert.equal(loadLearningProfile(storage).label, "TDA");
assert.equal(formatStudySteps(["Leer", "Comprender", "Practicar"], profile).length, 3);
assert.match(buildStudyPromptGuidance(profile).guidance.join(" "), /una tarea cada vez/);
assert.equal(deleteLearningProfile(storage), true);
assert.equal(loadLearningProfile(storage).label, "TDA");
assert.throws(() => createLearningProfile({ breakAfterMinutes: 2 }), /entre 5 y 90/);
console.log("learning-profile: todas las pruebas han pasado");
