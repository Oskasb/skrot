import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomQueueNotice {
    constructor() {


        let element = null;
        let statusMap = null;

        function update() {

        }

        function elemReady() {

        }

        function activate(sMap) {
            statusMap = sMap;
            element = poolFetch('HtmlElement');
            element.initHtmlElement('queue_notice', close, statusMap, 'bar_right', elemReady);
        }

        function hide() {
            element.hideHtmlElement(0.3)
            //    walletBarElement.hideHtmlElement(0.3)
        }

        let close = function () {
        //    ThreeAPI.unregisterPrerenderCallback(update);
            hide();
            setTimeout(function() {
                element.closeHtmlElement()
                poolReturn(element);
                element = null;
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