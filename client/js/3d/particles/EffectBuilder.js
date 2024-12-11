import { PipelineObject } from "../../application/load/PipelineObject.js";
import { ExpandingPool } from "../../application/utils/ExpandingPool.js";
import { DurableStamp } from "./classes/DurableStamp.js";
import { GameEffect } from "./classes/GameEffect.js";

class EffectBuilder {
        constructor(id) {

            this.id = id;
            this.effectClass = {
                DurableStamp          :DurableStamp,
                GameEffect            :GameEffect
            };

            this.configs = {};
            this.effectPools = {};
            this.activeEffects = {};


            let _this = this;
            let recoverEffect = function(effectOfClass) {
                _this.recoverEffectOfClass(effectOfClass)
            };

            let activateEffect = function(effectOfClass, isPermanent) {
                _this.activateEffectOfClass(_this.configs[effectOfClass.getEffectId()], effectOfClass, isPermanent)
            };

            this.callbacks = {
                activateEffect:activateEffect,
                recoverEffect:recoverEffect,
                addParticleGroup:this.addParticleGroup
            };

            this.isUpdate = false;
        };

        initEffectBuilder = function(dataId, onReady, rebuildFx) {

            let _this = this;

            let onDataReady = function(src, data) {

                for (let i = 0; i<data.length;i++) {
                    _this.applyConfigs(data[i]);
                }

                if (!this.isUpdate) {
                    onReady('effectBuilder ready: '+dataId);
                    this.isUpdate = true;
                } else {
                    rebuildFx();
                }

            }.bind(this);

            if (!this.isUpdate) {
                new PipelineObject('EFFECT', 'EFFECTS', onDataReady)
            }

        };

        applyConfigs = function(data) {

        //    console.log("Apply data", data);

            let createEffect = function(key, cb) {
                let fx = new this.effectClass[this.configs[key].effect_class](this.callbacks.activateEffect, this.callbacks.recoverEffect);
                fx.setEffectId(key);

                cb(fx)
            }.bind(this);

            for (let key in data.data) {


                if (this.activeEffects[key]) {
                    while (this.activeEffects[key].length) {
                        let fx = this.activeEffects[key].pop();
                        fx.recoverEffectOfClass();
                    }
                } else {
                    this.activeEffects[key] = [];
                }

                this.configs[key] = data.data[key];
                this.effectPools[key] = new ExpandingPool(key, createEffect)
            }

        };


        buildEffectByConfigId = function(configId, callback) {
            let pool = this.effectPools[configId];
        //    console.log("get pool", pool, configId, this.effectPools)
            pool.getFromExpandingPool(callback)
        };


        activateEffectOfClass = function(config, effectOfClass, isPermanent) {

            let cfgId = effectOfClass.getEffectId();

            let maxActive = this.configs[cfgId].max_active || 100;


            if (!isPermanent) {
                this.activeEffects[cfgId].push(effectOfClass);
            }

            effectOfClass.setConfig(config);

            let particles = config.particles;
            for (let i = 0; i < particles.length; i++) {
                this.callbacks.addParticleGroup(effectOfClass, particles[i])
            }

            if (this.activeEffects[cfgId].length > maxActive) {
                let recover = this.activeEffects[cfgId].shift();
                recover.recoverEffectOfClass();
            }

        };

        addParticleGroup = function(effectOfClass, particleGroup) {
            let count = Math.round(MATH.randomBetween(particleGroup.count[0], particleGroup.count[1]));

            for (let i = 0; i < count; i++) {
                effectOfClass.attachParticleId(particleGroup.id);
                effectOfClass.activateEffectParticle()
            }
        };


        addParticle = function(particleEffect, effectOfClass) {

            let classCfg = effectOfClass.config;
            if (classCfg.spread_pos) {
                MATH.randomVector(particleEffect.offset);
                particleEffect.offset.x *= classCfg.spread_pos[0];
                particleEffect.offset.y *= classCfg.spread_pos[1];
                particleEffect.offset.z *= classCfg.spread_pos[2];
            } else {
                particleEffect.offset.set(0, 0, 0);
            }

            if (classCfg.duration) {
                particleEffect.setParticleDuration(MATH.randomBetween(classCfg.duration[0], classCfg.duration[1]));
            } else {
                particleEffect.setParticleDuration(0);
            }

            particleEffect.setParticlePos(effectOfClass.pos);
            particleEffect.setParticleQuat(effectOfClass.quat);
            effectOfClass.activeParticles.push(particleEffect);
            EffectAPI.activateParticleEffect(particleEffect)

        };

        recoverEffectOfClass = function(effectOfClass) {
            this.effectPools[effectOfClass.getEffectId()].returnToExpandingPool(effectOfClass);
        };

    }

    export { EffectBuilder }

