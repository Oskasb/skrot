import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {getAssetBoneByName, getBoneWorldTransform} from "../../application/utils/AssetUtils.js";
import {MATH} from "../../application/MATH.js";

let tempObj = new Object3D();
let tempVec = new Vector3();

class DynamicPoint {
    constructor(assetInstance, config, groupName) {
        this.id = config.id;
        this.groupName = groupName;
        let obj3d = new Object3D();
        let offset = new Vector3();

        let localObj3d = new Object3D();

        MATH.vec3FromArray(offset, config.pos);

        let hasRotarion = false;
        let slerpFactor = false;

        let axisFactors = false;

        let parentNode = assetInstance.getObj3d();
        let hasBoneParent = false;

        if (config.bone) {
            hasBoneParent = true;
            parentNode = getAssetBoneByName(assetInstance, config.bone)
        } else {
            MATH.vec3FromArray(localObj3d.position, config.pos);
        }

        if (config.rot) {
            hasRotarion = true;
            MATH.vec3FromArray(obj3d.up, config.rot);
            MATH.rotateObj(localObj3d, config.rot);
            if (config['factors']) {
                axisFactors = config['factors'];
            }
        }

        function updateObj3d() {

            obj3d.position.copy(offset);

            if (hasBoneParent === true) {
                getBoneWorldTransform(parentNode, tempObj);

                if (axisFactors !== false) {
                    let lng = obj3d.position.length();
                    obj3d.position.normalize();
                    MATH.vec3FromArray(tempVec, axisFactors);
                    obj3d.position.x *= tempVec.x;
                    obj3d.position.y *= tempVec.y;
                    obj3d.position.z *= tempVec.z;
                    obj3d.position.normalize();
                    obj3d.position.multiplyScalar(lng);
                }

            } else {
                tempObj.position.copy(parentNode.position);
                tempObj.quaternion.copy(parentNode.quaternion);
                tempObj.scale.copy(parentNode.scale);
            }


            obj3d.position.applyQuaternion(tempObj.quaternion);

            obj3d.quaternion.copy(tempObj.quaternion);

            if (hasRotarion === true) {
                MATH.rotateObj(obj3d, config.rot);
            }

            obj3d.position.add(tempObj.position)
        }

        function getObj3d() {
            return obj3d;
        }

        function getLocalTransform(storeObj) {
            storeObj.position.copy(localObj3d.position);
            storeObj.quaternion.copy(localObj3d.quaternion);
        }

        this.call = {
            getObj3d:getObj3d,
            updateObj3d:updateObj3d,
            getLocalTransform:getLocalTransform
        }

    }

    getObj3d() {
        return this.call.getObj3d();
    }

    updateDynamicPoint() {
        this.call.updateObj3d()
    }



}

export {DynamicPoint}