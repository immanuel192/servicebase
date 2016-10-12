/** global _ assert */
'use strict';
const _ = require('lodash')
let _models = []

/**
 * To keep track any domain models which is not yet initialized yet
 */
class ModelManager {
    /**
     * Register models
     */
    registerModel(models){
        _.each(models, function addingModel (v){
            _models.push(_.clone(v))
        })
    }

    getModels(){
        return _models
    }
}

module.exports = new ModelManager()