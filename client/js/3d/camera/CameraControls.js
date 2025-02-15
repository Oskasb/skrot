
import {ENUMS} from "../../application/ENUMS.js";

let statusList = [];
let statusControls = {}
let camModeParams = {}
function setCameraStatusControl(statusKey, controlKey, activeBool) {
   // console.log('setCameraStatusControl', statusKey, controlKey, activeBool);

    if (typeof (controlKey) === 'string') {
        statusControls[statusKey]['controlKey'] = ENUMS.CameraControls[controlKey]
    }
    if (activeBool !== null) {
        statusControls[statusKey]['isActive']   = activeBool
    }

}

function onCamStatusEvent(event) {
    setCameraStatusControl(event['status_key'], event['control_key'], event['activate'])
}

class CameraControls {
    constructor() {
        for (let key in ENUMS.CameraStatus) {
            statusList.push(ENUMS.CameraStatus[key])
            statusControls[key] = {};
            setCameraStatusControl(key,  ENUMS.CameraControls.CAM_AUTO, false)
        }

        this.call = {
            onCamStatusEvent:onCamStatusEvent
        }

    }

    getCameraControlStatus(statusKey) {
        return statusControls[ENUMS.CameraStatus[statusKey]];
    }

    getStatusList() {
        return statusList;
    }

    applyCameraControls(tpf, pointerDragVector, dragToVec3, cameraCursor, camLookAtVec, camPosVec) {
        camModeParams.tpf = tpf;
        camModeParams.pointerDragVector = pointerDragVector;
        camModeParams.dragToVec3 = dragToVec3;
        camModeParams.cameraCursor = cameraCursor;
        camModeParams.camLookAtVec = camLookAtVec;
        camModeParams.camPosVec = camPosVec;
        camModeParams.statusControls = statusControls;
        updateCamParams(camModeParams);

        let camMode = false;

        if (statusControls[ENUMS.CameraStatus.CAMERA_MODE]['isActive']) {
            camMode = true;
            CAM_MODES[statusControls[ENUMS.CameraStatus.CAMERA_MODE]['controlKey']]();
        }

        if (!camMode) {
            CAM_MODES['CAM_AUTO']()
        }

    }

}


export {CameraControls}