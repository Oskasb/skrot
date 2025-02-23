import {evt} from "../../application/event/evt.js";
import {ENUMS} from "../../application/ENUMS.js";
import {getSetting, setSetting} from "../../application/utils/StatusUtils.js";

function applyCameraSelection(select) {
    evt.dispatch(ENUMS.Event.CAMERA_SELECTION, {select:select})
}

function applyEnvironmentSelection(select) {
    setSetting(ENUMS.Settings.ENVIRONMENT_INDEX, select);
}


const selectCalls = {}
selectCalls['APPLY_CAMERA_SELECTION'] = applyCameraSelection
selectCalls['APPLY_ENV_SELECTION'] = applyEnvironmentSelection

export {selectCalls}