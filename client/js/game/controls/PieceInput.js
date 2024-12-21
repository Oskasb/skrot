import {poolFetch} from "../../application/utils/PoolUtils.js";

class PieceInput {
    constructor(controllablePiece, id, json) {

        let isActive = false;
        let statusMap = {};
        let domUiElement = null;

        let inputTargets = json['input_targets'];

        for (let i = 0; i < inputTargets.length; i++) {
            statusMap[inputTargets[i].sample] = inputTargets[i].init || 0;
            statusMap[inputTargets[i].target] = inputTargets[i].init || 0;
        }

        function updateInputStatus(inputToTarget) {
            let sample = inputToTarget.sample;
            let target = inputToTarget.target;
            statusMap[target] = controllablePiece.getInputState(target);
            controllablePiece.setInputTargetState(target, statusMap[sample]);
            statusMap['output_'+target] = controllablePiece.getControlStateValue(target);
        }


        function update() {
            if (isActive === false) {
                if (domUiElement === null) {
                    activate();
                }

                return;
            }

            for (let i = 0; i < inputTargets.length; i++) {
                updateInputStatus(inputTargets[i]);
            }

            domUiElement.call.update();

        }

        function elemReady() {
            isActive = true;
        }


        function activate() {
            console.log("Activate Piece Input", json)
            domUiElement= poolFetch(json['ui']);
            domUiElement.call.initElement(statusMap, 'ui/'+json['html'], json['class'], elemReady)
        }

        this.call = {
            update:update
        }

    }

}

export {PieceInput}