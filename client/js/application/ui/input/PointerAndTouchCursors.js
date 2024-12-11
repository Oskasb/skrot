import {InputState} from './InputState.js';

class PointerAndTouchCursors {

    constructor (pipelineAPI, gameScreen) {
        this.gameScreen = gameScreen;

        this.inputState = new InputState(gameScreen);

    //    this.x = 0;
    //    this.y = 0;
        this.INPUT_STATE = this.inputState.getPointerState();
        pipelineAPI.setCategoryData('INPUT_STATE', this.INPUT_STATE);

        let onInputUpdate = function(pointerState) {
            this.inputState.updateInputState(pointerState);
            GuiAPI.calls.updateInput(pointerState);
        }.bind(this);

        this.inputState.setupUpdateCallback(onInputUpdate);

    }

    getInputState = function() {
        return this.INPUT_STATE;
    };


}

export { PointerAndTouchCursors }