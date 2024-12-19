import {poolFetch} from "../../application/utils/PoolUtils.js";

class PieceUi {
    constructor(controllablePiece, id, json) {


        let isActive = false;

        let statusMap = {};
        let domUiElement;


        function update() {
            if (isActive === false) {
                activate();
                return;
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

export {PieceUi}