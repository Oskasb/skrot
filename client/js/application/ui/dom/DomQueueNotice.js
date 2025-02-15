import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {createDivElement, removeDivElement} from "./DomUtils.js";
import {MATH} from "../../MATH.js";
import {getFrame} from "../../utils/DataUtils.js";

let index = 0;

class DomQueueNotice {
    constructor() {

        let elementHoriz = null;
        let elementVert = null;
        let barContainer = null;
        let vertContainer = null;
        let statusMap = null;
        let closed = false;
        let indocatorDivs = [];

        let string = "";
        let time = 0;

        let showing = null;

        function updateElements() {

            let now = performance.now() * 1000;
            let dt = now - time;
            time += dt;

            let lastString = string;
            let newString = "" // '<p>some_entry</p><p>some_entry</p>'


            for (let i = 0; i <indocatorDivs.length; i++) {
                let entry = indocatorDivs[i].entry;
                entry.age += entry.age;

            //    if (entry.age < 0.03) {
                    newString += '<p>'+entry.key+'</p>';
            //    }

            }

            if (lastString !== newString) {
                string = newString;
                vertContainer.innerHTML = newString;
            }


        }


        function updateIndicatorDivs(entries) {
            for (let i = 0; i < entries.length; i++) {
                let entry = entries[i];
                let key = entry.key;
                let div = entry.div;
                if (!div) {
                    let div = createDivElement(barContainer, key+'_'+index, "", "entry")
                    entry.div = div;
                    div.entry = entry;
                    entry.age = 0;

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

            if (entries.length === 0) {
                if (showing === true) {
                    hide();
                    showing = false;
                }
            } else {
                if (showing === false) {
                    show();
                    showing = true;
                }
            }
        }

        function update() {
            let entries = statusMap.activeEntries;
            updateIndicatorDivs(entries);
            updateElements()
            if (closed === true) {
                return;
            }

            window.requestAnimationFrame(update);
        }

        function vertRdy() {
            vertContainer = elementVert.call.getChildElement('load_list')
            update();
        }

        function elemReady() {
            barContainer = elementHoriz.call.getChildElement('load_bar')

            elementVert = poolFetch('HtmlElement');
            elementVert.initHtmlElement('queue_files', null, statusMap, 'asynch_list_feedback', vertRdy);

        }

        function activate(sMap) {
            statusMap = sMap;
            index++;
            statusMap.index = index;
            closed = false;

            elementHoriz = poolFetch('HtmlElement');
            elementHoriz.initHtmlElement('queue_notice', null, statusMap, 'asynch_queue_feedback', elemReady);

        }



        let close = function () {

            if (closed === true) {
                return;
            }
            closed = true;
            hide();
            let _this = this;
            setTimeout(function() {
                elementHoriz.closeHtmlElement()
                poolReturn(elementHoriz);
                elementHoriz = null;
                poolReturn(_this);
            }, 500)

        }.bind(this);

        function show() {
            elementHoriz.call.getIframe().style.display = ''
            elementVert.call.getIframe().style.display = ''
        }

        function hide() {
            elementHoriz.call.getIframe().body.style.visibility = 'hidden'
            elementVert.call.getIframe().style.display = 'none'
        }

        this.call = {
            close:close,
            activate:activate
        }

    }

}

export { DomQueueNotice }