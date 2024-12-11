class DurableStamp {
    constructor(activateEffect, recoverEffect) {
        this.effectId = null;
        this.pos = new THREE.Vector3();
        this.normal = new THREE.Vector3();
        this.quat = new THREE.Quaternion();

        this.config = null;

        this.attachParticles = [];
        this.activeParticles = [];

        let addEffectParticle = function(key, particle) {
            EffectAPI.addParticleToEffectOfClass(this.attachParticles.pop(), particle, this)
        }.bind(this);

        let getConfig = function() {
            return this.config;
        }.bind(this);

        let setConfig = function(config){
            this.config = config;
        }.bind(this);

        let setEffectId = function(effectId) {
            this.effectId = effectId;
        }.bind(this);

        let getEffectId = function() {
            return this.effectId
        }.bind(this);

        this.callbacks = {
            activateEffect : activateEffect,
            recoverEffect : recoverEffect,
            addEffectParticle:addEffectParticle,
            setConfig:setConfig,
            getConfig:getConfig,
            setEffectId:setEffectId,
            getEffectId:getEffectId
        }

    };

    setConfig = function(config) {
        this.callbacks.setConfig(config);
    };

    setEffectId = function(id) {
        this.callbacks.setEffectId(id);
    };

    getEffectId = function() {
        return this.callbacks.getEffectId();
    };

    attachParticleId = function(particleId) {
        this.attachParticles.push(particleId)
    };

    activateEffectParticle = function() {
        EffectAPI.buildEffect(this.callbacks.addEffectParticle)
    };

    activateEffectFromConfigId = function() {
        this.callbacks.activateEffect(this);
    };

    setEffectPosition = function(pos) {
        this.pos.copy(pos);
    };

    setEffectNormal = function(normal) {
        this.normal.copy(normal);
    };

    setEffectQuaternion = function(quat) {
        this.quat.copy(quat);
    };

    recoverEffectOfClass = function() {

        while (this.activeParticles.length) {
            EffectAPI.recoverParticleEffect(this.activeParticles.pop())
        }

        this.callbacks.recoverEffect(this);
    };

}

export { DurableStamp }