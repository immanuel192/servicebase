module.exports = {
    ServiceBaseShouldBeConfigureBeforeIncludeAllPlugins: 'Service Base should be configured before include all plugins'
    , PinMissing: 'Server config PIN is missing'
    , CmdMissing: 'Action should has cmd in it\'s pattern'
    , ModuleNameMissing: 'Module name should not be a empty string'
    
    
    /** For Authorization */
    , AuthModuleNameMissing: 'Module name should not be a empty string'
    , AuthNameMissing: 'Command name should not be a empty string'
    , AuthConfigShouldHaveServiceName: 'Config should have Service Name'
    
    /********** For Consul */
    , ConsulClientShouldBeInitFirst: 'Consult Client should be initialized'
    , ConsulKVValueNotWellFormat : 'Value received from Consul does not well formated'
}