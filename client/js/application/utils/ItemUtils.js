import {fetchConfigByEditId, readConfig} from "./ConfigUtils.js";
import {ENUMS} from "../ENUMS.js";
import {applyResourceHierarchy} from "./CraftingUtils.js";
import {playerCanAffordItem} from "./PlayerUtils.js";

let itemProgressTables;
let upgradeTables = {};
function cfgCb(cfg) {
    itemProgressTables = cfg;
    upgradeTables = cfg['item_upgrade_tables']
    console.log('item_upgrade_tables', upgradeTables)
}

fetchConfigByEditId('item_progress_tables', cfgCb);
fetchConfigByEditId('resource_hierarchy', applyResourceHierarchy);

function readConfigTableKey(table, key) {
    let data = upgradeTables[table]
    if (!data) {
        return {};
    }
    return data[key];
}



function rankEchelonLimit(quality) {
    return readConfigTableKey('item_rank_limits', quality) || 'ECHELON_0';
}

function potencyEchelonLimit(rarity) {
    return readConfigTableKey('item_potency_limits', rarity) || 'ECHELON_0';
}

function rankEchelonLevels(echelon) {
    return readConfigTableKey('item_rank_echelon_levels', echelon) || 0;
}

function potencyEchelonLevels(echelon) {
    return readConfigTableKey('item_potency_echelon_levels', echelon) || 0;
}


function getSlotStepMaxCount(slotStep) {
    return slotStep.slots * slotStep.steps;
}

function getVisualConfigIconClass(visdualConfig) {
    let cString = visdualConfig.data['icon_class'];
    if (typeof (cString) === "string") {
        return cString
    }
    return ""
}

function getItemIconClass(itemId) {
    let visualCfg = getVisualConfigByItemId(itemId);

    if (visualCfg !== null) {
        return getVisualConfigIconClass(visualCfg);
    }
    return "";
}

function getVisualConfigByVisualId(visualId) {
    let cfgs = readConfig("GAME","VISUALS")
    for (let i = 0; i < cfgs.length; i++) {
        if (cfgs[i].id === visualId) {
            return cfgs[i];
        }
    }
    return null;
}

function getItemConfigByItemId(itemId) {
    let cfgs = readConfig("GAME","ITEMS")
//    console.log("getItemConfigByItemId", cfgs)
    for (let i = 0; i < cfgs.length; i++) {
        if (cfgs[i].id === itemId) {
            return cfgs[i];
        }
    }

    return null;
}



function getVisualConfigByItemId(itemId) {
    let cfg = getItemConfigByItemId(itemId);

    if (cfg !== null) {
        let visualId = cfg.data['visual_id'];
        return getVisualConfigByVisualId(visualId);
    }
    return null;
}

function getItemConfigStatus(itemId, status) {
    let cfg = getItemConfigByItemId(itemId);
    if (cfg !== null) {
        if (cfg.data['status']) {
            if (cfg.data.status[status]) {
                return cfg.data.status[status]
            }
        }
    }
    return null;
}

function getItemRarity(itemId) {
    let rarity = getItemConfigStatus(itemId, "RARITY")
    if (rarity === null) {
        return ENUMS.rarity.COMMON;
    }
    return ENUMS.rarity[rarity];
}

function getItemQuality(itemId) {
    let rarity = getItemConfigStatus(itemId, "QUALITY")
    if (rarity === null) {
        return ENUMS.quality.BASIC;
    }
    return ENUMS.quality[rarity];
}

function getItemUiStateKey(item) {
    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
    if (typeof ENUMS.EquipmentSlots[slotId] === 'string') {
        return ENUMS.UiStates.CHARACTER;
    } else if (typeof ENUMS.InventorySlots[slotId] === 'string') {
        return ENUMS.UiStates.INVENTORY;
    } else if (typeof ENUMS.StashSlots[slotId] === 'string') {
        return ENUMS.UiStates.STASH;
    } else {
        let vendorList = getVendorItemList();
        if (vendorList.indexOf(item) !== -1) {
            return ENUMS.UiStates.VENDOR;
        }

    }
}



function getItemMaxPotency(item) {
    let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
    let topEchelon = potencyEchelonLimit(rarity);
    return ENUMS.echelon[topEchelon];
}

function getItemMaxRank(item) {
    let quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
    let topEchelon = rankEchelonLimit(quality);
    return ENUMS.echelon[topEchelon];
}

function getItemPotencySlotCount(item) {
    let p = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY);
    return potencyEchelonLevels('ECHELON_'+p);
}

function getItemRankSlotCount(item) {
    let rank = item.getStatus(ENUMS.ItemStatus.ITEM_RANK);
    return rankEchelonLevels('ECHELON_'+rank);
}

function updatePotencyDivs(item, potencyDivs) {
    let indicatorLevel = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY);
    let filledIndicators = item.getStatus(ENUMS.ItemStatus.POTENCY_ECHELON);

    for (let i = 0; i < potencyDivs.length; i++) {
        let iconClass = 'icon_potency';
        if (i < filledIndicators) {
            iconClass+='_set_'
        } else {
            iconClass+='_unset_'
        }
        iconClass+=indicatorLevel

        if (potencyDivs[i].indicatorClass !== iconClass) {
            if (typeof (potencyDivs[i].indicatorClass) === 'string') {
                DomUtils.removeElementClass(potencyDivs[i], potencyDivs[i].indicatorClass)
            }
            potencyDivs[i].indicatorClass = iconClass
            DomUtils.addElementClass(potencyDivs[i], potencyDivs[i].indicatorClass)
        }
    }

}

function updateRankDivs(item, rankDivs) {
    let indicatorLevel = item.getStatus(ENUMS.ItemStatus.ITEM_RANK);
    let filledIndicators = item.getStatus(ENUMS.ItemStatus.RANK_ECHELON);

    for (let i = 0; i < rankDivs.length; i++) {
        let iconClass = 'rank_'+indicatorLevel;
        if (i < filledIndicators) {
            iconClass+='_set'
        } else {
            iconClass+='_unset'
        }

        if (rankDivs[i].indicatorClass !== iconClass) {
            if (typeof (rankDivs[i].indicatorClass) === 'string') {
                DomUtils.removeElementClass(rankDivs[i], rankDivs[i].indicatorClass)
            }
            rankDivs[i].indicatorClass = iconClass
            DomUtils.addElementClass(rankDivs[i], rankDivs[i].indicatorClass)
        }
    }
}

function attachPotencySlots(item, container, divs) {
    DomUtils.clearDivArray(divs);
    let slots = getItemPotencySlotCount(item);
    for (let i = 0; i < slots; i++) {
        let div = DomUtils.createDivElement(container, 'potency_slot_'+i, '', 'item_potency_slot')
        divs.push(div);
    }
}

function attachRankSlots(item, container, divs) {
    DomUtils.clearDivArray(divs);
    let slots = getItemRankSlotCount(item);
    for (let i = 0; i < slots; i++) {
        let div = DomUtils.createDivElement(container, 'rank_slot_'+i, '', 'item_rank_slot')
        divs.push(div);
    }
}

function updateItemProgressUiStatus(item, statusMap, rankContainer, rankDivs, potencyContainer, potencyDivs) {

    let rank = item.getStatus(ENUMS.ItemStatus.ITEM_RANK);
    let rankEchelon = item.getStatus(ENUMS.ItemStatus.RANK_ECHELON);

    if (statusMap['ITEM_RANK'] !== rank) {
        statusMap['ITEM_RANK'] = rank
        statusMap['item_rank_echelon'] = "Rank:"+rank+" Echelon:"+statusMap['RANK_ECHELON']
        attachRankSlots(item, rankContainer, rankDivs)
    }

    if (statusMap['RANK_ECHELON'] !== rankEchelon) {
        statusMap['RANK_ECHELON'] = rankEchelon
        statusMap['item_rank_echelon'] = "Rank:"+rank+" Echelon:"+rankEchelon
        updateRankDivs(item, rankDivs)
    }

    let potency = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY)
    let potencyEchelon = item.getStatus(ENUMS.ItemStatus.POTENCY_ECHELON);

    if (statusMap['ITEM_POTENCY'] !== potency) {
        statusMap['ITEM_POTENCY'] = potency;
        statusMap['item_potency_echelon'] = "Potency:"+potency+" Echelon:"+potencyEchelon
        attachPotencySlots(item, potencyContainer, potencyDivs)
    }
    if (statusMap['POTENCY_ECHELON'] !== potencyEchelon) {
        statusMap['POTENCY_ECHELON'] = potencyEchelon;
        statusMap['item_potency_echelon'] = "Potency:"+potency+" Echelon:"+potencyEchelon
        updatePotencyDivs(item, potencyDivs)
    }
}

function styleIconDivByTemplateId(iconDiv, templateId) {
    let rarity = getItemRarity(templateId);
    let iconClass = getItemIconClass(templateId);
    DomUtils.addElementClass(iconDiv, rarity);
    let div = DomUtils.createDivElement(iconDiv, 'item_icon_'+templateId, '', 'item_icon')
    if (iconClass) {
        DomUtils.addElementClass(div, iconClass);
    }
}

let vendorItems = [];

function getVendorItemList() {
    return vendorItems;
}

function getItemVendorPrice(item) {
    return Math.ceil(MATH.randomBetween(1, 2 + 1000 * Math.random()))
}

function getItemVendorCurrency(item) {
    return "ITEM_CURRENCY_GOLD"
}

function applyCurrencySufficiency(element, item) {
    let canAfford = playerCanAffordItem(item);
    if (canAfford) {
        DomUtils.removeElementClass(element, 'currency_insufficient');
        DomUtils.addElementClass(element, 'currency_sufficient');
    } else {
        DomUtils.removeElementClass(element, 'currency_sufficient');
        DomUtils.addElementClass(element, 'currency_insufficient');
    }
    return canAfford;
}

export {
    getItemRarity,
    getItemQuality,
    getItemConfigStatus,
    getItemIconClass,
    getItemConfigByItemId,
    getVisualConfigByItemId,
    getVisualConfigByVisualId,
    getVisualConfigIconClass,
    getItemUiStateKey,
    getItemMaxPotency,
    getItemMaxRank,
    getItemPotencySlotCount,
    getItemRankSlotCount,
    updatePotencyDivs,
    updateRankDivs,
    attachPotencySlots,
    attachRankSlots,
    updateItemProgressUiStatus,
    styleIconDivByTemplateId,
    getVendorItemList,
    getItemVendorPrice,
    getItemVendorCurrency,
    applyCurrencySufficiency
}