import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {activateParticleEffectConfig, spawnParticle} from "./NodeParticles.js";
import {getFrame} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {Vector3} from "three/webgpu";

const tempVec = new Vector3();

class NodeParticleSpawner {
    constructor() {

        let point = null;
        let maxSpawnRate = 0;
        let gain = 0;
        let particleConfig = null;

        function closeParticleSpawner() {

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

            if (count > 0) {
                point.updateDynamicPoint();
                let obj3d = point.getObj3d();
                tempVec.set(0, 0, 1);
                tempVec.applyQuaternion(obj3d.quaternion);
                for (let i = 0; i < count; i++) {
                    spawnParticle(obj3d.position, tempVec, particleConfig)
                }
            }


        }

        function setSpawnerGain(value) {
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