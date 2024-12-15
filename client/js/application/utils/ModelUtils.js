import {ConfigData} from "./ConfigData.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Box3} from "../../../../libs/three/math/Box3.js";
import * as SkeletonUtils from "../../../../libs/jsm/utils/SkeletonUtils.js";
import {InstanceSpatial} from "../../3d/three/assets/InstanceSpatial.js";


let tempBox = new Box3();
let tempVec = new Vector3()
let tempVec2 = new Vector3()
let tempObj = new Object3D()
function buildAssetInstance(assetId, config, callback) {

    let addModelInstance = function(instance) {
        let obj3d = instance.spatial.obj3d
        ThreeAPI.getScene().remove(obj3d)

        if (config['rot']) {
            obj3d.rotateX(config.rot[0]);
            obj3d.rotateY(config.rot[1]);
            obj3d.rotateZ(config.rot[2]);
        }

        if (config['scale']) {
            MATH.vec3FromArray(obj3d.scale, config.scale)
        }

        instance.spatial.stickToObj3D(obj3d);

        let postCall = function() {
            callback(instance);
        }
        window.requestAnimationFrame(postCall);

    };

    client.dynamicMain.requestAssetInstance(assetId, addModelInstance)

}

function attachSkeletonRig(visualPiece, rigId, pieceReady) {
    visualPiece.rigId = rigId;


    let assetInstance = visualPiece.call.getInstance();
    let skellRig = rigId

    let assetDataCB = function() {

        let parsed = assetConfigData.parseConfigData()
        let assetConfig = parsed[visualPiece.assetId].config

        let rigDataKey = assetConfig['rig'];

        let rigData = new ConfigData("ASSETS", "RIGS", rigDataKey);
        let onRigData = function(config) {

    //        console.log("rigConf:", rigDataKey, config)
            let skeletonData = new ConfigData("GAME", "SKELETON_RIGS");

            visualPiece.rigData = MATH.getFromArrayByKeyValue(config, 'id', rigDataKey);

            let scaleVec = tempVec2;
            let size = 1 // gamePiece.getStatusByKey('size')
            scaleVec.set(size, size, size);
            visualPiece.pieceAnimator.setupAnimations(assetInstance.originalModel, visualPiece.call.getScaleCB);


            let onSkelRigData = function (skelConfig) {
                visualPiece.animStateMap = visualPiece.pieceAnimator.initPieceAnimator(skeletonData);
                visualPiece.pieceAttachments = visualPiece.pieceAttacher.initPieceAttacher(visualPiece, skeletonData.data);
                visualPiece.pieceActionSystem.initPieceActionSystem(visualPiece, skeletonData.data);
                pieceReady(visualPiece)
            }

            skeletonData.addUpdateCallback(onSkelRigData)
            skeletonData.fetchData(skellRig);

        }

        rigData.parseConfig(rigDataKey, onRigData)
    }

    let assetConfigData = new ConfigData("ASSETS", "MODELS", null, null, null, assetDataCB)

}


let postApply = function(baseSize, inst, visualPiece, pieceReady) {
    let apply = function() {
        if (inst.getSpatial().call.isInstanced()) {
        //    console.log("Set Base Scale: ", baseSize)
            inst.getSpatial().setBaseSize(baseSize);
            inst.getSpatial().call.getInstance().setBaseScale(baseSize);
            inst.getSpatial().setScaleXYZ(1,1, 1);
        }
        pieceReady(visualPiece);
    }

    // apply()
     window.requestAnimationFrame(apply)
}

function setupVisualModel(visualPiece, config, pieceReady) {

    visualPiece.assetId = config['model_asset']
        let addModel = function(instance) {
            visualPiece.call.setInstance(instance);

            if (config['skeleton_rig'])   {
                attachSkeletonRig(visualPiece, config['skeleton_rig'], pieceReady)
            } else {
                let size = config['base_size'] || 1;
                postApply(size, instance, visualPiece, pieceReady)
            }
        }



        buildAssetInstance(visualPiece.assetId, config, addModel)

}

function inheritConfigTransform(obj3d, config) {
    obj3d.quaternion.set(0, 0, 0, 1);
    obj3d.position.set(0, 0, 0);
    obj3d.scale.set(1, 1, 1);

    if (config.scale) {
        MATH.vec3FromArray(tempVec, config.scale)
        obj3d.scale.multiply(tempVec);
    }

    if (config.pos) {
        MATH.vec3FromArray(tempVec, config.pos)
    //    obj3d.position.multiply(obj3d.scale);
        obj3d.position.add(tempVec);
    }

    if (config.rot) {
    //    tempObj.quaternion.set(0, 0, 0, 1);
        MATH.rotXYZFromArray(obj3d, config.rot)
    //    obj3d.quaternion.copy(tempObj.quaternion);
    }


    if (config['on_ground']) {
        obj3d.position.y = ThreeAPI.terrainAt(obj3d.position);
    }

}

function inheritAsParent(childObj, parentObj) {
    childObj.position.multiply(parentObj.scale)
    childObj.quaternion.premultiply(parentObj.quaternion);
    childObj.position.applyQuaternion(parentObj.quaternion)

    childObj.position.add(parentObj.position);
    childObj.scale.x *= parentObj.scale.x;
    childObj.scale.y *= parentObj.scale.y;
    childObj.scale.z *= parentObj.scale.z;

}

function cubeTestVisibility(center, size) {

    tempBox.min.x = center.x - size*0.5;
    tempBox.min.y = center.y - size*0.5;
    tempBox.min.z = center.z - size*0.5;

    tempBox.max.x = center.x + size*0.5;
    tempBox.max.y = center.y + size*0.5;
    tempBox.max.z = center.z + size*0.5;

    return ThreeAPI.testBoxIsVisible(tempBox);
}

function aaBoxTestVisibility(center, sizeX, sizeY, sizeZ) {
    tempBox.min.x = center.x - sizeX*0.5;
    tempBox.min.y = center.y;
    tempBox.min.z = center.z - sizeZ*0.5;

    tempBox.max.x = center.x + sizeX*0.5;
    tempBox.max.y = center.y + sizeY;
    tempBox.max.z = center.z + sizeZ*0.5;

    return ThreeAPI.testBoxIsVisible(tempBox);
}


function testAABOXIntersectPosition(vec3, aabox) {
    return aabox.containsPoint(vec3);
}

function borrowBox() {
    return tempBox;
}

function fixParentAroundChildBox(parent, child, pad) {
    pad = pad || 0
    if (child.min.x < parent.min.x) parent.min.x = child.min.x - pad;
    if (child.min.y < parent.min.y) parent.min.y = child.min.y - pad;
    if (child.min.z < parent.min.z) parent.min.z = child.min.z - pad;
    if (child.max.x > parent.max.x) parent.max.x = child.max.x + pad;
    if (child.max.y > parent.max.y) parent.max.y = child.max.y + pad;
    if (child.max.z > parent.max.z) parent.max.z = child.max.z + pad;
}

function boxObjIntersectsPoint(boxObj3d, pos, insideStore) {

}

function  getObj3dScaleKey(obj3d, scaleConf) {
    return '_scale_'+obj3d.scale.x*scaleConf[0]+'_'+obj3d.scale.y*scaleConf[1]+'_'+obj3d.scale.z*scaleConf[2];
}


function getGroupMesh(children) {

    for (let j = 0; j < children.length; j++) {
        console.log("Types:", children[j].type);

        if (children[j].type === 'Group') {
            return getGroupMesh(children[j]);
        }

        if (children[j].type === 'SkinnedMesh') {
            console.log("Use the SkinnedMesh", children[j]);
            return children[j];
        }

        if (children[j].type === 'Mesh') {
            console.log("Use the SkinnedMesh", children[j]);
            return children[j];
        }

        if (children[j].children.length) {
            return getGroupMesh(children[j].children);
        }
    }
}


export {
    getGroupMesh,
    getObj3dScaleKey,
    borrowBox,
    cubeTestVisibility,
    aaBoxTestVisibility,
    setupVisualModel,
    buildAssetInstance,
    attachSkeletonRig,
    inheritConfigTransform,
    inheritAsParent,
    testAABOXIntersectPosition,
    fixParentAroundChildBox,
    boxObjIntersectsPoint
}