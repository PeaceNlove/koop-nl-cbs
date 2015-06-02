var request = require('request');

var CBS = function( koop ){

  var cbs = {};
  cbs.__proto__ = koop.BaseModel( koop );

  cbs.find = function( id, options, callback ){

    var type = 'CBS';
    
    // check the cache for data with this type & id 
    koop.Cache.get( type, id, options, function(err, entry ){
      if ( err){
        // if we get an err then get the data and insert it 
        var url = 'http://...'+id; // <-- change this to point to a real URL
  
        request.get(url, function(e, res){
          //var json = JSON.parse(res.body);
          // do something; turn json into GeoJSON
          // fake some geojson data for the sake of example
          var geojson = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {
                prop1: true
              }, 
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              }
            }]
          };
  
          // insert data into the cache; assume layer is 0 unless there are many layers (most cases 0 is fine)  
          koop.Cache.insert( type, id, geojson, 0, function( err, success){
            if ( success ) {
              callback( null, geojson );
            }
          });
        });
      } else {
        callback( null, entry );
      }
    });
  };

  return cbs;

};

module.exports = CBS;
