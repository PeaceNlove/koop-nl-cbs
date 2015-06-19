var request = require('request');
var pg = require('pg');
var sm = require('sphericalmercator');
var merc = new sm( { size:256 } );
var config = require('./config.js');

var CBS = function(koop){
  var cbs = {};
  cbs.__proto__ = koop.BaseModel( koop );
  cbs.client = new pg.Client(config.cbsdb);
  cbs.client.connect(function(err) {
    if(err) {
      console.error('could not connect to postgres', err);
    }
  });
  cbs.find = function( id, time, options, callback ){
	
	if (id===undefined || time===undefined){
		callback("Id or time not defined", null);	
	}
	else{
    var type = 'CBS';
    var cacheId = id+":"+time;
    // check the cache for data with this type & id 
    koop.Cache.get( type, cacheId, options, function(err, entry ){
      if ( err){
        // if we get an err then get the data and insert it 
		var url='http://opendata.cbs.nl/ODataApi/odata/'
		var query = 'SELECT *, ST_AsGeoJson(ST_Transform(geom,4326)) as geometry from "nl-cbs-admin"';   
		cbs.client.query(query, function(err, result) {			
		  if(err) {
			callback( err, null);
		  } else {
			  var geojson = {type: 'FeatureCollection', features: []};
			  var resultgeojson = {type: 'FeatureCollection', features: []};
			  cbs.getTypedDataset(url, id, time,  function(e, json){
				  debugger;
				  			  
				  for (var i = 0; i< json.value.length; i++){
					  var code = json.value[i].RegioS;
					  for (var j = 0; j<geojson.features.length; j++){
						  var regiocode = geojson.features[j].properties.code;
						  if (code===regiocode){
							  debugger;
							  for (var property in json.value[i]){
								  geojson.features[j].properties[property] = json.value[i][property];
							  }
							  delete geojson.features[j].properties.id;
							  delete geojson.features[j].properties.ID;
							  resultgeojson.features.push(geojson.features[j]);
							  break;
						  }
					  }
				  }
				  
		  
				  // insert data into the cache; assume layer is 0 unless there are many layers (most cases 0 is fine)  
				  koop.Cache.insert( type, cacheId, resultgeojson, 0, function( err, success){
					if ( success ) {
					  callback( null, resultgeojson );
					}
				  });
			});			
			var feature, geom;
			result.rows.forEach(function(row){
			  geom = JSON.parse(row.geometry);
			  
			  feature = {properties: row, geometry: geom, type: 'Feature'};
			  delete feature.properties.geom;
			  delete feature.properties.geometry;
			
			  geojson.features.push(feature);
			  
			});
		  }
		});
  
        
      } else {
        callback( null, entry );
      }
	
    });
	}
  };
  // drops the item from the cache
  cbs.drop = function( id, options, callback ){
    var type = 'CBS';
    koop.Cache.remove(type, id, options, function(err, res){
		callback(err, true);      
    });
  };
  cbs._buildQueryString = function(){
   
    var query = ''; 
    return query;
  };
  cbs.getTypedDataset = function(baseUrl, id, time, callback){
	  var url = 'http://opendata.cbs.nl/ODataApi/odata/'+id+'/TypedDataSet?$filter=Perioden eq \''+time+'JJ00\'';
	  var regiosUrl = 'http://opendata.cbs.nl/ODataApi/odata/'+id+'/RegioS'
	  var response;
	  var count=0;
	  var urls = [];
	  console.log(url);
	  request.get(url, function(e, res){
		  if (res.body.indexOf("Please redefine your query so that it returns less than 10000 records.")>0){
			  //get by region
			  //first, get the regions
			  console.log(regiosUrl);
			  request.get(regiosUrl, function(e,regiosRes){
				  var regios = JSON.parse(regiosRes.body);
				  for (var i = 0; i< regios.value.length; i++){					  
					  var regioDataUrl = 'http://opendata.cbs.nl/ODataApi/odata/'+id+'/TypedDataSet?$filter=Perioden eq \''+time+'JJ00\' and RegioS eq \''+regios.value[i].Key +'\'';
					  urls.push(regioDataUrl);
				  }
				  
				  var makeRequest; 
					  
				  var syncrequestcallback = function(e,regioRes){
					  if (response === undefined){response =JSON.parse(regioRes.body); }
					  else{
						  debugger;
						  try{
							var r = JSON.parse(regioRes.body);
							response = response.value.concat(r.value);
						  }
						  catch(e){
							  
						  }
					  }
					  count++;
					  if (count===regios.value.length){
						  callback(e,response);
					  }
					  else{
						  makeRequest();
						  
					  }
				  }
				  makeRequest = function(){			
					var u = urls.pop();
					console.log(u);
					request.get(u,syncrequestcallback);	
				  }
				  makeRequest();
			  });
		  }
		  else
		  {
			  response = JSON.parse(res.body);	
			  callback(e,response);
		  }
	  });
		//http://opendata.cbs.nl/ODataApi/odata/81575NED/TypedDataSet?$filter=Perioden%20eq%20%272013JJ00%27%20
        //var url = 'http://opendata.cbs.nl/ODataApi/odata/'+id+'/TypedDataSet'; // 
	  
  }

  return cbs;

};

module.exports = CBS;
