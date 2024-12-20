import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {MATH} from "../../application/MATH.js";

class ControlTransition {
    constructor() {

        let transition = null;

        let updateCallbacks = [];

        function transitionProgressUpdate(value) {
            MATH.callAll(updateCallbacks, value);
            if (oldTransition !== null) {
                poolReturn(oldTransition);
            }
        }

        function transitionCompleted(value) {
            MATH.callAll(updateCallbacks, value);
            transition = null;
            if (oldTransition !== null) {
                poolReturn(oldTransition);
            }
        }

        let oldTransition = null;

        function updateControlTransition(targetValue, state, onUpdateCB) {
            if (transition !== null) {
                oldTransition = transition;
                transition.cancelScalarTransition()
            }

                if (updateCallbacks.indexOf(onUpdateCB) === -1) {
                    updateCallbacks.push(onUpdateCB)
                }

            transition = poolFetch('ScalarTransition');

                let speed = state.speed || 1;
                let range = state.max - state.min;
                let diff = targetValue - state.value;
                let fraction = diff / range;


            transition.initScalarTransition(state.value, targetValue,  1 / speed, transitionProgressUpdate, null, transitionCompleted)
        }

        this.call = {
            updateControlTransition:updateControlTransition
        }

    }

}

export {ControlTransition}