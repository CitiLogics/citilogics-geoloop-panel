'use strict';

System.register(['moment', './libs/mapbox-gl', './libs/d3'], function (_export, _context) {
  "use strict";

  var moment, mapboxgl, d3, _createClass, GeoLoop;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_moment) {
      moment = _moment.default;
    }, function (_libsMapboxGl) {
      mapboxgl = _libsMapboxGl.default;
    }, function (_libsD) {
      d3 = _libsD;
    }],
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

      GeoLoop = function () {
        function GeoLoop(ctrl, mapContainer) {
          var _this = this;

          _classCallCheck(this, GeoLoop);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.createMap();
          this.frames = []; // list of timestamps
          this.currentFrameIndex = 0;
          this.animation = {};
          this.pause = false;
          // register button click event
          d3.select('#map_' + this.ctrl.panel.id + '_button').on('click', function () {
            // toggle pause
            _this.pause = !_this.pause;
            if (_this.pause) {
              _this.stopAnimation();
            } else {
              _this.startAnimation();
            }
          });
          // register slider input event
          d3.select('#map_' + this.ctrl.panel.id + '_slider').on('input', function () {
            // pause
            _this.pause = true;
            _this.stopAnimation();
            // set frame to selected date/time
            var targetFrame = parseInt(d3.select('#map_' + _this.ctrl.panel.id + '_slider').property('value'), 10);
            _this.stepFrame(targetFrame);
          });
          // colorbar
          var barColors = this.ctrl.thrRamp(0) + ', ' + this.ctrl.thrRamp(0.1) + ', ' + this.ctrl.thrRamp(0.2) + ', ' + this.ctrl.thrRamp(0.3) + ', ' + this.ctrl.thrRamp(0.4) + ', ' + this.ctrl.thrRamp(0.5) + ', ' + this.ctrl.thrRamp(0.6) + ', ' + this.ctrl.thrRamp(0.7) + ', ' + this.ctrl.thrRamp(0.8) + ', ' + this.ctrl.thrRamp(0.9) + ', ' + this.ctrl.thrRamp(1);
          d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.bar').attr('background', 'linear-gradient(to right, ' + barColors + ')');
          console.log('background', 'linear-gradient(to right, ' + barColors + ')');
          // d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.bar').attr('background', 'linear-gradient(to right, ' + this.ctrl.theRamp(0) + ', ' + this.ctrl.theRamp(1) + ')');
          // d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.bar').background('linear-gradient(to right, ' + [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(this.ctrl.theRamp).join(', ') + ')');
        }

        _createClass(GeoLoop, [{
          key: 'createMap',
          value: function createMap() {
            var _this2 = this;

            console.log('creating mapbox-map');
            var mapCenterLonLat = [parseFloat(this.ctrl.panel.mapCenterLongitude), parseFloat(this.ctrl.panel.mapCenterLatitude)];
            mapboxgl.accessToken = this.ctrl.panel.mbApiKey;
            this.map = new mapboxgl.Map({
              container: this.mapContainer,
              style: 'mapbox://styles/mapbox/' + this.ctrl.panel.mapStyle,
              center: mapCenterLonLat,
              zoom: parseFloat(this.ctrl.panel.initialZoom),
              interactive: this.ctrl.panel.userInteractionEnabled
            });
            // load geo data if there already is some
            this.map.on('load', function () {
              if (_this2.ctrl.geoResult) {
                console.log('loading cached geo data into mapbox-map');
                try {
                  _this2.map.addSource('geo', _this2.ctrl.geoResult);
                } catch (e) {
                  console.log('add source error: ', e);
                }
                _this2.ctrl.geoResult = null; // remove already used data
              }
            });
          }
        }, {
          key: 'createLegend',
          value: function createLegend() {
            this.legend = {};
          }
        }, {
          key: 'needToRedrawFrames',
          value: function needToRedrawFrames() {
            this.legend = {};
            return true;
          }
        }, {
          key: 'drawLayerFrames',
          value: function drawLayerFrames() {
            console.log('drawing layer frames');
            var data = this.ctrl.data;
            if (this.needToRedrawFrames(data)) {
              this.stopAnimation();
              this.clearFrames();
              this.createFrames(data);
              this.startAnimation();
            }
          }
        }, {
          key: 'clearFrames',
          value: function clearFrames() {
            var _this3 = this;

            this.frames.forEach(function (item) {
              try {
                _this3.map.removeLayer('f-' + item);
              } catch (e) {
                // print error, but don't stop
                console.error(e);
              }
            });
            this.frames = [];
          }
        }, {
          key: 'createFrames',
          value: function createFrames() {
            var _this4 = this;

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
              var attemptsLeft = 10;
              var interval = setInterval(function () {
                if (!_this4.map) {
                  console.log('map was unloaded while waiting for geo source');
                  clearInterval(interval);
                } else if (_this4.map.isSourceLoaded('geo')) {
                  console.log('geo source found. Starting to build frames');
                  clearInterval(interval);
                  _this4.createFramesSafely();
                } else {
                  console.log('still no geo source. try to refresh manually?');
                  attemptsLeft -= 1;
                  if (attemptsLeft <= 0) {
                    clearInterval(interval);
                  }
                }
              }, 1000);
            }
          }
        }, {
          key: 'createFramesSafely',
          value: function createFramesSafely() {
            var _this5 = this;

            var sizeIsDynamic = this.ctrl.panel.sizeRamp.codeTo === 'measurement';
            var colorIsDynamic = this.ctrl.panel.colorRamp.codeTo === 'measurement';
            var featureType = this.ctrl.panel.renderType;
            var layerType = this.ctrl.opts.layerTypes[featureType];
            var sizeStops = [[0, 1], [100, 10]];
            var colorStops = [];

            if (sizeIsDynamic) {
              // populate the sizeStops array with the input/output values
              var minInput = 0;
              var maxInput = 1;
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
              var _minInput = 0;
              var _maxInput = 1;
              if (this.ctrl.panel.colorRamp.auto) {
                _minInput = this.ctrl.dataCharacteristics.min;
                _maxInput = this.ctrl.dataCharacteristics.max;
              } else {
                _minInput = parseFloat(this.ctrl.panel.colorRamp.minValue);
                _maxInput = parseFloat(this.ctrl.panel.colorRamp.maxValue);
              }

              var nStops = 25;

              for (var iStop = 0; iStop <= nStops; iStop += 1) {
                var stop = _minInput + iStop / nStops * (_maxInput - _minInput);
                colorStops.push([stop, this.ctrl.panel.colorInterpolator(stop)]);
              }

              // console.log('color stops: ', colorStops);
            }

            this.ctrl.dataCharacteristics.timeValues.forEach(function (time) {
              var frameName = 'f-' + time;
              // create new map layer for this animation frame (name is the time code)
              var pp = {}; // paint properties
              var geoFilter = [];
              if (featureType === 'line') {
                geoFilter = ['==', '$type', 'LineString'];
                pp['line-opacity'] = 0;
                pp['line-opacity-transition'] = { duration: 0 };
                pp['line-width'] = sizeIsDynamic ? {
                  property: frameName,
                  type: 'exponential',
                  stops: sizeStops
                } : parseFloat(_this5.ctrl.panel.sizeRamp.fixedValue);
                pp['line-color'] = colorIsDynamic ? {
                  property: frameName,
                  type: 'exponential',
                  stops: colorStops
                } : parseFloat(_this5.ctrl.panel.colorRamp.fixedValue);
              } else if (featureType === 'point') {
                geoFilter = ['==', '$type', 'Point'];
                pp['circle-opacity'] = 0;
                pp['circle-opacity-transition'] = { duration: 0 };
                pp['circle-radius'] = sizeIsDynamic ? {
                  property: frameName,
                  type: 'exponential',
                  stops: sizeStops
                } : parseFloat(_this5.ctrl.panel.sizeRamp.fixedValue);
                pp['circle-color'] = colorIsDynamic ? {
                  property: frameName,
                  type: 'exponential',
                  stops: colorStops
                } : _this5.ctrl.panel.colorRamp.fixedValue;
              } else if (featureType === 'polygon') {
                geoFilter = ['==', '$type', 'Polygon'];
                pp['fill-opacity'] = 0;
                pp['fill-opacity-transition'] = { duration: 0 };
                pp['fill-color'] = colorIsDynamic ? {
                  property: frameName,
                  type: 'exponential',
                  stops: colorStops
                } : _this5.ctrl.panel.colorRamp.fixedValue;
              }

              _this5.map.addLayer({
                id: 'f-' + time,
                type: layerType,
                source: 'geo',
                paint: pp,
                filter: geoFilter
              });

              _this5.frames.push(time);
            });

            // get slider component, set min/max/value
            d3.select('#map_' + this.ctrl.panel.id + '_slider').attr('min', 0).attr('max', this.frames.length);
            // update colorbar text
            d3.select('#map_' + this.ctrl.panel.id + '_legend').selectAll('.legend_text').html(this.ctrl.inputRange.map(Math.round).join(' - '));
          }
        }, {
          key: 'startAnimation',
          value: function startAnimation() {
            var _this6 = this;

            if (this.animation) {
              this.stopAnimation();
            }

            this.animation = setInterval(function () {
              _this6.stepFrame();
            }, 1000 / this.ctrl.panel.framesPerSecond);
          }
        }, {
          key: 'stopAnimation',
          value: function stopAnimation() {
            clearInterval(this.animation);
            this.animation = null;
          }
        }, {
          key: 'stepFrame',
          value: function stepFrame() {
            var targetFrame = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

            if (!this.map) {
              return;
            }
            if (this.frames.length === 0) {
              // console.log('skipping animation: no frames');
              return;
            }
            var oldFrame = 'f-' + this.frames[this.currentFrameIndex];
            this.currentFrameIndex = targetFrame >= 0 ? targetFrame : this.currentFrameIndex + 1;
            this.currentFrameIndex %= this.frames.length;
            var newFrame = 'f-' + this.frames[this.currentFrameIndex];

            var opacitySelectors = {
              'point': 'circle-opacity',
              'polygon': 'fill-opacity',
              'line': 'line-opacity'
            };
            var selector = opacitySelectors[this.ctrl.panel.renderType];

            this.map.setPaintProperty(newFrame, selector, 1);
            this.map.setPaintProperty(oldFrame, selector, 0);
            var tstamp = this.frames[this.currentFrameIndex] / 1e3;
            var timeStr = moment.unix(tstamp).format(this.ctrl.panel.hideTime ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss');

            // set time string in legend
            d3.select('#map_' + this.ctrl.panel.id + '_date').text(timeStr);
            // set slider position to indicate time-location
            d3.select('#map_' + this.ctrl.panel.id + '_slider').property('value', this.currentFrameIndex);
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.map.resize();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLongitude), parseFloat(this.ctrl.panel.mapCenterLatitude)]);
            this.ctrl.mapCenterMoved = false;
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }, {
          key: 'remove',
          value: function remove() {
            this.stopAnimation();
            // this.clearFrames();  // this is probably not necessary
            if (this.map) {
              this.map.remove();
            }
            this.map = null;
          }
        }]);

        return GeoLoop;
      }();

      _export('default', GeoLoop);
    }
  };
});
//# sourceMappingURL=geoloop.js.map
