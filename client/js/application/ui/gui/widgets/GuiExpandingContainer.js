import { GuiWidget} from "../elements/GuiWidget.js";

class GuiExpandingContainer {
    constructor(options) {

            this.options = {};
            for (var key in options) {
                this.options[key] = options[key];
            }

        };

        initExpandingContainer = function(widgetConfig, onReady) {
            this.guiWidget = new GuiWidget(widgetConfig);
            this.guiWidget.initGuiWidget(null, onReady);
        };

        setGuiWidget = function(guiWidget) {
            this.guiWidget = guiWidget;
        };


        removeGuiWidget = function() {
            this.guiWidget.removeChildren();
            this.guiWidget.recoverGuiWidget();
        };

        addChildWidgetToContainer = function(guiWidget) {
            this.guiWidget.disableWidgetInteraction();
            this.guiWidget.addChild(guiWidget);
            this.fitContainerChildren()
        };

        fitContainerChildren = function() {
            this.guiWidget.applyWidgetPosition()
        };

        addToOffsetXY = function(x, y) {
            this.guiWidget.pos.x += x;
            this.guiWidget.pos.y += y;
        //    this.guiWidget.updateSurfacePositions();
            this.guiWidget.applyWidgetPosition()
        };

        setTestActiveCallback = function(cb) {
            this.guiWidget.addTestActiveCallback(cb);
        };

    }

export { GuiExpandingContainer}