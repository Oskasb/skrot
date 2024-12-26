import {JsonAsset} from "../../application/load/JsonAsset.js";
import {MATH} from "../../application/MATH.js";
import {jointCalls} from "../../application/utils/ControlUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {getAssetBoneByName} from "../../application/utils/AssetUtils.js";
import {Object3D} from "../../../../libs/three/Three.Core.js";
import {ControlTransition} from "./ControlTransition.js";
import {DynamicBone} from "../../3d/three/assets/DynamicBone.js";
import {getFrame} from "../../application/utils/DataUtils.js";


class ControlDynamics {
    constructor(assetInstance, controlId, fileName, onReady) {

        this.controlId = controlId;
        this.targets = [];
        this.state = {
            min: 0,
            max: 1,
            value: 0.5,
            targetValue: 0.5,
            speed: 0.04,
        }
        let state = this.state;
        this.dynamic = null;

        this.assetInstance = assetInstance;
        let controlTransition = new ControlTransition();
        let applyCalls = [];

        let jsonAsset = new JsonAsset(fileName)

        function attachDynamicTargets(targets) {
            if (targets.joints) {
                for (let i = 0; i < targets.joints.length; i++) {
                    let jointFb = targets.joints[i];

                    if (!assetInstance.dynamicBones[jointFb.bone]) {
                        let bone = getAssetBoneByName(assetInstance, jointFb.bone);
                        bone.userData.bindPoseObj3D = new Object3D();
                        bone.userData.bindPoseObj3D.position.copy(bone.position);
                        bone.userData.bindPoseObj3D.quaternion.copy(bone.quaternion);
                        bone.userData.bindPoseObj3D.scale.copy(bone.scale);
                        assetInstance.dynamicBones[jointFb.bone] = new DynamicBone(assetInstance, bone);
                    }
                    let dynamicBone = assetInstance.dynamicBones[jointFb.bone];

                    let args = jointFb.args;
                    let factor = jointFb['factor'] || 1;

                    let influence = dynamicBone.call.registerInfluence(jointFb.call, args, state, factor, jointFb.offset || 0)

                    let applyJointCall = function () {
                        dynamicBone.call.applyDynamicBoneInfluence(influence)
                    }

                    applyCalls.push(applyJointCall);
                }
            }
        }


        let condition = null;

        let onData = function(json) {

            this.dynamic = json.dynamic;

            for (let key in json.state) {
                state[key] = json.state[key];
            }

            if (json.condition) {
                condition = json.condition;
            }

            this.targets = MATH.jsonCopy(json.targets);
            MATH.emptyArray(applyCalls);
            for (let i = 0; i < this.targets.length; i++) {
                attachDynamicTargets(this.targets[i])
            }
            onReady(this)

        }.bind(this)

        jsonAsset.subscribe(onData);

        function onTransitionChange(value) {
            state.value = value;
            MATH.callAll(applyCalls);
        }

        let updateFrame = 0;

        function applyRange(value, rangeMin, rangeMax) {
            let frac = MATH.calcFraction(rangeMin, rangeMax, value);
            let clamped = MATH.clamp(frac, 0, 1)
            console.log(value, clamped, frac)

            return value * clamped;
        }

        function testControlCondition(condition) {
            let dyn = condition.dynamic;
            let range = condition.range;
            let currentValue = assetInstance.getControlDynamic(dyn).getControlValue();
            return MATH.valueIsBetween(currentValue, range.min, range.max);
        }


        function applyTargetStateChange(targetValue, range) {

            if (condition !== null) {
                let isMet = testControlCondition(condition)
                if (isMet === false) {
                    targetValue = condition.value;
                }
            }


            if (typeof (range) === 'object') {
                targetValue = applyRange(targetValue, range.min, range.max);
                console.log("Ranged value", targetValue);
            }

            if (state.targetValue !== targetValue) {

                let frame = getFrame().frame;
                if (frame !== updateFrame) {
                    updateFrame = frame;
               //     console.log("Dynamic applyTargetStateChange ", controlId, targetValue);
                    state.targetValue = targetValue
                    controlTransition.call.updateControlTransition(targetValue, state, onTransitionChange);
                }


            } else {
                console.log("Dynamic value same ", controlId, targetValue);
            }

        }

        this.call = {
            applyTargetStateChange:applyTargetStateChange
        }

    }


    setTargetState(value, range) {
        this.call.applyTargetStateChange(value, range);
    }

    getControlValue() {
        return this.state.value;
    }


}

export {ControlDynamics}