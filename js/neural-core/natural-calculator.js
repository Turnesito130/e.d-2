// E.D.-2 · Conversión conservadora de operaciones en español a expresiones verificables.
import { evaluateExpression } from "./logic-engine.js";

const WORD_NUMBERS = Object.freeze({
  un: "1", una: "1", uno: "1", dos: "2", tres: "3", cuatro: "4",
  cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9",
  diez: "10", once: "11", doce: "12", quince: "15",
  veinte: "20", treinta: "30", cuarenta: "40", cincuenta: "50",
  cien: "100"
});

export function normalizeNaturalExpression(input) {
  if (typeof input !== "string" || !input.trim() || input.length > 256) {
    throw new TypeError("Escribe una operación de hasta 256 caracteres.");
  }
  let text = input.toLowerCase().normalize("NFC").trim();
  text = text.replace(/[¿?¡!]/g, " ").replace(/\s+/g, " ");
  text = text.replace(/^(?:oye\s+)?(?:ed\s*)?[, :]*/i, "");
  text = text.replace(/^(?:cu[aá]nto es|calcula|calcular|resuelve|resu[eé]lveme)\s+/i, "");
  text = text.replace(/\bdividido\s+(?:entre|por)\b|\bdividida\s+(?:entre|por)\b/g, "/");
  text = text.replace(/\bpor\b|\bveces\b/g, "*");
  text = text.replace(/\bm[aá]s\b/g, "+").replace(/\bmenos\b/g, "-");
  text = text.replace(/\belevado a\b/g, "^");
  text = text.replace(/\bal cuadrado\b/g, "^2").replace(/\bal cubo\b/g, "^3");
  text = text.replace(/\bcoma\s+(\d+)\b/g, ".$1");
  text = text.replace(/\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta|cincuenta|cien)\b/g, word => WORD_NUMBERS[word]);
  text = text.replace(/,/g, ".");
  text = text.replace(/\s+/g, "");
  if (!/^[0-9.+*/^()\-]+$/.test(text)) {
    throw new SyntaxError("No he podido interpretar esa operación con seguridad.");
  }
  return text;
}

export function calculateNaturalExpression(input) {
  const expression = normalizeNaturalExpression(input);
  return { ...evaluateExpression(expression), original: input };
}
