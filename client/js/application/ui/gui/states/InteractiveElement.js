class InteractiveElement {

    constructor(surface) {
            this.surfaceElement = surface;
            this.state = ENUMS.ElementState.NONE;
            this.hoverIndices = [];
            this.pressIndices = [];
            this.onHoverCallbacks = [];
            this.onActivateCallbacks = [];
            this.pressActive = false;
        };

        addOnHoverCallback(callback) {
            this.onHoverCallbacks.push(callback);
        };

    addOnActivateCallback(callback) {
        this.onActivateCallbacks.push(callback);
    };

        getSurfaceElement = function() {
            return this.surfaceElement;
        };

        testSurfaceIntersects = function(vec3) {
            return this.surfaceElement.testIntersection(vec3.x, vec3.y);
        };

        setInteractiveState = function(state) {
            this.state = state;
            this.getSurfaceElement().applyStateFeedback()
        };


        getInteractiveElementState = function() {
            return this.state;
        };

        releasePressIndex = function(inputIndex) {
            MATH.splice(this.pressIndices, inputIndex);
        };

        releaseHoverIndex = function(inputIndex) {
            MATH.splice(this.hoverIndices, inputIndex);
        };

        notifyPointerPress = function(inputIndex, guiPointer) {
        //    GuiAPI.printDebugText("INTERACTIVE ELEM - PRESS START");
            this.pressActive = true;
            if (this.pressIndices.indexOf(inputIndex) === -1) {
                this.pressIndices.push(inputIndex);
                if (this.pressIndices.length === 1) {
                    this.onPressStart(inputIndex, guiPointer)
                }
            }
        };


        notifyHoverStateOn = function(inputIndex) {

            if (this.hoverIndices.indexOf(inputIndex) === -1) {
                this.hoverIndices.push(inputIndex);
                this.onHover()

            } else {

                if (this.pressActive) {
                    this.releasePressIndex(inputIndex);
                //    this.onPressActivate(inputIndex);
                    this.pressActive = false;
                }
            }
        };

        notifyInputOutside = function(inputIndex) {
            this.pressActive = false;
            if (this.hoverIndices.indexOf(inputIndex) !== -1) {

                this.releaseHoverIndex(inputIndex);
                this.releasePressIndex(inputIndex);

                if (!this.hoverIndices.length) {
                    this.onHoverEnd()
                }
            }
        };


        onHover = function() {
            this.applyHoverState()
            MATH.callAll(this.onHoverCallbacks, this)
        //    GuiAPI.printDebugText("INTERACTIVE ELEMENT STATE: " + ENUMS.getKey('ElementState', this.state));
        };

        onHoverEnd = function() {
            this.applyActiveState();
            MATH.emptyArray(this.onActivateCallbacks)
        //    GuiAPI.printDebugText("INTERACTIVE ELEMENT STATE: " + ENUMS.getKey('ElementState', this.state));
        };

        onPressStart = function(inputIndex, guiPointer) {
            this.getSurfaceElement().triggerPressStart(inputIndex, guiPointer);
            this.applyPressState();
         //   GuiAPI.printDebugText("INTERACTIVE ELEMENT STATE: " + ENUMS.getKey('ElementState', this.state));
        };

        onPressActivate = function(inputIndex) {
            MATH.callAndClearAll(this.onActivateCallbacks, inputIndex)
            this.getSurfaceElement().triggerActiveate(inputIndex);
            this.applyActiveState();
        //    GuiAPI.printDebugText("INTERACTIVE ELEMENT STATE: " + ENUMS.getKey('ElementState', this.state));
        };


        applyHoverState = function() {

        //    GuiAPI.debugDrawRectExtents(this.surfaceElement.minXY, this.surfaceElement.maxXY);
            if ( this.getSurfaceElement().getActive()) {
                this.setInteractiveState(ENUMS.ElementState.ACTIVE_HOVER);
            } else {
                this.setInteractiveState(ENUMS.ElementState.HOVER);
            }
         //   GuiAPI.printDebugText("INTERACTIVE ELEMENT STATE: " + ENUMS.getKey('ElementState', this.state));
        };

        applyActiveState = function() {
            MATH.callAndClearAll(this.onActivateCallbacks)
            if ( this.getSurfaceElement().getActive()) {
                this.setInteractiveState(ENUMS.ElementState.ACTIVE);
            } else {
                this.setInteractiveState(ENUMS.ElementState.NONE);
            }
        };

        applyPressState = function() {
            MATH.callAndClearAll(this.onActivateCallbacks)
            if ( this.getSurfaceElement().getActive()) {
                this.setInteractiveState(ENUMS.ElementState.ACTIVE_PRESS);
            } else {
                this.setInteractiveState(ENUMS.ElementState.PRESS);
            }

        };


    }

    export { InteractiveElement }

