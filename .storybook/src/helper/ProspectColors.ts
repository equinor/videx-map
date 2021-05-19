interface ProspectColor {
  lineColor?: string,
  fillColor: string,
};

/** Parse and scale hex by value. */
function scaleHex(hex: string, val: number): string {
  let n = parseInt(hex, 16);
  n = Math.round(n * val);
  const newHex = n.toString(16);
  return newHex.length === 1 ? `0${newHex}` : newHex;
}

/** Interpolate color towards #000000 by given percentage. */
function darkenColor(color: string, percent: number): string {
  const r = color.substr(1, 2);
  const g = color.substr(3, 2);
  const b = color.substr(5, 2);

  const val = 1 - percent * 0.01;
  return `#${scaleHex(r, val)}${scaleHex(g, val)}${scaleHex(b, val)}`;
}

/** Static helper class for managing prospect colors. Only calculates outline color when needed. */
export class ProspectColors {
  /** Object with available colors */
  static colors: any = {
    quaternary:     { fillColor: '#fff799' },
    neogene:        { fillColor: '#ffde2f' },
    paleogene:      { fillColor: '#f9a870' },
    cretaceous:     { fillColor: '#88c86f' },
    jurassic:       { fillColor: '#00b9e7' },
    triassic:       { fillColor: '#8f53a1' },
    permian:        { fillColor: '#e6654a' },
    carboniferous:  { fillColor: '#68aeb2' },
    devonian:       { fillColor: '#cf9c5a' },
    silurian:       { fillColor: '#b3ddca' },
    ordovician:     { fillColor: '#00a88e' },
    cambrian:       { fillColor: '#8cab79' },
    proterozoic:    { fillColor: '#f05b78' },
    archean:        { fillColor: '#ec008c' },
    hadean:         { fillColor: '#b41e8e' },
  };

  /** Returns true if given age maps to a color.
   * @param {*} age Age of prospect data (Currently only supporting chrono period)
  */
  static valid(age: string): boolean {
    return age && (age in ProspectColors.colors);
  }

  /**
   * Get color by given age.
   * @param {*} age Age of prospect data (Currently only supporting chrono period)
   */
  static get(age: string): ProspectColor {
    const color: ProspectColor = ProspectColors.colors[age];

    // Initialize outline color if null
    if (!color.lineColor) {
      color.lineColor = darkenColor(color.fillColor, 20);
    }

    return color;
  }
}
