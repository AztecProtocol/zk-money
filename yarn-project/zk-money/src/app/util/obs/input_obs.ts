import { BaseObs } from './base_obs.js';

export class InputObs<T> extends BaseObs<T> {
  next(value: T) {
    this.setAndEmit(value);
  }
}
