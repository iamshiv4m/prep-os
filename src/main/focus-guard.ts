let guardActive = false;
let listener: ((active: boolean) => void) | null = null;

export function setFocusGuard(active: boolean): void {
  const next = !!active;
  if (next === guardActive) return;
  guardActive = next;
  listener?.(guardActive);
}

export function isFocusGuardActive(): boolean {
  return guardActive;
}

export function setOnFocusGuardChanged(cb: (active: boolean) => void): void {
  listener = cb;
}
