var service = require("../../index");
function ErrorHandler(err) {
    console.log('Seneca got error:' + err.message)
    // return false so that seneca will continue throw the error to promise chain
    return false
}

service.configure({
    SERVICE_NAME: 'testService',
    serverConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        pin: 'module:b',
        timeout: 9999,
        // // handle all errors in both server and clients
        errhandler: ErrorHandler
    },
    clientConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        // log: 'print',
        timeout: 9999
    }
});


service.registerAuthzData({
    'testService': {
        '*': true
    }
})

// server init
service.include('../benchmark-service.js')

service.listen().then(function () {
    console.log('Server has been started')
})
