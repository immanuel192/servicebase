const _ = require('lodash')
let seneca
let log = _.noop
var services = []

class ServiceManager {
    constructor(senecaHost, logger) {
        assert.notEqual(senecaHost, undefined, 'seneca should be passed as parameter')
        seneca = senecaHost
        log = logger
    }
    /**
     * Add a seneca service into queue
     * @param  {string} pattern
     * @param  {Object} paramspec
     * @param  {function} action
     */
    add(pattern, paramspec, action) {
        services.push({
            pattern: pattern,
            paramspec: paramspec,
            action: action
        })
    }

    clear() {
        services.splice(0, services.length);
    }

    /**
     * Build all services logic into Seneca
     * @param  {seneca} seneca
     */
    build() {
        for (let i = 0; i < services.length; i++) {
            let service = services[i];
            seneca.add(service.pattern, service.paramspec, service.action);
        }
    }
}

module.exports = function (senecaHost, logger) {
    return new ServiceManager(senecaHost, logger)
}