/* eslint-disable curly */
import { Colors } from '../Colors';
import { getDefaultColors } from '../Colors';

export class ColorRegistry {

  /** Internal color register. */
  registry: { [key: string]: Colors } = {}

  /** Can map multiple strings to same instance in registry. */
  map: { [key: string]: Colors } = {}

  constructor() {
    // Register default key
    const defaultColor = getDefaultColors();
    this.registry['Default'] = defaultColor;
    this.map['Default'] = defaultColor;
  }

  /** Color collection */
  register (key: string, colors: Colors): void {
    if (this.registry[key]) throw `Key [ ${key} ] have already been registered.`;
    this.registry[key] = colors;
  }

  /**
   * Used to map key given as first parameter in 'WellboreModule' with a color collection in internal registy.
   * If key is blank, will try to retrieve 'setKey' from registry. Else key will map to default color configurations.
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

  get (setKey?: string): Colors {
    return this.map[setKey];
  }
}
