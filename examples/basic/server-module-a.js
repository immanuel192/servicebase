var service = require("../../index");
function ErrorHandler(err) {
    console.log('Seneca got error:' + err.message)
    // return false so that seneca will continue throw the error to promise chain
    return false
}

service.configure({
    transport: {
    },
    serverConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        pin: 'module:a',
        timeout: 9999,
        // // handle all errors in both server and clients
        errhandler: ErrorHandler
    }
})

// server init
service.include('../benchmark-service.js')

service.listen().then(function () {
    console.log('Server has been started')
})
