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
        var url = 'http://opendata.cbs.nl/ODataApi/odata/'+id+'/TypedDataSet'; // 
  
        request.get(url, function(e, res){
          var json = JSON.parse(res.body);
          debugger;
          var geojson = {
            type: 'FeatureCollection',
            features: []
          };
		  for (var i = 0; i< json.value.length; i++){
			  var f = {
              type: 'Feature',
              properties: {
                
              }, 
              geometry: {
                type: 'Point',
                coordinates: [1/(i+1), 1/(i+1)]
              }
            }
			f.properties = json.value[i];
			geojson.features.push(f);
		  }
		  
  
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
  // drops the item from the cache
  cbs.drop = function( id, options, callback ){
    var type = 'CBS';
    koop.Cache.remove(type, id, options, function(err, res){
		callback(err, true);      
    });
  };

  return cbs;

};

module.exports = CBS;
