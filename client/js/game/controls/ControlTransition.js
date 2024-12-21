import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {MATH} from "../../application/MATH.js";

class ControlTransition {
    constructor() {

        let transition = null;

        let updateCallbacks = [];

        function transitionProgressUpdate(value) {
        //    if (transitionEnded === false) {
                MATH.callAll(updateCallbacks, value);
         //   }
        }

        let transitionEnded = false;

        function transitionCompleted(value) {
            if (transitionEnded === false) {
                MATH.callAll(updateCallbacks, value);
            }

        }


        function updateControlTransition(targetValue, state, onUpdateCB) {

            if (transition !== null) {
                transition.cancelScalarTransition()
                transitionEnded = true;
                poolReturn(transition)
            }

                if (updateCallbacks.indexOf(onUpdateCB) === -1) {
                    updateCallbacks.push(onUpdateCB)
                }

                let speed = state.speed || 1;
                let range = state.max - state.min;
                let diff = Math.abs(state.value - targetValue) ;
                let fraction = diff / range;
                let time = fraction / speed

           if (time > 0.001) {
               transition = poolFetch('ScalarTransition');
               transitionEnded = false;
               transition.initScalarTransition(state.value, targetValue,  time, transitionProgressUpdate, null, transitionCompleted)
           } else {
               transitionEnded = false;
               transitionCompleted(targetValue);
           }

        }

        this.call = {
            updateControlTransition:updateControlTransition
        }

    }

}

export {ControlTransition}