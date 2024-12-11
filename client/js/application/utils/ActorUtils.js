import {configDataList} from "./ConfigUtils.js";
import {evt} from "../event/evt.js";
import {ENUMS} from "../ENUMS.js";
import {poolFetch} from "./PoolUtils.js";

let itemConfigs = null;
let slotToItemMap = {};

let onItemsData = function(data) {
    itemConfigs = data;

    for (let key in itemConfigs) {
        let cfg = itemConfigs[key];
        let slot = cfg['equip_slot'];

        if (typeof (slot) === 'string') {
            if (!slotToItemMap[slot]) {
                slotToItemMap[slot] = [];
            }
            slotToItemMap[slot].push(key)
        }
    }

 //   console.log("onItemsData itemConfigs", slotToItemMap, itemConfigs)
}

function getItemConfigs() {
    return itemConfigs;
}

function mapItemConfigs() {
    configDataList("GAME","ITEMS", onItemsData)
}

function getSlotToItemMap() {
    return slotToItemMap;
}

function getSlotItemByLevel(slotId, level) {
    let itemIds = slotToItemMap[slotId];

    let levelMatched = -1;
    let selectedItemId = null;
    if (itemIds) {
        for (let i = 0; i < itemIds.length; i++) {
            let itemConf = itemConfigs[itemIds[i]];

            if (itemConf) {
                if (typeof (itemConf.status) === 'object') {
                    let iLevel = itemConf.status['ITEM_LEVEL'] || 1;
                    if (level < iLevel) {
                        // level too high;
                    } else {
                        if (iLevel > levelMatched) {
                            levelMatched = iLevel;
                            selectedItemId = itemIds[i];
                        }
                    }
                }
            }

        }
    }

    return selectedItemId;

}

function autoEquipActorByLevel(actor) {

    let level = actor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL) || 1;
  //  let slots = actor.actorEquipment.itemSlots;
  //  console.log("autoEquipActorByLevel", level, actor)
    for (let key in slotToItemMap) {
        let itemConfId = getSlotItemByLevel(key, level);

        if (itemConfId !== null) {
            evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemConfId, callback:actor.call.equipItem})
        }
    }
}

function activateActorVisuals(actor, onReady) {
    let cb = function(visualActor) {
        visualActor.call.activate();
        if (typeof (onReady) === 'function') {
            onReady(actor)
        }
    }

    if (actor.visualActor === null) {
        actor.visualActor = poolFetch('VisualActor');
        actor.visualActor.call.setActor(actor, cb)
    }
}

function deactivateActorVisuals(actor) {
    if (actor.visualActor !== null) {
        actor.visualActor.call.deactivate();
        actor.visualActor = null;
    }
}

function getPlayerActor() {
    return GameAPI.getGamePieceSystem().selectedActor;
}

let none = [];

function getActiveUiStates() {
    let a = getPlayerActor();
    if (a) {
        return a.getStatus(ENUMS.ActorStatus.ACTIVE_UI_STATES)
    } else {
        return none;
    }
}

export {
    mapItemConfigs,
    getItemConfigs,
    getSlotToItemMap,
    autoEquipActorByLevel,
    activateActorVisuals,
    deactivateActorVisuals,
    getPlayerActor,
    getActiveUiStates
}