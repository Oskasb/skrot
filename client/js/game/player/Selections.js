import {evt} from "../../application/event/evt.js";
import {ENUMS} from "../../application/ENUMS.js";
import {setSetting} from "../../application/utils/StatusUtils.js";
import {getGameWorld} from "../../application/utils/GameUtils.js";

function applyCameraSelection(select) {
    evt.dispatch(ENUMS.Event.CAMERA_SELECTION, {select:select})
}

function applyEnvironmentSelection(select) {
    setSetting(ENUMS.Settings.ENVIRONMENT_INDEX, select);
}

function applyScenarioSelection(select) {
    getGameWorld().call.loadScenario(select);
}

const selectCalls = {}
selectCalls['APPLY_CAMERA_SELECTION'] = applyCameraSelection
selectCalls['APPLY_ENV_SELECTION'] = applyEnvironmentSelection
selectCalls['APPLY_SCENARIO'] = applyScenarioSelection

export {selectCalls}