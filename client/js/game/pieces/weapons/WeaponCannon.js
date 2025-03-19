import {debugDrawDynamicPoint} from "../../../application/utils/DebugUtils.js";
import {fireBullet} from "./ActiveBullet.js";




class WeaponCannon {
    constructor() {

        const info = {
            rate:5,
            velocity:100,
            bullet:{mass:0.01},
            dynamicPoint:null,
            triggerActive:false,
            activationDuration:0,
            cooldownRemaining:0
        }

        function applyHardpointOptions(dynPoint, opts) {
            info.dynamicPoint = dynPoint;
            info.rate = opts.rate;
            info.velocity = opts.velocity;
            info.bullet = opts.bullet;
        }

        function update(stepTime) {
        //    debugDrawDynamicPoint(info.dynamicPoint);
            let vel = info.dynamicPoint.getVel()
            fireBullet(info.dynamicPoint.getObj3d(), vel, info.velocity, info.bullet)
        }

        function onAttachmentStateChange(value) {
        //    console.log("onAttachmentStateChange", value)
            if (value === 1) {
                if (info.triggerActive === false) {
                 //   console.log("info.triggerActive === false", value)
                    info.triggerActive = true
                    AmmoAPI.registerPhysicsStepCallback(update);
                }
            } else {
                if (info.triggerActive === true) {
                //    console.log("info.triggerActive === true", value)
                    info.triggerActive = false
                    AmmoAPI.unregisterPhysicsStepCallback(update);
                }
            }
        }

        this.call = {
            applyHardpointOptions:applyHardpointOptions,
            onAttachmentStateChange:onAttachmentStateChange
        }

    }
}

export { WeaponCannon }