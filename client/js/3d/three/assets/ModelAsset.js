import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {loadModelGeometry} from "../../../application/utils/AssetUtils.js";
import {Object3D} from "../../../../../libs/three/Three.Core.js";

class ModelAsset {
    constructor() {
        let settings = {
            skeletonGeometry:null,
            rotation:[0, 0, 0],
            scale:[1, 1, 1]
        }
        let subscribers = [];

        let ready = false;

        let loadCalls = [];
        let geometries = [];
        let skeleton = null

        function instantiate() {
            console.log("Asset geometries:", geometries)

            let obj3d = new Object3D();

            obj3d.frustumCulled = false;
            let skeleton = null;

            for (let i = 0; i < geometries.length; i++) {
                let clone = geometries[i].call.cloneToParent(obj3d)
                MATH.vec3FromArray(clone.scale, settings.scale);
                MATH.rotateObj(clone, settings.rotation);
                if (settings.skeletonGeometry === geometries[i]) {
                    skeleton = clone.skeleton;
                }
            }

            for (let i = 0; i < obj3d.children.length; i++) {
                let child =obj3d.children[i];
                if (child.isSkinnedMesh === true) {
                    child.bind(skeleton, child.matrixWorld)
                }
            }



            console.log("Asset obj3d:", obj3d)
            return obj3d;
        }

        function sendToSubscribers() {
            MATH.callAll(subscribers, instantiate())
        }

        function initAsset(modelFileName) {
            settings.modelFileName = modelFileName;
            let json = getJsonByFileName(modelFileName);
            console.log("modelJson", json);

            settings.rotation = json.rotation || settings.rotation;
            settings.scale = json.scale || settings.scale;

            let assets = json.assets;

            function geoLoaded(geo) {
                let fileName = geo.call.getFileName()
                console.log("geoLoaded", fileName, geo);
                geometries.push(geo);
                MATH.splice(loadCalls, fileName);
                if (json['skeleton_file'] === fileName) {
                    geo.call.setHasSkeleton(true);
                    settings.skeletonGeometry = geo;
                }
                if (loadCalls.length === 0) {
                    sendToSubscribers()
                }
            }

            for (let i = 0; i < assets.length; i++) {
                loadCalls.push(assets[i].file);
            }

            for (let i = 0; i < loadCalls.length; i++) {
                loadModelGeometry(loadCalls[i], geoLoaded);
            }

            // let children = json.children;
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (ready === true) {
                cb(instantiate());
            }
        }

        this.call = {
            initAsset:initAsset,
            subscribe:subscribe
        }

    }

    initModelAsset(modelFileName) {
        this.call.initAsset(modelFileName);

    }

    subscribeToModel(callback) {
        this.call.subscribe(callback);
    }

}

export { ModelAsset }