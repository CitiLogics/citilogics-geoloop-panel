/* eslint-disable id-length, no-unused-vars */
import moment from 'moment';
import mapboxgl from './libs/mapbox-gl';
import * as d3 from './libs/d3';
/* eslint-disable id-length, no-unused-vars */

export default class GeoLoop {
  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.createMap();
    this.frames = []; // list of timestamps
    this.currentFrameIndex = 0;
    this.animation = {};
    this.pause = false;
    // register overlay button click event
    d3.select('#map_' + this.ctrl.panel.id + '_button_pause').on('click', () => {
      // toggle pause
      this.pause = !this.pause;
      if (this.pause) {
        this.stopAnimation();
      } else {
        this.startAnimation();
      }
    });
    d3.select('#map_' + this.ctrl.panel.id + '_button_backward').on('click', () => {
      // go one frame backward
      this.pause = true;
      this.stopAnimation();
      this.stepFrame(((this.currentFrameIndex + this.frames.length) - 1) % this.frames.length);
    });
    d3.select('#map_' + this.ctrl.panel.id + '_button_forward').on('click', () => {
      // go one frame forward
      this.pause = true;
      this.stopAnimation();
      this.stepFrame((this.currentFrameIndex + 1) % this.frames.length);
    });
    // register overlay slider input event
    d3.select('#map_' + this.ctrl.panel.id + '_slider').on('input', () => {
      // pause
      this.pause = true;
      this.stopAnimation();
      // set frame to selected date/time
      const targetFrame = parseInt(d3.select('#map_' + this.ctrl.panel.id + '_slider').property('value'), 10);
      this.stepFrame(targetFrame);
    });
  }

  createMap() {
    console.log('creating mapbox-map');
    const mapCenterLonLat = [parseFloat(this.ctrl.panel.mapCenterLongitude), parseFloat(this.ctrl.panel.mapCenterLatitude)];
    mapboxgl.accessToken = this.ctrl.panel.mbApiKey;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/' + this.ctrl.panel.mapStyle,
      center: mapCenterLonLat,
      zoom: parseFloat(this.ctrl.panel.initialZoom),
      interactive: this.ctrl.panel.userInteractionEnabled
    });
    // load geo data if there already is some (created by ctrl.updateGeoDataFeatures)
    this.map.on('load', () => {
      if (this.ctrl.geoResult) {
        console.log('loading cached geo data into mapbox-map');
        try {
          this.map.addSource('geo', this.ctrl.geoResult);
        } catch (e) {
          // don't panic on error, just print it
          console.log('add source error: ', e);
        }
      }
    });
  }

  createLegend() {
    this.legend = {};
  }

  needToRedrawFrames() {
    this.legend = {};
    return true;
  }

  drawLayerFrames() {
    console.log('drawing layer frames');
    const data = this.ctrl.data;
    if (this.needToRedrawFrames(data)) {
      this.stopAnimation();
      this.clearFrames();
      this.createFrames(data);
      this.startAnimation();
    }
  }

  clearFrames() {
    let errors = 0;
    this.frames.forEach((item) => {
      try {
        this.map.removeLayer('f-' + item);
      } catch (e) {
        // don't stop on error
        errors += 1;
      }
    });
    if (errors) {
      console.error('failed to remove' + errors + 'layers from mapbox-map');
    }
    this.frames = [];
  }

  createFrames() {
    if (!this.ctrl.dataCharacteristics.timeValues) {
      console.log('no series to display (while trying to create frames)');
      return;
    }

    if (!this.ctrl.geo) {
      console.log('no geo data (while trying to create frames)');
      return;
    }

    if (!this.map) {
      console.log('no map found (while trying to create frames)');
      return;
    }

    if (this.map.isSourceLoaded('geo')) {
      console.log('geo source found on first try. Starting to build frames.');
      this.createFramesSafely();
    } else {
      // console.log('no geo source in map. maybe not loaded?');
      // this is stupid to use setInterval.
      // but mapbox doesn't seem to have a on-source-loaded event that reliably works
      // for this purpose.
      let attemptsLeft = 15;  // slow connections might need a lot of time
      const interval = setInterval(() => {
        if (!this.map) {
          console.log('map was unloaded while waiting for geo source');
          clearInterval(interval);
        } else if (this.map.isSourceLoaded('geo')) {
          console.log('geo source found. Starting to build frames');
          clearInterval(interval);
          this.createFramesSafely();
        } else {
          console.log('no geo source found. Trying again...');
          attemptsLeft -= 1;
          if (attemptsLeft <= 0) {
            clearInterval(interval);
            console.error('Failed to load geo source. Try to refresh manually?');
          }
        }
      }, 1000);
    }
  }

  createFramesSafely() {
    const sizeIsDynamic = (this.ctrl.panel.sizeRamp.codeTo === 'measurement');
    const colorIsDynamic = (this.ctrl.panel.colorRamp.codeTo === 'measurement');
    const featureType = this.ctrl.panel.renderType;
    const layerType = this.ctrl.opts.layerTypes[featureType];
    let sizeStops = [[0, 1], [100, 10]];
    const colorStops = [];

    if (sizeIsDynamic) {
      // populate the sizeStops array with the input/output values
      let minInput = 0;
      let maxInput = 1;
      if (this.ctrl.panel.sizeRamp.auto) {
        minInput = this.ctrl.dataCharacteristics.min;
        maxInput = this.ctrl.dataCharacteristics.max;
      } else {
        minInput = parseFloat(this.ctrl.panel.sizeRamp.minValue);
        maxInput = parseFloat(this.ctrl.panel.sizeRamp.maxValue);
      }

      sizeStops = [[minInput, parseFloat(this.ctrl.panel.sizeRamp.min)], [maxInput, parseFloat(this.ctrl.panel.sizeRamp.max)]];
      // console.log('size stops: ', sizeStops);
    }

    if (colorIsDynamic) {
      // populate the sizeStops array with the input/output values
      let minInput = 0;
      let maxInput = 1;
      if (this.ctrl.panel.colorRamp.auto) {
        minInput = this.ctrl.dataCharacteristics.min;
        maxInput = this.ctrl.dataCharacteristics.max;
      } else {
        minInput = parseFloat(this.ctrl.panel.colorRamp.minValue);
        maxInput = parseFloat(this.ctrl.panel.colorRamp.maxValue);
      }

      const nStops = 25;

      for (let iStop = 0; iStop <= nStops; iStop += 1) {
        const stop = minInput + ((iStop / nStops) * (maxInput - minInput));
        colorStops.push([stop, this.ctrl.panel.colorInterpolator(stop)]);
      }

      // console.log('color stops: ', colorStops);
    }

    this.ctrl.dataCharacteristics.timeValues.forEach((time) => {
      const frameName = 'f-' + time;
      // create new map layer for this animation frame (name is the time code)
      const pp = {}; // paint properties
      let geoFilter = [];
      if (featureType === 'line') {
        geoFilter = ['==', '$type', 'LineString'];
        pp['line-opacity'] = 0;
        pp['line-opacity-transition'] = { duration: 0 };
        pp['line-width'] = sizeIsDynamic ? {
          property: frameName,
          type: 'exponential',
          stops: sizeStops
        } : parseFloat(this.ctrl.panel.sizeRamp.fixedValue);
        pp['line-color'] = colorIsDynamic ? {
          property: frameName,
          type: 'exponential',
          stops: colorStops
        } : parseFloat(this.ctrl.panel.colorRamp.fixedValue);
      } else if (featureType === 'point') {
        geoFilter = ['==', '$type', 'Point'];
        pp['circle-opacity'] = 0;
        pp['circle-opacity-transition'] = { duration: 0 };
        pp['circle-radius'] = sizeIsDynamic ? {
          property: frameName,
          type: 'exponential',
          stops: sizeStops
        } : parseFloat(this.ctrl.panel.sizeRamp.fixedValue);
        pp['circle-color'] = colorIsDynamic ? {
          property: frameName,
          type: 'exponential',
          stops: colorStops
        } : this.ctrl.panel.colorRamp.fixedValue;
      } else if (featureType === 'polygon') {
        geoFilter = ['==', '$type', 'Polygon'];
        pp['fill-opacity'] = 0;
        pp['fill-opacity-transition'] = { duration: 0 };
        pp['fill-color'] = colorIsDynamic ? {
          property: frameName,
          type: 'exponential',
          stops: colorStops
        } : this.ctrl.panel.colorRamp.fixedValue;
      }

      this.map.addLayer({
        id: 'f-' + time,
        type: layerType,
        source: 'geo',
        paint: pp,
        filter: geoFilter,
      });

      this.frames.push(time);
    });

    // get slider component, set min/max/value
    d3.select('#map_' + this.ctrl.panel.id + '_slider')
      .attr('min', 0)
      .attr('max', this.frames.length);
    // update colorbar legend and text
    d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.legend_text').html(this.ctrl.inputRange.map(Math.round).join(' - '));
    d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.bar').style('background', 'linear-gradient(to right, ' + [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(this.ctrl.theRamp).join(', ') + ')');
  }


  startAnimation() {
    if (this.animation) {
      this.stopAnimation();
    }

    // start the animation with the specified fps
    this.animation = setInterval(() => {
      this.stepFrame();
    }, 1000 / this.ctrl.panel.framesPerSecond);
  }

  stopAnimation() {
    clearInterval(this.animation);
    this.animation = null;
  }

  stepFrame(targetFrame = -1) {
    if (!this.map) {
      return;
    }
    if (this.frames.length === 0) {
      // console.log('skipping animation: no frames');
      return;
    }
    const oldFrame = 'f-' + this.frames[this.currentFrameIndex];
    this.currentFrameIndex = targetFrame >= 0 ? targetFrame : this.currentFrameIndex + 1;
    this.currentFrameIndex %= this.frames.length;
    const newFrame = 'f-' + this.frames[this.currentFrameIndex];

    const opacitySelectors = {
      'point': 'circle-opacity',
      'polygon': 'fill-opacity',
      'line': 'line-opacity'
    };
    const selector = opacitySelectors[this.ctrl.panel.renderType];

    this.map.setPaintProperty(newFrame, selector, 1);
    this.map.setPaintProperty(oldFrame, selector, 0);
    const tstamp = this.frames[this.currentFrameIndex] / 1e3;
    const timeStr = moment.unix(tstamp).format(this.ctrl.panel.hideTime ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss');

    // set time string in legend
    d3.select('#map_' + this.ctrl.panel.id + '_date').text(timeStr);
    // set slider position to indicate time-location
    d3.select('#map_' + this.ctrl.panel.id + '_slider').property('value', this.currentFrameIndex);
  }

  resize() {
    this.map.resize();
  }

  panToMapCenter() {
    this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLongitude), parseFloat(this.ctrl.panel.mapCenterLatitude)]);
    this.ctrl.mapCenterMoved = false;
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  remove() {
    this.stopAnimation();
    this.clearFrames();
    if (this.map) {
      this.map.remove();
    }
    this.map = null;
  }
}
