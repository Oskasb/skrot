import { EffectSpatialTransition } from "../EffectSpatialTransition.js";

class GameEffect {
    constructor(activateEffect, recoverEffect) {
        this.effectSpatialTransition = new EffectSpatialTransition(this)
        this.effectId = null;
        this.pos = new THREE.Vector3();
        this.normal = new THREE.Vector3();
        this.quat = new THREE.Quaternion();

        this.config = null;

        this.joint = null;

        this.attachParticles = [];
        this.activeParticles = [];

        let addEffectParticle = function(particle, key) {
            EffectAPI.addParticleToEffectOfClass(this.attachParticles.pop(), particle, this)
        }.bind(this);

        let positionUpdated = function(pos) {
            this.setEffectPosition(pos);
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

        let updateEffect = function(tpf, gameTime) {
            this.effectSpatialTransition.callbacks.onGameUpdate(tpf, gameTime)
        }.bind(this)

        let onArrive = function(gameEffect) {
            GameAPI.unregisterGameUpdateCallback(this.callbacks.updateEffect)
            //    callback(gameEffect);
        }.bind(this)

        this.callbacks = {
            activateEffect : activateEffect,
            recoverEffect : recoverEffect,
            addEffectParticle:addEffectParticle,
            positionUpdated:positionUpdated,
            setConfig:setConfig,
            getConfig:getConfig,
            setEffectId:setEffectId,
            getEffectId:getEffectId,
            updateEffect:updateEffect,
            onArrive:onArrive
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

    activateSpatialTransition(options) {
        this.effectSpatialTransition.initEffectTransition(options)
        this.effectSpatialTransition.addArriveCallback(this.callbacks.onArrive)
        GameAPI.registerGameUpdateCallback(this.callbacks.updateEffect)
    }

    activateEffectFromConfigId = function(isPermanent) {
        this.callbacks.activateEffect(this, isPermanent);
    };

    setEffectPosition = function(pos) {
        this.pos.copy(pos);
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].setParticlePos(this.pos)
        }
    };

    scaleEffectSize = function(scale) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].scaleParticleSize(scale)
        }
    };

    setEffectColorRGBA = function(rgba) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].setParticleColor(rgba)
        }
    };

    setEffectNormal = function(normal) {
        this.normal.copy(normal);
    };

    setEffectQuaternion = function(quat) {
        this.quat.copy(quat);
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].setParticleQuat(this.quat)
        }
    };

    setEffectLifecycle = function(startTime, attackTime, endTime, decayTime) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            let particle = this.activeParticles[i];
            particle.setParticleLifecycle(startTime, attackTime, endTime, decayTime);
        }
    };

    setEffectSpriteXY = function(x, y) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].setParticleTileXY(x, y)
        }
    };

    attachToJoint = function(joint) {

        joint.getDynamicPosition(this.pos);
        joint.addPositionUpdateCallback(this.callbacks.positionUpdated);
        this.activateEffectFromConfigId();
        this.joint = joint;
    };

    endEffectOfClass = function() {
        this.pos.set(0, -1000, 0)
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].endEffectLifecycle()
        }
    };

    recoverEffectOfClass = function() {
        this.pos.set(0, -1000, 0)

        this.effectSpatialTransition.cancelSpatialTransition()

        if (this.joint) {
            this.joint.removePositionUpdateCallback(this.callbacks.positionUpdated);
            this.joint = null
        }

        while (this.activeParticles.length) {
            let particleEffect = this.activeParticles.pop()
         //   console.log("Recover ", particleEffect)
            EffectAPI.recoverParticleEffect(particleEffect)
        }

        this.callbacks.recoverEffect(this);
    };


}

export { GameEffect };