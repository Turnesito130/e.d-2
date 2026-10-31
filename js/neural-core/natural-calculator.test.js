import assert from "node:assert/strict";
import { normalizeNaturalExpression, calculateNaturalExpression } from "./natural-calculator.js";

assert.equal(normalizeNaturalExpression("cuánto es 2 más 3 por 4"), "2+3*4");
assert.equal(calculateNaturalExpression("cuánto es 2 más 3 por 4").value, 14);
assert.equal(calculateNaturalExpression("12 dividido entre 3").value, 4);
assert.equal(calculateNaturalExpression("5 al cuadrado").value, 25);
assert.equal(calculateNaturalExpression("2 elevado a 3").value, 8);
assert.equal(calculateNaturalExpression("1,5 más 2,5").value, 4);
assert.equal(calculateNaturalExpression("tres por cuatro").value, 12);
assert.throws(() => normalizeNaturalExpression("abre mi correo"), /interpretar/);
assert.throws(() => calculateNaturalExpression("1 dividido entre 0"), /División por cero/);
assert.throws(() => normalizeNaturalExpression(""), /operación/);
console.log("natural-calculator: todas las pruebas han pasado");
