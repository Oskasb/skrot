class GuiSimpleButton {
    constructor(options) {

            this.options = {};
            for (var key in options) {
                this.options[key] = options[key];
            }
        };

        setGuiWidget = function(guiWidget) {
            this.guiWidget = guiWidget;
        };

        removeGuiWidget = function() {
            this.guiWidget.recoverGuiWidget();
        };

        pressButtonFromCode = function() {
            this.guiWidget.notifyElementActivate(0);
            this.guiWidget.getWidgetSurface().updateInterativeState();
        };

        setTestActiveCallback = function(cb) {
            this.guiWidget.addTestActiveCallback(cb);
        };

    }

    export { GuiSimpleButton }