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
        let maxSpawnRate = 0;
        let gain = 0;
        let particleConfig = null;

        const dynamicParameters = {

        }

        function closeParticleSpawner() {
            setSpawnerGain(0)
        }

        function setSpawnerConfig(config) {
            activateParticleEffectConfig(config);
            particleConfig = config;
            maxSpawnRate = config['spawn_rate_max'];
        }




        function activatePointSpawner(file, dynamicPoint) {
            point = dynamicPoint;
            jsonAsset(file, setSpawnerConfig)
        }


        function update() {
            let frameSpawnWeight = gain * maxSpawnRate / getFrame().tpfAvg;
            let count = Math.floor(MATH.remainder(frameSpawnWeight) * Math.random()) + Math.floor(frameSpawnWeight)
            let obj3d = point.getObj3d();
            if (count > 0) {

                let sampleGain = particleConfig['sample_gain']
                let velToGain = sampleGain['velocity_gain_factor']
                let velBase = sampleGain['velocity_base']

                point.updateDynamicPoint();

                obj3d.up.set(0, 0,velBase+velToGain*gain);
                obj3d.up.applyQuaternion(obj3d.quaternion);
                obj3d.up.add(point.getVel());
            //    console.log(getFrame().frame)
            //    for (let i = 0; i < 1; i++) {

            //    }
            }
            updateEmitterGain(obj3d, gain, particleConfig)

        }

        function setSpawnerGain(value) {

            if (particleConfig === null) {
                return;
            }

            if (gain === 0) {
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