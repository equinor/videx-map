/* eslint-disable no-magic-numbers, curly, @typescript-eslint/ban-ts-comment */
type vec3 = [number, number, number];

export interface Color {
  col1: vec3;
  col2: vec3;
  labelBg: number;
}

export interface Colors {
  fontColor: number;
  interactFontColor: number;
  default: Color;
  highlight: Color;
  multiHighlight: Color;
  selected: Color;
}

/** Enum for selecting color. [ Default, Highlight, MultiHighlight, Selected ] */
export enum ColorType {
  Default,
  Highlight,
  MultiHighlight,
  Selected,
}

export interface InputColors {
  fontColor?: number;
  interactFontColor?: number;
  defaultColor1?: vec3;
  defaultColor2?: vec3;
  defaultLabelBg?: number;
  highlightColor1?: vec3;
  highlightColor2?: vec3;
  highlightLabelBg?: number;
  multiHighlightColor1?: vec3;
  multiHighlightColor2?: vec3;
  multiHighlightLabelBg?: number;
  selectedColor1?: vec3;
  selectedColor2?: vec3;
  selectedLabelBg?: number;
}

/** Get default configuration for wellbores. */
export function getDefaultColors(input?: InputColors): Colors {

  const output: Colors = {
    fontColor: 0x000000,
    interactFontColor: 0xFFFFFF,
    default: {
      col1: [0.3, 0.3, 0.3],
      col2: [0.05, 0.05, 0.05],
      labelBg: 0xFFFFFF,
    },
    highlight: {
      col1: [0.8, 0.2, 0.9],
      col2: [0.5, 0.05, 0.6],
      labelBg: 0xA30AA3,
    },
    multiHighlight: {
      col1: [0.55, 0.55, 0.55],
      col2: [0.3, 0.3, 0.3],
      labelBg: 0x666666,
    },
    selected: {
      col1: [1.0, 0.0, 0.0],
      col2: [0.5, 0.0, 0.0],
      labelBg: 0xFFFFFF,
    },
  };

  // Return early if no input
  if (!input) return output;

  // Try to transfer from input
  function transfer(key: string) {
    // @ts-ignore
    if (!isNaN(input[key])) output[key] = input[key];
  }

  // Try to transfer color data
  function transferColor(color: string) {
    // @ts-ignore
    const inputCol1: vec3 = input[`${color}Color1`];
    // @ts-ignore
    const inputCol2: vec3 = input[`${color}Color2`];
    // @ts-ignore
    const inputLabelBg: number = input[`${color}LabelBg`];

    // @ts-ignore
    const outputColor: Color = output[color];
    if (inputCol1) outputColor.col1 = inputCol1;
    if (inputCol2) outputColor.col2 = inputCol2;
    if (inputLabelBg) outputColor.labelBg = inputLabelBg;
  }

  transfer('fontColor');
  transfer('interactFontColor');
  transferColor('default');
  transferColor('highlight');
  transferColor('multiHighlight');
  transferColor('selected');

  return output;
}

