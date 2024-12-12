import {pipelineAPI} from "../../../application/utils/DataUtils.js";

class ThreeModelSettings {
    constructor(id, config, callback) {

        //    console.log("new ThreeModelSettings", id, config, callback)

        let assetLoaded = function(src, asset) {
            //        console.log(src, asset);
            this.settings = asset;
            callback(this);
        }.bind(this);

        pipelineAPI.cacheCategoryKey('CONFIGS', 'MODEL_SETTINGS_'+id, assetLoaded);

    };
}

export { ThreeModelSettings };