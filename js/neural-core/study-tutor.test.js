import assert from "node:assert/strict";
import { createStudySession, formatStudyAnswer } from "./study-tutor.js";
import { createLearningProfile } from "./learning-profile.js";

const profile = createLearningProfile();
const session = createStudySession({ steps: ["Lee el problema", "Identifica los datos", "Calcula"], profile });
assert.equal(session.learnerLabel, "TDA");
assert.equal(session.sections.length, 3);
assert.equal(session.totalSteps, 3);
assert.match(session.guidance.join(" "), /una tarea cada vez/);
assert.equal(session.privacy, "local-only-by-default");
const answer = formatStudyAnswer({ explanation: "Vamos paso a paso.", steps: ["Primero", "Después"], profile });
assert.equal(answer.explanation, "Vamos paso a paso.");
assert.throws(() => createStudySession({ steps: [] }), /lista de pasos/);
console.log("study-tutor: todas las pruebas han pasado");
