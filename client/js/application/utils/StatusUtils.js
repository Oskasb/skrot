import {getUrlParam, isDev} from "./DebugUtils.js";
import {ENUMS} from "../ENUMS.js";
import {getLocalAccountStatus, storeLocalAccountStatus} from "../setup/Database.js";

let defaultSettings = {}

for (let key in ENUMS.Settings) {
    defaultSettings[key] = 0;
}


defaultSettings[ENUMS.Settings.RIG_STIFFNESS] = 45;
defaultSettings[ENUMS.Settings.RENDER_SCALE] = 1;
defaultSettings[ENUMS.Settings.TERRAIN_RANGE] = 2;
defaultSettings[ENUMS.Settings.PHYSICAL_DEBRIS] = 50;
defaultSettings[ENUMS.Settings.VIEW_DISTANCE] = 2;
defaultSettings[ENUMS.Settings.LOD_BIAS] = 40;
defaultSettings[ENUMS.Settings.VEGETATION_DENSITY] = 7;
defaultSettings[ENUMS.Settings.VEGETATION_RANGE] = 5;
defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_PROBES] = 3;
defaultSettings[ENUMS.Settings.PHYSICS_VFX_INTENSITY] = 3;


if (getUrlParam('low')) {
    for (let key in defaultSettings) {
        let val = defaultSettings[key];
        defaultSettings[key] = Math.floor(val*0.5);
    }
    defaultSettings[ENUMS.Settings.RENDER_SCALE] = 2;
}

defaultSettings[ENUMS.Settings.INSTANCE_MULTIPLIER] = 1;

if (getUrlParam('hi')) {
    for (let key in defaultSettings) {
        let val = defaultSettings[key];
        defaultSettings[key] = Math.floor(val*2);
    }
    defaultSettings[ENUMS.Settings.RENDER_SCALE] = 1;
}


defaultSettings[ENUMS.Settings.DRAW_TILE_BOXES] = 1;
defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_REACH] = 3;
defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_POWER] = 10;
defaultSettings[ENUMS.Settings.DEBRIS_SCALE_MIN] = 3;
defaultSettings[ENUMS.Settings.DEBRIS_SCALE_MAX] = 10;
defaultSettings[ENUMS.Settings.ZOOM_MAX] = 60;
defaultSettings[ENUMS.Settings.ZOOM_MIN] = 10;
defaultSettings[ENUMS.Settings.ZOOM_STRENGTH] = 25;
defaultSettings[ENUMS.Settings.CAMERA_VERTICAL] = 5;
defaultSettings[ENUMS.Settings.CAMERA_HORIZONTAL] = 15;
defaultSettings[ENUMS.Settings.DEBRIS_RANGE] = 20;
defaultSettings[ENUMS.Settings.LOOK_ABOVE] = 50;
defaultSettings[ENUMS.Settings.LOOK_AHEAD] = 20;
defaultSettings[ENUMS.Settings.ABOVE_HEIGHT] = 40;
defaultSettings[ENUMS.Settings.RIG_STIFFNESS] = 45;
defaultSettings[ENUMS.Settings.CAMERA_TERRAIN_MIN] = 20;
defaultSettings[ENUMS.Settings.ROTATION_COMPENSATION] = 7;
defaultSettings[ENUMS.Settings.CHARACTER_STIFFNESS] = 3;
defaultSettings[ENUMS.Settings.OBSTRUCTION_REACTIVITY] = 100;
defaultSettings[ENUMS.Settings.OBSTRUCTION_PENETRATION] = 50;
defaultSettings[ENUMS.Settings.ADVENTURE_AUTO_SELECT_DISTANCE] = 2;

defaultSettings[ENUMS.Settings.SCALE_RBAR] = -30;
defaultSettings[ENUMS.Settings.OFFSET_RBAR_X] = 2;
defaultSettings[ENUMS.Settings.OFFSET_RBAR_Y] = 2;

if (getUrlParam('wild')) {
    defaultSettings[ENUMS.Settings.TERRAIN_RANGE] = 4;
    defaultSettings[ENUMS.Settings.PHYSICAL_DEBRIS] = 200;
    defaultSettings[ENUMS.Settings.VIEW_DISTANCE] = 4;
    defaultSettings[ENUMS.Settings.VEGETATION_DENSITY] = 7;
    defaultSettings[ENUMS.Settings.VEGETATION_RANGE] = 2;
    defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_PROBES] = 3;
    defaultSettings[ENUMS.Settings.PHYSICS_VFX_INTENSITY] = 6;
    defaultSettings[ENUMS.Settings.DEBRIS_RANGE] = 5;
    defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_REACH] = 6;
    defaultSettings[ENUMS.Settings.ACTOR_INFLUENCE_POWER] = 40;
}

if (getUrlParam('dev')) {
    defaultSettings[ENUMS.Settings.DEBUG_VIEW_ACTIVE] = 1;
    defaultSettings[ENUMS.Settings.PHYSICAL_DEBRIS] = 0;
}

function getActorBySelectedTarget(actor) {
    return GameAPI.getActorById(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
}

function hasHostileTarget(actor) {
    let target = getActorBySelectedTarget(actor);
    if (target) {
        if (target.getStatus(ENUMS.ActorStatus.ATTITUDE) === 'HOSTILE') {
            return true;
        }
    }
}

function clearTargetSelection(actor) {
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '')
}

function clearActorEncounterStatus(actor) {
    if (isDev()) {
        actor.actorText.say("Clearing Encounter Status")
    }

    actor.setStatusKey(ENUMS.ActorStatus.DEAD, false);
    actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN, false);
    actor.setStatusKey(ENUMS.ActorStatus.HAS_TURN_INDEX, -1);
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, '');
    actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false);
    actor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, '');
    actor.setStatusKey(ENUMS.ActorStatus.RETREATING, '');
    actor.setStatusKey(ENUMS.ActorStatus.EXIT_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATING_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, '');
    actor.setStatusKey(ENUMS.ActorStatus.DAMAGE_APPLIED, 0);
    actor.setStatusKey(ENUMS.ActorStatus.NAVIGATION_STATE, ENUMS.NavigationState.WORLD)
    actor.setStatusKey(ENUMS.ActorStatus.ACTIVE_UI_STATES, [])

}

function getPlayerStatus(key) {
    return GameAPI.getPlayer().getStatus(key);
}

function setPlayerStatus(key, value) {
    GameAPI.getPlayer().setStatusKey(key, value);
}

function getSelectedActorStatus(key) {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    if (!selectedActor) {
        return null;
    }
    return selectedActor.getStatus(key);
}

function setSelectedActorStatus(key, value) {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    if (!selectedActor) {
        return null;
    }
    return selectedActor.setStatusKey(key, value);
}

function testStatusConditions(conditions) {
    if (isDev()) {
        return true
    }
    for (let i = 0; i < conditions.length; i++) {
        let cnd = conditions[i];
        let value = cnd.value;
        let status = null;

        if (typeof (cnd['ActorStatus']) === 'string') {
            status = getSelectedActorStatus(cnd['ActorStatus'])
        } else if (typeof (cnd['PlayerStatus']) === 'string') {
            status = getPlayerStatus(cnd['PlayerStatus'])
        }
        if (status === null) {
            return value === null;
        }

        if (typeof (status) === 'string') {
            if (status !== value) {
                return false;
            }
        } else if (typeof (status) === 'number') {
            if (status < value) {
                return false;
            }
        } else if (typeof (status) === 'object') {
            if (typeof (status.length) === 'number') {
                if (status.indexOf(value) === -1) {
                    return false;
                }
            }
        }
    }
    return true;
}

function setStatusValues(statusValues) {
    for (let i = 0; i < statusValues.length; i++) {
        let statusValue = statusValues[i];
        let value = statusValue.value;
        let status = null;

        if (typeof (statusValue['ActorStatus']) === 'string') {
            status = getSelectedActorStatus(statusValue['ActorStatus'])
            if (typeof (status.length) === 'number') {
                if (status.indexOf(value) === -1) {
                    status.push(value)
                }
            } else {
                status = value;
            }
            setSelectedActorStatus(statusValue['ActorStatus'], status);
        } else if (typeof (statusValue['PlayerStatus']) === 'string') {
            status = getPlayerStatus(statusValue['PlayerStatus'])
            if (typeof (status.length) === 'number') {
                if (status.indexOf(value) === -1) {
                    status.push(value)
                }
            } else {
                status = value;
            }
            setPlayerStatus(statusValue['PlayerStatus'], status)
        }
    }
    GameAPI.worldModels.notifyConditionsPossiblyChanged()
}

function getSetting(key) {
    let settings = getLocalAccountStatus(ENUMS.AccountStatus.ACCOUNT_SETTINGS) || {};
    if (settings[key] !== undefined) {
        return settings[key];
    }
    if (defaultSettings[key] !== undefined) {
        return defaultSettings[key];
    }
    return null;
}

function setSetting(key, value) {
    let settings = getLocalAccountStatus(ENUMS.AccountStatus.ACCOUNT_SETTINGS) || {};
    settings[key] = value;
    storeLocalAccountStatus(ENUMS.AccountStatus.ACCOUNT_SETTINGS, settings);
    return value;
}

export {
    getActorBySelectedTarget,
    hasHostileTarget,
    clearTargetSelection,
    clearActorEncounterStatus,
    setPlayerStatus,
    getPlayerStatus,
    getSelectedActorStatus,
    testStatusConditions,
    setStatusValues,
    getSetting,
    setSetting
}