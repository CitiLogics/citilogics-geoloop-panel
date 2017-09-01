'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [],
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

      DataFormatter = function () {
        function DataFormatter(ctrl, kbn) {
          _classCallCheck(this, DataFormatter);

          this.ctrl = ctrl;
          this.kbn = kbn;
        }

        _createClass(DataFormatter, [{
          key: 'getCharacteristics',
          value: function getCharacteristics() {
            var timeValues = new Set();
            var min = 0;
            var max = 0;

            if (this.ctrl.series && this.ctrl.series.length > 0 && this.ctrl.series[0].length === 2) {
              var point = this.ctrl.series[0][0];
              min = point;
              max = point;
            }

            if (this.ctrl.series && this.ctrl.series.length > 0) {
              this.ctrl.series.forEach(function (series) {
                min = series.stats.min < min ? series.stats.min : min;
                max = series.stats.max > max ? series.stats.max : max;
                series.datapoints.forEach(function (pt) {
                  timeValues.add(pt[1]);
                });
              });
            }
            var dc = {
              timeValues: Array.from(timeValues).sort(),
              min: min,
              max: max
            };

            console.log('data characteristics: ', dc);
            return dc;
          }
        }]);

        return DataFormatter;
      }();

      _export('default', DataFormatter);
    }
  };
});
//# sourceMappingURL=data_formatter.js.map
