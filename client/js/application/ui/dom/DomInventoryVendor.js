import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {evt} from "../../event/evt.js";
import {ENUMS} from "../../ENUMS.js";
import {
    applyCurrencySufficiency,
    getItemRarity,
    getItemVendorCurrency,
    getItemVendorPrice,
    getVendorItemList,
    getVisualConfigByItemId, getVisualConfigIconClass
} from "../../utils/ItemUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {playerCanAffordItem} from "../../utils/PlayerUtils.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}


class DomInventoryVendor {
    constructor() {
        let actor = null;

        let htmlElement = new HtmlElement();
        let adsrEnvelope;
        let slotElements = {};
        let rootElem;
        let statusMap = {
            name : ".."
        }
        let currentPageIndex = 1;
        let items = {};
        let setInitTransforms = function() {
            rootElem = htmlElement.call.getRootElement();
            rootElem.style.transform = "translate3d(-126%, -50%, 0)";
        }

        let retrigger = function() {
            close();
            setTimeout(function() {
                activate( GameAPI.getActorById(statusMap.id))
            }, 1500);
        }

        let mouseMove = function(e) {
        //    console.log("mouse Move ", e.target);
            e.target.style.borderColor = "rgba(155, 225, 255, 0.2)";
        }

        let mouseOut = function(e) {
        //    console.log("mouse Out ", e.target);
            e.target.style.borderColor = "";
        }

        let rebuild;
        let lastFrameState = [];
        let currencyRaritys = ["", "", "", "", ""]
        let iconDivs = [];

        let readyCb = function() {

            for (let i = 0; i < currencyRaritys.length;i++) {
                let slotKey = 'SLOT_VENDOR_'+i
                let slot = htmlElement.call.getChildElement(slotKey);
                if (slot) {
                    slotElements[slotKey] = slot;
                    DomUtils.addMouseMoveFunction(slot, mouseMove)
                    DomUtils.addPointerExitFunction(slot, mouseOut)
                }
            }

            let reloadDiv = htmlElement.call.getChildElement('reload');
            if (reloadDiv) {
                DomUtils.addClickFunction(reloadDiv, retrigger)
            }

        }


        let vendorSlots = [];


        function attachCurrencyFrame(vendorItem, slotIndex) {
            let frame = htmlElement.call.getChildElement('currency_'+slotIndex);

            if (!frame) {
                setTimeout(function() { // the doc elements wont be available until after a render frame
                    attachCurrencyFrame(vendorItem, slotIndex);
                }, 20)
                return;
            }

                let currencyTemplate = getItemVendorCurrency(vendorItem);
                let rarity = getItemRarity(currencyTemplate);
                let vconfig = getVisualConfigByItemId(currencyTemplate);
                let itemClass = getVisualConfigIconClass(vconfig)
                DomUtils.addElementClass(frame, rarity);
                let div = DomUtils.createDivElement(frame, 'c_icon_'+slotIndex, '', 'item_icon')
                if (itemClass) {
                    DomUtils.addElementClass(div, itemClass);
                }

        }

        let update = function() {

            if (actor === null) {
                console.log("No actor")
                return;
            }

            let container = htmlElement.call.getChildElement('inventory_slots_container');

            let vendorInv = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
            let offset = (statusMap.subpage-1) * (currencyRaritys.length);

            if (currentPageIndex !== statusMap.subpage) {
                currentPageIndex = statusMap.subpage;
                DomUtils.clearDivArray(iconDivs);
                DomUtils.clearDivArray(vendorSlots);
                for (let i = 0; i < currencyRaritys.length; i++) {


                    let itemIndex = i+offset;
                    let vendorItem = GameAPI.getItemById(vendorInv[itemIndex])

                    let slotInfoDiv = DomUtils.createDivElement(container, 'slot_info_'+itemIndex, "", "vendor_slot_info")
                    vendorSlots.push(slotInfoDiv);
                    let slotNr = '<p>'+itemIndex+'</p>'
                    DomUtils.createDivElement(slotInfoDiv, 'SLOT_VENDOR_'+itemIndex, slotNr, "item_container inv_slot")
                    let iHtml = '<h2 id=name_'+itemIndex+'></h2>';
                    iHtml += '<div id=currency_'+itemIndex+' class="currency_slot price_item_icon_frame"></div>';
                    iHtml += '<h3 id=price_'+itemIndex+'></h3>';
                    DomUtils.createDivElement(slotInfoDiv, 'price_container_'+itemIndex, iHtml, "price_container")
                    // let iHtml = '<div id=slot_info_'+itemIndex+' class=vendor_slot_info>'

                    if (vendorItem) {
                    //    setTimeout(function() { // the doc elements wont be available until after a render frame

                            attachCurrencyFrame(vendorItem, itemIndex);
                    //    }, 100)
                    }

                }
                setTimeout(function() {
                    getPlayerActor().activateUiState(ENUMS.UiStates.VENDOR);
                }, 20)

            }

            for (let i = 0; i < currencyRaritys.length; i++) {
                let itemIndex = i+offset;
                let vendorItem = GameAPI.getItemById(vendorInv[itemIndex])

                if (vendorItem) {
                    let priceElem = htmlElement.call.getChildElement('price_'+itemIndex);
                    if (priceElem) {
                        applyCurrencySufficiency(priceElem, vendorItem)
                    }
                }
            }

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            getPlayerActor().deactivateUiState(ENUMS.UiStates.VENDOR);
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.VENDOR, htmlElement)
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);


            let vendorInv = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);


            currentPageIndex = 0;
            statusMap['subpage'] = 1;
            statusMap['pages_total'] = Math.ceil(vendorInv.length / 5);

            if (statusMap.pages_total > 1) {
                let buttonNext = htmlElement.call.getChildElement('button_page_forward');
                let buttonBack = htmlElement.call.getChildElement('button_page_back');

                function next() {
                    getPlayerActor().deactivateUiState(ENUMS.UiStates.VENDOR);
                    statusMap['subpage'] = MATH.clamp(statusMap.subpage +1, 1, statusMap.pages_total);
                }

                function back() {
                    getPlayerActor().deactivateUiState(ENUMS.UiStates.VENDOR);
                    statusMap['subpage'] = MATH.clamp(statusMap.subpage -1, 1, statusMap.pages_total);
                }

                DomUtils.addClickFunction(buttonNext, next);
                DomUtils.addClickFunction(buttonBack, back);

            } else {

            }

            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
            },1)
        }


        let activate = function(actr, vendorConfig, onClose) {
            console.log("Vendor inventory", actr, vendorConfig)
            statusMap = {};
            let staticItems = vendorConfig['vendor_static_items']
            items = {};
            let vendorInv = actr.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
            MATH.emptyArray(vendorInv);
            let vendorItemList = getVendorItemList();
            MATH.emptyArray(vendorItemList);
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            function itemLoadedCB(item) {
                let slotId = 'SLOT_VENDOR_'+vendorInv.length
                statusMap['name_'+vendorInv.length] = item.getStatus(ENUMS.ItemStatus.NAME);
                statusMap['price_'+vendorInv.length] = getItemVendorPrice(item);
                items[slotId] = item;
                item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, slotId);
                vendorInv.push(item.getStatus(ENUMS.ItemStatus.ITEM_ID));
                vendorItemList.push(item);

                if (vendorInv.length === staticItems.length) {
                    console.log('vendor items loaded: ', items, vendorInv);
                    rebuild = htmlElement.initHtmlElement('inventory_vendor', onClose, statusMap, 'inventory_vendor', htmlReady);
                }
            }

            for (let i = 0; i < staticItems.length; i++) {
                evt.dispatch(ENUMS.Event.LOAD_ITEM, {id: staticItems[i], callback:itemLoadedCB})
            }



        }

        let release = function() {
            htmlElement.hideHtmlElement();

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

export {DomInventoryVendor}