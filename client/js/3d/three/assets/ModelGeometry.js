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
        let geometry = null;
        let scene = null;

        function sendToSubscribers() {
            MATH.callAll(subscribers, settings.modelGeometry)
        }

        function initGeometry(fileGlb) {
            settings['fileGlb'] = fileGlb;
            geometry = null;

            let assetLoaded = function(model) {

                scene = model.scene;
                geometry = getGroupMesh(model.scene.children);
                geometry.frustumCulled = false;

            //    geometry.boundingBox.setFromObject(geometry, true)
                if (geometry.computeBoundingBox) {
                    //       geometry.computeBoundingBox()
                }


                sendToSubscribers();
            }

            loadModelAsset(fileGlb, assetLoaded)
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (geometry !== null) {
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
                clone = geometry.clone()
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

        function cloneSkeleton() {

        }

        this.call = {
            initGeometry: initGeometry,
            subscribe:subscribe,
            getFileName:getFileName,
            cloneToParent: cloneToParent,
            setHasSkeleton: setHasSkeleton,
            cloneSkeleton:cloneSkeleton
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