/**
 * Sample seneca service for ServiceBase
 * Notice:
 * - You should register your module name immediately by using this.setModuleName
 * - To log, please use seneca.logger which is injected back to ServiceBase Logging service
 * - To access database, use seneca.DB
 * - To access system config, use seneca.Config
 */
const MODULE_NAME = 'benchmark-service'
const MODULE_TAG = 'tag1'

module.exports = function moduleBenchmarkService(options) {
    /**
     * @type {SenecaJS}
     */
    let seneca = this
    this.setModuleName(MODULE_NAME)

    // any init for this service
    seneca.add({ init: MODULE_NAME, tag: MODULE_TAG }, function (args, cb) {
        console.log(MODULE_NAME + ' init has been called')
        cb()
    })

    // service registration
    seneca.addService('cmd:test,foo:1', function (args, done) {
        // return done(new Error('test error'))
        var when = Date.now()
        var dt = when - args.t1
        console.log("cmd:test; with i = " + args.zed + "; delta t = " + dt + "; t1 = " + args.t1 + " ; t2= " + when);
        seneca
            .actService('cmd:second-test', {
                zed: args.zed,
                t1: Date.now()
            }, args)
            .then(function handleActLocalSuccess(data) {
                let when = Date.now()
                let dt = when - data.t1
                console.log("cmd:test; done -  with i = " + data.zed + "; delta t = " + dt + "; t1 = " + args.t1 + " ; t2= " + when);
                done(null, { t1: args.t1, zed: args.zed, bar: args.zed + 1, when: when })
            })
    })

    // return the meta info to seneca
    return {
        name: MODULE_NAME,
        tag: MODULE_TAG
    }
}