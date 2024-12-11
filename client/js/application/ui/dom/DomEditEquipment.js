import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {configDataList, detachConfig} from "../../utils/ConfigUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {evt} from "../../event/evt.js";
import {getItemConfigs, getSlotToItemMap} from "../../utils/ActorUtils.js";



class DomEditEquipment {
    constructor() {

        let statusMap = null;
        let itemSlots = null;
        let htmlElem = null;
        let idLabel = null;
        let editLabel = null;
        let itemConfigs = getItemConfigs();
        let slotToItemMap = getSlotToItemMap()
        let equipRequests = [];

        function toolClosedCB() {
        //    toolSelectDiv.value = "MODELS";
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            let actor = statusMap.parent;
            itemSlots = actor.actorEquipment.itemSlots;

            let container = htmlElem.call.getChildElement('selections_container');

            idLabel = htmlElem.call.getChildElement('actor_id');
            editLabel = htmlElem.call.getChildElement('edit_id');

            editLabel.innerHTML = statusMap.config.edit_id;

            let html = "";

            for (let key in itemSlots) {
                let id = itemSlots[key].slotId;
                html += "<label for="+id+">"+id+"</label><select name="+id+" id="+id+"></select>"
            }

            container.innerHTML = html;

            setTimeout(function() {
                setupLists()
            }, 200)

        }


        function setupLists() {

            for (let key in itemSlots) {
                let id = itemSlots[key].slotId;
                let list = slotToItemMap[id] || [""];
                let item = itemSlots[key].item;
                let selection = "";

                if (item !== null) {
                    selection = item.configId;
                    console.log("Init with item ", id, item.configId,  item.id);
                }

           //     console.log("slotToItemMap id ", selection, id, list, slotToItemMap);
                htmlElem.call.populateSelectList(id, list);
                let listElem = htmlElem.call.getChildElement(id);
                listElem.value = selection;
            }

            ThreeAPI.registerPrerenderCallback(update);
        }

        function itemLoaded(item) {
            let slotId = item.config['equip_slot']
            console.log("Editor Item Loaded", item, slotId);
            MATH.splice(equipRequests, slotId)
            let listElem = htmlElem.call.getChildElement(slotId);
            listElem.value = item.configId;
            let actor = statusMap.parent;
            actor.equipItem(item);
        }

        function equipItem(configId) {
            evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: configId, callback:itemLoaded})
        }


        function selectionUpdated(slotId, configId) {


            if (equipRequests.indexOf(slotId) === -1) {

            //    console.log("Selection Updated", slotId, configId);

                let actor = statusMap.parent;
                let config = statusMap.config;
                let status = actor.actorStatus.statusMap;

                let item = actor.actorEquipment.getEquippedItemBySlotId(slotId)
                if (item !== null) {
                    console.log("Slot selection UNEQUIP", slotId, item)
                    MATH.splice(status.EQUIPPED_ITEMS, item.configId);
                    actor.unequipItem(item);
                    item.disposeItem();
                }

                if (configId === "") {
                    console.log("Slot Cleared", slotId);
                    actor.actorText.say("Clear Slot "+slotId);
                } else  {
                    console.log("Equip Updated", statusMap, slotId, configId);
                    equipRequests.push(slotId);
                    equipItem(configId);
                    if (status.EQUIPPED_ITEMS.indexOf(configId) === -1) {
                        status.EQUIPPED_ITEMS.push(configId);
                    } else {
                        console.log("Item already listed, should not be happening")
                    }

        //            console.log("Slot selection EQUIP", id, key, selection, slots)
                }
            }

        }

        let update = function() {

            let actor = statusMap.parent;
            if (idLabel.innerHTML !== actor.getStatus(ENUMS.ActorStatus.ACTOR_ID)) {
                idLabel.innerHTML = actor.getStatus(ENUMS.ActorStatus.ACTOR_ID)
                console.log("Actor changed..", idLabel.innerHTML)
                return;
            }

            let slots = actor.actorEquipment.itemSlots;

            for (let key in slots) {
                let id = slots[key].slotId;
                let listElem = htmlElem.call.getChildElement(id);
                let item = slots[key].item;
                let selection = "";

                if (item !== null) {
                    selection = item.configId;
                }

                if (listElem.value !== selection) {
                    selectionUpdated(id, listElem.value);
                }
            }
        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(this.call.update);
            this.htmlElement.closeHtmlElement();
            poolReturn(this.htmlElement);
            this.htmlElement = null;
            poolReturn(this)
        }.bind(this);

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)

        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_equipment', closeCb, statusMap, 'edit_frame edit_equipment', readyCb);
    }


    closeEditTool() {
        this.call.close();
    }

}

export { DomEditEquipment }