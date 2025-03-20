import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Object3D} from "three/webgpu";
import {MATH} from "../../../application/MATH.js";
import {
    applyActiveBulletForce,
    callBodyActivation, getBodyByPointer,
    getBodyPointer,
    rayTest
} from "../../../application/utils/PhysicsUtils.js";
import {activateWorldEffects} from "../../../3d/three/assets/WorldEffect.js";
import {createGeometryInstance} from "../../../3d/three/assets/GeometryInstance.js";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {activatePhysicsProbe} from "../../../application/physics/PhysicsLodGrid.js";
import {getGamePlayer} from "../../../Client.js";

const tempVec = new Vector3();
const defaultHitFx = ["particles_hit_cannon"]

const splashEvt ={
    pos:new Vector3(),
    normal:new Vector3(),
    velocity: new Vector3(),
    hitDot:0
}



let bulletIndex = 0;

class ActiveBullet {

    constructor() {

        const obj3d = new Object3D();
        const vel = new Vector3();
        const bullet = this;


        const info = {
            age:0,
            mass:0.1,
            duration:1,
            hit_fx:defaultHitFx,
            geometryInstance: null,
            bulletIndex:bulletIndex
        }
        this.info = info;
        bulletIndex++;

        function updateVisualBullet() {
            if (info.geometryInstance !== null) {
                obj3d.scale.multiplyScalar(3);
                info.geometryInstance.call.applyTrxObj(obj3d);
            }

        }

        function updatePhysicalBullet(stepTime) {

            info.age += stepTime;

            if (info.age > info.duration) {
                closeBullet();
                return;
            }

            tempVec.set(0, -9.8  , 0);
            tempVec.add(vel);
            tempVec.multiplyScalar(stepTime);
            vel.multiplyScalar(0.999)
            obj3d.scale.set(info.caliber, info.caliber, tempVec.length())
            tempVec.add(obj3d.position);
            obj3d.lookAt(tempVec);

            let rayHit = rayTest(obj3d.position, tempVec, obj3d.position, tempVec);

            if (rayHit) {
                obj3d.up.copy(tempVec);
                activateWorldEffects(obj3d, info.hit_fx)
                callBodyActivation(rayHit.ptr)
                const body = getBodyByPointer(rayHit.ptr);
                if (body !== null) {
                    applyActiveBulletForce(bullet, obj3d.position, vel, body)
                }
                closeBullet();

                return;
            } else {
                obj3d.position.copy(tempVec);
            }

            if (obj3d.position.y < 0) {
                splashEvt.hitDot = 1;
                splashEvt.pos.copy(obj3d.position);
                splashEvt.pos.y = 0.5;
                splashEvt.velocity.set(0, 1,0);
                splashEvt.normal.set(0, 1,0);
                evt.dispatch(ENUMS.Event.SPLASH_OCEAN, splashEvt)
                closeBullet()
            } else {
                activatePhysicsProbe(obj3d.position)
            }

        }

        function fireBullet(sourceObj3d, sourceVelV3, exitVelMPS, bulletData) {
            info.age = 0;
            info.mass = bulletData.mass;
            info.duration = bulletData.duration;
            info.caliber = bulletData.caliber || 0.1;
            info.hit_fx = bulletData.hit_fx || defaultHitFx;

            if (info.bulletIndex % 3 === 1) {
                info.geometryInstance = createGeometryInstance("bullet_tracer", 'material_instances_8x8_add');
            } else {
                info.geometryInstance = null;
            }



            vel.set(0, 0, exitVelMPS);
            vel.applyQuaternion(sourceObj3d.quaternion);
            vel.add(sourceVelV3)

            if (bulletData.spread) {
               let rndV = MATH.randomVector();
               rndV.multiplyScalar(MATH.randomBetween(0, bulletData.spread));
               vel.add(rndV);
            };

            obj3d.position.copy(sourceObj3d.position);
            AmmoAPI.registerPhysicsStepCallback(updatePhysicalBullet);
            ThreeAPI.registerPrerenderCallback(updateVisualBullet);
        }

        function closeBullet() {
            AmmoAPI.unregisterPhysicsStepCallback(updatePhysicalBullet);
            ThreeAPI.unregisterPrerenderCallback(updateVisualBullet);
            if (info.geometryInstance !== null) {
                info.geometryInstance.call.closeGeoInstance();
            }
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