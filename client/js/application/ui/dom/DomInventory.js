import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

let defaultAdsr = {
    attack: {duration:0.5, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:0.4, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}


class DomInventory {
    constructor() {
        let actor = null;

        let htmlElement = new HtmlElement();
        let buttonDiv = null;
        let adsrEnvelope;
        let slotElements = {};
        let rootElem;
        let statusMap = {
            name : ".."
        }

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

        let readyCb = function() {

            let items = actor.actorInventory.items;


            MATH.emptyArray(lastFrameState); // For debugging

            for (let key in items) {
                let slot = htmlElement.call.getChildElement(key);
                slotElements[key] = slot;
                DomUtils.addMouseMoveFunction(slot, mouseMove)
                DomUtils.addPointerExitFunction(slot, mouseOut)
            }

            let reloadDiv = htmlElement.call.getChildElement('reload');
            if (reloadDiv) {
                DomUtils.addClickFunction(reloadDiv, retrigger)
            }

        }

        let rebuild;
        let lastFrameState = [];
        let update = function() {

            if (actor === null) {
                console.log("No actor")
                return;
            }

            let invState = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);

            let itemCount = 0;

            for (let i = 0; i < invState.length; i++) {
                let itemId = invState[i];
                if (lastFrameState[i] !== itemId) {
                    if (itemId) {
                        let item = GameAPI.getItemById(itemId);
                        console.log("Inv state updated", i, itemId, item);
                    /*
                        let slotId = item.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
                        if (slotId !== 'SLOT_'+i) {
                            item.setStatusKey(ENUMS.ItemStatus.EQUIPPED_SLOT, 'SLOT_'+i);
                            item.setStatusKey(ENUMS.ItemStatus.ACTOR_ID, actor.getStatus(ENUMS.ActorStatus.ACTOR_ID));
                        }
                    */
                    }
                }
            }
            MATH.copyArrayValues(invState, lastFrameState);


        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            actor.deactivateUiState(ENUMS.UiStates.INVENTORY);
            actor = null;
            htmlElement.closeHtmlElement();
            poolReturn(htmlElement);
        }

        let htmlReady = function() {
            readyCb()
            htmlElement.container.style.visibility = 'visible';
            GuiAPI.setUiStatusHtmlElement(ENUMS.UiStates.INVENTORY, htmlElement)
            statusMap.id = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID);
            statusMap.name = actor.getStatus(ENUMS.ActorStatus.NAME);

            setTimeout(function() {
                ThreeAPI.registerPrerenderCallback(update);
                setInitTransforms();
                actor.activateUiState(ENUMS.UiStates.INVENTORY);
            },1)
        }


        let activate = function(actr, btnDiv, onClose) {
            buttonDiv = btnDiv;
            console.log("Actor inventory", actr)
            DomUtils.addElementClass(buttonDiv, 'bar_button_active')
            adsrEnvelope = defaultAdsr;
            actor = actr;
            htmlElement = poolFetch('HtmlElement');
            rebuild = htmlElement.initHtmlElement('inventory', onClose, statusMap, 'inventory', htmlReady);
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

export {DomInventory}