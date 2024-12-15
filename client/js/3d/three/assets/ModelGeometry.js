import {loadModelAsset} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {getGroupMesh} from "../../../application/utils/ModelUtils.js";
import * as SkeletonUtils from "../../../../../libs/jsm/utils/SkeletonUtils.js";
import {Skeleton} from "../../../../../libs/three/Three.Core.js";



function cloneSkeletonFromSource(scene, clone) {

        clone.animations = scene.animations;
        clone.frustumCulled = false;
        let skinnedMeshes = {};

        scene.traverse(function (node) {
            if (node.isSkinnedMesh) {
                skinnedMeshes[node.name] = node;
            }
        });

        let cloneBones = {};
        let cloneSkinnedMeshes = {};

        clone.traverse(function (node) {
            clone.frustumCulled = false;
            if (node.isBone) {
                cloneBones[node.name] = node;
            }

            if (node.isSkinnedMesh) {
                cloneSkinnedMeshes[node.name] = node;
            }

        });

        for (let name in skinnedMeshes) {
            let skinnedMesh = skinnedMeshes[name];
            let skeleton = skinnedMesh.skeleton;
            let cloneSkinnedMesh = cloneSkinnedMeshes[name];

            let orderedCloneBones = [];

            for (let i = 0; i < skeleton.bones.length; ++i) {
                let cloneBone = cloneBones[skeleton.bones[i].name];
                orderedCloneBones.push(cloneBone);
            }

            cloneSkinnedMesh.bind(new Skeleton(  orderedCloneBones,  skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);
        }

        console.log("CloneAnimated SkinMesh..", clone, scene);

};

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
                console.log("assetLoaded", model);
                scene = model.scene;
                geometry = getGroupMesh(model.scene.children);
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

        function cloneGeometry() {
            if (hasSkeleton === true) {
                let clone = SkeletonUtils.clone(geometry);
                cloneSkeletonFromSource(scene, clone);
                return clone;
            } else {
                return geometry.clone();
            }

        }

        function cloneToParent(obj3d, skeletonGeometry) {
            console.log("clone to parent", settings.modelGeometry);

            if (skeletonGeometry === settings.modelGeometry) {
                console.log("is skeleton rig host", skeletonGeometry);
            }

            obj3d.add(cloneGeometry());
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