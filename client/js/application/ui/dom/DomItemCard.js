import {HtmlElement} from "./HtmlElement.js";
import {ENUMS} from "../../ENUMS.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {
    applyCurrencySufficiency,
    getItemConfigByItemId, getItemIconClass,
    getItemMaxPotency,
    getItemMaxRank,
    getItemPotencySlotCount,
    getItemRankSlotCount, getItemUiStateKey, getItemVendorCurrency, getItemVendorPrice, getVisualConfigByItemId,
    getVisualConfigByVisualId,
    getVisualConfigIconClass, styleIconDivByTemplateId, updateItemProgressUiStatus, updatePotencyDivs, updateRankDivs
} from "../../utils/ItemUtils.js";
import {saveItemStatus} from "../../setup/Database.js";
import {getItemRecipe} from "../../utils/CraftingUtils.js";
import {
    getStashItemCountByTemplateId,
    sendItemToStash
} from "../../utils/StashUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {
    canBuildConstructionKit,
    createByTemplate,
    generateEstateDeed,
    initActorEstateBuilding
} from "../../utils/EstateUtils.js";
import {getConfigByEditId, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {getPlayerStatus, getSetting, setSetting, setStatusValues} from "../../utils/StatusUtils.js";
import {notifyCameraStatus} from "../../../3d/camera/CameraFunctions.js";

let activeDomItems = [];




class DomItemCard {
    constructor() {

        let htmlElement = new HtmlElement();
        let item = null;
        let targetElement = null;
        let targetRoot = null;
        let rootElement = null;

        let potencyContainer = null;
        let rankContainer = null;
        let dynDivs = [];
        let potencyDivs = [];
        let rankDivs = [];

        let statusMap = {   }





        function updateCardPosition() {
            let bodyRect = DomUtils.getWindowBoundingRect();
            let rootRect = targetRoot.getBoundingClientRect();
            let elemRect = targetElement.getBoundingClientRect();

            let width = elemRect.width;
            let height = elemRect.height;

            let pTop  = bodyRect.height - rootRect.top - bodyRect.top;
            if (pTop > bodyRect.height*0.5) {
                pTop -= (rootRect.height*2.2 + height * 2);
            }


            let pLeft = elemRect.left + rootRect.left - bodyRect.left;

            if (pLeft > bodyRect.width * 0.4) {
                pLeft -= (rootRect.width*1.2 + width * 1)
            } else {
                pLeft += rootRect.width*1.2 + width * 2
            }

            setTargetCoordinates(pTop, pLeft)
        }




        let update = function() {
            if (targetRoot === null) {
                return;
            }

            let rootSize = DomUtils.rootFontSize()
            if ( rootElement.style.fontSize !== rootSize) {
                rootElement.style.fontSize = rootSize;
            }

        //    statusMap['PALETTE_VALUES'] = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);

            updateCardPosition()
            updateItemProgressUiStatus(item, statusMap, rankContainer, rankDivs, potencyContainer, potencyDivs)

            if (item.visualItem !== null) {
                let instance = item.visualItem.call.getInstance()

                if (instance !== null) {
                    let modelPalette = item.visualItem.call.getPalette()

                    modelPalette.setFromValuearray(statusMap['PALETTE_VALUES']);
                    modelPalette.applyPaletteToInstance(instance)
                }
            }

            let itemType = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);

            if (itemType === ENUMS.itemTypes.KIT) {

                let canBuild = canBuildConstructionKit(item, getPlayerActor());

            //    if (canBuild !== buildStatus.canBuild) {
                    buildStatus.canBuild = canBuild;

                    let paramBuild = htmlElement.call.getChildElement("param_BUILD");
                    let paramAquire = htmlElement.call.getChildElement("param_AQUIRE");
                    let paramDemolish = htmlElement.call.getChildElement("param_DEMOLISH");

                    if (canBuild !== false) {
                        if (item.getStatus(ENUMS.ItemStatus.CHILD_ITEMS).length === 0) {
                            statusMap['item_deed_build'] = "Begin Construction";
                            paramBuild.style.display = '';
                            let build = htmlElement.call.getChildElement("button_build");
                            build.style.display = '';
                            DomUtils.addClickFunction(build, activateBuild);
                        } else {
                        //    paramVisit.style.display = ''
                            paramDemolish.style.display = ''
                        //    let visit = htmlElement.call.getChildElement("button_visit");
                            let demolish = htmlElement.call.getChildElement("button_demolish");
                       //     DomUtils.addClickFunction(visit, activateTravel);
                       //     let wLevel = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL);
                       //     let coords = JSON.stringify(item.getStatus(ENUMS.ItemStatus.POS));
                       //     statusMap['item_deed_visit'] = "W: "+wLevel+" P:"+coords;
                            DomUtils.addClickFunction(demolish, activateDemolish);
                            statusMap['item_deed_demolish'] = item.getStatus(ENUMS.ItemStatus.CHILD_ITEMS)[0];
                        }
                    } else {
                        paramBuild.style.display = '';
                        htmlElement.call.getChildElement("button_build").style.display = 'none';
                        statusMap['item_deed_build'] = "Requires Private Estate";
                    }


            }

            let uiStateKey = getItemUiStateKey(item)
            if (uiStateKey === ENUMS.UiStates.VENDOR) {
                let priceElem = htmlElement.call.getChildElement("vendor_buy_price");
                let canAfford = applyCurrencySufficiency(priceElem, item)
                let buttonelem = htmlElement.call.getChildElement("button_buy");
                if (canAfford) {
                    DomUtils.removeElementClass(buttonelem, 'button_not_afford');
                    DomUtils.addElementClass(buttonelem, 'button_can_afford');
                } else {
                    DomUtils.removeElementClass(buttonelem, 'button_can_afford');
                    DomUtils.addElementClass(buttonelem, 'button_not_afford');
                }

            }


        }

        let buildStatus = {
            canBuild:false
        };

        let rebuild = function() {
            clearIframe();
        //    setTimeout(function() {
                setItem(item);
                setTargetElement(targetElement, targetRoot);
         //   }, 500)
        }

        let paletteEdit = null;

        let paletteEditReady = function(ple) {

            console.log("paletteEditReady", ple)
        }



        let editPalette = function() {

        //    let palette = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);

            if (paletteEdit !== null) {
                paletteEdit.closeDomPalette()
                poolReturn(paletteEdit);
                paletteEdit = null;
                item.status.call.pulseStatusUpdate();
                saveItemStatus(item.getStatus());
                // item.setStatusKey(ENUMS.ItemStatus.PALETTE_VALUES, statusMap['PALETTE_VALUES'])
                return;
            } else {
                paletteEdit = poolFetch('DomPalette');
                paletteEdit.initDomPalette(statusMap['PALETTE_VALUES'], paletteEditReady, editPalette)
            }

        }


        function activateTravel() {
            console.log("activateTravel", item)
            let buildingEditId = item.getStatus(ENUMS.ItemStatus.CHILD_ITEMS)[0];
            let pos;
            if (buildingEditId) {
                let buildingCfg = getConfigByEditId(buildingEditId);
                console.log("buildingCfg", buildingCfg);
                pos = MATH.vec3FromArray(null, buildingCfg['pos']);
            } else {
                pos = MATH.vec3FromArray(null, item.getStatus(ENUMS.ItemStatus.POS))
            }

            let worldLevel = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL);
            GameAPI.getPlayer().teleportPlayer(worldLevel, pos)
            close();
        }

        function activateAquireDeed() {
            generateEstateDeed(item, getPlayerActor())
        }



        let penPre = null;
        let pushPre = null;

        function buildCallback(model) {
            console.log("buildCallback", item, model)
            if (typeof (model) === 'object') {
            //    model.call.worldModelLodUpdate(-2);
                model.fitToTerrain();
                saveWorldModelEdits(model);
                let worldLevel = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
                item.getStatus(ENUMS.ItemStatus.CHILD_ITEMS).push(model.config.edit_id);
                item.setStatusKey(ENUMS.ItemStatus.WORLD_LEVEL, worldLevel);
                item.setStatusKey(ENUMS.ItemStatus.POS, MATH.vec3ToArray(model.getPos(), []));
           //     model.call.worldModelLodUpdate(-2);
                setSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY, pushPre);
                setSetting(ENUMS.Settings.OBSTRUCTION_PENETRATION, penPre);
                setTimeout(function () {
             //       model.call.worldModelLodUpdate(0);
                    function reImprintCB() {
                        model.preventLod = false;
                    }

                    setTimeout(function() {
                    //    model.imprintWorldModelToGround(reImprintCB);
                        model.preventLod = false;
                    }, 500)

                    setStatusValues([{PlayerStatus: ENUMS.PlayerStatus.PLAYER_STATUS_FLAGS, value: 'ESTATE_0'}])
                }, 500)
            } else {
                console.log("Building failure or cancel")
            }
        }

        function activateBuild() {
         //   let vConf = getVisualConfigByItemId(item.getStatus(ENUMS.ItemStatus.TEMPLATE));
            console.log("activateBuild", item)
            let buildingTemplate = item.config['building_template']
            let estate = canBuildConstructionKit(item, getPlayerActor());
            penPre  = getSetting(ENUMS.Settings.OBSTRUCTION_PENETRATION);
            pushPre = getSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY);
            setSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY, 0);
            setSetting(ENUMS.Settings.OBSTRUCTION_PENETRATION, 0);
            initActorEstateBuilding(getPlayerActor(), estate, buildingTemplate, buildCallback)

            close();
        }

        function activateDemolish() {
            let buildingEditId = item.getStatus(ENUMS.ItemStatus.CHILD_ITEMS).pop();
            let buildingCfg = getConfigByEditId(buildingEditId);
            let worldModel = GameAPI.worldModels.getActiveWorldModel(buildingEditId);
            worldModel.deleteWorldModel();
            console.log("activateDemolish worldModel", item, buildingCfg, worldModel);
            worldModel.config.DELETED = true;
            saveWorldModelEdits(worldModel);
            saveItemStatus(item.getStatus());

        }

        function activateRankUp() {
            let rank = item.getStatus(ENUMS.ItemStatus.ITEM_RANK)
            let echelon = item.getStatus(ENUMS.ItemStatus.RANK_ECHELON);

            let maxSlots = getItemRankSlotCount(item);

            if (echelon < maxSlots) {
                console.log("activateRankUp", item);
                item.setStatusKey(ENUMS.ItemStatus.RANK_ECHELON, echelon+1);
            } else {
                let maxRank = getItemMaxRank(item);
                if (rank < ENUMS.echelon['ECHELON_'+maxRank]) {
                    item.setStatusKey(ENUMS.ItemStatus.RANK_ECHELON, 0);
                    item.setStatusKey(ENUMS.ItemStatus.ITEM_RANK, rank+1);
                } else {
                    console.log("Item Rank progress Max reached")
                    let empowerDiv = htmlElement.call.getChildElement("rank_up");
                    empowerDiv.style.pointerEvents = 'none'
                    empowerDiv.innerHTML = 'MAX';
                }
            }
            saveItemStatus(item.getStatus())
        }


        function activateStashSwitch() {
            sendItemToStash(item)
        }

        function activateItemBuy() {
            let cost = getItemVendorPrice(item);
            console.log("activateItemBuy", cost, item);

            let templateId = item.getStatus(ENUMS.ItemStatus.TEMPLATE)

            function itemReady(loadedItem) {
                GuiAPI.notifyItemLooted(getPlayerActor(), loadedItem);
                getPlayerActor().processItemLooted(loadedItem)
                // sendItemToStash(loadedItem)
            }

            evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: templateId, callback:itemReady})


        }


        function activateEmpower() {

            let potency = item.getStatus(ENUMS.ItemStatus.ITEM_POTENCY)
            let echelon = item.getStatus(ENUMS.ItemStatus.POTENCY_ECHELON);

            let maxSlots = getItemPotencySlotCount(item);

            if (echelon < maxSlots) {
                console.log("activateRankUp", item);
                item.setStatusKey(ENUMS.ItemStatus.POTENCY_ECHELON, echelon+1);
            } else {
                let maxRank = getItemMaxPotency(item);
                if (potency < ENUMS.echelon['ECHELON_'+maxRank]) {
                    item.setStatusKey(ENUMS.ItemStatus.POTENCY_ECHELON, 0);
                    item.setStatusKey(ENUMS.ItemStatus.ITEM_POTENCY, potency+1);
                } else {
                    console.log("Item Rank progress Max reached")
                    let empowerDiv = htmlElement.call.getChildElement("empower");
                    empowerDiv.style.pointerEvents = 'none'
                    empowerDiv.innerHTML = 'MAX';
                }
            }
            saveItemStatus(item.getStatus())
        }

        let readyCb = function() {
            rootElement = htmlElement.call.getRootElement();
            rootElement.style.scale = 0.3;
            let bodyRect = DomUtils.getWindowBoundingRect();
            let width = bodyRect.width;
            let height = bodyRect.height;
            setTargetCoordinates(height*0.5,width *0.5)
            let container = htmlElement.call.getChildElement('container')
            let panel = htmlElement.call.getChildElement('item_card_panel')
            container.style.visibility = "visible";
            container.style.display = "";
        //    DomUtils.addClickFunction(container, rebuild)

            potencyContainer = htmlElement.call.getChildElement('container_item_potency')
            rankContainer = htmlElement.call.getChildElement('container_item_rank')

            let rankUpDiv = htmlElement.call.getChildElement("rank_up");
            let empowerDiv = htmlElement.call.getChildElement("empower");
            DomUtils.addClickFunction(rankUpDiv, activateRankUp);
            DomUtils.addClickFunction(empowerDiv, activateEmpower);

            let paramText = htmlElement.call.getChildElement("param_TEXT");
            let paramEquipSlot = htmlElement.call.getChildElement("param_EQUIPPED_SLOT");
            let paramModifiers = htmlElement.call.getChildElement("param_MODIFIERS");
            let paramPalVals = htmlElement.call.getChildElement("param_PALETTE_VALUES");
            let paramRank = htmlElement.call.getChildElement("param_RANK");
            let paramPotency = htmlElement.call.getChildElement("param_POTENCY");
            let paramRecIngredients = htmlElement.call.getChildElement("param_INGREDIENTS");
            let paramCraft = htmlElement.call.getChildElement("param_CRAFT");

            let paramBuild = htmlElement.call.getChildElement("param_BUILD");
            let paramAquire = htmlElement.call.getChildElement("param_AQUIRE");
            let paramDemolish = htmlElement.call.getChildElement("param_DEMOLISH");

            let paramTravel = htmlElement.call.getChildElement("param_TRAVEL");

            let paramStash = htmlElement.call.getChildElement("param_STASH");
            let buttonStash = htmlElement.call.getChildElement("button_stash");

            let paramBuy = htmlElement.call.getChildElement("param_BUY");
            let buttonBuy = htmlElement.call.getChildElement("button_buy");


            DomUtils.addClickFunction(buttonStash, activateStashSwitch);
            DomUtils.addClickFunction(buttonBuy, activateItemBuy);

            paramBuy.style.display = 'none'
            paramBuild.style.display = 'none'
            paramAquire.style.display = 'none'
            paramDemolish.style.display = 'none'
            paramTravel.style.display = 'none'

            let itemType = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE)



            if (typeof(item.config['equip_slot']) !== 'string' ) {
                paramRank.style.display = 'none'
                paramPotency.style.display = 'none'
            //    paramEquipSlot.style.display = 'none'
                paramPalVals.style.display = 'none'
                paramModifiers.style.display = 'none'
                paramRecIngredients.style.display = 'none'
                paramCraft.style.display = 'none'
            } else if (itemType === ENUMS.itemTypes.RECIPE) {
                paramRank.style.display = 'none'
                paramPotency.style.display = 'none'
                paramPalVals.style.display = 'none'

                let ingredients = getItemRecipe(item).getIngredients();
                if (ingredients.length !== 0) {
                    let container = htmlElement.call.getChildElement("container_ingredients");
                    for (let i = 0; i < ingredients.length; i++) {
                        let div = DomUtils.createDivElement(container, 'ingredients_'+i, '', 'ingredient_icon_frame')
                        styleIconDivByTemplateId(div, ingredients[i].templateId)
                        //    let iHtml = '<h4>'+ingredients[i].templateId+'</h4>';
                        let count = getStashItemCountByTemplateId(ingredients[i].templateId);
                        let iHtml = '<h2>'+ingredients[i].amount+'</h2>'
                        iHtml += '<p>/</p>'
                        iHtml += '<h3>'+count+'</h3>'
                        let textDiv = DomUtils.createDivElement(div, 'label_'+i, iHtml, "ingredient_icon_label")

                    //    div.innerHTML = iHtml;
                    }
                } else {
                    paramRecIngredients.style.display = 'none'
                }

            } else {
                paramRecIngredients.style.display = 'none'
                paramCraft.style.display = 'none'
                let maxRank = getItemMaxRank(item);
                let maxPotency = getItemMaxPotency(item);
                if (maxRank === ENUMS.echelon.ECHELON_0) {
                    paramRank.style.display = 'none'
                }
                if (maxPotency === ENUMS.echelon.ECHELON_0) {
                    paramPotency.style.display = 'none'
                }
            }

            let uiStateKey = getItemUiStateKey(item)
            if (uiStateKey === ENUMS.UiStates.VENDOR) {
                paramBuy.style.display = ''
                paramStash.style.display = 'none'
                paramRank.style.display = 'none'
                paramPotency.style.display = 'none'
                paramEquipSlot.style.display = 'none'
                paramPalVals.style.display = 'none'
                paramRecIngredients.style.display = 'none'
                paramBuild.style.display = 'none'
                paramAquire.style.display = 'none'
                paramDemolish.style.display = 'none'
                paramTravel.style.display = 'none'

                let currencyIcon = htmlElement.call.getChildElement("currency_icon");
                DomUtils.addElementClass(currencyIcon, getItemIconClass(statusMap['vendor_buy_currency']));
            }

            if (itemType === ENUMS.itemTypes.ESTATE) {
                paramTravel.style.display = ''
                paramAquire.style.display = ''
                let travel = htmlElement.call.getChildElement("button_travel");
                statusMap['item_travel'] = JSON.stringify(item.getStatus(ENUMS.ItemStatus.POS));
                DomUtils.addClickFunction(travel, activateTravel);

                let aquire = htmlElement.call.getChildElement("button_aquire");
                statusMap['item_aquire'] = "Sign Estate Deed";
                DomUtils.addClickFunction(aquire, activateAquireDeed);
            }

            if (itemType === ENUMS.itemTypes.DEED) {
                paramTravel.style.display = ''
                let travel = htmlElement.call.getChildElement("button_travel");
            //    let travelText = htmlElement.call.getChildElement("item_travel");
                let estateCfg = getItemConfigByItemId(item.config['estate_template']);
                let wl = estateCfg.data.status[ENUMS.ItemStatus.WORLD_LEVEL]
                if (wl === "19") {
                    wl = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_ID);
                }
                let pos = estateCfg.data.status[ENUMS.ItemStatus.POS]
                item.setStatusKey(ENUMS.ItemStatus.POS, pos);
                item.setStatusKey(ENUMS.ItemStatus.WORLD_LEVEL, wl);
                statusMap['item_travel'] = "w:"+wl+" pos:"+JSON.stringify(pos);
                DomUtils.addClickFunction(travel, activateTravel);
            }

            let paletteDiv = htmlElement.call.getChildElement("palette_edit");
            if (statusMap['PALETTE_VALUES'].length) {
                console.log(statusMap['PALETTE_VALUES'])
                DomUtils.addClickFunction(paletteDiv, editPalette);
            } else {
                paletteDiv.style.display = "none";
            }



            if (item.getStatus(ENUMS.ItemStatus.TEXT) === "") {
                paramText.style.display = 'none';
            }


        //    let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            let backplate = htmlElement.call.getChildElement("backplate");

            let itemDiv = htmlElement.call.getChildElement("item_icon");

            let visualConfig = getVisualConfigByVisualId(item.config['visual_id'])
            let iconClass = getVisualConfigIconClass(visualConfig);

            if (!iconClass) {
                iconClass = 'NYI_ICON'
            }

            let rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
            DomUtils.addElementClass(panel, rarity);
            DomUtils.addElementClass(backplate, rarity);
            DomUtils.addElementClass(itemDiv, iconClass);
            ThreeAPI.registerPrerenderCallback(update);
        }

        let setItem = function(itm, closeItemCard) {
            item = itm;
            statusMap['ITEM_ID'] = item.getStatus(ENUMS.ItemStatus.ITEM_ID);
            statusMap['TEMPLATE'] = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
            statusMap['NAME'] = item.getStatus(ENUMS.ItemStatus.NAME);
            statusMap['ITEM_LEVEL'] = item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
            statusMap['ITEM_TYPE'] = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);
            statusMap['QUALITY'] = item.getStatus(ENUMS.ItemStatus.QUALITY);
            statusMap['RARITY'] = item.getStatus(ENUMS.ItemStatus.RARITY);
            statusMap['ACTIVATION_STATE'] = item.getStatus(ENUMS.ItemStatus.ACTIVATION_STATE);
            statusMap['EQUIPPED_SLOT'] = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            statusMap['PALETTE_VALUES'] = item.getStatus(ENUMS.ItemStatus.PALETTE_VALUES);
            statusMap['MODIFIERS'] = item.getStatus(ENUMS.ItemStatus.MODIFIERS);
            statusMap['SLOT_ID'] = item.getEquipSlotId()
            statusMap['ITEM_RANK'] = -1;
            statusMap['ITEM_POTENCY'] = -1;
            statusMap['RANK_ECHELON'] = -1;
            statusMap['POTENCY_ECHELON'] = -1;
            statusMap['INGREDIENTS'] = getItemRecipe(item).getIngredients();
            statusMap['TEXT'] = item.getStatus(ENUMS.ItemStatus.TEXT) || "";
            statusMap['vendor_buy_price'] = getItemVendorPrice(item);
            statusMap['vendor_buy_currency'] = getItemVendorCurrency(item)
            htmlElement.initHtmlElement('item_card', closeItemCard, statusMap, 'item_card', readyCb);
        }

        let getItem = function() {
            return item;
        }

        let setTargetCoordinates = function(bottom, left) {
            rootElement.style.transform = "translate3d(-50%, 0, 0)";
            rootElement.style.bottom = bottom+'px';
            rootElement.style.left = left+'px';
        }

        let setTargetElement = function(target, root) {
            targetElement = target;
            targetRoot = root;
        }

        let clearIframe = function() {
            htmlElement.closeHtmlElement();
        //    console.log("Clear DomItem ", htmlElement)
            let rootElem = htmlElement.call.getRootElement()
            if (rootElem) {
                DomUtils.removeDivElement(rootElem);
            }
        }

        let close = function() {
            DomUtils.clearDivArray(dynDivs);
            DomUtils.clearDivArray(potencyDivs);
            DomUtils.clearDivArray(rankDivs);
        //    item = null;
            ThreeAPI.unregisterPrerenderCallback(update);
            clearIframe();
        }

        this.call = {
            setItem:setItem,
            getItem:getItem,
            setTargetElement:setTargetElement,
            close:close
        }

    }


}



export {DomItemCard}