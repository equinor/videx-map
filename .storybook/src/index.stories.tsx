import { create } from 'd3-selection';
import * as L from 'leaflet';
import { FaultlineModule, OutlineModule, WellboreModule, GeoJSONModule } from '../../src';
import { RootData } from '../../src/utils/wellbores/data';

import PixiLayer from './helper/PixiLayer';
import Sidebar from './Sidebar';

export default { title: 'Leaflet layer' };

const factors: any = {
  10: 0.3,
  11: 0.1,
  12: 0.06,
  13: 0.04,
  14: 0.03,
  15: 0.02,
  16: 0.01,
  17: 0.01,
  18: 0.005,
  19: 0.005,
  20: 0.0025,
};

const initialZoom: number = 12;

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Sample data
const licenseData = require('./samples/licenses.json');
const pipelineData = require('./samples/pipelines.json');
const facilityData = require('./samples/facilities.json');
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

export const layer = () => {
  const root = create('div')
    .style('width', '100%')
    .style('height', '1400px');

  const mapRoot = root.append('div')
    .style('position', 'absolute')
    .style('width', '88%')
    .style('height', '1400px');

  mapRoot.append('link')
    .attr('rel', 'stylesheet')
    .attr('href', 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css');

  const sidebarRoot = root.append('div')
      .style('position', 'absolute')
      .style('left', '88%')
      .style('width', '12%')
      .style('height', '1400px')

  const sidebar = new Sidebar(sidebarRoot, { marginPct: 7 });

  requestAnimationFrame(() => {
    const map = L.map(mapRoot.node()).setView([60.81, 3.57], initialZoom);
    // const map = L.map(root.node()).setView([72.395, 20.13], initialZoom); // JC
    // const map = L.map(root.node()).setView([59.227, 2.507], initialZoom); // Grand
    // const map = L.map(root.node()).setView([59.186, 2.491], initialZoom); // Grane
    L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png', {
      maxNativeZoom: 10,
      noWrap: true,
    }).addTo(map);

    const pixiLayer = new PixiLayer();
    const faultlines: FaultlineModule = new FaultlineModule();
    // const fields: FieldModule = new FieldModule();
    const outlines: OutlineModule = new OutlineModule({
      minExtraWidth: 0.0,
      maxExtraWidth: 0.3,
    });
    const wellbores: WellboreModule = new WellboreModule(
      {
        scale: 1.5,
        // labelScale: 1,
        labelBgOpacity: 0.2,
        zoomOrigin: 0,
        wellboreDash: 0.08,
        // @ts-ignore
        scaling: zoom => factors[zoom] || 0,
        wellboreResize: {
          min: { zoom: 10, scale: 0.5 },
          max: { zoom: 18, scale: 0.05 },
        },
        rootResize: {
          min: { zoom: 0, scale: 1000.0 },
          max: { zoom: 18, scale: 0.2 },
        },
        tick: {
          width: 0.01,
          height: 0.1,
        },
        onHighlightOn: event => {
          if (event.count === 1) mapRoot.node().style.cursor = 'pointer'; // Set cursor style
          else mapRoot.node().style.cursor = null; // Remove cursor style
        },
        onHighlightOff: () => {
          mapRoot.node().style.cursor = null; // Remove cursor style
        },
        onWellboreClick: wellbore => {
          wellbores.setSelected(d => d === wellbore.data);
        }
      },
    );

    const licenses: GeoJSONModule = new GeoJSONModule({
      outlineResize: {
        min: { zoom: 6, scale: 3.0 },
        max: { zoom: 18, scale: 0.05 },
      },
      labelResize: {
        min: { zoom: 11, scale: 0.1 },
        max: { zoom: 17, scale: 0.025 },
        threshold: 8,
        baseScale: 0.15,
      },
    });
    const pipelines: GeoJSONModule = new GeoJSONModule();
    const facilities: GeoJSONModule = new GeoJSONModule();
    const prospects: GeoJSONModule = new GeoJSONModule();

    pixiLayer.addModule(faultlines);
    // pixiLayer.addModule(fields);
    pixiLayer.addModule(outlines);
    pixiLayer.addModule(wellbores);
    pixiLayer.addModule(licenses);
    pixiLayer.addModule(pipelines);
    pixiLayer.addModule(facilities);
    pixiLayer.addModule(prospects);
    pixiLayer.addTo(map);

    // fields.set(fieldData.features);
    // faultlines.set(faultlineDataTroll);
    // outlines.set(outlineDataTroll);

    // const split = Math.floor(wbData.length * 0.9);

    // const drilled = wbData.slice(0, split);
    // const planned = wbData.slice(split + 1, wbData.length);

    wellbores.registerGroup('Drilled', {
      order: 0,
    });

    wellbores.registerGroup('Planned', {
      order: 1,
      colors: {
        defaultColor1: [0.4, 0.7, 1.0],
        defaultColor2: [0.1, 0.3, 0.6],
      },
    });

    wellbores.registerGroup('Exploration', {
      order: 2,
      colors: {
        defaultColor1: [0.7, 1.0, 0.4],
        defaultColor2: [0.3, 0.6, 0.1],
      },
    });

    // wellbores.set(drilled, 'Drilled'); // Set first half (Emulate 'Drilled')
    // wellbores.set(planned, 'Planned'); // Set second half (Emulate 'Planned')
    // wellbores.set(explorationData, 'Exploration');


    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // Buttons

    const groupShowHide = sidebar.addGroup('Show/Hide');

    const toggle = (key: string) => {
      if (wellbores.groups[key].active) wellbores.disable(key);
      else wellbores.enable(key);
    }

    groupShowHide.add('Disable wellbores', () => wellbores.disable());
    groupShowHide.add('Enable wellbores', () => wellbores.enable());
    groupShowHide.add('Toggle \'Drilled\'', () => toggle('Drilled'));
    groupShowHide.add('Toggle \'Planned\'', () => toggle('Planned'));

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    let labelActive = true;

    const groupShowHideLabel = sidebar.addGroup('Show/Hide labels');

    groupShowHideLabel.add('Toggle labels', () => {
      labelActive = !labelActive;
      wellbores.setLabelVisibility(labelActive);
    });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    let completionDrilledVisible = true;
    let completionPlannedVisible = true;

    const groupShowHideCompletion = sidebar.addGroup('Show/Hide completion');

    groupShowHideCompletion.add('Toggle completion', () => {
      const completionVisible = !(completionDrilledVisible && completionPlannedVisible);
      completionDrilledVisible = completionVisible;
      completionPlannedVisible = completionVisible;
      wellbores.setCompletionVisibility(completionDrilledVisible);
    });

    groupShowHideCompletion.add('Toggle \'Drilled\'', () => {
      completionDrilledVisible = !completionDrilledVisible;
      wellbores.setCompletionVisibility(completionDrilledVisible, 'Drilled');
    });
    groupShowHideCompletion.add('Toggle \'Planned\'', () => {
      completionPlannedVisible = !completionPlannedVisible;
      wellbores.setCompletionVisibility(completionPlannedVisible, 'Planned');
    });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    const groupFilter = sidebar.addGroup('Filter');

    groupFilter.add('Has completion (Hard)', () => {
      wellbores.hardFilter(d => d.intervals.length > 0);
    });

    groupFilter.add('Has completion (Soft)', () => {
      wellbores.softFilter(d => d.intervals.length > 0);
    });

    groupFilter.add('Reset filter', () => {
      wellbores.clearFilter();
    });

    const groupClear = sidebar.addGroup('Clear');

    groupClear.add('Clear \'Drilled\'', () => {
      wellbores.clear('Drilled');
    });

    groupClear.add('Clear \'Planned\'', () => {
      wellbores.clear('Planned');
    });

    groupClear.add('Clear all', () => {
      wellbores.clear();
    });

    const groupLblUnderRoot = sidebar.addGroup('Label under root');

    const attachToRoot = (attach: boolean, key: string) => {
      const roots = new Set<RootData>();
      wellbores.groups[key].wellbores.forEach(d => {
        roots.add(d.root);
        d.label.attachToRoot = attach ? true : d.interpolator.singlePoint;
      });
      roots.forEach(root => root.updateLabels());
      wellbores.pixiOverlay.redraw();
    }

    let drilledUnderRoot = false, plannedUnderRoot = false;

    groupLblUnderRoot.add('Toggle \'Drilled\'', () => {
      drilledUnderRoot = !drilledUnderRoot;
      attachToRoot(drilledUnderRoot, 'Drilled');
    });

    groupLblUnderRoot.add('Toggle \'Planned\'', () => {
      plannedUnderRoot = !plannedUnderRoot;
      attachToRoot(plannedUnderRoot, 'Planned');
    });


    const groupHighlightOverride = sidebar.addGroup('Highlight');

    groupHighlightOverride.add('31/3-Q-21 AY1H', () => {
      wellbores.setHighlight('NO 31/3-Q-21 AY1H', 'Drilled');
    });

    groupHighlightOverride.add('31/2-3', () => {
      wellbores.setHighlight('NO 31/2-3', 'Drilled');
    });

    groupHighlightOverride.add('Clear highlight', () => {
      wellbores.clearHighlight();
    });


    const groupAnimate = sidebar.addGroup('Animate');

    groupAnimate.add('Animate 1970 to 2020', () => {
      let year = 1970;
        let handle: any;
        const func = () => {
          wellbores.softFilter(d => d.drillEndYear < year);
          year++;
          if (year > 2020) clearInterval(handle);
        };

        handle = setInterval(func, 200);
    });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    const groupGeoJSON = sidebar.addGroup('GeoJSON');

    type SingleGeoJSON = { module: GeoJSONModule, data: any, props: (feature: any) => any, loaded?: boolean, visible: boolean }

    const licenseProps = (feature: any) => ({
      label: feature.properties.prlName,
      id: feature.properties.prlNpdidLicence,
      style: {
        lineColor: 'blue',
        lineWidth: 0.1,
        fillColor: feature.properties.prlActive === 'Y' ? 'blue' : 'grey',
        fillOpacity: 0.6,
      },
      additionalData: {},
    });

    const pipelineProps = (feature: any) => ({
      label: feature.properties.pplName,
      id: feature.properties.pplNpdidPipeline,
      style: {
        lineColor: 'red',
        lineWidth: 1,
        fillColor: 'red',
        fillOpacity: 0.6,
      },
     additionalData: {},
    });

    const facilityProps = (feature: any) => ({
      label: feature.properties.fclName,
      id: feature.properties.fclNpdidFacility,
      style: {
        lineColor: 'black',
        lineWidth: 1,
        fillColor: 'black',
        fillOpacity: 0.9,
      },
     additionalData: {},
    });

    const licenseGeoJSON: SingleGeoJSON = { module: licenses, data: licenseData, props: licenseProps, visible: false };
    const pipelineGeoJSON: SingleGeoJSON = { module: pipelines, data: pipelineData, props: pipelineProps, visible: false };
    const facilityGeoJSON: SingleGeoJSON = { module: facilities, data: facilityData, props: facilityProps, visible: false };
    // const prospectGeoJSON: SingleGeoJSON = { module: prospects, data: prospectData, props: prospectProps, visible: false };

    const toggleGeoJSON = (collection: any) => {
      collection.visible = !collection.visible;

      if (collection.visible && !collection.loaded) {
        collection.loaded = true;
        collection.module.set(collection.data, collection.props);
      }

      collection.module.setVisibility(collection.visible);
    }


    groupGeoJSON.add('Toggle licenses', () => toggleGeoJSON(licenseGeoJSON));
    groupGeoJSON.add('Toggle pipelines', () => toggleGeoJSON(pipelineGeoJSON));
    groupGeoJSON.add('Toggle facilities', () => toggleGeoJSON(facilityGeoJSON));
  });

  return root.node();
};
