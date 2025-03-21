import {poolFetch} from "../../application/utils/PoolUtils.js";

class PieceInput {
    constructor(controllablePiece, id, json) {

        let isActive = false;
        let statusMap = {};
        let domUiElement = null;

        let inputTargets = json['input_targets'];
        let feedback = json['feedback'] || [];

        let selections = json['selections'] || [];

        if (selections.length) {
            statusMap['selections'] = selections;
        }

        for (let i = 0; i < inputTargets.length; i++) {
            statusMap[inputTargets[i].sample] = inputTargets[i].init || 0;
            statusMap[inputTargets[i].target] = inputTargets[i].init || 0;
            if (inputTargets[i].keyAdd) {
                statusMap[inputTargets[i].sample+'_add'] = inputTargets[i].keyAdd;
            }
            if (inputTargets[i].keySub) {
                statusMap[inputTargets[i].sample+'_sub'] = inputTargets[i].keySub;
            }
        }

        function updateInputStatus(inputToTarget, setValue) {
            let sample = inputToTarget.sample;
            let target = inputToTarget.target;
            statusMap[target] = controllablePiece.getInputState(target);
            if (typeof (setValue) === 'number') {
                controllablePiece.setInputTargetState(target, setValue);
            } else {
                controllablePiece.setInputTargetState(target, statusMap[sample]);
            }

            statusMap['output_'+target] = controllablePiece.getControlStateValue(target);

            let dynamicTargets = controllablePiece.getControlStateTargets(target);

            for (let i = 0; i < dynamicTargets.length; i++) {
                let dynamicId = dynamicTargets[i].dynamic;
                let dynamic = controllablePiece.assetInstance.getControlDynamic(dynamicId)
                if (typeof (setValue) === 'number') {
                    dynamic.setTargetState(setValue);
                    dynamic.state.value = setValue;
                }
                if (!dynamic) {
                    statusMap[dynamicId] = 0;
                } else {
                    statusMap[dynamicId] = dynamic.state.value;
                }
            }

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

            for (let i = 0; i < feedback.length; i++) {
                let statusKey = feedback[i].status;
                statusMap[statusKey] = controllablePiece.getStatus(statusKey);
            }

            domUiElement.call.update();

        }

        function elemReady() {
            isActive = true;
        }

        function activate() {
            domUiElement= poolFetch(json['ui']);
            domUiElement.call.initElement(statusMap, 'ui/'+json['html'], json['class'], elemReady)
        }

        function close() {
            domUiElement.call.closeElement();
        }

        function setInputValue(value) {
            for (let i = 0; i < inputTargets.length; i++) {
                updateInputStatus(inputTargets[i], value);
            }
        }

        this.call = {
            setInputValue:setInputValue,
            update:update,
            close:close
        }

    }

}

export {PieceInput}