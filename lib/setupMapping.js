'use strict';

var _ = null;
var log = null;
var Promise = null;

var setupMapping = function (modelName) {
  if(!modelName) {
    return Promise.reject('missing modelName');
  }
  var self = this;
  var db = self.db;
  var settings = self.settings;

  // validate that a `mapping` for the `modelName` has been provided in datasource.<env>.json
  // TODO: key/value pairs in `mappings` where modelName is the key,
  //       may be more useful ... rather than `mappings` as an array of objects in datasource.<env>.json
  // var mappingsFromDatasource = _.filter(settings.mappings, function(mapping){
  //   return mapping.name === modelName;
  // });
  // log('ESConnector.prototype.setupMapping', 'mappingsFromDatasource:', mappingsFromDatasource);

  // var mappingFromDatasource;
  // if(mappingsFromDatasource.length === 0) {
  //   log('ESConnector.prototype.setupMapping', 'missing mapping for modelName:', modelName,
  //       ' ... this usecase is legitimate if you want elasticsearch to take care of mapping dynamically');
  //   return Promise.resolve();
  // }
  // else if(mappingsFromDatasource.length > 1) {
  //   return Promise.reject('more than one mapping for modelName:', modelName);
  //   // TODO: dynamic index/type mapping would be better via a dev provided function to determine what to use,
  //   //       if same model is present across different indexes
  // }
  // else {
  //   log('ESConnector.prototype.setupMapping', 'found mapping for modelName:', modelName);
  //   mappingFromDatasource = mappingsFromDatasource[0];
  // }

  var defaults = self.addDefaults(modelName); // NOTE: this is where the magic happens

  /**
  * fetch all es specific model properties
  **/
  var modelClass = self._models[modelName];
  if(!modelClass.settings.elasticsearch) {
    return Promise.reject('missing elasticsearch property on model !');
  }

  var properties = {}
  for (var property in modelClass.properties) {
    if (modelClass.properties[property]['es']) {
      properties[property] = modelClass.properties[property]['es'];
    }
  }
  var putMappingData = {
    body: {
      properties: properties
    }
  }
  _.extend(putMappingData, defaults);

  var modelSpecificSettings = modelClass.settings.elasticsearch.settings || {};
  log('ESConnector.prototype.setupMapping', 'will setup mapping for modelName:', defaults.index);

  //return self.setupIndices(defaults.index)
  return self.setupIndex(defaults.index, modelSpecificSettings)
      .then(function(){
        log('ESConnector.prototype.setupMapping', 'db.indices.putMapping', 'modelName:', modelName, 'start');
        return db.indices.putMapping(putMappingData)
            .then(function (body) {
              log('ESConnector.prototype.setupMapping', 'db.indices.putMapping', 'modelName:', modelName, 'response', body);
              return Promise.resolve();
            }, function (err) {
              log('ESConnector.prototype.setupMapping', 'db.indices.putMapping', 'modelName:', modelName, 'failed', err);
              //console.trace(err.message);
              return Promise.reject(err);
            });
      });
};

module.exports = function(dependencies) {
  log = (dependencies) ? (dependencies.log || console.log) : console.log; /*eslint no-console: ["error", { allow: ["log"] }] */
  _ = (dependencies) ? (dependencies.lodash ||  require('lodash')) : require('lodash');
  Promise = (dependencies) ? (dependencies.bluebird ||  require('bluebird')) : require('bluebird');
  return setupMapping;
};
