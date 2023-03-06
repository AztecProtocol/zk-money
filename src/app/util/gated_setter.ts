import type { Dispatch, SetStateAction } from 'react';

// This function is useful when setting state within an async useEffect call.
// Often only the most current effect should be able to update state, so it is
// convenient to first wrap the setter such that it can be invalidated during
// effect cleanup.
export function createGatedSetter<T>(setter: Dispatch<SetStateAction<T>>) {
  let open = true;
  return {
    set: (action: SetStateAction<T>) => {
      if (open) setter(action);
    },
    close: () => {
      open = false;
    },
  };
}

export function createGatedSetter_noArrows<T>(setter: (value: T) => void) {
  let open = true;
  return {
    set: (value: T) => {
      if (open) setter(value);
    },
    close: () => {
      open = false;
    },
  };
}
