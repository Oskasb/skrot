class ThreeModelSettings {
    constructor(id, config, callback) {

        //    console.log("new ThreeModelSettings", id, config, callback)

        let assetLoaded = function(src, asset) {
            //        console.log(src, asset);
            this.settings = asset.config;
            callback(this);
        }.bind(this);

        PipelineAPI.cacheCategoryKey('CONFIGS', 'MODEL_SETTINGS_'+id, assetLoaded);

    };
}

export { ThreeModelSettings };