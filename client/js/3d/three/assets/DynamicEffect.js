import {poolFetch} from "../../../application/utils/PoolUtils.js";

class DynamicEffect {
    constructor(assetInstance, pointKey, particleList) {

        let activeEmitter = null;

        function applyStateValue(stateValue) {

            let point = assetInstance.call.getPointById(pointKey);

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