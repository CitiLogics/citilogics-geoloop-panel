/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
import {contextSrv} from 'app/core/core';

import _ from 'lodash';
import * as d3 from './libs/d3';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import './css/geoloop-panel.css!';

const panelDefaults = {
  mbApiKey: 'pk.eyXXXXXXX',
  mapStyle: 'streets-v10', // see opts below
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 8,
  userInteractionEnabled: true,
  animationSpeed: 1, // # of seconds animation time per day of data
  animationPause: 500, // millisecond pause at end of animation loop
  geoIdTag: 'geo_id',
  geoIdPath: 'id',
  geo: {
    location: 'url', // one of: url, text
    contents: 'xxxxxx', // either the jsonp url or the json text itself
    callback: 'data' // named callback in jsonp contents
  },
  renderType: 'line', // one of: line,point,polygon
  sizeRamp: {
    codeTo: 'fixed', // or 'measurement'
    fixedValue: 5,
    measurement: 'measurement_name',
    auto: false,
    min: 1,
    max: 10,
    minValue: 0,
    maxValue: 100,
    showLegend: true,
    legendPosition: 'l'
  },
  colorRamp: {
    codeTo: 'fixed', // or 'measurement'
    fixedValue: '#0000ff',
    measurement: 'measurement_name',
    auto: false,
    minValue: 1,
    maxValue: 100,
    scaleName: 'viridis', // one of D3's color ramps
    showLegend: true,
    legendPosition: 'l'
  },
};

export default class GeoLoopCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);

    this.dataCharacteristics = {};

    this.opts = {
      renderTypes: ['line', 'point', 'polygon'],
      colorRamps: { /*
      for some reason, the extra d3-scale-chromatic library is hard to import ??
        'BrBG': scale.interpolateBrBG,
        'PRGn': scale.interpolatePRGn,
        'PiYG': scale.interpolatePiYG,
        'PuOr': scale.interpolatePuOr,
        'RdBu': scale.interpolateRdBu,
        'RdGy': scale.interpolateRdGy,
        'RdYlBu': scale.interpolateRdYlBu,
        'RdYlGn': scale.interpolateRdYlGn,
        'Spectral': scale.interpolateSpectral,
        'Blues': scale.interpolateBlues,
        'Greens': scale.interpolateGreens,
        'Greys': scale.interpolateGreys,
        'Oranges': scale.interpolateOranges,
        'Purples': scale.interpolatePurples,
        'Reds': scale.interpolateReds,
        'BuGn': scale.interpolateBuGn,
        'BuPu': scale.interpolateBuPu,
        'GnBu': scale.interpolateGnBu,
        'OrRd': scale.interpolateOrRd,
        'PuBuGn': scale.interpolatePuBuGn,
        'PuBu': scale.interpolatePuBu,
        'PuRd': scale.interpolatePuRd,
        'RdPu': scale.interpolateRdPu,
        'YlGnBu': scale.interpolateYlGnBu,
        'YlGn': scale.interpolateYlGn,
        'YlOrBr': scale.interpolateYlOrBr,
        'YlOrRd': scale.interpolateYlOrRd */
        'cubehelix': d3.interpolateCubehelixDefault,
        'rainbow': d3.interpolateRainbow,
        'warm': d3.interpolateWarm,
        'cool': d3.interpolateCool,
        'viridis': d3.interpolateViridis,
        'magma': d3.interpolateMagma,
        'inferno': d3.interpolateInferno,
        'plasma': d3.interpolatePlasma
      },
      mapStyles: {
        'streets': 'streets-v10',
        'outdoors': 'outdoors-v10',
        'light': 'light-v9',
        'dark': 'dark-v9',
        'satellite': 'satellite-v9',
        'satellite-streets': 'satellite-streets-v10',
        'traffic': 'traffic-day-v2',
        'traffic-night': 'traffic-night-v2'
      },
      featureTypes: {
        'Point': 'point',
        'Line': 'line',
        'Polygon': 'polygon'
      },
      layerTypes: {
        'point': 'circle',
        'polygon': 'fill',
        'line': 'line'
      }
    };
    /* set defaults: */
    _.defaults(this.panel, panelDefaults);
    _.defaults(this.panel, panelDefaults.colorRamp);
    _.defaults(this.panel, panelDefaults.sizeRamp);
    _.defaults(this.panel, panelDefaults.geo);
    this.setMapProviderOpts();

    this.dataFormatter = new DataFormatter(this, kbn);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));

    this.loadGeo();
    this.lonLatStr = this.panel.mapCenterLongitude + ',' + this.panel.mapCenterLatitude;

    //$scope.$root.onAppEvent('show-dash-editor', this.doMapResize());
    //$scope.$root.onAppEvent('hide-dash-editor', this.doMapResize());
  }

  getColorScaleImgUrl() {
    return '/public/plugins/citilogics-geoloop-panel/images/colorRamps/' + this.panel.colorRamp.scaleName + '.png';
  }
  getColorNames() {
    return Object.keys(this.opts.colorRamps);
  }

  setLocationFromMap() {
    const center = this.map.map.getCenter();
    this.panel.mapCenterLongitude = center.lng;
    this.panel.mapCenterLatitude = center.lat;
    this.lonLatStr = this.panel.mapCenterLongitude + ',' + this.panel.mapCenterLatitude;
  }

  setNewMapCenter() {
    const coords = this.lonLatStr.split(',').map((strVal) => {
      return Number(strVal.trim());
    });
    this.panel.mapCenterLongitude = coords[0];
    this.panel.mapCenterLatitude = coords[1];

    this.mapCenterMoved = true;
    this.render();
  }

  hardResetMap() {
    if (this.map) {
      this.map.remove();
    }
    this.map = null;
    this.render();
    this.hardRefresh();
  }

  hardRefresh() {
    this.updateRamp();
    this.loadGeo(true);
  }

  setMapProviderOpts() {
    if (contextSrv.user.lightTheme) {
      this.saturationClass = '';
    } else {
      this.saturationClass = 'map-darken';
    }

    if (this.map) {
      this.map.stopAnimation();
      this.map.clearFrames();
      this.map.map.setStyle('mapbox://styles/mapbox/' + this.panel.mapStyle).on('style.load', () => {
        this.updateGeoDataFeatures();
        this.render();
      });
    }
  }

  loadGeo(reload) {
    if (this.map && !reload) {
      return;
    }

    if (this.panel.snapshotLocationData) {
      this.geo = this.panel.snapshotLocationData;
      return;
    }

    if (this.panel.geo.location === 'url') {
      if (!this.panel.geo.contents) {
        return;
      }
      window.$.ajax({
        type: 'GET',
        url: this.panel.geo.contents + '?callback=?',
        contentType: 'application/json',
        jsonpCallback: this.panel.geo.callback,
        dataType: 'jsonp',
        success: (res) => {
          console.log('downloaded geojson');
          this.geo = res;
          this.updateGeoDataFeatures();
          this.render();
        }
      }).fail((res) => {
        console.log('error in ajax: ', res);
        this.geo = null;
        this.render();
      });
    } else if (this.panel.geo.location === 'text') {
      // nothing
    }
  }

  onPanelTeardown() {
    if (this.map) this.map.remove();
  }

  onInitEditMode() {
    console.log('init edit mode');
    this.addEditorTab('GeoLoop', 'public/plugins/citilogics-geoloop-panel/partials/editor.html');
  }

  onDataReceived(dataList) {
    // console.log('ctrl recieved data: ', dataList);
    if (!dataList) return;

    if (this.dashboard.snapshot && this.geo) {
      this.panel.snapshotLocationData = this.geo;
    }

    this.series = dataList.map(this.seriesHandler.bind(this));
    // console.log('series: ', this.series);
    this.dataCharacteristics = this.dataFormatter.getCharacteristics();
    this.updateRamp();
    this.updateGeoDataFeatures();
    this.render();
  }

  onDataSnapshotLoad(snapshotData) {
    this.onDataReceived(snapshotData);
  }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  setZoom() {
    this.map.setZoom(this.panel.initialZoom || 1);
  }

  toggleLegend() {
    this.render();
  }

  updateGeoDataFeatures() {
    if (!this.geo || !this.geo.features) {
      console.log('no geo or no features');
      return;
    }
    if (this.map && this.map.map.getSource('geo')) {
      // console.log('geojson source found. removing...');
      this.map.map.removeSource('geo');
    }

    // clear timeseries data from geojson data
    this.dataCharacteristics.timeValues.forEach((tv) => {
      this.geo.features.forEach((feature) => {
        const fname = 'f-' + tv;
        if (feature.properties && feature.properties[fname]) {
          delete feature.properties[fname];
        }
      });
    });


    // organize the series data - using the "tag" user has selected for correspondence with feature.id:
    const keyedSeries = {};
    const geoKeySearch = this.panel.geoIdTag + ':';
    const reStr = geoKeySearch + ' ([^,}]+)';
    const reg = new RegExp(reStr);
    this.series.forEach((series) => {
      // expect series.alias to be of the form --> "measure.aggregator {tagKey: tagVal, tagKey: tagVal}"
      const matches = series.alias.match(reg);
      // console.log('matches: ', matches);
      if (matches && matches.length > 1) {
        keyedSeries[matches[1]] = series;
      }
    });

    // console.log('features: ', this.geo.features);
    // console.log('keyed series: ', keyedSeries);

    // put data into features.
    this.geo.features.forEach((feature) => {
      if (!feature.properties) {
        feature.properties = {};
      }
      // this funny business below deserializes the dot-notation path name and resolves the feature id
      // the user has specified.
      const featureId = this.panel.geoIdPath.split('.').reduce((obj, key) => obj[key], feature);
      if (featureId in keyedSeries) {
        const series = keyedSeries[featureId];
        series.datapoints.forEach((point) => {
          const time = point[1];
          const val = point[0];
          feature.properties['f-' + time] = val;
        });
      }
    });

    if (this.geo && this.map) {
      console.log('adding geojson source...');
      this.map.map.addSource('geo', {
        type: 'geojson',
        data: this.geo
      });
    }
    else {
      console.log('not adding source because no map');
    }
  }


  updateRamp() { // dc :: data characteristics (dc{timeValues, min, max})
    const dc = this.dataCharacteristics;
    if (this.panel.colorRamp.codeTo === 'fixed') {
      this.panel.colorInterpolator = () => { return this.panel.colorRamp.fixedValue; };
    } else {
      const inputRange = this.panel.colorRamp.auto ? [dc.min, dc.max] : [this.panel.colorRamp.minValue, this.panel.colorRamp.maxValue];
      const theRamp = this.opts.colorRamps[this.panel.colorRamp.scaleName];
      // console.log('color ramp name: ', this.panel.colorRamp.scaleName);
      // console.log('color ramp: ', theRamp);
      this.panel.colorInterpolator = d3.scaleSequential().domain(inputRange).interpolator(theRamp);
    }

    if (this.panel.sizeRamp.codeTo === 'fixed') {
      this.panel.sizeInterpolator = () => { return this.panel.sizeRamp.fixedValue; };
    } else {
      const px = this.panel.sizeRamp.auto ? [dc.min, dc.max] : [this.panel.sizeRamp.minValue, this.panel.sizeRamp.maxValue];
      const py = [this.panel.sizeRamp.min, this.panel.sizeRamp.max];
      this.panel.sizeInterpolator = (val) => { return py[0] + (((val - px[0]) * (py[1] - py[0])) / (px[1] - px[0])); };
    }
  }


/* eslint class-methods-use-this: 0 */
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }
}

GeoLoopCtrl.templateUrl = 'module.html';
