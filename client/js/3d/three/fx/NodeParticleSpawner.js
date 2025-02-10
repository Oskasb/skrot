import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {activateParticleEffectConfig, updateEmitterGain} from "./NodeParticles.js";
import {getFrame} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {Vector3} from "three/webgpu";

const tempVec = new Vector3();
const tempVec2 = new Vector3()

class NodeParticleSpawner {
    constructor() {

        let point = null;
        let gain = 0;
        let particleConfig = null;


        function closeParticleSpawner() {
            setSpawnerGain(0)
        }

        function setSpawnerConfig(config) {
            activateParticleEffectConfig(config);
            particleConfig = config;

            if (point.isObject3D === true) {
                point.userData.gain = 1;
                point.userData.emitForce = 1;
                updateEmitterGain(point, particleConfig)
            }

        }


        function activatePointSpawner(file, dynamicPoint) {
            point = dynamicPoint;
            jsonAsset(file, setSpawnerConfig)
        }

        function update() {
            let obj3d = point.getObj3d();
            obj3d.userData.gain = gain;
            if (gain > 0) {
                let sampleGain = particleConfig['sample_gain']
                let velToGain = sampleGain['velocity_gain_factor']
                let velBase = sampleGain['velocity_base']
                point.updateDynamicPoint();
                let vel = point.getVel()
                obj3d.userData.emitForce = velBase+velToGain*gain;
                obj3d.up.set(0, 0, obj3d.userData.emitForce);
                obj3d.up.applyQuaternion(obj3d.quaternion);
                obj3d.up.add(vel);
            }
            updateEmitterGain(obj3d, particleConfig)

        }

        function setSpawnerGain(value) {

            if (particleConfig === null) {
                return;
            }

            if (gain > 0) {
                ThreeAPI.registerPrerenderCallback(update);
            } else if (value === 0) {
                ThreeAPI.unregisterPrerenderCallback(update);
            }
            gain = value;
        }

        this.call = {
            activatePointSpawner:activatePointSpawner,
            closeParticleSpawner:closeParticleSpawner,
            setSpawnerGain:setSpawnerGain
        }

    }
}

export { NodeParticleSpawner }