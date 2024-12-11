import { GuiWidget } from "../elements/GuiWidget.js";

class GuiActionPoint {
    constructor(options) {

        this.progressIcon = 'progress_horizontal';
        this.readyIconKey = 'center_lit_square';
        this.tempVec1 = new THREE.Vector3();
        this.options = {};
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.offsetPos = new THREE.Vector3();
        this.offsetTargetPos = new THREE.Vector3();
        this.deltaPos = new THREE.Vector3();
        this.sourcePos = new THREE.Vector3();

        this.movePprogress = 0;
        this.currentTime = 0;
        this.moveTime = 0.5;
        this.moving = false;

        this.lastProgress = 0;

        this.actionPoint = null;

        let updateActionPointStatus = function(tpf, time) {
            this.updateActionPointStatus(this.getActionPointStatus(), tpf);
        }.bind(this);

        this.callbacks = {
            updateActionPointStatus:updateActionPointStatus
        }
    };


    initActionPoint = function(widgetConfig, onReady) {
        this.offsetPos.set(0, 0, 0);
        this.guiWidget = new GuiWidget(widgetConfig);

        let containerReady = function(widget) {
            widget.setWidgetIconKey(this.progressIcon);
            widget.setWidgetInteractiveState(ENUMS.ElementState.NONE);
            onReady(this);

        }.bind(this);

        this.guiWidget.initGuiWidget(null, containerReady);

    };



    getGuiActionPointIndex = function() {
        return this.index;
    };

    setActionPointTargetOffset = function(targetOffset) {
        if (!this.offsetTargetPos.equals(targetOffset)) {
            this.offsetTargetPos.copy(targetOffset);
            this.deltaPos.subVectors(this.offsetTargetPos ,this.offsetPos);
            this.sourcePos.copy(this.offsetPos);
            this.currentTime = 0;
            this.moving = true;
        }
    };

    updateGuiActionPointPosition = function() {

        let moveProg = MATH.curveSigmoid(this.movePprogress);

        this.tempVec1.copy(this.deltaPos);
        this.tempVec1.multiplyScalar(moveProg);

        this.offsetPos.addVectors(this.tempVec1, this.sourcePos);

        this.guiWidget.offsetWidgetPosition(this.offsetPos);

    };

    getGuiActionPointIndex = function() {
        return this.actionPoint.getActionPointIndex();
    };

    setActionPoint = function(actionPoint) {
        this.actionPoint = actionPoint;
    };

    getActionPoint = function() {
        return this.actionPoint;
    };

    updateGuiActionPointFrame = function(tpf, actionPoint) {

        if (this.moving) {

            this.currentTime += tpf;


            this.movePprogress = this.currentTime / this.moveTime;

            if (this.currentTime > this.moveTime) {

                this.moving = false;
                this.movePprogress = 1;
            }

            this.updateGuiActionPointPosition();
        } else {

        }

        if (this.actionPoint.getActionPointIsConsumed()) {
            this.guiWidget.setWidgetInteractiveState(ENUMS.ElementState.DISABLED);
        } else if (this.actionPoint.getActionPointReady()) {
            this.guiWidget.setWidgetInteractiveState(ENUMS.ElementState.ACTIVE);
            this.guiWidget.setWidgetIconKey(this.readyIconKey);
        } else {
            this.guiWidget.setWidgetInteractiveState(ENUMS.ElementState.NONE);
        }



        let progress = actionPoint.getActionPointProgress();

        if (progress !== this.lastProgress) {
            this.guiWidget.indicateProgress(0, 1, progress, 1);
            this.lastProgress = actionPoint.getActionPointProgress();
        }

    };

    removeGuiWidget = function() {
        this.actionPoint = null;
        this.guiWidget.recoverGuiWidget();
    };

}

export { GuiActionPoint }