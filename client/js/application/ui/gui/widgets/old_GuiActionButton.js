import { GuiWidget} from "../elements/GuiWidget.js";
import { Action } from "../../../../game/piece_functions/Action.js";

class GuiActionButton {
    constructor(options) {

        this.progWidgetId = 'widget_action_button_progress';
        this.progressIcon = 'progress_vertical';

        let stateFeedbackMap = {};
        stateFeedbackMap[ENUMS.ActionState.UNAVAILABLE   ] = ENUMS.ElementState.DISABLED    ;
        stateFeedbackMap[ENUMS.ActionState.AVAILABLE     ] = ENUMS.ElementState.NONE        ;
        stateFeedbackMap[ENUMS.ActionState.ACTIVATING    ] = ENUMS.ElementState.ACTIVE      ;
        stateFeedbackMap[ENUMS.ActionState.ACTIVE        ] = ENUMS.ElementState.ACTIVE_PRESS;
        stateFeedbackMap[ENUMS.ActionState.ON_COOLDOWN   ] = ENUMS.ElementState.DISABLED    ;
        stateFeedbackMap[ENUMS.ActionState.ENABLED       ] = ENUMS.ElementState.NONE        ;
        this.stateFeedbackMap = stateFeedbackMap;

        this.options = {};

        for (let key in options) {
            this.options[key] = options[key];
        }

        let testActive = function() {
            if (this.action) {
                return this.action.testActivatable()
            }
        }.bind(this);

        let activateAction = function(inputIndex, widget) {
            this.actionButtonActivated(inputIndex, widget);
        }.bind(this);

        let updateProgress = function(tpf, time) {
            this.updateCurrentProgress(this.getAction());
        }.bind(this);

        let actionButtonTriggerUiUpdate = function() {
            this.actionButtonTriggerUiUpdate();
        }.bind(this);

        let updateSufficientActionPoints = function(action, count) {
            this.updateSufficientActionPoints(action, count);
        }.bind(this);

        let attachActionToButton = function(action) {
            this.attachActionToButton(action);
        }.bind(this);

        let removeGuiWidget = function() {
            this.removeGuiWidget();
        }.bind(this);

        this.callbacks = {
            testActive:testActive,
            activateAction:activateAction,
            updateProgress:updateProgress,
            actionButtonTriggerUiUpdate:actionButtonTriggerUiUpdate,
            updateSufficientActionPoints:updateSufficientActionPoints,
            attachActionToButton:attachActionToButton,
            removeGuiWidget:removeGuiWidget
        }
    };


    setGuiWidget = function(widget) {
        this.guiWidget = widget;

        let progressReady = function(pwidget) {
            widget.addChild(pwidget);
        };

        widget.enableWidgetInteraction();

        this.progressWidget = new GuiWidget(this.progWidgetId);
        this.progressWidget.initGuiWidget(null, progressReady);
        this.progressWidget.setWidgetIconKey(this.progressIcon);
        this.setTestActiveCallback(this.callbacks.testActive);

        widget.attachToAnchor('bottom_right');

    };


    initActionButton = function(widgetConfig, onReady) {
        this.guiWidget = new GuiWidget(widgetConfig);

        let progressReady = function(widget) {

            this.guiWidget.addChild(widget);

        }.bind(this);

        let buttonReady = function(widget) {
            widget.enableWidgetInteraction();

            this.progressWidget = new GuiWidget(this.progWidgetId);
            this.progressWidget.initGuiWidget(null, progressReady);
            this.progressWidget.setWidgetIconKey(this.progressIcon);
            this.setTestActiveCallback(this.callbacks.testActive);

            widget.attachToAnchor('bottom_right');

            onReady(widget)

        }.bind(this);

        this.guiWidget.initGuiWidget(null, buttonReady);

    };

    setAction = function(action) {
        this.action = action;
    };


    getAction = function() {
        return this.action;
    };


    attachActionToButton = function(action) {

        this.setAction(action);
        this.guiWidget.printWidgetText(action.getActionName());
        this.guiWidget.setWidgetIconKey(action.getActionIcon());
        this.guiWidget.addOnActiaveCallback(this.callbacks.activateAction);

    };

    bindActionSlotCallbacks = function(actionSlot) {

        actionSlot.addActionPointUpdateCallback(this.callbacks.updateSufficientActionPoints);
        actionSlot.addSetSlotActionCallback(this.callbacks.attachActionToButton);
        actionSlot.addActionSlotRemovedCallback(this.callbacks.removeGuiWidget);
        actionSlot.addActionTriggeredCallback(this.callbacks.actionButtonTriggerUiUpdate);

        if (actionSlot.getSlotCurrentAction()) {
            actionSlot.notifySetSlotAction(actionSlot.getSlotCurrentAction())
        }
        this.actionSlot = actionSlot;
    };

    updateCurrentProgress = function(action) {

        if (!action.getActionText()) {
            console.log("TextMissing", action)
        } else {
            this.guiWidget.setFirstSTringText(action.getActionText());
        }

        this.progressWidget.indicateProgress(0, action.getActionTargetTime(), action.getActionProgressTime(), 1);

        this.guiWidget.setWidgetInteractiveState(this.stateFeedbackMap[action.getActionState()]);
        this.progressWidget.setWidgetInteractiveState(this.stateFeedbackMap[action.getActionState()]);

        if (!action.getActionIsActive()) {
            this.progressWidget.setFirstSTringText(null);
            this.guiWidget.enableWidgetInteraction();
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.updateProgress);
        }

    };

    actionButtonInitiateAction = function() {

        this.getAction().requestActivation();
        this.actionButtonTriggerUiUpdate();

    };

    actionButtonTriggerUiUpdate = function() {

        ThreeAPI.addPostrenderCallback(this.callbacks.updateProgress);
        this.guiWidget.disableWidgetInteraction();

    };


    actionButtonActivated = function(inputIndex, widget) {

        if (this.getAction().testAvailable()) {
            this.actionButtonInitiateAction()
        }

    };

    setTestActiveCallback = function(cb) {
        this.guiWidget.addTestActiveCallback(cb);
    };

    updateSufficientActionPoints = function(action, count) {
        this.guiWidget.setWidgetInteractiveState(this.stateFeedbackMap[action.getActionState()]);

        if (action.getActionState() === ENUMS.ActionState.UNAVAILABLE) {
            this.guiWidget.setFirstSTringText(count +'/'+action.getActionPointCost());
        } else {
            if (action.getActionState() === ENUMS.ActionState.AVAILABLE) {
                this.updateCurrentProgress(action);
            }
        }

    };

    removeGuiWidget = function() {
        this.guiWidget.recoverGuiWidget();
        this.progressWidget.recoverGuiWidget();
        ThreeAPI.unregisterPostrenderCallback(this.callbacks.updateProgress);

        if (this.actionSlot) {
            this.actionSlot.removeActionPointUpdateCallback(this.callbacks.updateSufficientActionPoints);
            this.actionSlot.removeSetSlotActionCallback(this.callbacks.attachActionToButton);
            this.actionSlot.removeActionSlotRemovedCallback(this.callbacks.removeGuiWidget);
            this.actionSlot.removeActionTriggeredCallback(this.callbacks.actionButtonTriggerUiUpdate);
        }

    };

}

export { GuiActionButton }