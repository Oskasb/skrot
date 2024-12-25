import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {MATH} from "../../application/MATH.js";
import {getFrame} from "../../application/utils/DataUtils.js";

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
        //    if (transitionEnded === false) {
                MATH.callAll(updateCallbacks, value);
        //    }
            poolReturn(transition)
            transition = null //poolFetch('ScalarTransition');
        }

        let updateFrame = 0;

        function updateControlTransition(targetValue, state, onUpdateCB) {

            let frame = getFrame().frame;
            if (updateFrame === frame) {
                if (transition !== null) {
                 //   transition.to = targetValue;
                }
                updateFrame = frame;
                console.log("same frame updateControlTransition")
                return;
            }

            let speed = state.speed || 1;
            let range = state.max - state.min;
            let diff = Math.abs(state.value - targetValue) ;
            let fraction = diff / range;
            let time = fraction / speed

            if (transition !== null) {
            //    console.log("updateScalarTransition updateControlTransition")
                transition.updateScalarTransition(targetValue, time)
            } else {

                if (updateCallbacks.indexOf(onUpdateCB) === -1) {
                    updateCallbacks.push(onUpdateCB)
                }

                transition = poolFetch('ScalarTransition');
            //    transitionEnded = false;
                transition.initScalarTransition(state.value, targetValue,  time, transitionCompleted , null, transitionProgressUpdate)
            }


        }

        this.call = {
            updateControlTransition:updateControlTransition
        }

    }

}

export {ControlTransition}