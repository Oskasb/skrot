import {
    getLoadedAccount,
    loadActorStatus,
    loadItemStatus,
    loadPlayerStatus
} from "../setup/Database.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {clearActorEncounterStatus, getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {fetchAllStashItemIDs, getStashItemCountByTemplateId} from "./StashUtils.js";
import {getPlayerActor} from "./ActorUtils.js";
import {getItemVendorCurrency, getItemVendorPrice} from "./ItemUtils.js";

function loadStoredPlayer(dataList, playerLoadedCB) {

    function accountCallback(account) {
        let id = null;
        if (account !== null) {
            id = account[ENUMS.PlayerStatus.PLAYER_ID];
        }

        if (id) {
            dataList[ENUMS.PlayerStatus.PLAYER_ID] = id;

            function pStatusCB(playerStatus) {
                if (playerStatus !== null) {
                    dataList[ENUMS.PlayerStatus.PLAYER_NAME] = playerStatus[ENUMS.PlayerStatus.PLAYER_NAME];
                    let actorId = playerStatus[ENUMS.PlayerStatus.ACTIVE_ACTOR_ID];
                    dataList[ENUMS.ActorStatus.ACTOR_ID] = actorId;
                    if (actorId) {

                        function aStatusCB(actorStatus) {
                            if (actorStatus !== null) {
                                dataList['CLIENT_STAMP'] = client.getStamp();
                                actorStatus[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
                                actorStatus[ENUMS.ActorStatus.EQUIP_REQUESTS] = [];
                                dataList['ACTOR_STAMP'] = actorStatus[ENUMS.ActorStatus.CLIENT_STAMP]
                                dataList[ENUMS.ActorStatus.CONFIG_ID] = actorStatus[ENUMS.ActorStatus.CONFIG_ID];
                            }
                            playerLoadedCB()
                        }

                        loadActorStatus(actorId, aStatusCB);

                    } else {
                        playerLoadedCB()
                    }
                } else {
                    playerLoadedCB()
                }

            }

           loadPlayerStatus(id, pStatusCB);

        } else {
            playerLoadedCB()
        }

    }

    getLoadedAccount(accountCallback);

}

let slots = [
      'SLOT_HEAD',
      'SLOT_BODY',
      'SLOT_CHEST',
      'SLOT_WRIST',
      'SLOT_HANDS',
      'SLOT_WAIST',
      'SLOT_LEGS',
      'SLOT_SKIRT',
      'SLOT_FEET',
      'SLOT_HAND_R',
      'SLOT_HAND_L',
      'SLOT_BACK',
      'SLOT_WRIST_L',
      'SLOT_WRIST_R'
]

let loadedItems = [];

function itemLoaded(item) {

    function iStatusCB(itemStatus) {

        for (let key in itemStatus) {
            item.setStatusKey(key, itemStatus[key]);
        }

        evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ITEM, status:itemStatus})

    }

    loadItemStatus(item.getStatus(ENUMS.ItemStatus.ITEM_ID), iStatusCB);
}

function loadStoredItemId(itemId, cb) {
    let checkString = itemId.split('_');
    if (checkString[1] === 'RECIPE') {
    //    console.log("Skip load recipe from DB - Recipes load from parent item loading");
        // console.error("Check item id fail", itemId);
    //    return;
    } else {

    }


    function iStatusCB(itemStatus) {
        console.log("Item load iStatusCB", itemStatus)
        if (itemStatus[ENUMS.ItemStatus.ITEM_TYPE] === ENUMS.itemTypes.RECIPE) {

            function recipeLoaded(item) {
                console.log("Item recipeLoaded", [item], item.status.statusMap, itemStatus)
                for (let key in itemStatus) {
                    item.status.statusMap[key] = itemStatus[key];
                }
            }
        //    console.log("Recipes load status", itemStatus);
            initRecipeByTemplateId(itemStatus[ENUMS.ItemStatus.TEMPLATE], recipeLoaded)
            //    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:recipeLoaded})
        //
            return;
        }
        if (itemStatus === null) {
            console.log("Item load request failed", itemId)
            return;
        }
        evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})
    }
    loadItemStatus(itemId, iStatusCB);
}

function getItemStatuses(statusMap) {

    for (let i = 0; i < slots.length; i++) {
        if (statusMap[slots[i]] !== "") {
            console.log("Load to Equip Slot ", statusMap[slots[i]])
            loadStoredItemId(statusMap[slots[i]])
        }
    }

    let invItems = statusMap[ENUMS.ActorStatus.INVENTORY_ITEMS];

    for (let i = 0; i < invItems.length; i++) {
        if (invItems[i] !== "") {
            console.log("Load to INVENTORY Slot ", invItems[i])
            loadStoredItemId(invItems[i])
        }
    }




}

function loadPlayerStashItems() {

    let itemList = fetchAllStashItemIDs();
    for (let i = 0; i <itemList.length; i++ ) {
        loadStoredItemId(itemList[i])
    }
}

function initLoadedPlayerState(dataList, readyCB) {
    ThreeAPI.getCameraCursor().setZoomDistance(5)
    notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
    notifyCameraStatus(ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, true)
    notifyCameraStatus(ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)

    let playerId = dataList[ENUMS.PlayerStatus.PLAYER_ID];
    let actorId = dataList[ENUMS.ActorStatus.ACTOR_ID] ;

    function pStatusCB(playerStatus) {
        for (let key in playerStatus) {
            setPlayerStatus(key, playerStatus[key]);
        }


        function aStatusCB(actorStatus) {
            let pos = ThreeAPI.getCameraCursor().getPos()
            pos.set(
                actorStatus[ENUMS.ActorStatus.POS_X],
                actorStatus[ENUMS.ActorStatus.POS_Y],
                actorStatus[ENUMS.ActorStatus.POS_Z],
            )
            ThreeAPI.getCameraCursor().getLookAroundPoint().copy(pos);

            function actorReady(actor) {
                console.log("loaded actor ready", actor);
                actor.call.activateActionKey("ACTION_TRAVEL_WALK", ENUMS.ActorStatus.TRAVEL)

                clearActorEncounterStatus(actor)
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
                let statusMap = JSON.parse(JSON.stringify(actor.getStatus()));
                actor.removeGameActor()
                setTimeout(function() {
                    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {request:ENUMS.ClientRequests.LOAD_SERVER_ACTOR, status:statusMap})
                }, 500)
                readyCB(statusMap);
            }

            function actorLoaded(actor) {
                console.log("init player with loaded actor", actor);
                actor.setStatusKey(ENUMS.ActorStatus.IN_COMBAT, false);
                actor.setStatusKey(ENUMS.ActorStatus.IS_ACTIVE, 0);
                actor.activateGameActor(actorReady);

            }

            getItemStatuses(actorStatus);
            loadPlayerStashItems();
        //    initiateEstates()
            evt.dispatch(ENUMS.Event.LOAD_ACTOR, {status: actorStatus, callback:actorLoaded});
            GameAPI.getGamePieceSystem().playerActorId = actorStatus[ENUMS.ActorStatus.ACTOR_ID];

        }

        loadActorStatus(actorId, aStatusCB);

    }

    loadPlayerStatus(playerId, pStatusCB);

}

let selectedActor = null;

function targetSelectActor(actor) {
    let playerActor = GameAPI.getGamePieceSystem().getSelectedGameActor()

    if (selectedActor) {
        selectedActor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false)
        playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "")
    }
    if (actor === selectedActor) {
        selectedActor = null;
        return;
    }
    playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, actor.id)
    playerActor.turnTowardsPos(actor.getSpatialPosition());
    selectedActor = actor;
    actor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, true)
    actor.actorText.say('Selected')
}

function populateInvStatusMap(statusMap) {
    let actor = getPlayerActor()
    if (!actor) {
        return;
    }

    let invState = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);

    let itemCount = 0;
    for (let i = 0; i < invState.length; i++) {
        let itemId = invState[i];
        if (itemId !== "") {
            itemCount++;
        }
    }

    statusMap['inventory_count'] = itemCount || "";
    statusMap['stash_count_items'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_ITEMS).length || "-";
    statusMap['stash_count_materials'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_MATERIALS).length || "-";;
    statusMap['stash_count_currencies'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_CURRENCIES).length || "-";;
    statusMap['stash_count_lore'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_LORE).length || "-";
    statusMap['stash_count_craft'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_CRAFT).length || "-";
    statusMap['stash_count_housing'] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_HOUSING).length || "-";
}

function playerCanAffordItem(item) {
    let price = getItemVendorPrice(item);
    let currency = getItemVendorCurrency(item);
    let playerAmount = getStashItemCountByTemplateId(currency);

    if (playerAmount < price) {
        return false;
    } else {
        return true;
    }

}

function testSeekPartyEncounterActive(encounterId) {
    let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
    if (selectedActor.getStatus(ENUMS.ActorStatus.REQUEST_PARTY) === encounterId) {
        return true;
    } else {
        selectedActor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, "");
        return false;
    }
}

function activateSeekPartyEncounter(encounterId) {
    let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
    if (testSeekPartyEncounterActive(encounterId)) {
        selectedActor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, "");
    } else {
        selectedActor.setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, encounterId);
    }
}

let playerActorList = [];

function getActivePlayerActors() {
    MATH.emptyArray(playerActorList);

    let remoteClients = getRemoteClients();
    for (let key in remoteClients) {
        if (key === "-1" || remoteClients[key] === null) {

        } else {
            let actor = remoteClients[key].actors[0];
            if (actor) {
                let stamp = actor.getStatus(ENUMS.ActorStatus.CLIENT_STAMP);
                if (stamp !== client.getStamp()) {
                    playerActorList.push(actor);
                }
            }
        }
    }

    return playerActorList;

}

export {
    loadStoredPlayer,
    initLoadedPlayerState,
    targetSelectActor,
    populateInvStatusMap,
    playerCanAffordItem,
    testSeekPartyEncounterActive,
    activateSeekPartyEncounter,
    getActivePlayerActors
}