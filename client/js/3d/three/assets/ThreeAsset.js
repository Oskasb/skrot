import {ExpandingPool} from '../../../application/utils/ExpandingPool.js';
import {InstancedModel} from './InstancedModel.js';


class ThreeAsset  {
    constructor(assetId, assetReadyCallback) {
        this.datakey = 'MODELS_';
        this.id = assetId;

        let instantiateAsset = function(assetId, callback) {
            let modelInstance = new InstancedModel(this);
            modelInstance.assetId = assetId;
            modelInstance.initModelInstance(callback, modelInstance);
        }.bind(this);

        this.expandingPool = new ExpandingPool(this.id, instantiateAsset);
        this.initAssetConfigs(assetId, assetReadyCallback, this);
    };

    initAssetConfigs = function(assetId, cb, _this) {

        let assetLoaded = function(asset) {
            _this.finaliseAsset(asset, cb)
        };

        ThreeAPI.loadThreeAsset(this.datakey, assetId, assetLoaded);

    };

    finaliseAsset = function(model, cb) {

        this.model = model;
        cb(this);
    };

    instantiateAsset = function(callback) {
        this.expandingPool.getFromExpandingPool(callback);
    };

    disableAssetInstance = function(modelInstance) {
        modelInstance.detatchAllAttachmnets();

        if (modelInstance.assetId !== this.id) {
            console.log("wrong ID returned", modelInstance, this);
            return;
        }

        this.expandingPool.returnToExpandingPool(modelInstance);
        client.dynamicMain.removeFromInstanceIndex(modelInstance)

    };

    getActiveCount() {
        return this.expandingPool.count.active;
    }

}

export { ThreeAsset };