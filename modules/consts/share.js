/**
 * Database type constant
 */
module.exports = {
    /**
     * Default pin property name
     */
    PIN: 'module',
    SERVICE_NAME: 'SERVICE_NAME',
    
    // For Authorization
    /**
     * Preresented all items can be check for authorization
     */ 
    AUTHZ_WILDCAT_ALL: '*',
    /*
    Only allow if authenticated
    */
    AUTHZ_ALLOW_IF_AUTHENTICATED: 'auth',

    // For Transport
    TRANSPORT_AMQP: 'amqp',
    
    // For database dialect
    DIALECT_POSTGRES: 'postgres',
    DIALECT_SQLITE: 'sqlite'
}