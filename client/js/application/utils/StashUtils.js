import {getReversedConfigs} from "./ConfigUtils.js";
import {getItemConfigs, getPlayerActor} from "./ActorUtils.js";
import {getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {ENUMS} from "../ENUMS.js";
import {loadItemStatus, saveItemStatus, savePlayerStatus} from "../setup/Database.js";
import {evt} from "../event/evt.js";
import {getItemRecipe, initRecipeByItemConfig} from "./CraftingUtils.js";


let stashTabs = [
    ENUMS.PlayerStatus.STASH_TAB_ITEMS,
    ENUMS.PlayerStatus.STASH_TAB_MATERIALS,
    ENUMS.PlayerStatus.STASH_TAB_CURRENCIES,
    ENUMS.PlayerStatus.STASH_TAB_LORE,
    ENUMS.PlayerStatus.STASH_TAB_HOUSING,
    ENUMS.PlayerStatus.STASH_TAB_CRAFT
]

function itemLoaded(item) {

    function iStatusCB(itemStatus) {
        for (let key in itemStatus) {
            item.setStatusKey(key, itemStatus[key]);
        }
        let slot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
        console.log("Stash Item Loaded ", slot, item.getStatus(ENUMS.ItemStatus.ITEM_ID), item.getStatus());
        saveItemStatus(item.getStatus());
    }

    loadItemStatus(item.getStatus(ENUMS.ItemStatus.ITEM_ID), iStatusCB);

}
function loadStashItem(item) {
    let itemStatus = item.getStatus();
    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: itemStatus[ENUMS.ItemStatus.TEMPLATE], itemId:itemStatus[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})
}

function getStashTabItemByTemplateId(stashTab, templateId) {
    let tabItems = getStashPageItems(stashTab);
    for (let i = 0; i < tabItems.length; i++) {
        let tabItem = tabItems[i];
        let tabItemTemplateId = tabItem.getStatus(ENUMS.ItemStatus.TEMPLATE);
        if (tabItemTemplateId === templateId) {
            return tabItem;
        }
    }
    return false;
}

function combineItemStackToStashTab(stashTab, item) {
    let existingStackItem = getStashTabItemByTemplateId(stashTab, item.getStatus(ENUMS.ItemStatus.TEMPLATE));
    if (existingStackItem !== false) {
        let addStack = item.getStatus(ENUMS.ItemStatus.STACK_SIZE);
        let existingStack = existingStackItem.getStatus(ENUMS.ItemStatus.STACK_SIZE);
        existingStackItem.setStatusKey(ENUMS.ItemStatus.STACK_SIZE, existingStack + addStack);
        return existingStackItem;
    }
    return item;

}

function stashItem(item, unstash) {


    let itemType = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);

    let page = ENUMS.PlayerStatus.STASH_TAB_ITEMS;
    if (itemType === ENUMS.itemTypes.MATERIAL) {
        page =  ENUMS.PlayerStatus.STASH_TAB_MATERIALS;
        if (item.getStatus(ENUMS.ItemStatus.STACK_SIZE) === 0) { // For debug adding
            item.setStatusKey(ENUMS.ItemStatus.STACK_SIZE, Math.floor(MATH.randomBetween(5, 1000)))
        }

        if (unstash !== true) {
            item = combineItemStackToStashTab(page, item)
        }


    } else if (itemType === ENUMS.itemTypes.CURRENCY || itemType === ENUMS.itemTypes.CLASS || itemType === ENUMS.itemTypes.SUBCLASS) {
        page =  ENUMS.PlayerStatus.STASH_TAB_CURRENCIES;
        if (item.getStatus(ENUMS.ItemStatus.STACK_SIZE) === 0) {
            item.setStatusKey(ENUMS.ItemStatus.STACK_SIZE, Math.floor(MATH.randomBetween(5, 1000)))
        }

        if (unstash !== true) {
            item = combineItemStackToStashTab(page, item)
        }

    } else if (itemType === ENUMS.itemTypes.LORE) {
        page =  ENUMS.PlayerStatus.STASH_TAB_LORE
    } else if (itemType === ENUMS.itemTypes.RECIPE) {
        console.log("Stash Recipe", item);
        page =  ENUMS.PlayerStatus.STASH_TAB_CRAFT
    } else if (itemType === ENUMS.itemTypes.DEED || itemType === ENUMS.itemTypes.ESTATE || itemType === ENUMS.itemTypes.KIT) {
        console.log("Stash Estate", item);
        page =  ENUMS.PlayerStatus.STASH_TAB_HOUSING
    } else {
        if (typeof (item.config['equip_slot']) !== 'string') {
            console.log("No stash tab defined for item ", item);
        }
    }

    let itemId = item.getStatus(ENUMS.ItemStatus.ITEM_ID)
    let itemStash = getPlayerStatus(ENUMS.PlayerStatus[page]) || [];

    if (itemStash.indexOf(itemId) === -1) {
        itemStash.push(itemId);
    } else {
        if (unstash === true) {
            MATH.splice(itemStash, itemId)
        } else {
            console.log("Double stash same itemId not ok", item);
        }
        return;
    }

    item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, 'STASH_SLOT_'+itemStash.indexOf(itemId))
    setPlayerStatus(ENUMS.PlayerStatus[page], itemStash);

    saveItemStatus(item.getStatus())
    loadStashItem(item)


}




function stashAllConfigItems() {
    let configs = getItemConfigs();
    console.log("Item Configs ", configs);

    for (let key in configs) {
        let cfg = configs[key]
        if (typeof(cfg['visual_id']) === 'string') {
            let itemType = cfg[ENUMS.ItemStatus.ITEM_TYPE];
            evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: key, callback:stashItem})
        //    if (itemType) {
                initRecipeByItemConfig(key, cfg, stashItem);
        //    }
        }
    }

}

let stashViewState = {};
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_TAB] = null;
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS] = [];
stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE] = null;
stashViewState[ENUMS.PlayerStatus.SLOTS_PER_PAGE] = null;
let viewStashItems = [];

function checkUpdate() {
    let update = false;
    for (let key in stashViewState) {
        let state = getPlayerStatus(ENUMS.PlayerStatus[key]);
        if (key === ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS) {
            for (let i = 0; i < state.length; i++) {
                if (state[i] !== stashViewState[key][i]) {
                    update = true;
                }
            }
        } else if (state !== stashViewState[key]) {
            update = true;
            stashViewState[key] = state;
        }
    }

    if (update === true) {
        MATH.emptyArray(stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS])
        MATH.copyArrayValues(getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS), stashViewState[ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS])

    }

    return update;
}

function fetchActiveStashPageItems(store) {
    let currentTab = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB)
    let slotsPerPage = getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE)
    let subpageIndex = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE)
    let activeFilters = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_FILTERS)
    let itemIds = getPlayerStatus(ENUMS.PlayerStatus[currentTab]);

    let update = checkUpdate();

    if (update === true) {
        while (viewStashItems.length) {
            MATH.splice(store, viewStashItems.pop());
        }

        let startIndex = subpageIndex*slotsPerPage;
        let matchedCount = 0;
        for (let i = 0; i < itemIds.length; i++) {
            let id=itemIds[i];
            if (id !== "" && matchedCount < startIndex+slotsPerPage) {
                matchedCount++;
                if (matchedCount > startIndex) {
                    let item = GameAPI.getItemById(itemIds[i])
                    if (item !== null) {
                        viewStashItems.push(item);
                    }
                }
            }
        }

    }
    for (let i = 0; i < viewStashItems.length; i++) {
        store.push(viewStashItems[i])
    }
    return update;
}

function getStashPageItems(pageKey, store) {
    if (!store) {
        MATH.emptyArray(tempStore);
        store = tempStore;
    }
    let stashList = getPlayerStatus(pageKey);
    for (let i = 0; i < stashList.length; i++) {
        let item = GameAPI.getItemById(stashList[i]);
        store.push(item);
    }
    return store;
}

let tempStore = [];
function getAllStashItems() {
    MATH.emptyArray(tempStore);
    for (let i = 0; i < stashTabs.length; i++) {
        getStashPageItems(stashTabs[i], tempStore)
    }
    return tempStore;
}


function fetchAllStashItemIDs() {
    MATH.emptyArray(tempStore);
    for (let key in stashTabs) {
        let tabList = getPlayerStatus(ENUMS.PlayerStatus[stashTabs[key]]);
        for (let i = 0; i < tabList.length; i++) {
            tempStore.push(tabList[i]);
        }
    }
    return tempStore;
}

function getStashItemCountByTemplateId(templateId) {
    let stashItems = getAllStashItems();
    let count = 0;
    for (let i = 0; i < stashItems.length; i++) {
        let item = stashItems[i];
        if (item) {
            if (item.getStatus(ENUMS.ItemStatus.TEMPLATE) === templateId) {
                if (item.getStatus(ENUMS.ItemStatus.STACK_SIZE) !== 0) {
                    count+=item.getStatus(ENUMS.ItemStatus.STACK_SIZE)
                } else {
                    count++;
                }
            }
        }
    }
    return count;
}

function unstashItem(item) {
    let actor = getPlayerActor();
    actor.actorInventory.addInventoryItem(item);
    stashItem(item, true);
}

function sendItemToStash(item) {
    let slot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    let itemId = item.getStatus(ENUMS.ItemStatus.ITEM_ID);

    let actor = getPlayerActor();

    if (typeof (ENUMS.EquipmentSlots[slot]) === 'string') {
        actor.actorEquipment.call.unequipActorItem(item);
        stashItem(item);
    } else if (typeof (ENUMS.InventorySlots[slot]) === 'string') {

        let invItems = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
        invItems[invItems.indexOf(itemId)] = "";
        stashItem(item);
    } else {
        unstashItem(item);
    }


}

export {
    fetchAllStashItemIDs,
    stashAllConfigItems,
    fetchActiveStashPageItems,
    getStashItemCountByTemplateId,
    sendItemToStash,
    stashItem
}