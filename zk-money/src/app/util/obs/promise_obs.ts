import { BaseObs } from './base_obs.js';

export class PromiseObs<T> extends BaseObs<T> {
  constructor(promise: Promise<T>, initialValue: T) {
    super(initialValue);
    promise.then(value => this.setAndEmit(value));
  }
}
