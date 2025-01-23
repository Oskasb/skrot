
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";

class NodeParticleEmitter {
    constructor() {

        let point = null;
        let particleList = null;
        const spawners = []

        function attachEffectJson(json) {
        //    console.log("attachEffectJson", json)
            let fxSpawners = json['spawners'];
            for (let i = 0; i < fxSpawners.length; i++) {
                let spawner = poolFetch('NodeParticleSpawner')
                spawner.call.activatePointSpawner(fxSpawners[i], point);
                spawners.push(spawner);
            }
        }

        function activatePointList(pnt, list) {
            point = pnt;
            particleList = list;
            for (let i =0; i < list.length; i++) {
                jsonAsset(list[i], attachEffectJson)
            }
        }

        function setEmitterStateValue(stateValue) {
            for (let i = 0; i < spawners.length; i++) {
                spawners[i].call.setSpawnerGain(stateValue);
            }
        }

        function closeEmitter() {
            while (spawners.length) {
                spawners.pop().call.closeParticleSpawner();
            }
        }

        this.call = {
            setEmitterStateValue:setEmitterStateValue,
            activatePointList:activatePointList,
            closeEmitter:closeEmitter
        }

    }

    initNodeParticleEmitter(point, particleList) {
        this.call.activatePointList(point, particleList);
    }

    detachNodeParticleEmitter() {
        this.call.closeEmitter()
        poolReturn(this)
    }

}

export { NodeParticleEmitter }