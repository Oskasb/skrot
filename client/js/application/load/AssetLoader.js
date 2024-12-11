import {ThreeModel} from '../../3d/three/assets/ThreeModel.js';
import {ThreeRig} from '../../3d/three/assets/ThreeRig.js';
import {ThreeMaterial} from '../../3d/three/assets/ThreeMaterial.js';
import {ThreeTexture} from '../../3d/three/assets/ThreeTexture.js';
import {ThreeModelSettings} from '../../3d/three/assets/ThreeModelSettings.js';
import {ThreeModelFile} from '../../3d/three/assets/ThreeModelFile.js';
import {ThreeMaterialSettings} from '../../3d/three/assets/ThreeMaterialSettings.js';
import {ThreeTextureSettings} from '../../3d/three/assets/ThreeTextureSettings.js';
import {ThreeImage} from '../../3d/three/assets/ThreeImage.js';
import {LoadSequencer} from "./LoadSequencer.js";


class AssetLoader {
    constructor() {

        this.loadSequencer = new LoadSequencer();
        this.assetMap = {
            MODELS_:            ThreeModel,
            RIGS_:              ThreeRig,
            MATERIALS_:         ThreeMaterial,
            TEXTURES_:          ThreeTexture,
            MODEL_SETTINGS_:    ThreeModelSettings,
            MATERIAL_SETTINGS_: ThreeMaterialSettings,
            TEXTURE_SETTINGS_:  ThreeTextureSettings,
            FILES_GLB_:         ThreeModelFile,
            FILES_IMAGES_:      ThreeImage
        };

        this.assets = {};

        };

        initAssetConfigs = function() {

            let loadList = function(src, data) {
                this.loadAssetConfigs(data);
            }.bind(this);

            PipelineAPI.cacheCategoryKey('ASSETS', 'LOAD', loadList);
        };

        loadAssetConfigs = function(assets) {

            let assetData = function(src, data) {

                for (let i = 0; i < data.length; i++) {
                    this.setAssetConfig(src, data[i].id, data[i]);
                }

            }.bind(this);

            for (let i = 0; i < assets.length; i++) {
                PipelineAPI.cacheCategoryKey('ASSETS', assets[i], assetData);
            }

        };

        setAssetConfig = function(assetType, assetId, data) {
            PipelineAPI.setCategoryKeyValue('CONFIGS', assetType+'_'+assetId, data);
        };

        getAsset(assetKey) {
            return this.assets[assetKey]
        }

        loadAsset = function(assetType, assetId, callback) {

            let loadSequencer = this.loadSequencer;
            let assetMap = this.assetMap;
            let assets = this.assets;

            let initLoadAsset = function(assetType, assetId, lcallback) {
                let assetKey = assetType+assetId;
                let cachedAsset = PipelineAPI.readCachedConfigKey('ASSET', assetKey);
                if (cachedAsset === assetKey) {
                //    PipelineAPI.cacheCategoryKey('ASSET', assetKey, lcallback);
            //        console.log("Request LoadSequencer", assetKey);
                    loadSequencer.sequenceAssetLoad(assets, assetMap, assetType, assetId, lcallback);
                } else {
                    //    PipelineAPI.removeCategoryKeySubscriber('ASSET', assetKey, lcallback)
            //        console.log('asset cached', assetKey);
                    lcallback(cachedAsset);
                }
            };

            initLoadAsset(assetType, assetId, callback)
        };
    }

export { AssetLoader };