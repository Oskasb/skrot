import { GuiWidget} from "../elements/GuiWidget.js";

class GuiAnchors {
    constructor() {

        this.anchors = {
            center:{x:0, y:0},
            top_q_left:{x:-0.4, y:0.4},
            top_q_right:{x:0.4, y:0.4},
            top_left:{x:-0.5, y:0.5},
            top_right:{x:0.5, y:0.5},
            bottom_left:{x:-0.5, y:-0.5},
            bottom_right:{x:0.5, y:-0.5},
            stick_bottom_left: {x:-0.34, y: -0.34},
            stick_bottom_right:{x: 0.34, y: -0.34},
            stick_mid_right:{x: 0.32, y: -0.08},
            stick_more_bottom_right:{x: 0.45, y: -0.40},
            top_center:{x:0, y:0.5},
            bottom_center:{x:0, y:-0.5},
            mid_right:{x:0.5, y:0},
            mid_left:{x:-0.5, y:0},
            mid_q_right:{x:0.4, y:0},
            mid_q_left:{x:-0.4, y:0}
        };

        this.frustumFactor = 0.828;

    };

    initGuiAnchors = function() {

        for (let key in this.anchors) {
            this.addAnchor(key)
        }
    };

    addAnchor = function(key) {

        let anchorReady = function(widget) {
            widget.originalPosition.x = widget.anchor.x * this.frustumFactor;
            widget.originalPosition.y = widget.anchor.y * this.frustumFactor;
        //    GameScreen.fitView(widget.originalPosition);
            widget.pos.copy(widget.originalPosition);

            widget.applyWidgetPosition();
            GuiAPI.setAnchorWidget(widget.anchor.key, widget)
        }.bind(this);
        let anchor = new GuiWidget("widget_gui_anchor");
        anchor.anchor = this.anchors[key];
        anchor.anchor.key = key;

        anchor.initGuiWidget(null, anchorReady);

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

    setTestActiveCallback = function(cb) {
        this.guiWidget.addTestActiveCallback(cb);
    };

}

export { GuiAnchors }