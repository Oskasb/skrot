import { GuiWidget} from "../elements/GuiWidget.js";
import { GuiActionPoint} from "./GuiActionPoint.js";

define([
        'client/js/workers/main/ui/elements/GuiWidget',
        'client/js/workers/main/ui/widgets/GuiActionPoint',
        'client/js/workers/main/game/actions/ActionPointStatus'
    ],
    function(
        GuiWidget,
        GuiActionPoint,
        ActionPointStatus
    ) {

        var apWidgetId = 'widget_action_point';
        var progWidgetId = 'widget_action_button_progress';
        var progressIcon = 'progress_horizontal';


        var stateFeedbackMap = {};
        stateFeedbackMap[ENUMS.ActionState.DISABLED      ] = ENUMS.ElementState.DISABLED     ;
        stateFeedbackMap[ENUMS.ActionState.UNAVAILABLE   ] = ENUMS.ElementState.DISABLED     ;
        stateFeedbackMap[ENUMS.ActionState.AVAILABLE     ] = ENUMS.ElementState.ACTIVE       ;
        stateFeedbackMap[ENUMS.ActionState.ACTIVATING    ] = ENUMS.ElementState.NONE         ;
        stateFeedbackMap[ENUMS.ActionState.ACTIVE        ] = ENUMS.ElementState.ACTIVE_PRESS ;
        stateFeedbackMap[ENUMS.ActionState.ON_COOLDOWN   ] = ENUMS.ElementState.DISABLED     ;
        stateFeedbackMap[ENUMS.ActionState.ENABLED       ] = ENUMS.ElementState.ACTIVE       ;

        var tempVec1 = new THREE.Vector3();

        var GuiActionPointStatus = function(options) {

            this.options = {};
            for (var key in options) {
                this.options[key] = options[key];
            }


            this.guiActionPoints = [];
            this.releasedActionPoints = [];

            var updateActionPointStatus = function(tpf, time) {
                this.updateActionPointStatus(this.getActionPointStatus(), tpf);
            }.bind(this);

            var removeActionPointStatus = function(aps) {
                this.removeActionPointStatus(aps);
            }.bind(this);


            var gapReady = function(gap) {
                this.guiActionPoints.push(gap);
                this.guiWidget.addChild(gap.guiWidget);
            }.bind(this);


            this.callbacks = {
                updateActionPointStatus:updateActionPointStatus,
                removeActionPointStatus:removeActionPointStatus,
                gapReady:gapReady
            }
        };


        GuiActionPointStatus.prototype.initActionPointStatus = function(widgetConfig, onReady) {
            this.guiWidget = new GuiWidget(widgetConfig);

            var containerReady = function(widget) {
                widget.attachToAnchor('bottom_center');
                widget.setWidgetIconKey(progressIcon);
                onReady(widget);
            }.bind(this);

            this.guiWidget.initGuiWidget(null, containerReady);

        };

        GuiActionPointStatus.prototype.setGuiWidget = function(widget) {
            this.guiWidget = widget
        };

        GuiActionPointStatus.prototype.getGuiActionPointForActionPoint = function(actionPoint, apArray) {

            for (var i = 0; i < apArray.length; i++) {
                if (apArray[i].getActionPoint() === actionPoint)
                    return apArray[i];
            }

        };


        GuiActionPointStatus.prototype.removeGuiWidget = function() {
            this.guiWidget.recoverGuiWidget();
        //    this.actionPointStatus.recoverActionPointStatus();
            ThreeAPI.unregisterPostrenderCallback(this.callbacks.updateActionPointStatus);

            while (this.guiActionPoints.length) {
                this.guiActionPoints.pop().removeGuiWidget();
            }

            while (this.releasedActionPoints.length) {
                this.releasedActionPoints.pop().removeGuiWidget();
            }

        };

        GuiActionPointStatus.prototype.getActionPointStatus = function() {
            return this.actionPointStatus
        };


        GuiActionPointStatus.prototype.attachActionPointGui = function(actionPoint) {

            var gap = new GuiActionPoint();
            gap.initActionPoint("widget_action_point", this.callbacks.gapReady);
            gap.setActionPoint(actionPoint);


        };

        GuiActionPointStatus.prototype.updateActionPointGui = function(guiActionPoint, actionPoint, tpf, targetPos) {

            guiActionPoint.setActionPointTargetOffset(targetPos);
            guiActionPoint.updateGuiActionPointFrame(tpf, actionPoint);

        };

        GuiActionPointStatus.prototype.updateActionPoint = function(actionPoint, tpf, maxActionPoints) {

            var count = maxActionPoints;

            var guiAP = this.getGuiActionPointForActionPoint(actionPoint, this.guiActionPoints);

            var size = this.guiWidget.size;

            if (guiAP) {
                var posFrac = MATH.calcFraction(0, count, actionPoint.index +0.5) - 0.5;
                tempVec1.set( posFrac * size.x - size.x*0.5, size.y * Math.cos(posFrac*3.145) + size.y, 0);
                this.updateActionPointGui(guiAP, actionPoint, tpf, tempVec1);

            } else {
                this.attachActionPointGui(actionPoint);
            }

        };


        var releases = [];

        GuiActionPointStatus.prototype.updateConsumedActionPoint = function(actionPoint, tpf) {

            var guiAP = this.getGuiActionPointForActionPoint(actionPoint, this.guiActionPoints);

            if (!guiAP) {
            //    console.log("No AP")
                return;
            }

            releases.push(guiAP);
        };

        var removes = [];

        GuiActionPointStatus.prototype.updateReleasedActionPoint = function(guiAP, tpf) {

            guiAP.updateGuiActionPointFrame(tpf, guiAP.actionPoint);

                    if (guiAP.actionPoint.getActionPointProgress()+tpf >= 1) {
                        removes.push(guiAP)
                    }

        };


        GuiActionPointStatus.prototype.updateActionPoints = function(aps, tpf) {

            for (var i = 0; i < aps.actionPoints.length; i++) {
                this.updateActionPoint(aps.actionPoints[i], tpf, aps.getMaxActionPoints())
            }

            for (i = 0; i < aps.consumedActionPoints.length; i++) {
                this.updateConsumedActionPoint(aps.consumedActionPoints[i], tpf)
            }

            while (releases.length) {
                var release = releases.pop();

                tempVec1.copy(release.offsetPos);
                tempVec1.y += 0.06;
                release.setActionPointTargetOffset(tempVec1);

                this.releasedActionPoints.push(release);
                MATH.quickSplice(this.guiActionPoints, release);
            }

            for (i = 0; i < this.releasedActionPoints.length; i++) {
                this.updateReleasedActionPoint(this.releasedActionPoints[i], tpf)
            }

            while (removes.length) {
                var remove = removes.pop();
                MATH.splice(this.releasedActionPoints, remove);

                remove.removeGuiWidget();
            }

        };

        GuiActionPointStatus.prototype.updateActionPointStatus = function(aps, tpf) {
            this.updateActionPoints(aps, tpf);
            this.guiWidget.indicateProgress(0, aps.getTimePerPoint(), aps.getCurrentProgress(), 1);
            this.guiWidget.setWidgetInteractiveState(stateFeedbackMap[aps.getApsState()]);

            /*
            if (Math.random() < 0.02) {
                aps.consumeActionPoints( Math.floor(Math.random() * (aps.countReadyActionPoints() ) ) );
            }
            */

        };

        GuiActionPointStatus.prototype.setActionPointStatus = function(aps) {
            this.actionPointStatus = aps;
            ThreeAPI.addPostrenderCallback(this.callbacks.updateActionPointStatus);
            aps.addRemoveActionPointStatusCallback(this.callbacks.removeActionPointStatus)
        };

        GuiActionPointStatus.prototype.removeActionPointStatus = function(aps) {
            this.removeGuiWidget();
        };

        GuiActionPointStatus.prototype.createDummyActionPointStatus = function(count) {
            var aps = new ActionPointStatus();
            aps.activateActionPointStatus(count);
            return aps
        };

        return GuiActionPointStatus;

    });