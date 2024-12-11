import {GuiButtonFrame} from "./GuiButtonFrame.js";
import {poolFetch} from "../../../utils/PoolUtils.js";
import {elementColorMap, frameFeedbackMap} from "../../../../game/visuals/Colors.js";
import {checkCombatActionConditions} from "../../../../../../Server/game/action/ServerActionFunctions.js";

class GuiActorActionButton {
    constructor(actor, actionId, actorStatusKey, layoutConfId, onActivate, testActive, x, y, onReady, frameWidgetId, hpProgressId) {

        this.actor = actor;

        this.templateAction = poolFetch('ActorAction')
        this.templateAction.setActionKey(actor, actionId);

        this.name = this.templateAction.visualAction.name;
        this.iconKey = this.templateAction.visualAction.iconKey;
        this.portraitContainer;

        function getAction() {
            return actor.call.getActionByKey(actionId, actorStatusKey)
        }

        let activate = function() {
            if (buttonState === ENUMS.ButtonState.UNAVAILABLE) {
                actor.actorText.say('I need a target')
                return;
            }

            let gotAction = getAction()

            if (typeof (gotAction) === 'object') {

                if (gotAction.call.getStatus(ENUMS.ActionStatus.BUTTON_STATE) === ENUMS.ButtonState.UNAVAILABLE) {
                    return;
                }

                if (gotAction.getActionKey() === actionId) {
                    gotAction.call.updateActionCompleted()
                    return;
                }
            }

            onActivate(actionId, actorStatusKey);
        }

        let isActive = function() {

            let available = false;
            let isActivated = false;
            let inCombat = GameAPI.checkInCombat();
            if (inCombat) {
                let hasTurn = testActive(actor);
                if (hasTurn) {
                    available = true;
                }
            } else {
                available = true;
            }

            let action = getAction();

            return testActive(action)
        }

        let buttonState = null;
        let buttonStateTime = 0;
        let buttonStateDuration = 1;
        let stateProgress = 0;
        let buttonStateStartTime = 0;
        let buttonStateKey = "none";
        let newButtonState = false;

        let updateButtonState = function(tpf) {

            let gotAction = getAction() ;
            if (actorStatusKey === ENUMS.ActorStatus.TRAVEL) {
                // movement actions
                let travelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);
           //     if (actionId === travelMode) {
                    if (typeof (gotAction) === 'object') {
                        newButtonState = ENUMS.ButtonState.ACTIVE;
                    } else {
                        if (typeof (gotAction) === 'string') {
                            newButtonState = ENUMS.ButtonState.AVAILABLE;
                        } else {
                            newButtonState = ENUMS.ButtonState.DISABLED;
                        }
                    }
            //    }
            }

            if (actorStatusKey === ENUMS.ActorStatus.ACTIONS) {
                // combat action..
                if (typeof (gotAction) === 'object') {
                //    console.log("gotAction activated", gotAction)
                    newButtonState = gotAction.call.getStatus(ENUMS.ActionStatus.BUTTON_STATE);

                    let targetId = actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
                    if (!targetId) {
                        newButtonState = ENUMS.ButtonState.UNAVAILABLE
                        gotAction.call.setStatusKey(ENUMS.ActionStatus.BUTTON_STATE, newButtonState)
                    } else {
                        buttonStateStartTime =  gotAction.call.getStatus(ENUMS.ActionStatus.STEP_START_TIME)
                        buttonStateDuration = gotAction.call.getStatus(ENUMS.ActionStatus.STEP_END_TIME)
                        stateProgress = MATH.calcFraction(buttonStateTime, buttonStateStartTime, buttonStateDuration);
                    }
                } else {
                    if (typeof (gotAction) === 'string') {

                        let action = this.templateAction;

                        let available = checkCombatActionConditions(actor, action)

                        if (!available) {
                            newButtonState = ENUMS.ButtonState.UNAVAILABLE
                        } else {
                            newButtonState = ENUMS.ButtonState.AVAILABLE;
                        }
                    } else {
                        newButtonState = ENUMS.ButtonState.DISABLED;
                    }
                }
            }


        //    console.log("Got Action", gotAction)
        //    newButtonState = Math.ceil(Math.random()*5);

            if (newButtonState !== buttonState) {
                buttonState = newButtonState;
                buttonStateKey = ENUMS.getKey('ButtonState', buttonState)
            //    let colorRgb = elementColorMap[buttonStateKey]
           //     this.button.guiWidget.setIconRGBA(colorRgb)
                buttonStateTime = 0;
                let frameFbConfId = frameFeedbackMap[buttonStateKey];

            this.guiWidget.icon.setFeedbackConfigId(frameFbConfId || 'feedback_icon_button_item')
            this.guiWidget.guiSurface.setFeedbackConfigId(frameFbConfId || 'feedback_icon_button_item')
            }

            buttonStateTime += tpf;
        //    this.guiWidget.guiSurface.applyStateFeedback()
            this.updateButtonState(tpf);

        }.bind(this)

        this.call = {
            updateButtonState:updateButtonState
        }

        let buttonReady = function(button) {
            button.guiWidget.setWidgetIconKey(this.iconKey)
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
                text: this.name,
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


    updateButtonState(tpf) {

        this.guiWidget.getWidgetSurface().updateInterativeState();
        this.buttonFrame.updateButtonFrame(tpf);

    }

    removeGuiWidget() {
        this.templateAction.recoverAttack()
        ThreeAPI.unregisterPrerenderCallback(this.call.updateButtonState)
        this.guiWidget.recoverGuiWidget()
    }


}

export { GuiActorActionButton }