import {poolReturn} from "../../../application/utils/PoolUtils.js";
import {instanceIndex} from "../../../../../libs/three/Three.TSL.js";

let splashes = [];

let count = 0;

class OceanSplash {
    constructor() {

        let splashIndex = count;
        count++

        function applySplash(e, particles, positions, velocities) {

            let pos = e.pos;
            const position = positions.element( splashIndex );

            position.x = pos.x;
            position.y = pos.y;
            position.z = pos.z;
        }

        this.call = {
            applySplash:applySplash
        }

    }

    initSplash(splashEvent, particles, positionBuffer, velocityBuffer) {

        if (splashes.length + 2 > particles.count) {
            splashes.shift().clearSplash();
        }

        splashes.push(this);
        this.call.applySplash(splashEvent, particles, positionBuffer, velocityBuffer);
    }

    clearSplash() {
        poolReturn(this);
    }


}

export { OceanSplash }