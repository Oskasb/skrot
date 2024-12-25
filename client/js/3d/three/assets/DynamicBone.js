import {jointCalls} from "../../../application/utils/ControlUtils.js";
import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {WebGLRenderList as influences} from "../../../../../libs/three/renderers/webgl/WebGLRenderLists.js";

class DynamicBone {
    constructor(assetInstance, bone) {

        let influensors = [];
        let callbacks = [];
        let boneCalls = {};

        function updateInfluences() {

            bone.quaternion.copy(bone.userData.bindPoseObj3D.quaternion)

            while (updatedInfluences.length) {
                let influence = updatedInfluences.pop();
                let callName = influence.callName;
                let factor = influence.factor;
                let args = influence.args;
                let value = influence.state.value;
                let obj3d = influence.obj3d;
                obj3d.quaternion.set(0, 0, 0, 1);
                jointCalls[callName](obj3d, args, value, factor);

                if (callName === "applyBoneScale") {
                    bone.scale.copy(bone.userData.bindPoseObj3D.scale)
                    bone.scale.copy(obj3d.scale)
                }
            }

            for (let i = 0; i  < influensors.length; i++) {
                let obj3d = influensors[i].obj3d;

                let callName = influensors[i].callName;
                if (callName === "setBoneRotation") {
                    bone.quaternion.multiply(obj3d.quaternion)
                }
            }

            ThreeAPI.unregisterPrerenderCallback(updateFrame)
        }

        let updatedInfluences = []

        function updateFrame() {
            while (callbacks.length) {
                callbacks.pop()();
            }
        }

        function applyDynamicBoneInfluence(influence) {
            updatedInfluences.push(influence);
            if (callbacks.length === 0) {
                callbacks.push(updateInfluences)
                ThreeAPI.registerPrerenderCallback(updateFrame)
            }
        }


        function registerInfluence(callName, args, state, factor) {

            let influence = {
                callName:callName,
                factor:factor,
                state:state,
                args:args,
                obj3d:new Object3D()
            }
            influensors.push(influence);

            if (!boneCalls[callName]) {
                boneCalls[callName] = {
                    value:0,
                    args:[]
                }
            }

            if (args === null) {
                console.log("args are null", callName, args, state)
                return influence;
            }

            if (typeof args === 'string') {
                if (boneCalls[callName].args.indexOf(args) === -1) {
                    boneCalls[callName].args.push(args)
                }
            } else {
                for (let i = 0; i < args.length; i++) {
                    let arg = args[i];

                    if (boneCalls[callName].args.indexOf(arg) === -1) {
                        boneCalls[callName].args.push(arg)
                    }
                }
            }

            return influence;
        }

        this.call = {
            registerInfluence:registerInfluence,
            applyDynamicBoneInfluence:applyDynamicBoneInfluence
        }

    }



}

export { DynamicBone }