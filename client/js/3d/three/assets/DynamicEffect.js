import {Object3D, Vector3} from "three/webgpu";
import {debugDrawDynamicPoint} from "../../../application/utils/DebugUtils.js";
import {poolFetch} from "../../../application/utils/PoolUtils.js";

class DynamicEffect {
    constructor(assetInstance, pointKey, particleList) {

        let obj3d = new Object3D()
        let activeEmitter = null;

        function applyStateValue(stateValue) {
         //   console.log("Apply State Value Dyn Fx ", stateValue);
            let point = assetInstance.call.getPointById(pointKey);
        //    point.getTransformWS(obj3d);

        //    debugDrawDynamicPoint(point)

            if (stateValue !== 0) {
                if (activeEmitter === null) {
                    activeEmitter = poolFetch('NodeParticleEmitter');
                    activeEmitter.initNodeParticleEmitter(point, particleList)
                }
                activeEmitter.call.setEmitterStateValue(stateValue);
            } else {
                if (activeEmitter !== null) {
                    activeEmitter.detachNodeParticleEmitter();
                    activeEmitter = null;
                }
            }

        }

        this.call = {
            applyStateValue:applyStateValue
        }

    }



}

export { DynamicEffect }