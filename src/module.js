/* eslint import/no-extraneous-dependencies: 0 */
import {loadPluginCss} from 'app/plugins/sdk';
import GeoLoopCtrl from './geoloop_ctrl';

loadPluginCss({
  dark: 'plugins/grafana-geoloop/css/geoloop.dark.css',
  light: 'plugins/grafana-geoloop/css/geoloop.light.css'
});

/* eslint import/prefer-default-export: 0 */
export {
  GeoLoopCtrl as PanelCtrl
};
