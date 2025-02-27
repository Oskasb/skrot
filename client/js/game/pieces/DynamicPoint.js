import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {getAssetBoneByName, getBoneWorldTransform} from "../../application/utils/AssetUtils.js";
import {MATH} from "../../application/MATH.js";
import {getFrame} from "../../application/utils/DataUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {bodyTransformToObj3d} from "../../application/utils/PhysicsUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";

let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec = new Vector3();
let tempVec2 = new Vector3();

class DynamicPoint {
    constructor(assetInstance, config, groupName) {
        this.id = config.id;
        this.json = config;
        this.groupName = groupName;
        const stateInfo = {
            value:0,
            forwardOffset:0,
            offsetVel:new Vector3()
        };

        const status = new SimpleStatus();
        this.status = status;
        const onStateChangeCallbacks = [];

        const obj3d = new Object3D();
        const offset = new Vector3();
        const velocity = new Vector3();
        const angularVelocity = new Vector3();
        const frameAngles = new Vector3();
        const localObj3d = new Object3D();
        const originalTrxObj = new Object3D();

        const frameModifiedTrxObj = new Object3D();

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


        originalTrxObj.position.copy(localObj3d.position);
        originalTrxObj.quaternion.copy(localObj3d.quaternion);

        frameModifiedTrxObj.position.copy(localObj3d.position);
        frameModifiedTrxObj.quaternion.copy(localObj3d.quaternion);

        let updateSteps = 0;


        let updateObj3d = function(stepTime) {


            if (stepTime) {

            }

            let frame = getFrame().frame;
            if (updateFrame !== frame) {
                updateSteps = 0;
            }
            updateSteps++

            updateFrame = frame;
            obj3d.position.copy(offset);

            if (hasBoneParent === true) {

                if (isNaN(tempObj.position.x)) {
                    console.log("localObj3d isNaN(obj3d.position.x)")
                    return;
                }

                getBoneWorldTransform(parentNode, tempObj);

                if (isNaN(tempObj.position.x)) {
                    console.log("localObj3d isNaN(obj3d.position.x)")
                    return;
                }

                if (axisFactors !== false) {
                    MATH.vec3FromArray(tempVec, axisFactors);
                    tempObj2.quaternion.set(0, 0, 0, 1);
                    tempObj2.rotation.set(
                        tempObj.rotation.x * tempVec.x,
                        tempObj.rotation.y * tempVec.y,
                        tempObj.rotation.z * tempVec.z,
                        'XYZ'
                    )
                    obj3d.position.applyQuaternion(tempObj2.quaternion);
                    obj3d.quaternion.copy(tempObj.quaternion);


                } else {
                    obj3d.position.applyQuaternion(tempObj.quaternion);
                    obj3d.quaternion.copy(tempObj.quaternion);

                }

                obj3d.position.add(tempObj.position)

                let assetNode = assetInstance.getObj3d();
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:assetNode.position, size:1.2, color:'CYAN'});
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, size:0.6, color:'CYAN'});

                frameModifiedTrxObj.position.subVectors(obj3d.position, assetNode.position);
                frameModifiedTrxObj.position.add(originalTrxObj.position)
             //   frameModifiedTrxObj.position.add(assetNode.position);


                frameModifiedTrxObj.quaternion.copy(assetNode.quaternion).invert()
                frameModifiedTrxObj.quaternion.multiply(obj3d.quaternion);
                frameModifiedTrxObj.quaternion.multiply(originalTrxObj.quaternion);



            } else {

                frameModifiedTrxObj.position.copy(originalTrxObj.position);
                frameModifiedTrxObj.quaternion.copy(originalTrxObj.quaternion)

                tempObj.position.copy(parentNode.position);
                tempObj.quaternion.copy(parentNode.quaternion);
                tempObj.scale.copy(parentNode.scale);

                obj3d.position.applyQuaternion(tempObj.quaternion);
                obj3d.quaternion.copy(tempObj.quaternion);
                obj3d.position.add(tempObj.position)
            }


            if (hasRotarion === true) {
                MATH.rotateObj(obj3d, config.rot);
            }

            if (stateInfo.forwardOffset !== 0) {
                tempVec2.copy(stateInfo.offsetVel)
                tempVec.set(0, 0, stateInfo.forwardOffset);
                tempVec.applyQuaternion(obj3d.quaternion);
                stateInfo.offsetVel.copy(tempVec);
                stateInfo.offsetVel.sub(tempVec2);
            //    stateInfo.offsetVel.multiplyScalar(100)
                obj3d.position.add(tempVec);
            } else {
                stateInfo.offsetVel.set(0, 0, 0);
            }


            return true;
        }



        function getObj3d() {
            return obj3d;
        }

        let getLocalTransform = function(storeObj) {

            storeObj.position.copy(frameModifiedTrxObj.position);
            storeObj.quaternion.copy(frameModifiedTrxObj.quaternion);

        }



        function updateVelocity() {
            const bodyVelocity = assetInstance.getAssetBodyVelocity()
            velocity.copy(bodyVelocity)
            tempVec.copy(offset)
            const bodyAngularVelocity = assetInstance.getAssetBodyAngularVelocity()
            tempVec.applyQuaternion(tempObj.quaternion)
            tempVec.crossVectors(bodyAngularVelocity, tempVec) // .multiplyScalar(1.5);
            velocity.add(tempVec)
            velocity.add(stateInfo.offsetVel)
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

        function setAppliedForce(vec3) {
            status.setStatusKey(ENUMS.PointStatus.FORCE_X, vec3.x * 0.000001);
            status.setStatusKey(ENUMS.PointStatus.FORCE_Y, MATH.clamp(vec3.y * 0.00001, -0.5, 0.5));
            status.setStatusKey(ENUMS.PointStatus.FORCE_Z, vec3.z * 0.000001);
        }


        const trsCompletedCBs = [];

        function transitionEnded(offset, trs) {
            while (trsCompletedCBs.length) {
                trsCompletedCBs.pop()()
            }
            poolReturn(trs);
            stateInfo.forwardOffset = 0;
        }

        function setForwardOffset(offset) {
            stateInfo.forwardOffset = offset;
        }

        function transitionPosForward(distance, time, onCompletedCB) {
            trsCompletedCBs.push(onCompletedCB);
            const trs = poolFetch('ScalarTransition')
            trs.initScalarTransition(0, distance, time, transitionEnded, 'curveQuad', setForwardOffset)
        }

        this.call = {
            getObj3d:getObj3d,
            updateObj3d:updateObj3d,
            getLocalTransform:getLocalTransform,
            getPointVelocity:getPointVelocity,
            addPointStateChangeCallback:addPointStateChangeCallback,
            removePointStateChangeCallback:removePointStateChangeCallback,
            setPointStateValue:setPointStateValue,
            setAppliedForce:setAppliedForce,
            transitionPosForward:transitionPosForward
        }

    }



    getPos() {
        return this.call.getObj3d().position;
    }

    getQuat() {
        return this.call.getObj3d().quaternion;
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

    updateDynamicPoint(stepTime) {
        this.call.updateObj3d(stepTime)
    }



}

export {DynamicPoint}