import {MATH} from "../../application/MATH.js";

class PieceControl {
    constructor(id, state) {
        this.id = id;

        this.state = {
            min:state.min || 0,
            max:state.max || 1,
            value:state.value || 0
        };

    }

    getValue() {
        return this.state.value;
    }

    setValue(value) {
        this.state.value = MATH.clamp(value, this.state.min, this.state.max)
    }

}

export { PieceControl }