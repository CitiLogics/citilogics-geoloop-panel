'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'app/core/core', 'lodash', './libs/d3', './map_renderer', './data_formatter', './css/geoloop-panel.css!'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, TimeSeries, kbn, contextSrv, _, d3, mapRenderer, DataFormatter, _createClass, panelDefaults, GeoLoopCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreCore) {
      contextSrv = _appCoreCore.contextSrv;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_libsD) {
      d3 = _libsD;
    }, function (_map_renderer) {
      mapRenderer = _map_renderer.default;
    }, function (_data_formatter) {
      DataFormatter = _data_formatter.default;
    }, function (_cssGeoloopPanelCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      panelDefaults = {
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
        }
      };

      GeoLoopCtrl = function (_MetricsPanelCtrl) {
        _inherits(GeoLoopCtrl, _MetricsPanelCtrl);

        function GeoLoopCtrl($scope, $injector, contextSrv) {
          _classCallCheck(this, GeoLoopCtrl);

          var _this = _possibleConstructorReturn(this, (GeoLoopCtrl.__proto__ || Object.getPrototypeOf(GeoLoopCtrl)).call(this, $scope, $injector));

          _this.dataCharacteristics = {};

          _this.opts = {
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
          _.defaults(_this.panel, panelDefaults);
          _.defaults(_this.panel, panelDefaults.colorRamp);
          _.defaults(_this.panel, panelDefaults.sizeRamp);
          _.defaults(_this.panel, panelDefaults.geo);
          _this.setMapProviderOpts();

          _this.dataFormatter = new DataFormatter(_this, kbn);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));

          _this.loadGeo();
          _this.lonLatStr = _this.panel.mapCenterLongitude + ',' + _this.panel.mapCenterLatitude;

          //$scope.$root.onAppEvent('show-dash-editor', this.doMapResize());
          //$scope.$root.onAppEvent('hide-dash-editor', this.doMapResize());
          return _this;
        }

        _createClass(GeoLoopCtrl, [{
          key: 'getColorScaleImgUrl',
          value: function getColorScaleImgUrl() {
            return '/public/plugins/citilogics-geoloop-panel/images/colorRamps/' + this.panel.colorRamp.scaleName + '.png';
          }
        }, {
          key: 'getColorNames',
          value: function getColorNames() {
            return Object.keys(this.opts.colorRamps);
          }
        }, {
          key: 'setLocationFromMap',
          value: function setLocationFromMap() {
            var center = this.map.map.getCenter();
            this.panel.mapCenterLongitude = center.lng;
            this.panel.mapCenterLatitude = center.lat;
            this.lonLatStr = this.panel.mapCenterLongitude + ',' + this.panel.mapCenterLatitude;
          }
        }, {
          key: 'setNewMapCenter',
          value: function setNewMapCenter() {
            var coords = this.lonLatStr.split(',').map(function (strVal) {
              return Number(strVal.trim());
            });
            this.panel.mapCenterLongitude = coords[0];
            this.panel.mapCenterLatitude = coords[1];

            this.mapCenterMoved = true;
            this.render();
          }
        }, {
          key: 'hardResetMap',
          value: function hardResetMap() {
            if (this.map) {
              this.map.remove();
            }
            this.map = null;
            this.render();
            this.hardRefresh();
          }
        }, {
          key: 'hardRefresh',
          value: function hardRefresh() {
            this.updateRamp();
            this.loadGeo(true);
          }
        }, {
          key: 'setMapProviderOpts',
          value: function setMapProviderOpts() {
            var _this2 = this;

            if (contextSrv.user.lightTheme) {
              this.saturationClass = '';
            } else {
              this.saturationClass = 'map-darken';
            }

            if (this.map) {
              this.map.stopAnimation();
              this.map.clearFrames();
              this.map.map.setStyle('mapbox://styles/mapbox/' + this.panel.mapStyle).on('style.load', function () {
                _this2.updateGeoDataFeatures();
                _this2.render();
              });
            }
          }
        }, {
          key: 'loadGeo',
          value: function loadGeo(reload) {
            var _this3 = this;

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
                success: function success(res) {
                  console.log('downloaded geojson');
                  _this3.geo = res;
                  _this3.updateGeoDataFeatures();
                  _this3.render();
                }
              }).fail(function (res) {
                console.log('error in ajax: ', res);
                _this3.geo = null;
                _this3.render();
              });
            } else if (this.panel.geo.location === 'text') {
              // nothing
            }
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
            if (this.map) this.map.remove();
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            console.log('init edit mode');
            this.addEditorTab('GeoLoop', 'public/plugins/citilogics-geoloop-panel/partials/editor.html');
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
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
        }, {
          key: 'onDataSnapshotLoad',
          value: function onDataSnapshotLoad(snapshotData) {
            this.onDataReceived(snapshotData);
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'setZoom',
          value: function setZoom() {
            this.map.setZoom(this.panel.initialZoom || 1);
          }
        }, {
          key: 'toggleLegend',
          value: function toggleLegend() {
            this.render();
          }
        }, {
          key: 'updateGeoDataFeatures',
          value: function updateGeoDataFeatures() {
            var _this4 = this;

            if (!this.geo || !this.geo.features) {
              console.log('no geo or no features');
              return;
            }
            if (this.map && this.map.map.getSource('geo')) {
              // console.log('geojson source found. removing...');
              this.map.map.removeSource('geo');
            }

            // clear timeseries data from geojson data
            this.dataCharacteristics.timeValues.forEach(function (tv) {
              _this4.geo.features.forEach(function (feature) {
                var fname = 'f-' + tv;
                if (feature.properties && feature.properties[fname]) {
                  delete feature.properties[fname];
                }
              });
            });

            // organize the series data - using the "tag" user has selected for correspondence with feature.id:
            var keyedSeries = {};
            var geoKeySearch = this.panel.geoIdTag + ':';
            var reStr = geoKeySearch + ' ([^,}]+)';
            var reg = new RegExp(reStr);
            this.series.forEach(function (series) {
              // expect series.alias to be of the form --> "measure.aggregator {tagKey: tagVal, tagKey: tagVal}"
              var matches = series.alias.match(reg);
              // console.log('matches: ', matches);
              if (matches && matches.length > 1) {
                keyedSeries[matches[1]] = series;
              }
            });

            // console.log('features: ', this.geo.features);
            // console.log('keyed series: ', keyedSeries);

            // put data into features.
            this.geo.features.forEach(function (feature) {
              if (!feature.properties) {
                feature.properties = {};
              }
              // this funny business below deserializes the dot-notation path name and resolves the feature id
              // the user has specified.
              var featureId = _this4.panel.geoIdPath.split('.').reduce(function (obj, key) {
                return obj[key];
              }, feature);
              if (featureId in keyedSeries) {
                var series = keyedSeries[featureId];
                series.datapoints.forEach(function (point) {
                  var time = point[1];
                  var val = point[0];
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
            } else {
              console.log('not adding source because no map');
            }
          }
        }, {
          key: 'updateRamp',
          value: function updateRamp() {
            var _this5 = this;

            // dc :: data characteristics (dc{timeValues, min, max})
            var dc = this.dataCharacteristics;
            if (this.panel.colorRamp.codeTo === 'fixed') {
              this.panel.colorInterpolator = function () {
                return _this5.panel.colorRamp.fixedValue;
              };
            } else {
              var inputRange = this.panel.colorRamp.auto ? [dc.min, dc.max] : [this.panel.colorRamp.minValue, this.panel.colorRamp.maxValue];
              var theRamp = this.opts.colorRamps[this.panel.colorRamp.scaleName];
              // console.log('color ramp name: ', this.panel.colorRamp.scaleName);
              // console.log('color ramp: ', theRamp);
              this.panel.colorInterpolator = d3.scaleSequential().domain(inputRange).interpolator(theRamp);
            }

            if (this.panel.sizeRamp.codeTo === 'fixed') {
              this.panel.sizeInterpolator = function () {
                return _this5.panel.sizeRamp.fixedValue;
              };
            } else {
              var px = this.panel.sizeRamp.auto ? [dc.min, dc.max] : [this.panel.sizeRamp.minValue, this.panel.sizeRamp.maxValue];
              var py = [this.panel.sizeRamp.min, this.panel.sizeRamp.max];
              this.panel.sizeInterpolator = function (val) {
                return py[0] + (val - px[0]) * (py[1] - py[0]) / (px[1] - px[0]);
              };
            }
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            mapRenderer(scope, elem, attrs, ctrl);
          }
        }]);

        return GeoLoopCtrl;
      }(MetricsPanelCtrl);

      _export('default', GeoLoopCtrl);

      GeoLoopCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=geoloop_ctrl.js.map
