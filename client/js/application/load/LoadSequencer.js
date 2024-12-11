
import {PipelineObject} from "./PipelineObject.js";
class LoadSequencer {
    constructor() {
        this.loadQueue = {}
    }

    sequenceAssetLoad = function(assetStore, assetMap, assetType, assetId, callback) {

        let assetKey = assetType+assetId;

        if (assetStore[assetKey]) {
            callback(assetStore[assetKey])
        }

        let loadQueue = this.loadQueue

        let configLoaded = function(src, data) {

            let acallback = function(asset) {
       //             console.log('asset loaded:', asset, assetKey, assetStore)
                PipelineAPI.setCategoryKeyValue('ASSET', assetKey, asset);
                if ( assetStore[assetKey]) {
                    //       console.log("Asset Already stored...", assetKey)
                } else {
                    assetStore[assetKey] = asset;
                }

            };

            if (assetStore[assetKey]) {
        //             console.log('ALREADY loaded asset:', assetKey, assetStore[assetKey])
                callback(assetStore[assetKey])
            } else {
           //     console.log('load asset:', assetKey)
                let onLoaded = function(asset) {
            //        console.log('onLoaded asset:', asset)
                    acallback(asset);
                    while(loadQueue[assetKey].length) {
                        loadQueue[assetKey].pop()(assetStore[assetKey])
                    }
                }
                if (loadQueue[assetKey]) {
                //    console.log('callback assetMap:', loadQueue)
                    loadQueue[assetKey].push(callback)
                } else {
                    loadQueue[assetKey] = [callback];
                //    console.log('load assetMap:', loadQueue)
                    new assetMap[assetType](assetId, data.config, onLoaded);
                }

            }

        };

        let cachedConfig = PipelineAPI.readCachedConfigKey('CONFIGS', assetKey);
        if (cachedConfig === assetKey) {
            //      console.log("Cache not ready: ", cachedConfig);
            new PipelineObject('CONFIGS', assetKey, configLoaded)
            //   PipelineAPI.cacheCategoryKey('CONFIGS', assetKey, configLoaded);
        } else {
            configLoaded(assetKey, cachedConfig);
        }

    }


}

export { LoadSequencer }