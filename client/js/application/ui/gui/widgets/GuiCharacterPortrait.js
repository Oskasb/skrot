import { PortraitStatusGui } from "../game/PortraitStatusGui.js";
import {GuiButtonFrame} from "./GuiButtonFrame.js";
import {frameFeedbackMap} from "../../../../game/visuals/Colors.js";

class GuiCharacterPortrait {
    constructor(actor, layoutConfId, onActivate, testActive, x, y, onReady, frameWidgetId, hpProgressId) {
        this.portraitContainer;
        this.portraitStatusGui = new PortraitStatusGui(hpProgressId);
        this.actor = actor;
        let buttonReady = function(button) {
            button.guiWidget.setWidgetIconKey(actor.getStatus(ENUMS.ActorStatus.ICON_KEY))
            this.button = button;
            this.container = this.portraitContainer;
            this.guiWidget = button.guiWidget;

            this.buttonFrame = new GuiButtonFrame(this.guiWidget, frameWidgetId);
            this.portraitStatusGui.initPortraitStatusGui(actor, button);
            ThreeAPI.addPrerenderCallback(this.portraitStatusGui.callbacks.updateCharStatGui)
            onReady(this)
        }.bind(this)

        let activate = function() {
            onActivate(actor);
        }

        let isActive = function() {

            if (this.actor.call.getRemote()) {
                let attitude = this.actor.getStatus(ENUMS.ActorStatus.ATTITUDE) || 'ITEM';
                let frameFbConfId = frameFeedbackMap[attitude];
                this.button.guiWidget.guiSurface.setFeedbackConfigId(frameFbConfId || 'feedback_icon_button_item')
                this.button.guiWidget.guiSurface.applyStateFeedback()
            }

            return testActive(actor)
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
                text: actor.getStatus(ENUMS.ActorStatus.NAME),
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

        this.call = {
            isActive:isActive
        }

    }

    updatePortraitInteractiveState(turnIndex) {
        if (typeof (turnIndex) !== 'undefined') {
            if (this.actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {
                this.buttonFrame.setFrameState('turn_active');
            } else {
                let doneTurn = this.actor.getStatus(ENUMS.ActorStatus.TURN_DONE)
                if (doneTurn === turnIndex) {
                    this.buttonFrame.setFrameState('turn_done');
                } else {
                    this.buttonFrame.setFrameState('turn_await');
                }
            }
        }

        this.guiWidget.getWidgetSurface().updateInterativeState();
    }

    updateCharacterPortrait(tpf, turnIndex) {

        this.updatePortraitInteractiveState(turnIndex)
        this.buttonFrame.updateButtonFrame(tpf);

        if (this.portraitStatusGui) {
            this.portraitStatusGui.updateCharacterStatElement();

            if (this.actor.getStatus(ENUMS.ActorStatus.DEAD)) {
                let iconKey = 'dead'
                this.button.guiWidget.setWidgetIconKey(iconKey)
            } else {
                let iconKey = this.actor.getStatus(ENUMS.ActorStatus.ICON_KEY)
                this.button.guiWidget.setWidgetIconKey(iconKey)
            }
        }
    }

    closeCharacterPortrait() {
        ThreeAPI.unregisterPrerenderCallback(this.portraitStatusGui.callbacks.updateCharStatGui)
        this.guiWidget.recoverGuiWidget()
    }

}

export { GuiCharacterPortrait }