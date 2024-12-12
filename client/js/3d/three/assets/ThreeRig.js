import {pipelineAPI} from "../../../application/utils/DataUtils.js";

class ThreeRig {
    constructor(id, config, callback) {

        let _this = this;

        let assetLoaded = function(src, asset) {
            //        console.log(src, asset);
            _this.joints = asset.config.joints;
            _this.animations = asset.config.animations;
            callback(asset.config);
        };

        pipelineAPI.cacheCategoryKey('CONFIGS', 'RIGS_'+id, assetLoaded);
    };
}

export { ThreeRig };