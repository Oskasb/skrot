import {Object3D} from "../../../libs/three/core/Object3D.js";
import { Vector3 } from "../../../libs/three/math/Vector3.js";
let tempVec3 = new Vector3();
let tempObj = new Object3D();

class ParticleEffect {
    constructor() {
        this.particle_id = null;
        this.spawner_id = "additive_particles_8x8";
        this.pos = new THREE.Vector3();
        this.offset = new THREE.Vector3();
        this.offsetMax = new THREE.Vector3();
        this.quat = new THREE.Quaternion();
        this.normal = new THREE.Vector3(0, 1, 0);
        this.rotZ = 0;
        this.spreadPos = 0;
        this.size = 2+Math.random()*3;
        this.attackTime = 1;
        this.releaseTime = 1;
        this.colorRgba = {r:1, g:1, b:1, a: 1};


        this.defaults = {
            particle_id: "additive",
            spawner_id: "additive_particles_8x8",
            "spread_pos_min": 0,
            "spread_pos_max": 0,
            "rot_z_min":0,
            "rot_z_max":0,
            "size_min": 7,
            "size_max": 22,
            "color_min": [0.95, 0.95, 0.95, 1],
            "color_max": [1, 1, 1, 1],
            "sprite": [0, 0, 1, 0]
        };


        this.sprite = [0, 7];

        this.isActive = false;

        let setConfig = function(config){
            this.config = {};
            for (let key in this.defaults) {
                this.config[key] = this.defaults[key]
            }
            for (let key in config) {
                this.config[key] = config[key]
            }

            setSpawnerId(this.config.spawner_id)

        }.bind(this);

        let setParticleId = function(particle_id) {
            this.particle_id = particle_id;
        }.bind(this);

        let getParticleId = function() {
            return this.particle_id
        }.bind(this);


        let getSpawnerId = function() {
            return this.spawner_id
        }.bind(this)

        let setSpawnerId = function(spawner_id) {
            this.spawner_id = spawner_id
        }.bind(this)

        let getParticleProgress = function(bufferElement) {
            return bufferElement.getLifecycleProgress();
        }

        this.callbacks = {
            setConfig:setConfig,
            getParticleId:getParticleId,
            setParticleId:setParticleId,
            getSpawnerId:getSpawnerId,
            setSpawnerId:setSpawnerId,
            getParticleProgress:getParticleProgress
        };

        this.bufferElement;
    };

    setParticleId = function(id) {
        this.callbacks.setParticleId(id);
    };

    getParticleId = function() {
        return this.callbacks.getParticleId();
    };

    setConfig = function(config) {
        this.callbacks.setConfig(config);
    };

    getSpawnerId = function() {
        return this.callbacks.getSpawnerId();
    };



    setParticlePos = function(pos) {
        this.pos.copy(pos);

        if (this.bufferElement) {
            if (this.spreadPos !== 0) {
                let progress = this.callbacks.getParticleProgress(this.bufferElement);
                this.offset.copy(this.offsetMax);
            //    console.log(progress)
                this.offset.multiplyScalar(Math.sin(progress*3.14));
                this.pos.add(this.offset);
            }

            this.bufferElement.setPositionVec3(this.pos);
        }
    };

    setParticleColor = function(rgba) {
        this.colorRgba.r = rgba.r;
        this.colorRgba.g = rgba.g;
        this.colorRgba.b = rgba.b;
        this.colorRgba.a = rgba.a;
        if (this.bufferElement) {
            this.bufferElement.setColorRGBA(this.colorRgba);
        }
    };

    setParticleTileXY = function(x, y) {
        if (this.bufferElement) {
            this.bufferElement.sprite.x = x;
            this.bufferElement.sprite.y = y;
            this.bufferElement.setSprite(this.bufferElement.sprite);
        }
    };


    setParticleNormal = function(normal) {
        this.normal.copy(normal);
    };

    scaleParticleSize = function(scale) {
        if (this.bufferElement) {
            this.bufferElement.scaleUniform(this.size * scale);
        }
    };

    endEffectLifecycle = function() {
        if (this.bufferElement) {
            this.bufferElement.endLifecycleNow();
            this.bufferElement.scaleUniform(0);
        }
    };

    setParticleQuat = function(quat) {
        this.quat.copy(quat);
        if (this.bufferElement) {
            if (this.rotZ !== 0) {
                tempObj.quaternion.copy(this.quat);
                tempObj.rotateZ(this.rotZ);
                this.quat.copy(tempObj.quaternion);
            }
            this.bufferElement.setQuat(this.quat);
        }
    };

    setParticleDuration = function(duration) {
        this.duration = duration;
    };

    setParticleLifecycle = function(startTime, attackTime, endTime, decayTime) {
        if (this.bufferElement) {
            this.bufferElement.setLifecycle(startTime, attackTime, endTime, decayTime);
            this.bufferElement.applyLifecycle();
        }
    };

    applyConfig = function() {

        this.size = MATH.randomBetween(this.config.size_min, this.config.size_max) || 5;

        this.colorRgba.r = MATH.randomBetween(this.config.color_min[0], this.config.color_max[0]) || 1;
        this.colorRgba.g = MATH.randomBetween(this.config.color_min[1], this.config.color_max[1]) || 1;
        this.colorRgba.b = MATH.randomBetween(this.config.color_min[2], this.config.color_max[2]) || 1;
        this.colorRgba.a = MATH.randomBetween(this.config.color_min[3], this.config.color_max[3]) || 1;
        this.rotZ = MATH.randomBetween(this.config.rot_z_min, this.config.rot_z_max)*MATH.TWO_PI || 0;
        this.spreadPos = MATH.randomBetween(this.config.spread_pos_min, this.config.spread_pos_max) || 0;


        this.sprite[0] = this.config.sprite[0] || 0;
        this.sprite[1] = this.config.sprite[1] || 7;
        this.sprite[2] = this.config.sprite[2] || 1;
        this.sprite[3] = this.config.sprite[3] || 0;

        this.attackTime = this.config.attack_time   || 1;
        this.releaseTime =this.config.release_time  || 1;

        if (this.config.surface) {

            if (this.pos.y < 0) {
                this.pos.y = 0;
                this.normal.set(0, 1, 0)
            }
        }

    };

    getParticleEffectBuffer = function() {
        return this.bufferElement;
    };

    setBufferElement = function(bufferElement) {

        this.bufferElement = bufferElement;

        if (this.spreadPos !== 0) {
            MATH.randomVector(tempVec3);
            tempVec3.multiplyScalar(this.spreadPos)
            this.offsetMax.copy(tempVec3)
        }

        this.bufferElement.setPositionVec3(this.pos);
        if (this.rotZ !== 0) {
            tempObj.quaternion.copy(this.quat)
            tempObj.rotateZ(this.rotZ);
            tempObj.rotateY(Math.random()*5)
            tempObj.rotateX(Math.random()*5)
            this.quat.copy(tempObj.quaternion);
        }

        this.bufferElement.setQuat(this.quat);

        this.bufferElement.scaleUniform(this.size);
        this.bufferElement.sprite.x = this.sprite[0];
        this.bufferElement.sprite.y = this.sprite[1];
        this.bufferElement.sprite.z = this.sprite[2];
        this.bufferElement.sprite.w = this.sprite[3];

        this.bufferElement.setSprite(this.bufferElement.sprite);
        this.bufferElement.setColorRGBA(this.colorRgba);

        this.bufferElement.setAttackTime(this.attackTime);
        if (this.duration) {
        //    console.log("Duration: ", this.duration);
            this.bufferElement.applyDuration(this.duration);
        }

        this.bufferElement.setReleaseTime(this.releaseTime);
        this.bufferElement.startLifecycleNow();


    };


}
export { ParticleEffect }