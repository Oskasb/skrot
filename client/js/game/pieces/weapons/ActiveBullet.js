import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Object3D} from "three/webgpu";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";

const tempVec = new Vector3();

class ActiveBullet {

    constructor() {

        const obj3d = new Object3D();
        const vel = new Vector3();
        const bullet = this;


        const info = {
            age:0,
            mass:0.1,
            duration:1
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
            obj3d.position.add(tempVec);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:obj3d.position, size:2, color:"YELLOW"})
        }

        function fireBullet(sourceObj3d, sourceVelV3, exitVelMPS, bulletData) {
            info.age = 0;
            info.mass = bulletData.mass;
            info.duration = bulletData.duration;
            vel.set(0, 0, exitVelMPS);
            vel.applyQuaternion(sourceObj3d.quaternion);
            vel.add(sourceVelV3)
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