import {HtmlElement} from "./HtmlElement.js";
import {poolReturn} from "../../utils/PoolUtils.js";
import {styleIconDivByTemplateId} from "../../utils/ItemUtils.js";

let noticeQueue = [];

class DomLootNotice {
    constructor() {
        let domLootNotice = this;
        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        let htmlElement = new HtmlElement();

        let statusMap = {}

        let closeCb = function () {
            console.log("Close...")
        }

        let container;

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();

        //    let optElem = DomUtils.createDivElement(container, 'option_' + option['interaction'], option['text'], 'option_container ' + option['interaction'])

            let addIcon = function () {
        //        let iconElem = DomUtils.createDivElement(optElem, 'icon_' + option['interaction'], '', 'interact_icon')
            }

            setTimeout(addIcon, 100)

        let hide = function() {
            htmlElement.hideHtmlElement()


            setTimeout(function() {
                close();
            }, 1500)
        }

        let rootElement;
            let readyCb = function () {
                rootElement = htmlElement.call.getRootElement();
                setTimeout(function() {
                    rootElement.style.opacity = 1;
                }, 100)

                container = htmlElement.call.getChildElement('notice_container')
                DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
                let iconFrame = htmlElement.call.getChildElement('icon_frame')
                styleIconDivByTemplateId(iconFrame, statusMap.template)

            //    header.innerHTML = hostActor.getStatus(ENUMS.ActorStatus.NAME)
                DomUtils.addClickFunction(header, rebuild)
                DomUtils.addClickFunction(container, hide)
                setTimeout(hide, 3200)
                ThreeAPI.registerPrerenderCallback(update);
            }

            let rebuild // = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);

            let notify = function(actor, item) {
                if (actor === GameAPI.getGamePieceSystem().selectedActor) {
                    noticeQueue.push(domLootNotice);
                    console.log("loot notice", item)
                    rebuild = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);
                //    let visualPiece = item.visualGamePiece
                    statusMap.header = item.getStatus(ENUMS.ItemStatus.NAME);
                    statusMap.item_type = item.getStatus(ENUMS.ItemStatus.ITEM_TYPE);
                    statusMap.item_level = 'Level:'+item.getStatus(ENUMS.ItemStatus.ITEM_LEVEL);
                    statusMap.rarity = item.getStatus(ENUMS.ItemStatus.RARITY);
                    statusMap.quality = item.getStatus(ENUMS.ItemStatus.QUALITY);
                    statusMap.template = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
                    setTimeout(function() {
                        htmlElement.showHtmlElement();
                    }, noticeQueue.length * 200)

                } else {
                    console.log("Someone elses loot")
                }

            }


            let update = function () {

                let top = (15 + noticeQueue.indexOf(domLootNotice)*6) + '%';
                if (rootElement.style.top !== top) {
                    rootElement.style.top = top;
                }

                let optsContainer = htmlElement.call.getChildElement('interact_container')
                if (optsContainer) {
                    let gameTime = GameAPI.getGameTime();
                    let flash = Math.sin(gameTime * 2.7) * 0.5 + 0.5;
                    let shadowSize = flash * 0.55 + 0.65
                    let color = 'rgba(99, 255, 255, 0.7)';
                    optsContainer.style.boxShadow = '0 0 ' + shadowSize + 'em ' + color;
                }
            }


        let clearIframe = function() {
            MATH.splice(noticeQueue, domLootNotice)
            htmlElement.closeHtmlElement()
        }

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
            poolReturn(this);
        }.bind(this);

        this.call = {
            close: close,
            notify: notify
        }
    }


}

export { DomLootNotice }