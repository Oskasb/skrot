import {MATH} from "../../application/MATH.js";
import {ControlTransition} from "./ControlTransition.js";

class PieceControl {
    constructor(id, state) {
        this.id = id;

        this.state = {
            min:state.min || 0,
            max:state.max || 1,
            value:state.value || 0,
            speed:state.speed || 1
        };

        state = this.state;

        let controlTransition = new ControlTransition();

        function onTransitionUpdate(value) {
            state.value = value;
        }

        let setTargetValue = function(value) {
            if (value !== state.value) {
                controlTransition.call.updateControlTransition(value, state, onTransitionUpdate)
            }
        }

        this.call = {
            setTargetValue:setTargetValue
        }

    }

    getValue() {
        return this.state.value;
    }

    setValue(value) {
        this.call.setTargetValue(MATH.clamp(value, this.state.min, this.state.max));
    }

}

export { PieceControl }