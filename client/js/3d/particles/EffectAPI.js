import { ExpandingPool } from "../../application/utils/ExpandingPool.js";
import { PipelineObject } from "../../application/load/PipelineObject.js";
import { EffectSpawner } from "./EffectSpawner.js";
import { ParticleEffect } from "./ParticleEffect.js";
import { EffectBuilder } from "./EffectBuilder.js";

class EffectAPI {
    constructor() {
        let rebuildFx = function () {
            let rebuild = {};

            for (let key in this.activeEffects) {
                rebuild[key] = [];

                while (activeEffects[key].length) {
                    let fx = activeEffects[key].pop();
                    fx.bufferElement.releaseElement();
                    rebuild[key].push(fx)
                }

                while (rebuild[key].length) {
                    this.activateParticleEffect(rebuild[key].pop())
                }
            }

        }.bind(this);

        let createEffect = function (key, cb) {
        //    console.log("Create effect", key, cb)
            cb(new ParticleEffect(), key);
        };

        this.effectPool = new ExpandingPool('effect', createEffect);
        this.effectBuilders = {};
        this.effectSpawners = {};
        this.particleConfigs = {};
        this.activeEffects = {};
        this.activateEffects = {};

        this.callbacks = {
            rebuildFx:rebuildFx
        }
    }

    initEffectAPI = function(onReady) {

        let callbacks = this.callbacks;
        let effectSpawners =  this.effectSpawners;
        let particleConfigs = this.particleConfigs;
        let effectBuilders = this.effectBuilders;

        let onParticlesReady = function(src, particleConfig) {
        //    console.log(src, particleConfig)

            let applyParticleData = function(effectConfig) {
                let data = effectConfig.data;
            //    console.log('applyParticleData', data)
                for (let i = 0; i < data.length; i++) {
                    applyParticleConfigs(data[i]);
                    if (!effectBuilders[data[i].spawner_id]) {
                        effectBuilders[data[i].spawner_id] = new EffectBuilder(data[i].spawner_id)
                    }
                    let effectBuilder = effectBuilders[data[i].spawner_id];
                    effectBuilder.initEffectBuilder(data[i].spawner_id, onReady, callbacks.rebuildFx)
                }
            };

            for (let i = 0; i < particleConfig.length; i++) {
                applyParticleData(particleConfig[i]);
            }
        };

        let applyParticleConfigs = function(particleConfig) {

                let particleId = particleConfig.particle_id;
                if (!particleConfigs[particleId]) {
                    particleConfigs[particleId] = {}
                }

                for (let key in particleConfig) {
                    particleConfigs[particleId][key] = particleConfig[key]
                }

            callbacks.rebuildFx()

        };

        let applyEffectConfigs = function(spawnerConfigs) {
            let data = spawnerConfigs.data;
        //        console.log(data)
            for (let i in data) {
                let spawner = data[i].spawner;

                if (effectSpawners[spawner]) {
                    effectSpawners[spawner].resetEffectSpawner()
                }

                effectSpawners[spawner] = new EffectSpawner();
                effectSpawners[spawner].applyConfig(data[i]);
                effectSpawners[spawner].setupInstantiator()
            }
            callbacks.rebuildFx()
        };

        let onDataReady = function(src, data) {
        //    console.log("Particle BUFFER data:", data, src)
            for (let i = 0; i < data.length; i++) {
                applyEffectConfigs(data[i]);
            }
            new PipelineObject('EFFECT', 'PARTICLES', onParticlesReady);
        };

        new PipelineObject('EFFECT', 'BUFFERS', onDataReady);
    };



    activateParticleEffect = function(effect) {

        let setupParticleEffect = function(bufferElement, spawnerId) {
            let partEffect = this.activateEffects[spawnerId].pop();
            partEffect.setBufferElement(bufferElement);

            if (!this.activeEffects[spawnerId]) {
                this.activeEffects[spawnerId] = []
            }

            this.activeEffects[spawnerId].push(partEffect);
        }.bind(this);

        let particleId = effect.getParticleId();
        let config = this.getEffectConfig( particleId)
        effect.setConfig(config);
        effect.applyConfig();
        let spawnerId = effect.getSpawnerId();

        if (!this.activateEffects[spawnerId]) {
            this.activateEffects[spawnerId] = []
        }
        this.activateEffects[spawnerId].push(effect);

        this.effectSpawners[spawnerId].buildBufferElement(spawnerId, setupParticleEffect)
    };

    getEffectConfig = function(particleId) {
        return this.particleConfigs[particleId]
    };

    recoverParticleEffect = function(effect) {
        let spawner = effect.getSpawnerId();
        MATH.splice(this.activeEffects[spawner], effect);
        this.effectSpawners[spawner].deactivateEffect(effect);
        this.effectPool.returnToExpandingPool(effect);
    };

    buildEffect = function(callback) {
        this.effectPool.getFromExpandingPool(callback)
    };

    buildEffectClassByConfigId = function(builderId, effectName, callback) {
   //     console.log("buildEffectClassByConfigId",builderId, effectName )
        let builder = this.effectBuilders[builderId];
    //    console.log("buildEffectClassByConfigId",builder, effectName )
        builder.buildEffectByConfigId(effectName, callback)
    };

    addParticleToEffectOfClass = function(particleId, particleEffect, effectOfClass) {
        particleEffect.setParticleId(particleId);
        let spawnerId = particleEffect.getSpawnerId();
        let builder = this.effectBuilders[spawnerId];
        builder.addParticle(particleEffect, effectOfClass)
    };

    setupJointEffect = function(joint, configId) {
    //    console.log("setupJointEffect", joint, configId)
        this.effectBuilders[configId].buildEffectByConfigId(configId, joint.getAttachEffectCallback());
    };

    updateEffectAPI = function() {
        for (let spn in this.effectSpawners) {
            this.effectSpawners[spn].updateEffectSpawner()
        }
    };

}

export { EffectAPI };