import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {jsonAsset, loadAssetMaterial, loadModelGeometry} from "../../../application/utils/AssetUtils.js";
import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";

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

        function getGeometryByName(name) {
            for (let i = 0; i< geometries.length; ++i) {
                if (geometries[i].call.getFileName() === name) {
                    return geometries[i];
                }
            }
        }

        function getAssetMaterialName(fileName) {
            let assets = settings.assets;
            for (let i = 0; i < assets.length; i++) {
                if (fileName === assets[i].file) {
                    return assets[i].material;
                }
            }
        }

        function instantiate(obj3d) {

            obj3d.frustumCulled = false;
            let skeleton = null;

            for (let i = 0; i < geometries.length; i++) {
                let clone = geometries[i].call.cloneToParent(obj3d, getAssetMaterialName(geometries[i].call.getFileName()))
                MATH.vec3FromArray(clone.scale, settings.scale);
            //    MATH.rotateObj(clone, settings.rotation);
                if (settings.skeletonGeometry === geometries[i]) {
                    skeleton = clone.skeleton;
                    MATH.rotateObj(skeleton.bones[0], settings.rotation);
                }
            }

            for (let i = 0; i < obj3d.children.length; i++) {
                let child = obj3d.children[i];
                if (child.isSkinnedMesh === true) {
                    child.bind(skeleton, child.matrixWorld)
                }
            }

            console.log("modelJson instantiated", obj3d.userData );
            return obj3d;
        }

        function sendToSubscribers() {
            for (let i = 0; i < subscribers.length; i++) {
                let obj3d = subscribers[i];
                obj3d.userData.modelCallback(instantiate(obj3d))
            }
        }

        function initAsset(modelFileName) {
            settings.modelFileName = modelFileName;

            function onJson(data) {

                let json = data;
                    console.log("modelJson", json);

                settings.rotation = json.rotation || settings.rotation;
                settings.scale = json.scale || settings.scale;

                let assets = json.assets;
                settings.assets = assets;

                function geoLoaded(geo) {
                    let fileName = geo.call.getFileName()
                    //    console.log("geoLoaded", fileName, geo);
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

                let materialList = []

                for (let i = 0; i < assets.length; i++) {
                    if (typeof (assets[i].material) === 'string') {
                        if (materialList.indexOf(assets[i].material) === -1) {
                            materialList.push(assets[i].material);
                        }
                    }
                    loadCalls.push(assets[i].file);
                }

                function loadGeometries() {
                    for (let i = 0; i < loadCalls.length; i++) {
                        loadModelGeometry(loadCalls[i], geoLoaded);
                    }
                }

                function matLoaded(matSettings) {
                       console.log("matLoaded", materialList, matSettings);
                    MATH.splice(materialList, matSettings.fileName);
                    if (materialList.length === 0) {
                        loadGeometries();
                    } else {
                        loadAssetMaterial(materialList.pop(), matLoaded);
                    }
                }

                if (materialList.length === 0) {
                    loadGeometries();
                } else {
                    loadAssetMaterial(materialList.pop(), matLoaded);
                }

            }

            jsonAsset(modelFileName, onJson);
        }

        function subscribe(cb, obj3d) {
            if (!obj3d) {
                obj3d = new Object3D()
            }
            obj3d.userData.modelCallback = cb;
            subscribers.push(obj3d);
            if (ready === true) {
                obj3d.userData.modelCallback(instantiate(obj3d))
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

    subscribeToModel(callback, obj3d) {
        this.call.subscribe(callback, obj3d);
    }

}

export { ModelAsset }