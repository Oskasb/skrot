import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiControlButton} from "../widgets/GuiControlButton.js";

let playerPortraitLayoutId = 'widget_icon_button_tiny'
let frameLayoutId = 'widget_button_state_tiny_frame'

let buttons = []
let container = null;
let activeStatuses = [];
let cameraControls;

let labelMap = {}
labelMap[ENUMS.CameraStatus.CAMERA_MODE] = 'Camera';
labelMap[ENUMS.CameraStatus.LOOK_AT] = 'Focus';
labelMap[ENUMS.CameraStatus.LOOK_FROM] = 'Source';
labelMap[ENUMS.CameraStatus.POINTER_ACTION] = 'World';


function getStatusList() {
    return cameraControls.getStatusList()
}

let testActive = function(statusKey) {
    let seqIndex = getStatusList().indexOf(statusKey);
    let button = buttons[seqIndex];
    let controlStatus = cameraControls.getCameraControlStatus(statusKey);
    button.setButtonIcon(controlStatus['controlKey']);
    return controlStatus['isActive'];

}

let statusEvent = {
    status_key:'',
    control_key:'',
    activate:false
}

let onActivate = function(statusKey) {
    // console.log("Button Pressed, onActivate:", statusKey)
    let controlStatus = cameraControls.getCameraControlStatus(statusKey);
    statusEvent['status_key'] = statusKey;
    statusEvent['control_key'] = controlStatus['controlKey'];
    statusEvent['activate']= !controlStatus['isActive'];
    evt.dispatch(ENUMS.Event.SET_CAMERA_STATUS, statusEvent)
}

let fitTimeout = null;

let onReady = function(button) {
    container.addChildWidgetToContainer(button.guiWidget)
    button.setButtonIcon('CAM_AUTO')
    clearTimeout(fitTimeout);
    fitTimeout = setTimeout(function() {
        container.fitContainerChildren()
    },0)
}

function addControlButton(statusKey) {
    let seqIndex = getStatusList().indexOf(statusKey);
    buttons[seqIndex] = new GuiControlButton(statusKey, playerPortraitLayoutId, onActivate, testActive, 0, 0, onReady, frameLayoutId, labelMap)
}

function renderCameraControlUi(statusKey) {

    if (!buttons[getStatusList().indexOf(statusKey)]) {
        addControlButton(statusKey);
    }

}

let updateCameraUiSystem = function(tpf, time) {
    MATH.forAll(getStatusList(), renderCameraControlUi);
}



class CameraUiSystem {
    constructor() {}

    initCameraUi() {
        cameraControls = ThreeAPI.getCameraCursor().getCameraControls();
        let containerReady = function(widget) {
            widget.attachToAnchor('mid_right');
            ThreeAPI.addPrerenderCallback(updateCameraUiSystem)
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_camera_status_expanding_container', containerReady)
        }

    }

    closeCameraUi() {

        while (buttons.length) {
            buttons.pop().removeGuiWidget()
        }

        if (container) {
            container = container.guiWidget.recoverGuiWidget()
            container = null;
        }

        ThreeAPI.unregisterPrerenderCallback(updateCameraUiSystem)
    }

}

export { CameraUiSystem }