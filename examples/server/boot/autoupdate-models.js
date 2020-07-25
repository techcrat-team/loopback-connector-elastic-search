'use strict';

const async = require('async');
const datasourceExclusionList = ['memory', 'elasticsearch-plain'];

module.exports = function (app, cb) {

  let modelsToUpdate = [];
  function updateModel(model, callback) {
    app.models[model].getDataSource().autoupdate(model, function (err, data) {
      if (err) {
        console.error('An error occured while updating model ' + model);
        console.error(err);
        return callback(err);
      } else {
        console.log('Auto updated model ' + model);
        return callback();
      }
    });
  }

  for (var key in app.models) {
    if (app.models[key].getDataSource() &&
      app.models[key].getDataSource().connector &&
      datasourceExclusionList.indexOf(app.models[key].getDataSource().connector.name) == -1) {
      modelsToUpdate.push(key);
    }
  }

  async.eachSeries(modelsToUpdate, updateModel, function (error) {
    if (error) {
      cb(error);
    }
    cb();
  });

};
