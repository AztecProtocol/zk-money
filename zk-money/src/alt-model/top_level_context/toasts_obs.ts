import { Obs } from 'app/util';
import type { IObs } from 'app/util/obs/types';
import { ToastContent } from 'ui-components';

export type ToastsObsValue = ToastContent[];

export class ToastsObs implements IObs<ToastsObsValue> {
  obs = Obs.input<ToastsObsValue>([]);

  get value() {
    return this.obs.value;
  }

  listen = this.obs.listen.bind(this.obs);

  addToast(toast: ToastContent) {
    this.obs.next([...this.obs.value, toast]);
  }

  removeToastByKey(key: string) {
    this.obs.next(this.obs.value.filter(toast => toast.key !== key));
  }

  removeToastByIndex(index: number) {
    this.obs.next(this.obs.value.slice(0, index).concat(this.obs.value.slice(index + 1)));
  }
}