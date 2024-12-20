import {poolFetch} from "../../application/utils/PoolUtils.js";

class PieceInput {
    constructor(controllablePiece, id, json) {


        let isActive = false;

        let statusMap = {};
        let domUiElement;


        let inputTargets = json['input_targets'];


        function updateInputStatus(inputToTarget) {
            let sample = inputToTarget.sample;
            let target = inputToTarget.target;
            statusMap[target] = controllablePiece.getInputState(target);
            controllablePiece.setInputTargetState(target, statusMap[sample]);
        }


        function update() {
            if (isActive === false) {
                activate();
                return;
            }

            for (let i = 0; i < inputTargets.length; i++) {
                updateInputStatus(inputTargets[i]);
            }

            domUiElement.call.update();

        }

        function elemReady(domUi) {
            domUiElement = domUi;
            isActive = true;
        }


        function activate() {
            let elem = poolFetch(json['ui']);
            elem.call.initElement(statusMap, 'ui/'+json['html'], json['class'], elemReady)
        }

        this.call = {
            update:update
        }

    }

}

export {PieceInput}