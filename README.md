![Overview](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/rain.gif)


## GeoLoop Panel Plugin for Grafana

The GeoLoop Panel is a simple visualizer for joining GeoJSON to Time Series data, and animating the geo features in a loop. You can link Polygon, Point, or Line attributes to dynamic data fetched through Grafana. An example use might be to visualize the hourly varying temperature at land-based weather stations across the country, or to view the evolution of water quality along a stream or tributary. The image above is showing the rate of rainfall during a 5-hour storm passing over Cincinnati, Ohio, in March of 2017.

Ready to get going? If you know how to use GeoJSON and InfluxDB, then you're most of the way there.

- Wrap up your GeoJSON in a callback: `geo({ "type": "FeatureCollection", ... });` and put it on a server somewhere.
- Make sure that each GeoJSON feature has some property value that corresponds to some tag in your InfluxDB.
- Get a free [MapBox API Key](https://www.mapbox.com/developers/).

## Simple Example

Say you're using InfluxDB's [sample data set](https://docs.influxdata.com/influxdb/v1.3/query_language/data_download/). Your query might look like this:

![Metrics Setup](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/timeseries-query.png)

Notice the `GROUP BY tag(location)`? That's super important. It's what causes the data source to spit out the series alias in the format `index.mean {location:coyote_creek}` - otherwise the location would be hidden, aggregated, or otherwise lost.

Now, hop over to the "GeoLoop" tab.

![Options Setup](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/geoloop-options.png)

### Map Options
This is where you enter your MapBox API key, set the default center/zoom for the map view, and configure the data/viz options.

### Map Data Options
Your GeoJSON must be downloadable as JSONP - that is, within a callback. Enter the URL and callback name here. Also enter the Time Series tag that will be used to coordinate between the Series and the GeoJSON Features. Specify which type of feature you want to visualize (Line, Point, or Polygon). The map will filter those features and only show the type you specify.

Use the "GeoJSON ID Path" to designate the dot-separated key path of your GeoJSON Features that correspond to the tag you're referencing from the Time Series location tag. For example, if your features have a path `properties.FEATURE_ID` that references the same value you expect from the Time Series location tag, then enter that here.

### Visualization Options
Here is where you configure the animated display preferences. Do you want the Lines/Points to vary in size? What about color? These Options are here.

### Animation Speed / Looping Options
Not yet implemented. Have something to contribute? PRs are welcome!

### Special Notes
This work borrows heavily from the great work in `grafana-worldmap-panel`. While both plugins display maps, this one was developed specifically to play an animation of how geographic properties change over time.
