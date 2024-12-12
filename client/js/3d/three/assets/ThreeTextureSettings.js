import {pipelineAPI} from "../../../application/utils/DataUtils.js";

class ThreeTextureSettings {
    constructor(id, config, callback) {

        this.id = id;
        this.config = {};

        let assetLoaded = function(src, asset) {
       //         console.log('TEXTURE_SETTINGS_',src, asset);
            for (let key in asset.config) {
                this.config[key] = asset.config[key];
            }
            callback(this)
        }.bind(this);

        pipelineAPI.cacheCategoryKey('CONFIGS', 'TEXTURE_SETTINGS_'+id, assetLoaded);

    };

}

export { ThreeTextureSettings }