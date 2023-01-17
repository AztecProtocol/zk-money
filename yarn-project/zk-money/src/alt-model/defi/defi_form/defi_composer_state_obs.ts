import { Obs } from '../../../app/util/index.js';
import type { IObs } from '../../../app/util/obs/types.js';
import type { Retryable } from '../../../app/util/promises/retryable.js';

export enum DefiComposerPhase {
  IDLE = 'IDLE',
  GENERATING_KEY = 'GENERATING_KEY',
  CREATING_PROOF = 'CREATING_PROOF',
  SENDING_PROOF = 'SENDING_PROOF',
  DONE = 'DONE',
}

export interface DefiComposerState {
  phase: DefiComposerPhase;
  error?: { phase: DefiComposerPhase; message: string; raw: unknown };
  signingRetryable?: Retryable<unknown>;
  backNoRetry?: boolean;
}

export class DefiComposerStateObs implements IObs<DefiComposerState> {
  obs = Obs.input<DefiComposerState>({ phase: DefiComposerPhase.IDLE });

  get value() {
    return this.obs.value;
  }

  listen = this.obs.listen.bind(this.obs);

  setPhase(phase: DefiComposerPhase) {
    this.obs.next({ ...this.obs.value, phase });
  }

  enableRetryableSigning(signingRetryable: Retryable<unknown>) {
    this.obs.next({ ...this.value, signingRetryable });
  }

  disableRetryableSigning() {
    this.obs.next({ ...this.value, signingRetryable: undefined });
  }

  clearError() {
    this.obs.next({ ...this.obs.value, error: undefined });
  }

  error(message: string, raw: unknown) {
    const error = { phase: this.obs.value.phase, message, raw };
    this.obs.next({ phase: DefiComposerPhase.IDLE, error });
  }

  setBackNoRetry(value: boolean) {
    this.obs.next({ ...this.value, backNoRetry: value });
  }
}
