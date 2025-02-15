import {evt} from "../../application/event/evt.js";
import {ENUMS} from "../../application/ENUMS.js";

function applyCameraSelection(select) {
    evt.dispatch(ENUMS.Event.CAMERA_SELECTION, {select:select})
}

const selectCalls = {}
selectCalls['APPLY_CAMERA_SELECTION'] = applyCameraSelection


export {selectCalls}