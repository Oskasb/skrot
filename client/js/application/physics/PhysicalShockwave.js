import {poolReturn} from "../utils/PoolUtils.js";
import {visualPhysicsImpulse, visualPhysicsShockwave} from "../../game/visuals/effects/VisualPhysisEffects.js";
import {applyPhysicalInfluenceRayProbe} from "../utils/PhysicsUtils.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";

class PhysicalShockwave {
    constructor() {

        let position = new Vector3()
        let initTime = 0;
        let size = 0;
        let duration = 0
        let strength = 0;
        let color = null;

        function close(pSw) {
            ThreeAPI.unregisterPrerenderCallback(update);
            poolReturn(pSw)
        }

        let update = function() {
            let time = GameAPI.getGameTime();
            let progress = MATH.calcFraction(initTime, initTime + duration, time);
            if (progress > 1) {
                close(this);
                progress = 1;
            }
            applyPhysicalInfluenceRayProbe(position, position, Math.ceil(size*progress * 5), size*progress, strength / (1.5-progress), visualPhysicsImpulse)
         }.bind(this)
2
        function initPhysicalShockwave(pos, sze, dur, str, clr) {
            position.copy(pos);
            size = sze;
            duration = dur;
            strength = str;
            color = clr;
            initTime = GameAPI.getGameTime();
            ThreeAPI.addPrerenderCallback(update);
            visualPhysicsShockwave(position, size, duration, color);

        }

        this.call = {
            initPhysicalShockwave:initPhysicalShockwave
        }

    }


}


export { PhysicalShockwave }