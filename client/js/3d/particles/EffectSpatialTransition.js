import { Vector3 } from "../../../libs/three/math/Vector3.js";
let tempVec3 = new Vector3();
class EffectSpatialTransition {
    constructor(gameEffect) {

        this.gameEffect = gameEffect;

        this.startTime = 0;
        this.targetTime = 1;
        this.targetSpatial = null;
        this.startObj3D = new THREE.Object3D();
        this.targetObj3D = new THREE.Object3D();
        this.startSize = 0;
        this.endSize = 0;
        this.spread = 0;
        this.bounce = 1;
        this.getPosFunction = null;
        this.getOriginFunction = null;

        let tickMovement = function(tpf, gameTime) {
            this.applyFrameToMovement(tpf, gameTime);
        }.bind(this);

        this.callbacks = {
            onGameUpdate:tickMovement
        }

        this.onArriveCallbacks = [];

    }

    addArriveCallback(cb) {
        if (this.onArriveCallbacks.indexOf(cb) === -1) {
            this.onArriveCallbacks.push(cb)
        }
    }

    applyTransitionOptions(opts) {
        this.targetTime = this.startTime+opts.time;

        if (typeof(opts.fromPos) === 'function') {
            this.getOriginFunction = opts.fromPos;
            this.startObj3D.position.copy(opts.fromPos())
        } else {
            this.startObj3D.position.copy(opts.fromPos);
            this.getOriginFunction = null;
        }

        this.startObj3D.quaternion.copy(opts.fromQuat);
        this.startObj3D.scale.set(opts.fromSize, opts.fromSize, opts.fromSize)
        this.targetObj3D.position.copy(opts.toPos);
        this.targetObj3D.quaternion.copy(opts.toQuat);
        this.targetObj3D.scale.set(opts.toSize, opts.toSize, opts.toSize)

        this.startSize = opts.fromSize;
        this.endSize = opts.toSize;
        this.bounce = opts.bounce || 0;
        this.spread = opts.spread || 0;

        if (typeof(opts.callback) === 'function') {
            this.addArriveCallback(opts.callback)
        }

        if (typeof(opts.getPosFunc) === 'function') {
            this.getPosFunction = opts.getPosFunc;
        } else {
            this.getPosFunction = null;
        }
    }

    initEffectTransition(opts) {
        let now = client.getFrame().systemTime;;
        this.startTime = now;
        this.applyTransitionOptions(opts);
    }

    interpolatePosition() {
        let now = client.getFrame().systemTime;;
        if (this.targetTime > now) {
            let fraction = MATH.calcFraction(this.startTime, this.targetTime, now);
            if (fraction > 1) fraction = 1;

        //    this.targetSpatial.getSpatialPosition(this.targetPos);

        //    this.targetObj3D.position.y+=Math.sin(fraction*Math.PI)*0.7+1.1;
            let size = MATH.interpolateFromTo(this.startSize, this.endSize, fraction);

            if (this.getPosFunction) {
                this.targetObj3D.position.copy(this.getPosFunction())
            }

            if (this.getOriginFunction) {
                this.startObj3D.position.copy(this.getOriginFunction())
            }

            MATH.interpolateVec3FromTo(this.startObj3D.position, this.targetObj3D.position, MATH.curveSqrt(fraction), tempVec3 , 'curveSigmoid');
            tempVec3.y += Math.sin(fraction*Math.PI)*this.bounce;



            let sinPos = Math.sin(fraction*MATH.HALF_PI)*Math.cos(fraction*MATH.HALF_PI);
            let fracMod = MATH.curveSigmoid(sinPos)*this.spread;
            tempVec3.x += fracMod
            tempVec3.z += fracMod
            let tempQuat = ThreeAPI.tempObj.quaternion;
            tempQuat.slerpQuaternions(this.startObj3D.quaternion, this.targetObj3D.quaternion, fraction)

            this.gameEffect.setEffectPosition(tempVec3);
            this.gameEffect.setEffectQuaternion(tempQuat);

            this.gameEffect.scaleEffectSize(size);

        } else {
            MATH.callAndClearAll(this.onArriveCallbacks, this.gameEffect);
        //    MATH.emptyArray(this.onArriveCallbacks);
        }
    }

    cancelSpatialTransition() {
        MATH.callAll(this.onArriveCallbacks, this.gameEffect);
        MATH.emptyArray(this.onArriveCallbacks);
    }

    applyFrameToMovement(tpf, gameTime) {
        if (this.targetTime+tpf > gameTime) {
            this.interpolatePosition(tpf);
        }
    }

}

export { EffectSpatialTransition }