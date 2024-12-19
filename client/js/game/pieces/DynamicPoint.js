import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {getAssetBoneByName, getBoneWorldTransform} from "../../application/utils/AssetUtils.js";
import {MATH} from "../../application/MATH.js";

let tempObj = new Object3D();

class DynamicPoint {
    constructor(assetInstance, config) {
        let obj3d = new Object3D();
        let sourceObj3d = null;
        let offset = new Vector3();
        MATH.vec3FromArray(offset, config.pos);

        let hasRotarion = false;
        let slerpFactor = false;

        let axisFactors = false;

        let parentNode = assetInstance.getObj3d();
        let hasBoneParent = false;

        if (config.bone) {
            hasBoneParent = true;
            parentNode = getAssetBoneByName(assetInstance, config.bone)
        }

        if (config.rot) {
            hasRotarion = true;
            MATH.vec3FromArray(obj3d.up, config.rot);
            if (config['factors']) {
                axisFactors = config['factors'];
                sourceObj3d = new Object3D();
            //    sourceObj3d.copy(parentNode.userData.bindPoseObj3D)
            //    sourceObj3d.copy(parentNode);
            }
        }

        function updateObj3d() {

            if (hasBoneParent === true) {
/*
                if (axisFactors !== false) {

                    getBoneWorldTransform(parentNode, sourceObj3d);
                    tempObj.quaternion.set(0, 0, 0, 1);
                    tempObj.position.copy(sourceObj3d.position);
                    tempObj.rotateX(sourceObj3d.rotation.x * axisFactors[0]);
                    tempObj.rotateY(sourceObj3d.rotation.y * axisFactors[1]);
                    tempObj.rotateZ(sourceObj3d.rotation.z * axisFactors[2]);
                //    sourceObj3d.quaternion.slerp(tempObj.quaternion, slerpFactor)
                //    getBoneWorldTransform(parentNode.parent, tempObj);
                //    tempObj.quaternion.premultiply(sourceObj3d.quaternion);
                } else {
            */
            //    }
                    getBoneWorldTransform(parentNode, tempObj);
             //   }

            } else {
                tempObj.copy(parentNode);
            }

            obj3d.position.copy(offset);
            obj3d.position.applyQuaternion(tempObj.quaternion);


            if (axisFactors !== false) {
                let lng = obj3d.position.length();
                obj3d.position.normalize();
                obj3d.position.x *= axisFactors[0];
                obj3d.position.y *= axisFactors[1];
                obj3d.position.z *= axisFactors[2];
                obj3d.position.normalize();
                obj3d.position.multiplyScalar(lng);
            }


            obj3d.quaternion.copy(tempObj.quaternion);

            if (hasRotarion === true) {
                MATH.rotateObj(obj3d, config.rot);
            }

            obj3d.position.add(tempObj.position)
        }

        function getObj3d() {
            return obj3d;
        }

        this.call = {
            getObj3d:getObj3d,
            updateObj3d:updateObj3d
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