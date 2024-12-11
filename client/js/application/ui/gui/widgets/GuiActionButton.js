import { GuiWidget} from "../elements/GuiWidget.js";

let colorMap = {
    flash:{"r": 0.99, "g": 0.99, "b": 0.99, "a": 0.99},
    manual:{"r": 0.09, "g": 0.49, "b": 0.59, "a": 0.99},
    on:{"r": 0.11, "g": 0.75, "b": 0.75, "a": 0.99},
    active:{"r": 0.41, "g": 0.33, "b": 0.22, "a": 0.99},
    off:{"r": 0.69, "g":  0.25, "b": 0.25, "a": 0.99},
    ap_missing:{"r": 0.39, "g": -0.95, "b": 0.95, "a": 0.99},
    available:{"r": 0.41, "g": 0.69, "b": 0.11, "a": 0.99},
    activated:{"r": 0.59, "g": 0.49, "b": 0.05, "a": 0.99},
    unavailable:{"r": 0.3, "g": 0.5, "b": 0.3,  "a": 0.99}
}

class GuiActionButton {
    constructor(options) {

        this.colorMap = {}

        this.available = true;

        for (let key in colorMap) {
            this.colorMap[key] = colorMap[key];
        }

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

        let updateProgress = function(progress) {
            this.updateCurrentProgress(progress);
        }.bind(this);

        let updateActionStatus = function(action) {
            this.updateActionStatus(action);
        }.bind(this);

        let removeGuiWidget = function() {
            this.removeGuiWidget();
        }.bind(this);

        this.callbacks = {
            updateProgress:updateProgress,
            updateActionStatus:updateActionStatus,
            removeGuiWidget:removeGuiWidget
        }
    };

    getInteractiveElement = function() {
        return this.guiWidget.guiSurface.interactiveElement;
    }
    setGuiWidget = function(widget) {
        this.guiWidget = widget;
        console.log("Init Action Button", this)
        let progressReady = function(pwidget) {
            widget.addChild(pwidget);
        };

        widget.enableWidgetInteraction();

        this.progressWidget = new GuiWidget(this.progWidgetId);
        this.progressWidget.initGuiWidget(null, progressReady);
        this.progressWidget.setWidgetIconKey(this.progressIcon);

        //widget.attachToAnchor('bottom_center');

    };


    initActionButton = function(widgetConfig, onReady) {

        this.guiWidget = new GuiWidget(widgetConfig);

        for (let key in colorMap) {
            this.colorMap[key] = colorMap[key];
        }

        let progressReady = function(widget) {
            this.guiWidget.addChild(widget);
        }.bind(this);

        let buttonReady = function(widget) {
            console.log("Button Ready", this)

            this.progressWidget = new GuiWidget(this.progWidgetId);
            this.progressWidget.initGuiWidget(null, progressReady);
            this.progressWidget.setWidgetIconKey(this.progressIcon);

       //     widget.attachToAnchor('bottom_right');

            onReady(widget)

        }.bind(this);

        this.guiWidget.initGuiWidget(null, buttonReady);

    };

    updateAbilityProgress = function(ability) {
        let progress = 0;
        let progressStatus = ability.call.getProgressStatus();
        let cooldownStatus = ability.call.getCooldownStatus();
        let apProgress = ability.call.getActionPointStatus();


        if (progressStatus !== 0) {
            progress = progressStatus;
            this.setProgressBarColor(this.colorMap['on'])
        } else if (cooldownStatus !== 0) {
            progress = cooldownStatus;
            this.setProgressBarColor(this.colorMap['off'])
        } else if (apProgress !== 0) {
            this.setProgressBarColor(this.colorMap['ap_missing'])
            progress = apProgress;
        }

        this.progressWidget.indicateProgress(0, 1, progress, 1);
    };

    updateAbilityAvailability = function(ability) {
    //    console.log("Update avail")
        let isAvailable = ability.call.getIsAvailable();

        if (isAvailable) {
            this.getInteractiveElement().setInteractiveState(this.stateFeedbackMap[ENUMS.ActionState.AVAILABLE])
            this.setActionIconColor(this.colorMap['available'])
        } else {
            if (ability.call.getProgressStatus()) {
                this.getInteractiveElement().setInteractiveState(this.stateFeedbackMap[ENUMS.ActionState.ACTIVATING])
                this.setActionIconColor(this.colorMap['activated'])
            } else if (ability.call.getCooldownStatus()) {
                this.getInteractiveElement().setInteractiveState(this.stateFeedbackMap[ENUMS.ActionState.ACTIVE])
                this.setActionIconColor(this.colorMap['active'])
            } else if (ability.call.getInRange()) {
                this.getInteractiveElement().setInteractiveState(this.stateFeedbackMap[ENUMS.ActionState.UNAVAILABLE])
                this.setActionIconColor(this.colorMap['unavailable'])
            } else {
                this.getInteractiveElement().setInteractiveState(this.stateFeedbackMap[ENUMS.ActionState.UNAVAILABLE])
                this.setActionIconColor(this.colorMap['off'])
            }
        }

    }

    actionButtonInitiateAction = function() {
        this.getAction().requestActivation();
        this.actionButtonTriggerUiUpdate();
    };

    actionButtonTriggerUiUpdate = function() {
        this.guiWidget.disableWidgetInteraction();
    };

    setTestActiveCallback = function(cb) {
        this.guiWidget.addTestActiveCallback(cb);
    };

    removeGuiWidget = function() {
        this.guiWidget.recoverGuiWidget();
        this.progressWidget.recoverGuiWidget();
    };

    getProgressSurface = function() {
        return this.progressWidget.guiSurface;
    }

    setActionIconColor = function(rgba) {
        this.guiWidget.icon.setGuiIconColorRGBA(rgba);
    }
    setProgressBarColor = function(rgba) {
        this.progressWidget.icon.setGuiIconColorRGBA(rgba);
    }

    setFrameColor(rgba) {
        let frameSurface = this.getProgressSurface();
        frameSurface.setSurfaceColor(rgba)
    }

    flashFrame(uiSysTime) {
        let rgba = this.colorMap['flash']
        let brightness = 0.25 + Math.cos(uiSysTime*10)*0.25;
        rgba.r = Math.abs(Math.sin(uiSysTime*8))*0.49 +brightness;
        rgba.g = Math.abs(Math.cos(uiSysTime*8))*0.49 +brightness;
        rgba.b = 0.5 + brightness;
        this.setFrameColor(rgba)
    }

    updateAutoCastFeedback(ability) {
        let autocastOn = ability.call.getAutoCast();
        if (autocastOn === true) {
            this.flashFrame(GuiAPI.getUiSystemTime());
        } else {
            this.setFrameColor(this.colorMap['manual'])
        }
    }

    updateActionStatus(ability) {
        this.updateAutoCastFeedback(ability)
        this.updateAbilityAvailability(ability)
        this.updateAbilityProgress(ability)
    }

    updateActionButton = function(ability) {
        this.callbacks.updateActionStatus(ability);
    }

}

export { GuiActionButton }