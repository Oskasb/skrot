import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {getPlayerStatus, setPlayerStatus} from "../../utils/StatusUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {fetchActiveStashPageItems, stashAllConfigItems} from "../../utils/StashUtils.js";
import {saveItemStatus} from "../../setup/Database.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}


class DomStash {
    constructor() {
        let actor = null;

        let htmlElement = new HtmlElement();
        let buttonDiv = null;
        let adsrEnvelope;
        let rootElem;
        let statusMap = {
            name : ".."
        }


        let buttonDivs = {};
        let buttonFunctions = {};

        function tabItems() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_ITEMS);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }
        function tabMats() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_MATERIALS);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }

        function tabCurr() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_CURRENCIES);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }
        function tabLore() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_LORE);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }

        function tabCraft() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_CRAFT);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }

        function tabHousing() {
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB, ENUMS.PlayerStatus.STASH_TAB_HOUSING);
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, 0);
        }

        function pageBack() {
            let currentPage = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE);
            if (currentPage > 0) {
                currentPage--
            }

            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, currentPage);
        }
        function pageFor() {
            let currentPage = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE);
            if (currentPage < statusMap['pages_total']-1) {
                currentPage++
            }
            setPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE, currentPage);
        }

        function cheatAllItems() {
            console.log("cheat all items")
            stashAllConfigItems();
        }

        buttonFunctions['tab_items'] = tabItems;
        buttonFunctions['tab_materials'] = tabMats;
        buttonFunctions['tab_currencies'] = tabCurr;
        buttonFunctions['tab_lore'] = tabLore;
        buttonFunctions['tab_craft'] = tabCraft;
        buttonFunctions['tab_housing'] = tabHousing;
        buttonFunctions['button_page_back'] = pageBack;
        buttonFunctions['button_page_forward'] = pageFor;


        buttonFunctions['tab_cheat'] = cheatAllItems;

        let setInitTransforms = function() {
            rootElem = htmlElement.call.getRootElement();
            rootElem.style.transform = "translate3d(-50%, 0, 0)";
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate(actor, buttonDiv)
            }, 2000);
        }

        let mouseMove = function(e) {
        //    console.log("mouse Move ", e.target);
            e.target.style.borderColor = "rgba(155, 225, 255, 0.2)";
        }

        let mouseOut = function(e) {
        //    console.log("mouse Out ", e.target);
            e.target.style.borderColor = "";
        }

        let stashContainerDiv;

        function attachStashSlot(slotIndex) {

        }

        let readyCb = function() {

            stashContainerDiv = htmlElement.call.getChildElement('stash_container');

            MATH.emptyArray(lastFrameState); // For debugging
            updateActivePageSlots(getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE), getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE));

            buttonDivs['tab_items'] = htmlElement.call.getChildElement('tab_items');
            buttonDivs['tab_materials'] = htmlElement.call.getChildElement('tab_materials');
            buttonDivs['tab_currencies'] = htmlElement.call.getChildElement('tab_currencies');
            buttonDivs['tab_lore'] = htmlElement.call.getChildElement('tab_lore');
            buttonDivs['tab_craft'] = htmlElement.call.getChildElement('tab_craft');
            buttonDivs['tab_housing'] = htmlElement.call.getChildElement('tab_housing');
            buttonDivs['button_page_back'] = htmlElement.call.getChildElement('button_page_back');
            buttonDivs['button_page_forward'] = htmlElement.call.getChildElement('button_page_forward');
            buttonDivs['tab_cheat'] = htmlElement.call.getChildElement('tab_cheat');
            for (let key in buttonDivs) {
                DomUtils.addClickFunction(buttonDivs[key], buttonFunctions[key])
            }

            let reloadDiv = htmlElement.call.getChildElement('reload');
            if (reloadDiv) {
                DomUtils.addClickFunction(reloadDiv, retrigger)
            }

        }

        let rebuild;
        let lastFrameState = [];
        let slotDivs = [];

        function updateActivePageSlots(slotCount, subPageIndex) {
            DomUtils.clearDivArray(slotDivs);
            let pageOffset =slotCount*subPageIndex;
            for (let i = 0; i < slotCount; i++) {

                let slotIndex = i+pageOffset;
                let slotKey ='STASH_SLOT_'+slotIndex;
                    ENUMS.StashSlots[slotKey] = slotKey;
                let div = DomUtils.createDivElement(stashContainerDiv, slotKey, '<p>'+slotIndex+'</p>', "item_container stash_slot")
                slotDivs.push(div);
                DomUtils.addMouseMoveFunction(div, mouseMove)
                DomUtils.addPointerExitFunction(div, mouseOut)
            }
        }

        let stashState = [];

        let tabLabelMap = {};
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_ITEMS] = 'GEAR'
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_MATERIALS] = 'MATS'
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_CURRENCIES] = 'MONEY'
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_LORE] = 'LORE'
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_CRAFT] = 'RECIPES'
        tabLabelMap[ENUMS.PlayerStatus.STASH_TAB_HOUSING] = 'ESTATE'
        tabLabelMap["STASH_TAB_CHEAT"] = 'CHEAT'
        let update = function() {

            MATH.emptyArray(stashState);
            let isUpdate = fetchActiveStashPageItems(stashState)
            if (isUpdate) {
                updateActivePageSlots(getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE), getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE));
                actor.deactivateUiState(ENUMS.UiStates.STASH);
            } else {
                actor.activateUiState(ENUMS.UiStates.STASH);
            }

            for (let i = 0; i < stashState.length; i++) {
                let item = stashState[i];
                if (lastFrameState[i] !== item) {
                    if (item) {
                        let itemId = item.getStatus(ENUMS.ItemStatus.ITEM_ID)
                        let serverSynchedItem = GameAPI.getItemById(itemId);
               //         console.log("Stash state updated", i, itemId, serverSynchedItem);

                        let eqSlot = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT)
                        if (eqSlot === "") {
                            item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, 'STASH_SLOT_'+i)
                            saveItemStatus(item.getStatus())
                        }


                    }
                }
            }
            MATH.copyArrayValues(stashState, lastFrameState);

            statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_TAB] = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_TAB)
            statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE] = getPlayerStatus(ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE)
            statusMap[ENUMS.PlayerStatus.STASH_TAB_ITEMS] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_ITEMS).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_MATERIALS] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_MATERIALS).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_CURRENCIES] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_CURRENCIES).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_LORE] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_LORE).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_CRAFT] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_CRAFT).length
            statusMap[ENUMS.PlayerStatus.STASH_TAB_HOUSING] = getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_HOUSING).length

            let tabTotal = getPlayerStatus(ENUMS.PlayerStatus[statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_TAB]]).length
            statusMap['pages_total'] = Math.ceil((tabTotal || 1)  / getPlayerStatus(ENUMS.PlayerStatus.SLOTS_PER_PAGE))
            statusMap['active_tab_header'] = tabLabelMap[statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_TAB]]
            statusMap['subpage'] = statusMap[ENUMS.PlayerStatus.ACTIVE_STASH_SUBPAGE]+1;

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            actor.deactivateUiState(ENUMS.UiStates.STASH);
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.STASH, htmlElement)
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
                actor.activateUiState(ENUMS.UiStates.STASH);
            },1)
        }

        let activate = function(actr, btnDiv, onClose) {
            buttonDiv = btnDiv;
            console.log("Player Stash", actr)
            if (buttonDiv) {
                DomUtils.addElementClass(buttonDiv, 'bar_button_active')
            }

            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');

            htmlElement.initHtmlElement('stash', onClose, statusMap, 'stash', htmlReady);
        }

        let release = function() {
            htmlElement.hideHtmlElement();
            if (buttonDiv !== null) {
                DomUtils.removeElementClass(buttonDiv, 'bar_button_active')
            }
            buttonDiv = null;
            setTimeout(function() {
                close();
            }, adsrEnvelope.release.duration*1000+200)
        }

        this.call = {
            close:close,
            activate:activate,
            release:release
        }
    }
}

export {DomStash}