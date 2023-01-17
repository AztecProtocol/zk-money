import { Obs } from '../../app/util/index.js';
import { IObs } from '../../app/util/obs/types.js';
import type { Retryable } from '../../app/util/promises/retryable.js';

export enum ShieldComposerPhase {
  IDLE = 'IDLE',
  DEPOSIT = 'DEPOSIT',
  GENERATE_SPENDING_KEY = 'GENERATE_SPENDING_KEY',
  CREATE_PROOF = 'CREATE_PROOF',
  APPROVE_PROOF = 'APPROVE_PROOF',
  SEND_PROOF = 'SEND_PROOF',
  DONE = 'DONE',
}
export interface ShieldComposerState {
  phase: ShieldComposerPhase;
  error?: { phase: ShieldComposerPhase; message: string; raw: unknown };
  prompt?: string;
  signingRetryable?: Retryable<unknown>;
  backNoRetry?: boolean;
}

export class ShieldComposerStateObs implements IObs<ShieldComposerState> {
  obs = Obs.input<ShieldComposerState>({ phase: ShieldComposerPhase.IDLE });

  get value() {
    return this.obs.value;
  }

  listen = this.obs.listen.bind(this.obs);

  setPhase(phase: ShieldComposerPhase) {
    this.obs.next({ ...this.obs.value, phase });
  }

  clearError() {
    this.obs.next({ ...this.obs.value, error: undefined });
  }

  setPrompt = (prompt: string) => {
    this.obs.next({ ...this.obs.value, prompt });
  };

  clearPrompt() {
    this.obs.next({ ...this.obs.value, prompt: undefined });
  }

  enableRetryableSigning(signingRetryable: Retryable<unknown>) {
    this.obs.next({ ...this.value, signingRetryable });
  }

  disableRetryableSigning() {
    this.obs.next({ ...this.value, signingRetryable: undefined });
  }

  error(message: string, raw: unknown) {
    const error = { phase: this.obs.value.phase, message, raw };
    this.obs.next({ phase: ShieldComposerPhase.IDLE, error });
  }

  setBackNoRetry(value: boolean) {
    this.obs.next({ ...this.value, backNoRetry: value });
  }
}
