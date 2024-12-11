import {GuiButtonFrame} from "./GuiButtonFrame.js";

class GuiControlButton {
    constructor(statusKey, layoutConfId, onActivate, testActive, x, y, onReady, frameWidgetId, labelMap) {

        this.statusKey = statusKey;

        if (!labelMap) {
            this.name = ""+statusKey;
        } else {
            if (typeof (labelMap) === 'string') {
                this.name = labelMap
            } else {
                if (typeof (labelMap) === "function") {
                    this.name = labelMap();
                } else {
                    this.name = labelMap[statusKey] || statusKey
                }
            }
        }

        this.portraitContainer;

        let updateName = function() {
            if (typeof (labelMap) === "function") {
                return labelMap();
            } else {
                return this.name
            }
        }.bind(this);


        let activate = function() {
            onActivate(statusKey);
        }

        let isActive = function() {
            return testActive(statusKey, this)
        }.bind(this)

        let updateButtonState = function(tpf) {
            this.updateButtonState(tpf);
            let name = updateName()
            if (name !== this.name) {
                this.name = name;
                this.guiWidget.printWidgetText(name);
            }

        }.bind(this)

        this.call = {
            isActive:isActive,
            updateButtonState:updateButtonState
        }

        let buttonReady = function(button) {
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;
            this.buttonFrame = new GuiButtonFrame(this.guiWidget, frameWidgetId);
            ThreeAPI.addPrerenderCallback(this.call.updateButtonState)
            onReady(this)
        }.bind(this)



        let anchorReady = function(element) {
            this.portraitContainer = element;

            let opts = {
                widgetClass:'GuiSimpleButton',
                widgetCallback:buttonReady,
                configId: layoutConfId,
                onActivate: activate,
                testActive: isActive,
                interactive: true,
                set_parent:element.guiWidget,
                text: updateName()
            };


            evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
        }.bind(this);

        let contopts = GuiAPI.buildWidgetOptions(
            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:anchorReady,
                offset_x:  x,
                offset_y:  y,
                configId:'widget_gui_anchor'
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, contopts)

    }

    setButtonFrameFeedbackConfig(configId) {
        //   this.guiWidget.guiSurface.setFeedbackConfigId('feedback_icon_button_friendly')
        this.guiWidget.guiSurface.setFeedbackConfigId(configId || 'feedback_icon_button_item')
    }

    setButtonIcon(iconKey) {
        if (this.iconKey !== iconKey) {
            this.iconKey = iconKey;
            this.guiWidget.setWidgetIconKey(this.iconKey)
        }
    }

    setIconRgba(rgba) {
        this.guiWidget.icon.setGuiIconColorRGBA(rgba)
    }

    positionByWorld(posVec) {
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:posVec, color:'YELLOW'});
        GuiAPI.worldPosToScreen(posVec, ThreeAPI.tempVec3, 0.38, 0.0)
        this.setButtonScreenPosition(ThreeAPI.tempVec3);
    }

    setButtonScreenPosition(screenPos) {
        this.guiWidget.offsetWidgetPosition(screenPos)
    }

    updateButtonState(tpf) {

        this.guiWidget.getWidgetSurface().updateInterativeState();
        this.buttonFrame.updateButtonFrame(tpf);

    }

    removeGuiWidget() {
        ThreeAPI.unregisterPrerenderCallback(this.call.updateButtonState)
    //    this.guiWidget.printWidgetText("");
        this.guiWidget.recoverGuiWidget()
    }


}

export { GuiControlButton }