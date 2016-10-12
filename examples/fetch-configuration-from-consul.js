var service = require("../index");

service.configure({    
    serverConfig: {
        pin: 'module:a',
        timeout: 9999
    },
    clientConfig: {
        // log: 'print',
        timeout: 9999
    }
});

service.connectConsul({
    keyPrefix : ''
});