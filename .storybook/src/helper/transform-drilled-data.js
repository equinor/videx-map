import { GeoProjection } from './geo-projection';

export function stripLabel(name) {
  let output = name;
  if (/^[a-zA-Z]{2}\s/.test(name)) {
    output = name.substring(3);
  }
  return output;
}

/** Extract year from date string. */
export function getYear(date) {
  if (!date) return null;
  return new Date(date).getFullYear();
}

export function transformDrilledData(data) {
  const proj = new GeoProjection();
  const wellboreInfo = data.map(item => {
    const depthRef = item.depthReferenceElevation;

    item.intervals = item.intervals.map(d => ({
      ...d,
      start: d.start + depthRef,
      end: d.end + depthRef,
    }));
    proj.set(item.projectedCoordinateSystem);
    item.path = proj.toLatLongStream(item.path, [item.refX, item.refY]);
    const { depthMsl, ...rest } = item;
    return {
      ...rest,
      wellboreId: item.wellboreUuid,
      wellboreType: 'drilled',
      wbType: item.wellboreType,
      label: item.uniqueWellboreIdentifier,
      labelShort: stripLabel(item.uniqueWellboreIdentifier),
      category: item.wellborePurpose?.toLowerCase() || 'uncategorized',
      completionDateYear: getYear(item.completionDate),
      totalDepthDrillerMd: depthMsl + depthRef,
    };
  });

  return wellboreInfo;
}
