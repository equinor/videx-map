import proj4 from 'proj4';

const crsProj = '+proj=utm +zone=31 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs';
const wgsProj = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

export class GeoProjection {
  constructor() {
    this.proj = null;
  }

  set() {
    this.setProj4(crsProj);
  }

  setProj4(proj4def) {
    if (proj4def) {
      this.utmProj = proj4def;
      this.proj = proj4(this.utmProj, wgsProj);
    }
    if (!this.checkProj()) {
      console.warn('GeoProjection - No projection found.');
    }
  }

  checkProj() {
    return this.proj && this.utmProj;
  }

  /**
   * converts longitude/latitude coordinates to utm
   * @param {array} coords - [longitude, latitude]
   * @returns {array} [easting, northing]
   */
  toUtm(coords) {
    if (!this.checkProj()) return null;
    return this.proj.inverse(coords);
  }

  /**
   * Converts a single utm coordinate to a latitude/longitude coordinate.
   * @param {[number, number]} coord - [easting, northing]
   * @returns {[number, number]} [latitude, longitude]
   */
  toLatLong(coord) {
    if (!this.checkProj()) return null;
    const latLng = this.proj.forward(coord);

    // Reverse [Mutate]
    const temp = latLng[0];
    latLng[0] = latLng[1];
    latLng[1] = temp;

    return latLng;
  }

  /**
   * Convertion from UTM to latitude/longitude coordinates.
   * @param {[number, number][]} coords - [easting, northing][]
   * @param {[number, number]} displacement [easting, northing]
   * @returns {[number, number][]} [latitude, longitude][]
   */
  toLatLongStream(coords, displacement) {
    if (!this.checkProj()) return null;
    const { forward } = this.proj;

    const output = new Array(coords.length);

    let utm;
    let latLng;
    let temp;

    for (let i = 0; i < coords.length; i++) {
      utm = coords[i];
      if (displacement)
        utm = [utm[0] + displacement[0], utm[1] + displacement[1]];
      latLng = forward(utm);

      // Reverse [Mutate]
      temp = latLng[0];
      latLng[0] = latLng[1];
      latLng[1] = temp;

      output[i] = latLng;
    }

    return output;
  }
}
