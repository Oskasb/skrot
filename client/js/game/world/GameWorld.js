import {poolFetch} from "../../application/utils/PoolUtils.js";

let pieces = []

class GameWorld {
    constructor() {

        function loadGamePiece(name, callback, pos, rot) {
            let controllable = poolFetch('ControllablePiece');
            controllable.initControllable(name, callback, pos, rot);
        }

        function update() {

        }

        this.call = {
            loadGamePiece:loadGamePiece,
            update:update
        }

    }

    initGameWorld() {
        ThreeAPI.addPostrenderCallback(this.call.update);
    }

}

export { GameWorld }