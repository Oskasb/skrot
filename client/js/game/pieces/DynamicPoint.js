import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {getAssetBoneByName, getBoneWorldTransform} from "../../application/utils/AssetUtils.js";
import {MATH} from "../../application/MATH.js";
import {getFrame} from "../../application/utils/DataUtils.js";

let tempObj = new Object3D();
let tempVec = new Vector3();

class DynamicPoint {
    constructor(assetInstance, config, groupName) {
        this.id = config.id;
        this.groupName = groupName;
        const stateInfo = {
            value:0
        };

        const onStateChangeCallbacks = [];


        const obj3d = new Object3D();
        const offset = new Vector3();

        const velocity = new Vector3();
        const localObj3d = new Object3D();

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

        let updateFrame = getFrame().frame;
        let timeDelta = 0;
        let lastFrameTime = getFrame().gameTime;
        let lastUpdatePos = new Vector3();

        let updateSteps = 0;
        let updateObj3d = function() {



            let frame = getFrame().frame;
            if (updateFrame !== frame) {
                updateSteps = 0;
            }
            updateSteps++

            updateFrame = frame;
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

                localObj3d.quaternion.copy(obj3d.quaternion);
                obj3d.position.applyQuaternion(tempObj.quaternion);
                localObj3d.position.copy(obj3d.position)
                obj3d.quaternion.copy(tempObj.quaternion);

            } else {
                tempObj.position.copy(parentNode.position);
                tempObj.quaternion.copy(parentNode.quaternion);
                tempObj.scale.copy(parentNode.scale);

                obj3d.position.applyQuaternion(tempObj.quaternion);
                localObj3d.quaternion.copy(obj3d.quaternion);
                obj3d.quaternion.copy(tempObj.quaternion);
                localObj3d.position.copy(obj3d.position)
            }

            if (hasRotarion === true) {
                MATH.rotateObj(obj3d, config.rot);
            }

            obj3d.position.add(tempObj.position)


        //    console.log(timeDelta, velocity)

            return true;
        }

        function getObj3d() {
            return obj3d;
        }

        let getLocalTransform = function(storeObj) {

            let assetNode = assetInstance.getObj3d();
            tempObj.position.copy(assetNode.position);
            tempObj.quaternion.copy(assetNode.quaternion).invert();
            localObj3d.position.copy(obj3d.position);
            localObj3d.position.sub(tempObj.position);
            localObj3d.quaternion.copy(tempObj.quaternion)
            localObj3d.quaternion.premultiply(obj3d.quaternion);
            storeObj.position.copy(localObj3d.position);
            storeObj.quaternion.copy(localObj3d.quaternion);
        }

        function updateVelocity() {
            let bodyVelocity = assetInstance.getAssetBodyVelocity()
            let bodyAngularVelocity = assetInstance.getAssetBodyAngularVelocity()

            let frame = getFrame().frame;
            if (updateFrame !== frame) {
                updateObj3d();
            }

            velocity.copy(bodyVelocity)

            bodyAngularVelocity.cross(localObj3d.position)
            velocity.add(bodyAngularVelocity);
        }

        let getPointVelocity = function() {
            updateVelocity();
            return velocity
        }

        function addPointStateChangeCallback(cb) {
            if (onStateChangeCallbacks.indexOf(cb) === -1) {
                onStateChangeCallbacks.push(cb)
            }
        }

        function removePointStateChangeCallback(cb) {
            MATH.splice(onStateChangeCallbacks, cb)
        }

        function setPointStateValue(value) {
            if (stateInfo.value !== value) {
                stateInfo.value = value;
                MATH.callAll(onStateChangeCallbacks, value);
            }
        }

        this.call = {
            getObj3d:getObj3d,
            updateObj3d:updateObj3d,
            getLocalTransform:getLocalTransform,
            getPointVelocity:getPointVelocity,
            addPointStateChangeCallback:addPointStateChangeCallback,
            removePointStateChangeCallback:removePointStateChangeCallback,
            setPointStateValue:setPointStateValue
        }

    }

    getPos() {
        return this.call.getObj3d().position;
    }

    getVel() {
        return this.call.getPointVelocity()
    }

    getTransformWS(storeObj) {
        this.call.updateObj3d()
        let obj3d = this.call.getObj3d();
        storeObj.position.copy(obj3d.position);
        storeObj.quaternion.copy(obj3d.quaternion);
        storeObj.scale.copy(obj3d.scale);
    }

    getObj3d() {
        return this.call.getObj3d();
    }

    updateDynamicPoint() {
        this.call.updateObj3d()
    }



}

export {DynamicPoint}