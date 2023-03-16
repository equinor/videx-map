/* eslint-disable curly, @typescript-eslint/no-empty-function */
type Callback = (wellboreId: number) => void;

export class CallbackRegistry {
  /** Internal callback register. */
  registry: { [key: string]: Callback } = {}

  /** Can map multiple strings to same callback. */
  map: { [key: string]: Callback } = {}

  constructor() {
    // Register default callback
    this.registry['Default'] = () => {};
    this.map['Default'] = () => {};
  }

  /** Register callback */
  register (key: string, callback: Callback): void {
    if (this.registry[key]) throw `Key [ ${key} ] have already been registered.`;
    this.registry[key] = callback;
  }

  /**
   * Used to map key given as first parameter in 'WellboreModule' with a callback in internal registy.
   * If key is blank, will try to retrieve 'setKey' from registry. Else key will map to default callback.
   * @param setKey Key to map to registry.
   * @param key Key in registry.
   */
  mapKey (setKey: string, key?: string): void {
    if (this.map[setKey]) throw `Key [ ${setKey} ] have already been mapped.`;
    if (!key) {
      if (setKey in this.registry) key = setKey;
      else key = 'Default';
    }
    this.map[setKey] = this.registry[key];
  }

  get (setKey?: string): Callback {
    return this.map[setKey];
  }
}
