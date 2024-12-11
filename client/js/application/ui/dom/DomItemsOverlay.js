import {getPlayerActor} from "../../utils/ActorUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {fetchActiveStashPageItems} from "../../utils/StashUtils.js";
import {getVendorItemList} from "../../utils/ItemUtils.js";

let items = [];
let domItems = [];
let removeDomItems = [];

function removeDomItemByItem(item) {
    for (let i = 0; i < domItems.length; i++) {
        if (domItems[i].call.getItem() === item) {
            let domItem =  domItems[i];
            removeDomItems.push(domItem);
            return domItem;
        }
    }

}

function clearRemoveList() {
    while (removeDomItems.length) {
        let domItem = removeDomItems.pop();
        let item = domItem.call.getItem()
    //    console.log("clearRemoveList item", item, domItem)
        domItem.call.close();
        MATH.splice(items, item);
        MATH.splice(domItems, domItem);
    }
//    console.log("remaining items to show", items.length, items)
}

function excludeItemsList(itemsList) {
 //   console.log("excludeItemsList", itemsList.length, itemsList)
    while (itemsList.length) {
        let item = itemsList.pop();

    //    console.log("Remove item ", item).reload(
        let removed = removeDomItemByItem(item);
    //    console.log("Remove removed item ", item, removed)
    }

 //   console.log("removeDomItems", removeDomItems.length, removeDomItems)

    clearRemoveList();

}

let removeList = []
function includeItemsList(itemsList) {

 //   console.log("includeItemsList", itemsList.length, itemsList)
/*
    for (let i =0; i < items.length; i++) { // if a domItem is missing for whatever reason add it here
        if (itemsList.indexOf(items[i]) === -1) {
            console.log("item was missing so adding it again...", items[i])
            itemsList.push(items[i])
        }
    }
*/
    while (itemsList.length) {
        let item = itemsList.pop();
        if (items.indexOf(item) === -1) {
            items.push(item);
            let domItem = poolFetch('DomItem');
        //    console.log("domItem.call.setItem", item, domItem)
            if (domItem.item) {
                console.log("dom item already has item, not closed?", domItem.item);
            }
            domItem.call.setItem(item);
            domItems.push(domItem);
        } else {
        //    console.log("Item already included... something is bad", item, items)
        }
    }

}

let fetchItems = [];

function getActorCharacterItems(actor, store) {
    actor.actorEquipment.getEquippedItems(store);
}

function getActorInventoryItems(actor, store) {
    actor.actorInventory.fetchInventoryItems(store);
}

function getPlayerStashPageItems(actor, store) {
    fetchActiveStashPageItems(store);
}

function getVendorItems(actor, store) {
    let vendorItems = getVendorItemList();

    for (let i=0; i < vendorItems.length; i++) {
        store.push(vendorItems[i]);
    }

}

let uiStateItems = {};

uiStateItems[ENUMS.UiStates.CHARACTER] = getActorCharacterItems;
uiStateItems[ENUMS.UiStates.INVENTORY] = getActorInventoryItems;
uiStateItems[ENUMS.UiStates.STASH] = getPlayerStashPageItems;
uiStateItems[ENUMS.UiStates.VENDOR] = getVendorItems;

let stateItemLists = {};

function updateActorUiState(actor, uiStateKey, open) {
    MATH.emptyArray(fetchItems);
  //  actor.actorText.say(uiStateKey +' '+open)
 //   console.log("updateActorUiState", open, uiStateKey, actor.actorStatus.statusMap);
    let getter = uiStateItems[ENUMS.UiStates[uiStateKey]]

    if (!stateItemLists[uiStateKey]) {
        stateItemLists[uiStateKey] = [];
    }

    let itemsForState = stateItemLists[uiStateKey];

    if (typeof (getter) === 'function') {
        getter(actor, fetchItems);
        excludeItemsList(itemsForState);
        if (open === true) {
        //    MATH.emptyArray(itemsForState);
            MATH.copyArrayValues(fetchItems, itemsForState)
            includeItemsList(fetchItems);
        } else {

        }

    } else {
        console.log("Not yet supported uiState", uiStateKey)
    }

}

let count = 0;

function pruneItemsMissingDomItems(item) {
    for (let i = 0; i < domItems.length; i++) {
        if (domItems[i].call.getItem() === item) {
            return 0;
        }
    }
    MATH.splice(items, item);
    return -1;
}


function clearClosedDomItems() {
    for (let i = 0; i < domItems.length; i++) {
        let domItem = domItems[i];
        let item = domItem.call.getItem();
        if (item === null) {
            removeDomItems.push(domItem);
        }
    }
    clearRemoveList();

    for (let i = 0;i < items.length; i++) {
        let item = items[i];
        i += pruneItemsMissingDomItems(item);
    }

}

function renderItemIcons() {
    if (count !== domItems.length) {
        clearClosedDomItems();
        count = domItems.length;
        console.log("render item count", items.length, domItems.length, [items, domItems])
    }
}

class DomItemsOverlay {
    constructor() {

        let currentStates = [];
        function update() {
            let actor = getPlayerActor();
            if (actor) {
                let uiStates = actor.getStatus(ENUMS.ActorStatus.ACTIVE_UI_STATES);


                if (currentStates.length > uiStates.length) {
                    for (let i=0; i < currentStates.length; i++) {
                        if (uiStates.indexOf(currentStates[i]) === -1) {
                            updateActorUiState(actor, currentStates[i], false)
                            MATH.splice(currentStates, currentStates[i]);
                            i--;
                        }
                    }
                }

                for (let i=0; i < uiStates.length; i++) {
                    if (currentStates.indexOf(uiStates[i]) === -1) {
                        currentStates.push(uiStates[i]);
                        updateActorUiState(actor, uiStates[i], true)
                    }
                }


            }

            renderItemIcons()


        }

        ThreeAPI.registerPrerenderCallback(update);

    }

    overlayItemIcon(item) {

    }



}

export { DomItemsOverlay }