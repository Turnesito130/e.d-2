// E.D.-2 · Motor lógico determinista v0.1
// Evalúa expresiones matemáticas sin eval(), Function ni servicios externos.
// No interpreta lenguaje natural: recibe expresiones ya extraídas por la capa de comprensión.

const MAX_INPUT = 256;
const MAX_ABS = 1e12;
const MAX_EXPONENT = 12;

function tokenize(source) {
  if (typeof source !== "string" || !source.trim() || source.length > MAX_INPUT) {
    throw new TypeError("La expresión debe ser texto no vacío de hasta 256 caracteres");
  }
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }
    const rest = source.slice(i);
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      const value = Number(number[0]);
      if (!Number.isFinite(value)) throw new RangeError("Número fuera de rango");
      tokens.push({ type: "number", value });
      i += number[0].length;
      continue;
    }
    if ("+-*/^()".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    throw new SyntaxError("Carácter no permitido: " + ch);
  }
  return tokens;
}

export function evaluateExpression(source) {
  const tokens = tokenize(source);
  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = type => {
    const token = peek();
    if (!token || token.type !== type) throw new SyntaxError("Se esperaba " + type);
    cursor++;
    return token;
  };
  const checked = value => {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_ABS) {
      throw new RangeError("Resultado fuera del rango permitido");
    }
    return Object.is(value, -0) ? 0 : value;
  };
  function primary() {
    if (peek()?.type === "number") return take("number").value;
    if (peek()?.type === "(") {
      take("(");
      const value = expression();
      take(")");
      return value;
    }
    throw new SyntaxError("Se esperaba un número o paréntesis");
  }
  // La potencia tiene mayor precedencia que el signo: -2^2 = -(2^2).
  // El exponente admite signo y la recursión conserva la asociatividad derecha.
  function unary() {
    if (peek()?.type === "+") { take("+"); return unary(); }
    if (peek()?.type === "-") { take("-"); return -unary(); }
    return power();
  }
  function power() {
    const base = primary();
    if (peek()?.type !== "^") return base;
    take("^");
    const exponent = unary();
    if (Math.abs(exponent) > MAX_EXPONENT) throw new RangeError("Exponente demasiado grande");
    if (base === 0 && exponent < 0) throw new RangeError("División por cero");
    return checked(base ** exponent);
  }
  function term() {
    let value = unary();
    while (peek()?.type === "*" || peek()?.type === "/") {
      const op = tokens[cursor++].type;
      const right = unary();
      if (op === "/" && right === 0) throw new RangeError("División por cero");
      value = checked(op === "*" ? value * right : value / right);
    }
    return value;
  }
  function expression() {
    let value = term();
    while (peek()?.type === "+" || peek()?.type === "-") {
      const op = tokens[cursor++].type;
      const right = term();
      value = checked(op === "+" ? value + right : value - right);
    }
    return value;
  }
  const result = expression();
  if (cursor !== tokens.length) throw new SyntaxError("Hay contenido sobrante en la expresión");
  return { ok: true, expression: source, value: result, verifiedBy: "ed2-logic-engine" };
}

// Comprueba una respuesta numérica contra el resultado calculado, con tolerancia explícita.
export function verifyNumericResult(expression, proposed, { tolerance = 1e-9 } = {}) {
  if (typeof proposed !== "number" || !Number.isFinite(proposed)) {
    throw new TypeError("La respuesta propuesta debe ser un número finito");
  }
  if (typeof tolerance !== "number" || !Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1) {
    throw new RangeError("Tolerancia no válida");
  }
  const calculation = evaluateExpression(expression);
  const difference = Math.abs(calculation.value - proposed);
  const allowed = tolerance * Math.max(1, Math.abs(calculation.value));
  return {
    ok: difference <= allowed,
    expected: calculation.value,
    proposed,
    difference,
    tolerance,
    verifiedBy: "ed2-logic-engine"
  };
}
