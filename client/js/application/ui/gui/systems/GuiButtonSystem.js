class GuiButtonSystem {
    constructor() {

    }

    initGuiButtonSystem() {
        evt.on(ENUMS.Event.BUILD_GUI_ELEMENT, this.buildButton)
    }


    buildButton(evtArgs) {

    //    console.log(evtArgs)

        let buttonReady = function(button) {
            if (evtArgs.container) {
                evtArgs.container.addChildWidgetToContainer(button.guiWidget);
            }
            if (evtArgs.widgetCallback) {
                evtArgs.widgetCallback(button);
            } else {
            //    console.log("Button Ready, no callback registered...", button)
            }

        };

        let opts = GuiAPI.buildWidgetOptions(evtArgs);

        GuiAPI.buildGuiWidget(evtArgs.widgetClass || 'GuiSimpleButton', opts, buttonReady);

    }


}

export {GuiButtonSystem}