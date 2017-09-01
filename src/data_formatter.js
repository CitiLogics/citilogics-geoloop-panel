
export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  getCharacteristics() {
    const timeValues = new Set();
    let min = 0;
    let max = 0;

    if (this.ctrl.series && this.ctrl.series.length > 0 && this.ctrl.series[0].length === 2) {
      const point = this.ctrl.series[0][0];
      min = point;
      max = point;
    }

    if (this.ctrl.series && this.ctrl.series.length > 0) {
      this.ctrl.series.forEach((series) => {
        min = (series.stats.min < min) ? series.stats.min : min;
        max = (series.stats.max > max) ? series.stats.max : max;
        series.datapoints.forEach((pt) => {
          timeValues.add(pt[1]);
        });
      });
    }
    const dc = {
      timeValues: Array.from(timeValues).sort(),
      min: min,
      max: max
    };

    console.log('data characteristics: ', dc);
    return dc;
  }
}
