import {MATH} from "../MATH.js";

class ScalarTransition {
    constructor() {
        this.from = 0;
        this.to = 0;
        this.delta = 0;
        this.frameValue = 0;
        this.elapsedTime = 0;
        this.startTime = 0;
        this.targetTime = 0;
        this.callback = null;
        this.onArriveCallbacks = [];
        this.onFrameUpdateCallbacks = [];

        let update = function(tpf) {
            this.updateFrame(tpf);
        }.bind(this)

        this.call = {
            update:update
        }

    }

    initScalarTransition(from, to, overTime, callback, curve, onFrameUpdateCB) {
        this.curve = curve || 'curveSigmoid'
        this.from = from;
        this.to = to;
        this.delta = to-from;
        this.frameValue = from;
        this.elapsedTime = 0;
        this.startTime = 0;
        this.targetTime = overTime;
        if (this.onArriveCallbacks.length === 0) {
            ThreeAPI.addPrerenderCallback(this.call.update);
        }
        if (typeof(callback) === 'function') {
            this.onArriveCallbacks.push(callback);
        }
        if (typeof(onFrameUpdateCB) === 'function') {
            this.onFrameUpdateCallbacks.push(onFrameUpdateCB);
        }
    }

    updateFrame(tpf) {

        if (this.elapsedTime+tpf < this.targetTime) {
            this.elapsedTime += tpf;
            let fraction = MATH.calcFraction(this.startTime, this.targetTime+tpf, this.elapsedTime);
            if (fraction > 1) fraction = 1;
            let curveValue = MATH[this.curve](fraction);
            this.frameValue = this.from+this.delta*curveValue;
            MATH.callAll(this.onFrameUpdateCallbacks, this.frameValue, fraction);
        } else {
            this.frameValue = this.to;
            MATH.callAll(this.onFrameUpdateCallbacks, this.frameValue, 1);
            this.cancelScalarTransition();
        }

    }

    cancelScalarTransition() {
        while (this.onArriveCallbacks.length) {
            this.onArriveCallbacks.pop()(this.frameValue, this)
        }
        MATH.emptyArray(this.onFrameUpdateCallbacks);
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }


}

export { ScalarTransition }