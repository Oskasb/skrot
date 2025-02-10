import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Object3D} from "three/webgpu";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {MATH} from "../../../application/MATH.js";
import {rayTest} from "../../../application/utils/PhysicsUtils.js";
import {activateWorldEffects} from "../../../3d/three/assets/WorldEffect.js";

const tempVec = new Vector3();

const defaultHitFx = ["particles_hit_cannon"]

class ActiveBullet {

    constructor() {

        const obj3d = new Object3D();
        const vel = new Vector3();
        const bullet = this;


        const info = {
            age:0,
            mass:0.1,
            duration:1,
            hit_fx:defaultHitFx
        }

        function update(stepTime) {

            info.age += stepTime;

            if (info.age > info.duration) {
                closeBullet();
                return;
            }

            tempVec.set(0, -9, 0);
            tempVec.add(vel);
            tempVec.multiplyScalar(stepTime);
            vel.multiplyScalar(0.999)

            tempVec.add(obj3d.position);
            obj3d.lookAt(tempVec);
            let rayHit = rayTest(obj3d.position, tempVec, obj3d.position, tempVec);

            if (rayHit) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, size:2.5, color:"RED"})

                obj3d.up.copy(tempVec);
                closeBullet()
                activateWorldEffects(obj3d, info.hit_fx)

             //   obj3d.lookAt(tempVec);
             //   obj3d.position.copy(tempVec);
            } else {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:tempVec, color:"YELLOW"})
                obj3d.position.copy(tempVec);
            }

        }

        function fireBullet(sourceObj3d, sourceVelV3, exitVelMPS, bulletData) {
            info.age = 0;
            info.mass = bulletData.mass;
            info.duration = bulletData.duration;
            info.hit_fx = bulletData.hit_fx || defaultHitFx;
            vel.set(0, 0, exitVelMPS);
            vel.applyQuaternion(sourceObj3d.quaternion);
            vel.add(sourceVelV3)

            if (bulletData.spread) {
               let rndV = MATH.randomVector();
               rndV.multiplyScalar(MATH.randomBetween(0, bulletData.spread));
               vel.add(rndV);
            };


            obj3d.position.copy(sourceObj3d.position);
            AmmoAPI.registerPhysicsStepCallback(update);
        }

        function closeBullet() {
            AmmoAPI.unregisterPhysicsStepCallback(update);
            poolReturn(bullet)
        }

        this.call = {
            fireBullet:fireBullet
        }
    }

}

function fireBullet(sourceObj3d, sourceVelV3, exitVelMPS, bulletData) {
    let bullet = poolFetch('ActiveBullet');
    bullet.call.fireBullet(sourceObj3d, sourceVelV3, exitVelMPS, bulletData)
}


export {
    ActiveBullet,
    fireBullet
}