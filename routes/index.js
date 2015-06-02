// Defines the routes and params name that will be passed in req.params 
// routes tell Koop what controller method should handle what request route

module.exports = {
  // route : handler
  'get /cbs': 'index',
  'get /cbs/:id': 'get',
  'get /cbs/:id/FeatureServer': 'featureserver'
}
