[![npm version](https://badge.fury.io/js/%40equinor%2Fvidex-map.svg)](https://badge.fury.io/js/%40equinor%2Fvidex-map)
![](https://github.com/equinor/videx-map/workflows/Unit%20test/badge.svg)

# Videx map

A leaflet layer for visualizing wellbore related data.

- [GitHub Repository](https://github.com/equinor/videx-map)
- [Documentation](https://equinor.github.io/videx-map/)

## Installation
```
npm install --save @equinor/videx-map
```

## Usage
```js
// ES6
import { WellboreModule, FaultlineModule, ...  } from '@equinor/videx-map';
```

<br/>

# Modules
Videx map is divided into various modules with specific purposes. These modules can be used individually or combined into a single WebGL context.

## Wellbore Module
Module responsible for visualizing wellbores with roots and paths.

### Configurations

- <b>scale</b> - Relative scale of everything. (Default: 1.0)
- <b>wellboreWidth</b> - Width of wellbore. (Default: 0.15)
- <b>rootRadius</b> - Width of root. (Default: 0.4)
- <b>labelScale</b> - Scale of labels. (Default: 0.011)
- <b>labelBgOpacity</b> - Opacity of label background. (Default: 0.5)
- <b>fontSize</b> - Size of font. (Default: 24)
- <b>batchSize</b> - Amount of wellbores per batch. (Default: 25)
- <b>zoomOrigin</b> - Origin zoom level, i.e. where input for scaling function is 0. (Default: 0)
- <b>customEventHandler</b> - Provide your custom event handler.
- <b>scaling</b> - Zoom event handler.
- <b>gridSize</b> - Grid size to control resolution of spatial indexing.
- <b>rootResize</b> - Resize configurations of roots.
- <b>onWellboreClick</b> - Function to be called when a wellbore is selected.
- <b>onHighlightOn</b> - Function to be called when wellbores are highlighted.
- <b>onHighlightOff</b> - Function to be called when highlight is removed.

```js
// Example configuration
const wellbores: WellboreModule = new WellboreModule({
  rootRadius: 0.3,
  scale: 1.5,
  labelBgOpacity: 0.2,
  zoomOrigin: 0,
  scaling: zoom => factors[zoom] || 0,
  rootResize: {
    base: 1.75,
    multiplier: 0.5,
    zoomReference: 12.0,
  },
  onHighlightOn: event => {
    // Special 'HighlightOn' logic ...
  },
  onHighlightOff: () => {
    // Special 'HighlightOff' logic ...
  },
  onWellboreClick: wellbore => {
    // Special 'WellboreClick' logic ...
  }
});
```

## Faultline Module
Module responsible for visualizing faultlines on fields.

- <b>color</b> - Color of faultline on format 0xRRGGBB. (Default: 0x727D88)
- <b>alpha</b> - Alpha of faultlines. (Default: 1.0)
- <b>outlineWidth</b> - Width of outline. (Default: 0.125)

```js
// Example configuration
const faultlines: FaultlineModule = new FaultlineModule({
  color: 0xFF00FF,
  alpha: 0.75,
  outlineWidth: 0.13,
});
```

## Outline Module
Module responsible for visualizing field outlines.

- <b>zoomOrigin</b> - Origin zoom level, i.e. where input for scaling function is 0. (Default: 0)
- <b>lineWidth</b> - Width of line. (Default: 0.125)
- <b>scaling</b> - Zoom event handler.

```js
// Example configuration
const outlines: OutlineModule = new OutlineModule({
  zoomOrigin: 12,
  lineWidth: 0.1,
  scaling: zoom => (1.5 ** -zoom),
});
```

<br/>

![Equinor Logo](images/equinor-logo.png)
