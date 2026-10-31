// E.D.-2 Neural Core — optimizador Adam desde cero.
export class AdamOptimizer {
  constructor({ beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8 } = {}) {
    if (!(beta1 >= 0 && beta1 < 1) || !(beta2 >= 0 && beta2 < 1) || !(epsilon > 0)) {
      throw new RangeError("Hiperparámetros Adam no válidos");
    }
    this.beta1 = beta1; this.beta2 = beta2; this.epsilon = epsilon;
    this.states = new WeakMap();
  }

  _updateArray(params, grads, learningRate, scale) {
    if (!Array.isArray(params) || !Array.isArray(grads) || params.length !== grads.length) {
      throw new TypeError("Parámetros y gradientes incompatibles");
    }
    let state = this.states.get(params);
    if (!state) {
      state = { step: 0, m: Array(params.length).fill(0), v: Array(params.length).fill(0) };
      this.states.set(params, state);
    }
    state.step++;
    const correction1 = 1 - Math.pow(this.beta1, state.step);
    const correction2 = 1 - Math.pow(this.beta2, state.step);
    for (let i = 0; i < params.length; i++) {
      if (Array.isArray(params[i])) {
        this._updateArray(params[i], grads[i], learningRate, scale);
      } else {
        const g = grads[i] * scale;
        if (!Number.isFinite(g) || !Number.isFinite(params[i])) throw new Error("Valor no finito en Adam");
        state.m[i] = this.beta1 * state.m[i] + (1 - this.beta1) * g;
        state.v[i] = this.beta2 * state.v[i] + (1 - this.beta2) * g * g;
        const mHat = state.m[i] / correction1;
        const vHat = state.v[i] / correction2;
        params[i] -= learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
      }
    }
  }

  step(groups, learningRate, scale = 1) {
    if (!Array.isArray(groups) || !(learningRate > 0) || !Number.isFinite(learningRate)) {
      throw new TypeError("Paso Adam no válido");
    }
    for (const group of groups) this._updateArray(group.params, group.grads, learningRate, scale);
  }

  reset() { this.states = new WeakMap(); }
}
