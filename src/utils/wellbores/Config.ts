import { WellboreEventData } from "./data";
import { HighlightEvent } from "./data/WellboreEventData";
import { EventHandler } from "../../EventHandler";

/** Resize config for [Multiplier] * [Base] ^ -(zoom - [zoomReference]). */
export interface ResizeConfig {
  /** Base of resizing function. Size does not change when base is 2. (Default: 1.75) */
  base: number;
  /** Multiplier for adding additional size. (Default: 1) */
  multiplier: number;
  /** Reference for calculating origin size. (Default: 12) */
  zoomReference: number;
}

/** Interface for wellbore config. */
export interface Config {
  /** Relative scale of all components (Default: 1.0). */
  scale: number;
  /** Wellbore width (Default: 0.15). */
  wellboreWidth: number;
  /** Root width (Default: 0.4). */
  rootRadius: number;
  /** Amount of wellbores per batch. (Default: 25) */
  batchSize: number;
  /** Origin zoom level, i.e. where input for scaling function is 0. (Default: 0) */
  zoomOrigin: number;
  /** Grid size to control resolution of spacial indexing. */
  gridSize: number;
  /** Resize configurations of roots. */
  rootResize: ResizeConfig;
  /** Function to be called when a wellbore is selected. */
  onWellboreClick?: (wellbore: WellboreEventData) => void;
  /** Function to be called when wellbores are highlighted. */
  onHighlightOn?: (event: HighlightEvent) => void;
  /** Function to be called when highlight is removed. */
  onHighlightOff?: () => void;
}

/** Data from 'InputConfig' not included in 'Config'. */
export interface ExtraConfig {
  labelBgOpacity: number;
  labelScale: number;
  fontSize: number;
  scaling: (zoom: number) => number;
}

export interface InputConfig {
  /** Relative scale of all components. (Default: 1.0) */
  scale?: number;
  /** Width of wellbore. (Default: 0.15) */
  wellboreWidth?: number;
  /** Width of root. (Default: 0.4) */
  rootRadius?: number;
  /** Scale of labels. (Default: 0.011) */
  labelScale?: number;
  /** Opacity of label background. (Default: 0.5) */
  labelBgOpacity?: number;
  /** Size of font. (Default: 24) */
  fontSize?: number;
  /** Amount of wellbores per batch. (Default: 25) */
  batchSize?: number;
  /** Origin zoom level, i.e. where input for scaling function is 0. (Default: 0) */
  zoomOrigin?: number;
  /** Provide your custom event handler. */
  customEventHandler?: EventHandler;
  /** Zoom event handler. */
  scaling?: (zoom: number) => number;
  /** Grid size to control resolution of spatial indexing. */
  gridSize?: number;
  /** Resize configurations of roots. */
  rootResize?: ResizeConfig;
  /** Function to be called when a wellbore is selected. */
  onWellboreClick?: (selected: WellboreEventData) => void;
  /** Function to be called when wellbores are highlighted. */
  onHighlightOn?: (event: HighlightEvent) => void;
  /** Function to be called when highlight is removed. */
  onHighlightOff?: () => void;
}

/** Get default configuration for wellbores. */
export function getDefaultConfig(input?: InputConfig): [ Config, ExtraConfig ] {

  const outputConfig: Config = {
    scale: 1.0,
    wellboreWidth: 0.15,
    rootRadius: 0.4,
    batchSize: 15,
    zoomOrigin: 0,
    gridSize: 2,
    rootResize: {
      base: 1.75,
      multiplier: 1,
      zoomReference: 12,
    },
  }

  // Extra config represents temporary configurations that does not belong into the Config object
  const outputExtra: ExtraConfig = {
    labelBgOpacity: 0.5,
    labelScale: 0.011,
    fontSize: 18,
    scaling: undefined,
  }

  // Return early if no input
  if (!input) return [ outputConfig, outputExtra ];

  // Try to transfer from input
  function transfer(key: string, target: {}) {
    // @ts-ignore
    if (!isNaN(input[key])) target[key] = input[key];
  }

  transfer('wellboreWidth', outputConfig);
  transfer('rootRadius', outputConfig);
  transfer('batchSize', outputConfig);
  transfer('zoomOrigin', outputConfig);
  transfer('gridSize', outputConfig);

  // Scale everything
  if (!isNaN(input.scale)) {
    outputConfig.scale = input.scale;
    outputConfig.wellboreWidth *= input.scale;
    outputConfig.rootRadius *= input.scale;
  }

  transfer('labelBgOpacity', outputExtra);
  transfer('labelScale', outputExtra);
  transfer('fontSize', outputExtra);

  function transferFunction(key: string, target: {}) {
    // @ts-ignore
    if (typeof input[key] === 'function') target[key] = input[key];
  }

  transferFunction('scaling', outputExtra);
  transferFunction('onWellboreClick', outputConfig);
  transferFunction('onHighlightOn', outputConfig);
  transferFunction('onHighlightOff', outputConfig);

  function transferObj(key: string, target: {}) {
    // @ts-ignore
    if (input[key]) target[key] = input[key];
  }

  transferObj('rootResize', outputConfig);

  return [ outputConfig, outputExtra ];
}
