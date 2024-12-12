import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomQueueNotice {
    constructor() {


        let element = null;
        let statusMap = null;

        let closed = false;

        function update() {

        }

        function elemReady() {

        }

        function activate(sMap) {
            closed = false;
            statusMap = sMap;
            element = poolFetch('HtmlElement');
            element.initHtmlElement('queue_notice', close, statusMap, 'asynch_queue_feedback', elemReady);
        }

        function hide() {
            element.hideHtmlElement(0.3)
            //    walletBarElement.hideHtmlElement(0.3)
        }

        let close = function () {
        //    ThreeAPI.unregisterPrerenderCallback(update);

            if (closed === true) {
                return;
            }
            closed = true;
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