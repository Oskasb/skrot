import {JsonAsset} from "../../application/load/JsonAsset.js";
import {MATH} from "../../application/MATH.js";
import {jointCalls} from "../../application/utils/ControlUtils.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {getAssetBoneByName} from "../../application/utils/AssetUtils.js";
import {Object3D} from "../../../../libs/three/Three.Core.js";


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

        };
        let state = this.state;
        this.dynamic = null;

        this.assetInstance = assetInstance;

        let applyCalls = [];

        let jsonAsset = new JsonAsset(fileName)

        function attachDynamicTargets(targets) {
            if (targets.joints) {
                for (let i = 0; i < targets.joints.length; i++) {

                    let jointFb = targets.joints[i];
                    let call = jointCalls[jointFb.call];
                    let args = jointFb.args;
                    let bone = getAssetBoneByName(assetInstance, jointFb.bone);
                    let factor = jointFb['factor'] || 1;

                    bone.userData.bindPoseObj3D = new Object3D();
                    bone.userData.bindPoseObj3D.position.copy(bone.position);
                    bone.userData.bindPoseObj3D.quaternion.copy(bone.quaternion);
                    bone.userData.bindPoseObj3D.scale.copy(bone.scale);

                    let applyJointCall = function () {
                        call(bone, args, state.value, factor)
                    }

                    applyCalls.push(applyJointCall);
                }
            }
        }


        let onData = function(json) {

            this.dynamic = json.dynamic;

            for (let key in json.state) {
                state[key] = json.state[key];
            }
            state.targetValue = json.state.value;

            this.targets = MATH.jsonCopy(json.targets);
            MATH.emptyArray(applyCalls);
            for (let i = 0; i < this.targets.length; i++) {
                attachDynamicTargets(this.targets[i])
            }
            onReady(this)

        }.bind(this)

        jsonAsset.subscribe(onData);

        let transition = null;

        function transitionProgressUpdate(value) {
            state.value = value;
            MATH.callAll(applyCalls);
        }

        function applyTargetStateChange() {

            if (transition !== null) {
                transition.cancelScalarTransition()
                poolReturn(transition);
            }

            transition = poolFetch('ScalarTransition');
            transition.initScalarTransition(state.value, state.targetValue, 1, transitionProgressUpdate, null, transitionProgressUpdate)

        }

        this.call = {
            applyTargetStateChange:applyTargetStateChange
        }

    }


    setTargetState(value) {
        this.state.targetValue = value;
        this.call.applyTargetStateChange();
    }



}

export {ControlDynamics}