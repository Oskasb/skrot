import {ExpandingPool} from '../../../application/utils/ExpandingPool.js';
import {InstanceSpatial} from './InstanceSpatial.js';

class ThreeModel {
    constructor(id, config, callback) {
    //    console.log("New Model", id);
        InstanceAPI.addToModelCount();
        this.modelNr = InstanceAPI.getModelCount();

        this.config = config;

        this.id = id;

    //    console.log('Load Model', id)

        this.jointMap = {};
        this.joints = {};
        this.jointKeys = [];

        this.animMap = {};
        this.animations = {};
        this.animationKeys = [];

        this.hasAnimations = false;
        this.material;
        let _this = this;

        let materialLoaded = function(asset) {
       //     console.log('materialLoaded', asset.mat);
            _this.material = asset;

            if (this.geometryInstancingSettings()) {
                this.setupGeometryInstancing()
            }

            callback(this);
        }.bind(this);

        this.settings = {};
        let settings = this.settings;

        let modelSettingsLoaded = function(asset) {
           //    console.log('modelSettingsLoaded', asset, config);
            for (let key in asset.settings) {
                settings[key] = asset.settings[key];
            }
            ThreeAPI.loadThreeAsset('MATERIALS_', config.material, materialLoaded);
        }.bind(this);

        let modelFilesLoaded = function(src, asset) {
        //    console.log("modelFilesLoaded")
            ThreeAPI.loadThreeAsset('MODEL_SETTINGS_', config.settings, modelSettingsLoaded);
        }.bind(this);

        this.loadModelFiles(config, modelFilesLoaded)



    };

    geometryInstancingSettings = function() {
        //    console.log(this.settings.instancing)
        return this.settings.instancing;
    };

    setupGeometryInstancing = function() {

        let instancingSettings = this.geometryInstancingSettings();
    //    console.log("Register geom: ",this.id, this.model, instancingSettings, this.material)
        this.instanceBuffers = InstanceAPI.registerGeometry(this.id, this.model, instancingSettings, this.material.getAssetMaterial());

        let instantiateAsset = function(id, callback) {

            let instanceCb = function(geomIns) {
                let spatial = new InstanceSpatial(geomIns.obj3d);
                spatial.setGeometryInstance(geomIns);
                callback(spatial);
            };

            InstanceAPI.instantiateGeometry(this.id, instanceCb);
        }.bind(this);

        this.expandingPool = new ExpandingPool(this.id, instantiateAsset);
    };

    getAnimationClip = function(animationClipKey) {
        let animScene = this.animations[animationClipKey].scene;
        return animScene.animations[0]
    };

    loadModelFiles = function(config, callback) {

        var rqs = 0;
        var rds = 0;

        var loadCheck = function() {
            if (rqs === rds) {
        //        console.log("loadCheck OK", config)
                callback()
            }
        };

        var animLoaded = function(asset) {
            rds++;
            this.animations[this.animMap[asset.id]] = asset;
            loadCheck()
        }.bind(this);

        var fileLoaded = function(asset) {
    //        console.log("fileLoaded", asset)
            rds++;
            this.model = asset;
            loadCheck()
        }.bind(this);


        var loadRig = function(rig) {

            if (rig.joints) {
                for (var i = 0; i < rig.joints.length; i++) {
                    var bone_name = rig.joints[i]['bone_name'];
                    var key = rig.joints[i].key;
                    this.jointMap[key] = bone_name;
                    if (typeof(ENUMS.Joints[key]) !== 'number') {
                        console.log("No joint ENUM mapped for key: ", key)
                    }
                    this.jointKeys.push(ENUMS.Joints[key]);
                }
            }

            if (rig.animations) {
                this.hasAnimations = true;
                for (var i = 0; i < rig.animations.length; i++) {
                    var id = rig.animations[i].id;
                    var key = rig.animations[i].key;
                    this.animMap[id] = key;
                    if (typeof(ENUMS.Animations[key]) !== 'number') {
                        console.log("No animation ENUM mapped for key: ", key)
                    }
                    this.animationKeys.push(ENUMS.Animations[key]);

                    rqs++;
                    ThreeAPI.loadThreeAsset('FILES_GLB_', id, animLoaded);
                }
            }
            rds++;
        }.bind(this);

        if (config['rig']) {
            rqs++;
            ThreeAPI.loadThreeAsset('RIGS_', config['rig'], loadRig);
        }

   //     console.log("loadThreeAsset", config.model)
        ThreeAPI.loadThreeAsset('FILES_GLB_', config.model, fileLoaded);
        rqs++;
        loadCheck();

    };


    isGeometryInstance = function() {
        if (this.geometryInstancingSettings()) {
            return true;
        } else {
            return false;
        }
    }

    recoverModelClone = function(spatial) {

        if (this.isGeometryInstance()) {
            spatial.setPosXYZ(20+this.modelNr*5, - 5000, 3000);
        //    spatial.setScaleXYZ(0.0, 0.0, 0.0);
            InstanceAPI.releaseGeometryInstance(spatial.geometryInstance);
            if (this.expandingPool.pool.indexOf(spatial) !== -1) {
                console.log("Bad pool recovery", this.id, spatial, this);
                return;
            }
        } else {
            //    this.model.returnCloneToPool(spatial);
            ThreeAPI.hideModel(spatial.obj3d);
        }

    };

    getModelMaterial = function() {
        return this.material.getAssetMaterial();
    };

    getModelClone = function(callback) {

        if (this.geometryInstancingSettings()) {
            this.expandingPool.getFromExpandingPool(callback);
        } else {
            this.model.getCloneFromPool(callback);
        }
    };

}

export { ThreeModel }