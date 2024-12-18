import {poolFetch} from "../../application/utils/PoolUtils.js";

let pieces = []

class GameWorld {
    constructor() {

        function loadGamePiece(name, callback) {
            let controllable = poolFetch('ControllablePiece');
            controllable.initControllable(name, callback);
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