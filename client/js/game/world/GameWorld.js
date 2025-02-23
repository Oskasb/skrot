import {poolFetch} from "../../application/utils/PoolUtils.js";
import {GameScenario} from "./scenarios/GameScenario.js";

let pieces = []

class GameWorld {
    constructor() {

        let activeScenario = null;

        function loadGamePiece(name, callback, pos, rot) {
            let controllable = poolFetch('ControllablePiece');
            controllable.initControllable(name, callback, pos, rot);
        }

        function update() {

        }

        function loadScenario(fileName) {
            if (activeScenario !== null) {
                activeScenario.call.close();
            }
            console.log("Load Scenario: ", fileName)
            activeScenario = new GameScenario(fileName);
        }

        this.call = {
            loadScenario:loadScenario,
            loadGamePiece:loadGamePiece,
            update:update
        }

    }

    initGameWorld() {
        ThreeAPI.addPostrenderCallback(this.call.update);
    }

}

export { GameWorld }