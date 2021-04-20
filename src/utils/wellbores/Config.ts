import { WellboreEventData } from "./data";
import { HighlightEvent } from "./data/WellboreEventData";
import { EventHandler } from "../../EventHandler";

export interface ResizeConfig {
  min: { zoom: number, scale: number },
  max: { zoom: number, scale: number }
}

/** Interface for wellbore config. */
export interface Config {
  /** Relative scale of all components (Default: 1.0). */
  scale: number;
  /** Amount of wellbores per batch. (Default: 25) */
  batchSize: number;
  /** Origin zoom level, i.e. where input for scaling function is 0. (Default: 0) */
  zoomOrigin: number;
  /** Grid size to control resolution of spacial indexing. */
  gridSize: number;
  /** Resize configurations of wellbores. */
  wellboreResize: ResizeConfig;
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
  /** Opacity of label background. (Default: 0.5) */
  labelBgOpacity: number;
  /** Scale of labels. (Default: 0.011) */
  labelScale: number;
  /** Size of font. (Default: 24) */
  fontSize: number;
  /** Zoom event handler. */
  scaling: (zoom: number) => number;
  /** Size of wellbore dash. (Default: 0.01) */
  wellboreDash: number;
}

export interface InputConfig {
  /** Relative scale of all components. (Default: 1.0) */
  scale?: number;
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
  /** Size of wellbore dash. (Default: 0.01) */
  wellboreDash?: number;
  /** Provide your custom event handler. */
  customEventHandler?: EventHandler;
  /** Zoom event handler. */
  scaling?: (zoom: number) => number;
  /** Grid size to control resolution of spatial indexing. */
  gridSize?: number;
  /** Resize configurations of wellbores. */
  wellboreResize: ResizeConfig;
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
    batchSize: 15,
    zoomOrigin: 0,
    gridSize: 2,
    wellboreResize: {
      min: { zoom: 10, scale: 0.01 },
      max: { zoom: 18, scale: 0.001 },
    },
    rootResize: {
      min: { zoom: 0, scale: 1.0 },
      max: { zoom: 18, scale: 0.1 },
    },
  }

  // Extra config represents temporary configurations that does not belong into the Config object
  const outputExtra: ExtraConfig = {
    labelBgOpacity: 0.5,
    labelScale: 0.011,
    fontSize: 18,
    scaling: undefined,
    wellboreDash: 0.01,
  }

  // Return early if no input
  if (!input) return [ outputConfig, outputExtra ];

  // Try to transfer from input
  function transfer(key: string, target: {}) {
    // @ts-ignore
    if (!isNaN(input[key])) target[key] = input[key];
  }

  transfer('rootRadius', outputConfig);
  transfer('batchSize', outputConfig);
  transfer('zoomOrigin', outputConfig);
  transfer('gridSize', outputConfig);

  transfer('labelBgOpacity', outputExtra);
  transfer('labelScale', outputExtra);
  transfer('fontSize', outputExtra);
  transfer('wellboreDash', outputExtra);

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

  transferObj('wellboreResize', outputConfig);
  transferObj('rootResize', outputConfig);

  return [ outputConfig, outputExtra ];
}
