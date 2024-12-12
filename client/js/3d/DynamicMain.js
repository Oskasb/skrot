
import {ENUMS} from "../application/ENUMS.js";
import {Vector3} from "../../../libs/three/Three.Core.js";
import {evt} from "../application/event/evt.js";

let tempVec = new Vector3();

class DynamicMain {
    constructor() {

    this.assets = {};
    this.assetIndex = {};
    this.instances = [];
    this.loadlist = []

        let requestInstance = function(event) {
            this.requestAssetInstance(event)
        }.bind(this);

        evt.on(ENUMS.Event.REQUEST_ASSET_INSTANCE, requestInstance);

        this.instancePointer = ENUMS.Numbers.INSTANCE_PTR_0;

    };

    requestAsset = function(modelAssetId, assetReadyCB) {

        let onAssetReady = function(asset) {

            this.assetIndex[asset.id] = this.assets.length;
            this.assets[modelAssetId] = asset;

            let idx = this.assetIndex[asset.id];

            let anims = asset.model.animKeys;
            let joints = asset.model.jointKeys;
            let message = {};


            message.index = idx;
            message.animKeys = anims;
            message.jointKeys = joints;

            let modelSettings = asset.model.settings;
            if (modelSettings.skin) {
                asset.model.skin = modelSettings.skin;
                message.skin = modelSettings.skin

            }


            let onInstance = function(instance) {
            //    console.log("First loaded Instance:", instance.originalModel);
                if (instance.originalModel.isGeometryInstance()) {
            //        console.log("buffers", instance.originalModel.instanceBuffers.geometry.attributes)
                    window.AmmoAPI.registerGeoBuffer(asset.id, instance.originalModel.instanceBuffers.geometry.attributes.position.array)
                }
                instance.decommissionInstancedModel();
            }.bind(this);


            this.requestAssetInstance(asset.id, onInstance)




        }.bind(this);



        if (this.assets[modelAssetId]) {
            assetReadyCB(this.assets[modelAssetId])


        } else {

            let assetLoaded = function(asset) {
                if (!this.assets[asset.id]) {
                    onAssetReady(asset)
                }
                while(this.loadlist[modelAssetId].length) {
                    this.loadlist[modelAssetId].pop()(this.assets[asset.id]);
                }
            }.bind(this)

            if (this.loadlist[modelAssetId]) {
                this.loadlist[modelAssetId].push(assetReadyCB)
            } else {
                this.loadlist[modelAssetId] = [assetReadyCB]
                ThreeAPI.buildAsset(modelAssetId, assetLoaded);
            }

        }

    };


    removeFromInstanceIndex = function(instancedModel) {
        MATH.splice(this.instances, instancedModel);
    };

    requestAssetInstance = function(assetId, callback) {
        let assets = this.assets;

        let instanceReady = function(modelInstance) {
            this.instancePointer++;
            this.instances.push(modelInstance);
            modelInstance.activateInstancedModel();
            modelInstance.setPointer(this.instancePointer);
            callback(modelInstance);
        }.bind(this);

        let asset = assets[assetId];

        if (asset) {
            asset.instantiateAsset(instanceReady);
        } else {

            let postLoadCB = function(loadedAsset) {

                let warmup = function(modelInstance) {
                //    modelInstance.activateInstancedModel();
                    modelInstance.decommissionInstancedModel()
                    asset = assets[assetId];

                    let instantiate = function() {
                        asset.instantiateAsset(instanceReady);
                    }
                    window.requestAnimationFrame(instantiate)

                }

                loadedAsset.instantiateAsset(warmup);
            }

            this.requestAsset(assetId, postLoadCB)
        }

    };

    updateDynamicInstances = function() {
        for (var i = 0; i < this.instances.length; i++) {
            this.instances[i].getSpatial().updateSpatialFrame();
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.instances[i].getSpatial().getPos(), color:'WHITE', size:0.35})
        }
    };

    updateDynamicMatrices = function() {

        let cPos = ThreeAPI.getCameraCursor().getLookAroundPoint();
        tempVec.copy(cPos);
        tempVec.y += 1.5;
        for (let i = 0; i < this.instances.length; i++) {

            if (this.instances[i].stationary) {
        //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.instances[i].getSpatial().getPos(), to:tempVec, color:'BLUE'});

            } else {

                if (this.instances[i].getSpatial().call.getFrameVelocity()) {
                    this.instances[i].updateSpatialWorldMatrix();
            //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.instances[i].getSpatial().getPos(), to:tempVec, color:'RED'});

                } else {
            //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.instances[i].getSpatial().getPos(), to:tempVec, color:'YELLOW'});

                }
            }

        }
    };

    tickDynamicMain = function() {
        this.updateDynamicMatrices();
     //   this.updateDynamicInstances();


     //   InstanceAPI.updateInstances();

    };

    initiateInstancesFromBufferMsg = function(bufferMsg) {
        InstanceAPI.setupInstancingBuffers(bufferMsg);
    };

};

export { DynamicMain }