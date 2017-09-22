![Overview](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/rain.gif)


## GeoLoop Panel Plugin for Grafana

The GeoLoop Panel is a simple visualizer for joining GeoJSON to Time Series data, and animating the geo features in a loop. You can link Polygon, Point, or Line attributes to dynamic data fetched through Grafana. An example use might be to visualize the hourly varying temperature at land-based weather stations across the country, or to view the evolution of water quality along a stream or tributary. The image above is showing the rate of rainfall during a 5-hour storm passing over Cincinnati, Ohio, U.S., in March of 2017.

Ready to get going? If you know how to use GeoJSON and InfluxDB, then you're most of the way there.

- Wrap up your GeoJSON in a callback: `geo({ "type": "FeatureCollection", ... });` and put it on a server somewhere.
- Make sure that each GeoJSON feature has some property value that corresponds to some tag value in your InfluxDB.
- Get a free [MapBox API Key](https://www.mapbox.com/developers/).

__But wait, where do I get/host some GeoJSON?__

You could GoogBingSearch(tm) for your relevant GIS data set, in GeoJSON format. [Here is a set of files](http://eric.clst.org/Stuff/USGeoJSON) for US states, counties, and congressional districts. If you have shapefiles, you can convert using the [OGR tools in GDAL](http://www.gdal.org/ogr2ogr.html). If your geography is not too complicated an you want to make your own, use something like [geojson.io](http://geojson.io/#map=2/20.0/0.0). For serving the GeoJSON data to GeoLoop, you could use [Caddy](https://caddyserver.com), or use a very simple [Nginx docker container](https://hub.docker.com/_/nginx/) to serve the file. Whatever you do, just remember to wrap the entire `FeatureCollection` in a callback to get around CORS.

## Simple Example

Say you're using InfluxDB's [sample data set](https://docs.influxdata.com/influxdb/v1.3/query_language/data_download/). Your query might look like this:

![Metrics Setup](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/timeseries-query.png)

Notice the `GROUP BY tag(location)`? That's super important. It's what causes the data source to spit out the series alias in the format `index.mean {location:coyote_creek}` - otherwise the location would be hidden, aggregated, or otherwise lost. On a related note, please observe that the `ALIAS` field is empty. If we have an alias, then the data given to GeoLoop will loose the tagging we just discussed. Don't fall into this trap! GeoLoop needs the series to be separated into tags, and for those tags to be intact in the series metadata. If you _must_ use an alias, then make sure that you reproduce the tag formatting so GeoLoop can pick up the value of the location tag: `ALIAS: $m.myAlias {location:$tag_myLocationTag}`.

Now, hop over to the "GeoLoop" tab.

![Options Setup](https://raw.githubusercontent.com/CitiLogics/citilogics-geoloop-panel/master/src/images/geoloop-options.png)

### Map Options
This is where you enter your MapBox API key, set the default center/zoom for the map view, and configure the data/viz options.

### Map Data Options
Your GeoJSON must be downloadable as (Geo)JSONP - that is, within a callback. Enter the URL and callback name here. Also enter the Time Series tag that will be used to coordinate between the Series and the GeoJSON Features. Specify which type of feature you want to visualize (Line, Point, or Polygon). The map will filter those features and only show the type you specify.

Use the "GeoJSON ID Path" to designate the dot-separated key path of your GeoJSON Features that correspond to the tag you're referencing from the Time Series location tag. If your features have a path `properties.FEATURE_ID` that references the same value you expect from the Time Series location tag, then enter that here. For example, suppose we are working with the 344 climate divisions in the [U.S. Climate Divisional Dataset](https://www.ncdc.noaa.gov/monitoring-references/maps/us-climate-divisions.php). If our GeoJSON data were of the format:

```
{ "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "STATE": "New Mexico",
        "STATE_CODE": 29,
        "CLIMDIV": 2905,
        "NAME": "CENTRAL VALLEY",
        ...
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [ -105.87799800030689, 33.24399899955506 ],
            [ -105.98500100019538, 33.269000999597324 ],
            ...
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "STATE": "New Mexico",
        "STATE_CODE": 29,
        "CLIMDIV": 2906,
        "NAME": "CENTRAL HIGHLANDS",
        ...
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [ -105.14900200004166, 32.63999899975494 ],
            [ -105.22300000044908, 32.5630000003506 ],
            ...
          ]
        ]
      }
    },
    ...
  ]
}
```

... we will want to carefully notice that the path to the identifier we are interested in (_relative to each feature_) is `properties.CLIMDIV` - that is, for each Geo feature, there is a `properties` object, and that object has a nested `CLIMDIV` that will match an identifier in our timeseries database. On that note, let's further assume that we expect data coming from our timeseries database to have the tag `clim_div` relating to the climate division number for the series, like so:

```
temperature,units=degrees_f,clim_div=2905
temperature,units=degrees_f,clim_div=2906
...
```

... then our setup would look like the following:

| Tab      | Setting                              | Value                |
| -------- | ------------------------------------ | -------------------- |
| Metrics  | GROUP BY                             | `tag(clim_div)`      |
| GeoLoop  | Map Data Options > Series GeoID Tag  | `properties.CLIMDIV` |

GeoLoop will join the query results up with the GeoJSON data based on these two settings.


### Visualization Options
Here is where you configure the animated display preferences. Do you want the Lines/Points to vary in size? What about color? These Options are here.

### Animation Speed / Looping Options
Not yet implemented. Have something to contribute? PRs are welcome!

### Special Notes
This work borrows heavily from the great work in `grafana-worldmap-panel`. While both plugins display maps, this one was developed specifically to play an animation of how geographic properties change over time.
