import {loadModelAsset} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {getGroupMesh} from "../../../application/utils/ModelUtils.js";
import * as SkeletonUtils from "../../../../../libs/jsm/utils/SkeletonUtils.js";
import {Object3D, Skeleton} from "../../../../../libs/three/Three.Core.js";
import {applyMaterial, loadAssetMaterial} from "../../../application/utils/AssetUtils.js";



function cloneSkeletonFromSource(scene, parentObj3d, materialName) {
    let clone = SkeletonUtils.clone(scene);
    let root;
    let children = [];

    clone.traverse(function (node) {
            if (node.isSkinnedMesh) {
            //    console.log("CloneAnimated SkinMesh..", node.parent, scene);
                applyMaterial(node, materialName);
                root = node.parent;
                parentObj3d.skeleton = node.skeleton;
                for (let i = 0; i < root.children.length; i++) {
                    children.push(root.children[i]);
                }
            }
        });

    while (children.length) {
        parentObj3d.add(children.pop());
    }

    return parentObj3d;
}

class ModelGeometry{
    constructor() {
        let settings = {
            modelGeometry:this
        };
        let subscribers = [];
        let hasSkeleton = false;
        let mesh = null;
        let scene = null;


        function getGeometry() {
            return mesh.geometry;
        }

        function sendToSubscribers() {
            MATH.callAll(subscribers, settings.modelGeometry)
        }

        function initGeometry(fileGlb) {
            settings['fileGlb'] = fileGlb;
            mesh = null;

            let assetLoaded = function(model) {

                scene = model.scene;
                mesh = getGroupMesh(model.scene.children);
                mesh.frustumCulled = false;

            //    geometry.boundingBox.setFromObject(geometry, true)
                if (mesh.computeBoundingBox) {
                    //       geometry.computeBoundingBox()
                }


                sendToSubscribers();
            }

            loadModelAsset(fileGlb, assetLoaded)
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (mesh !== null) {
                cb(settings.modelGeometry);
            }
        }

        function getFileName() {
            return settings['fileGlb'];
        }

        function cloneGeometry(obj3d, materialName) {
            let clone;
            if (hasSkeleton === true) {
                clone = cloneSkeletonFromSource(scene, obj3d, materialName);
            } else {
                clone = mesh.clone()
                if (typeof (materialName) === "string") {
                    clone.traverse(function (child) {
                        if (child.isSkinnedMesh || child.isMesh) {
                            applyMaterial(child, materialName);
                        }
                    })
                }
                obj3d.add(clone);
            }

            return clone;

        }


        function cloneToParent(obj3d, materialName) {
            return cloneGeometry(obj3d, materialName)
        }

        function setHasSkeleton(bool) {
            hasSkeleton = bool;
        }


        this.call = {
            initGeometry: initGeometry,
            subscribe:subscribe,
            getFileName:getFileName,
            cloneToParent: cloneToParent,
            setHasSkeleton: setHasSkeleton,
            getGeometry:getGeometry
        }

    }

    initModelGeometry(fileGlb) {
        this.call.initGeometry(fileGlb);
    }

    subscribeToGeometry(callback) {
        this.call.subscribe(callback);
    }


}

export {ModelGeometry};