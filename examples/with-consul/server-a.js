var service = require("../../index");
function ErrorHandler(err) {
    console.log('Seneca got error:' + err.message)
    // return false so that seneca will continue throw the error to promise chain
    return false
}

// before start, let set consul setting to ENV 
process.env.SERVICE_NAME = 'MyService'
process.env.PROJECT_NAME = 'MyProject'
process.env.CONSUL_HOST = 'rabbitmq-server'
process.env.CONSUL_PORT = 8500

var serverExtraConfig = {
    serverConfig: {
        errhandler: ErrorHandler
    }
}
var consulOptions = {
    secure: false,
    ca: undefined
}

service.autostart(consulOptions, serverExtraConfig)
    .then(function () {
        // server init
        service.include('../benchmark-service.js')
    })
    .then(function () {
        console.log('Server has been started')
    })
