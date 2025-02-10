import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/Three.Core.js";

class WorldEffect {
    constructor() {

        let activeEmitter = null;
        const obj3d = new Object3D();
        const worldEffect = this;

        function update() {
            obj3d.userData.gain = -1;
            if (obj3d.userData.gain < 0) {
                obj3d.userData.gain = 0;
                activeEmitter.detachNodeParticleEmitter();
                ThreeAPI.unregisterPrerenderCallback(update);
                poolReturn(worldEffect);
            }
        }


        function initWorldEffect(trxObj3d, list) {
            obj3d.position.copy(trxObj3d.position);
            obj3d.quaternion.copy(trxObj3d.quaternion);
            obj3d.scale.copy(trxObj3d.scale);
            obj3d.up.copy(trxObj3d.up);
            obj3d.userData.gain = 1;
            obj3d.userData.emitForce = 1;
            activeEmitter = poolFetch('NodeParticleEmitter');
            activeEmitter.call.activatePointList(obj3d, list);
            ThreeAPI.registerPrerenderCallback(update);
        }

        this.call = {
            initWorldEffect:initWorldEffect
        }

    }

}

function activateWorldEffects(trxObj3d, list) {

    let fx = poolFetch('WorldEffect');
    fx.call.initWorldEffect(trxObj3d, list)

}

export { WorldEffect,
    activateWorldEffects}