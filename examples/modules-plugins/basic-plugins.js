const MODULE_NAME = 'basic-plugin'
const MODULE_TAG = 'tag1'

module.exports = function moduleBenchmarkService(options) {
    /**
     * @type {SenecaJS}
     */
    let seneca = this
	this.setModuleName (MODULE_NAME)

    // any init for this service
    seneca.add({ init: MODULE_NAME, tag: MODULE_TAG }, function (args, cb) {
        console.log(MODULE_NAME + ' init has been called')
        cb()
    })

	seneca.addService( 'cmd:second-test', function (args, done) {
        // return done(new Error('test error'))
        var when = Date.now()
        var dt = when - args.t1
        console.log("cmd:second-test ; with i = " + args.zed + "; delta t = " + dt + "; t1 = " + args.t1 + " ; t2= " + when);
        done(null, { t1: args.t1, zed: args.zed, bar: args.zed + 1, when: when })
    })

    // return the meta info to seneca
    return {
        name: MODULE_NAME,
        tag: MODULE_TAG
    }
}