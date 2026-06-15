[![npm version](https://badge.fury.io/js/%40equinor%2Fvidex-map.svg)](https://badge.fury.io/js/%40equinor%2Fvidex-map)
![](https://github.com/equinor/videx-map/workflows/Unit%20test/badge.svg)
[![SCM Compliance](https://scm-compliance-api.radix.equinor.com/repos/equinor/videx-map/badge)](https://scm-compliance-api.radix.equinor.com/repos/equinor/videx-map/badge)

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
import { WellboreModule, FaultlineModule, FieldModule, GeoJSONModule, OutlineModule } from '@equinor/videx-map';
```

<br/>

# Modules
Videx map is divided into various modules with specific purposes. These modules can be used individually or combined into a single WebGL context.

## Wellbore Module
Module responsible for visualizing wellbores with roots and paths.

### Configurations

- <b>scale</b> - Relative scale of everything. (Default: 1.0)
- <b>labelScale</b> - Scale of labels. (Default: 0.011)
- <b>labelBgOpacity</b> - Opacity of label background. (Default: 0.5)
- <b>fontSize</b> - Size of font. (Default: 18)
- <b>batchSize</b> - Amount of wellbores per batch. (Default: 20)
- <b>zoomOrigin</b> - Origin zoom level, i.e. where input for scaling function is 0. (Default: 0)
- <b>customEventHandler</b> - Provide your custom event handler.
- <b>scaling</b> - Zoom event handler.
- <b>gridSize</b> - Grid size to control resolution of spatial indexing.
- <b>wellboreResize</b> - Resize configurations of wellbores.
- <b>rootResize</b> - Resize configurations of roots.
- <b>wellboreDash</b> - Size of wellbore dash. (Default: 0.01)
- <b>tick</b> - Object `{ width, height }` for tick marks along wellbore lines.
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

## Field Module
Module responsible for visualizing oil and gas fields with filled polygons, outlines, and labels.

### Configurations

- <b>initialHash</b> - Initial scale of field hash pattern. (Default: 1.0)
- <b>minHash</b> - Minimum scale of field hash pattern. (Default: 0.0)
- <b>maxHash</b> - Maximum scale of field hash pattern. (Default: Infinity)

```js
// Example configuration
const fields: FieldModule = new FieldModule({
  initialHash: 0.5,
  minHash: 0.1,
  maxHash: 2.0,
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

## GeoJSON Module
Module responsible for visualizing arbitrary GeoJSON data, supporting `Point`, `LineString`, `Polygon`, and `MultiPolygon` geometry types.

### Configurations

- <b>customEventHandler</b> - Provide your custom event handler.
- <b>onFeatureHover</b> - Function called when a feature is hovered.
- <b>outlineResize</b> - Resize configuration for outlines.
- <b>labelResize</b> - Resize configuration for labels.

```js
// Example usage
const geojson: GeoJSONModule = new GeoJSONModule({
  onFeatureHover: (event, data) => {
    // Handle hover ...
  },
});

// Pass a GeoJSON FeatureCollection and an optional props mapper
geojson.set(featureCollection, feature => ({
  id: feature.properties.id,
  label: feature.properties.name,
  style: {
    lineColor: '#FF0000',
    lineWidth: 2,
    fillColor: '#00FF00',
    fillOpacity: 0.5,
  },
}));
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

## Contribution
We greatly appreciate contributions to this repository, see our [contribution page](CONTRIBUTION.md) on how to get started.

### Quick start
```
$ git clone https://github.com/equinor/videx-map.git
$ npm install
$ npm start
```



![Equinor Logo](images/equinor-logo.png)
