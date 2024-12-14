import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {createDivElement, removeDivElement} from "./DomUtils.js";
import {MATH} from "../../MATH.js";

let index = 0;

class DomQueueNotice {
    constructor() {

        let element = null;
        let barContainer = null;
        let statusMap = null;
        let closed = false;
        let indocatorDivs = [];

        function updateIndicatorDivs(entries) {
            for (let i = 0; i < entries.length; i++) {
                let entry = entries[i];
                let key = entry.key;
                let div = entry.div;
                if (!div) {
                    let div = createDivElement(barContainer, key+'_'+index, "", "entry")
                    entry.div = div;
                    div.entry = entry;
                    indocatorDivs.push(div)
                }
            }

            for (let i = 0; i < indocatorDivs.length; i++) {
                let div = indocatorDivs[i];
                if (entries.indexOf(div.entry) === -1) {
                    div.entry.div = null;
                    div.entry = null;
                    MATH.splice(indocatorDivs, div);
                    removeDivElement(div);
                }
            }

        }

        function update() {
            let entries = statusMap.activeEntries;
            updateIndicatorDivs(entries);

            if (closed === true) {
                return;
            }

            window.requestAnimationFrame(update);
        }

        function elemReady() {
            barContainer = element.call.getChildElement('load_bar')
            update();
        }

        function activate(sMap) {
            statusMap = sMap;
            index++;
            statusMap.index = index;
            closed = false;
            element = poolFetch('HtmlElement');
            element.initHtmlElement('queue_notice', null, statusMap, 'asynch_queue_feedback', elemReady);
        }

        function hide() {
            element.hideHtmlElement(0.3)
            //    walletBarElement.hideHtmlElement(0.3)
        }

        let close = function () {

            if (closed === true) {
                return;
            }
            closed = true;
            hide();
            let _this = this;
            setTimeout(function() {
                element.closeHtmlElement()
                poolReturn(element);
                element = null;
                poolReturn(_this);
            }, 500)

        }.bind(this);

        function show() {
            element.showHtmlElement(0.3)
        }

        this.call = {
            close:close,
            activate:activate
        }

    }

}

export { DomQueueNotice }