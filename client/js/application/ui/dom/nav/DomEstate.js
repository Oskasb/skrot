import {poolFetch, poolReturn} from "../../../utils/PoolUtils.js";

class DomEstate {
    constructor() {

        let statusMap = {};

        let mainElement = null;

        function elemReady() {

        }

        function activate() {
            mainElement = poolFetch('HtmlElement');
            mainElement.initHtmlElement('nav/estate', close, statusMap, 'full_screen', elemReady);
        }

        function close() {
            setTimeout(function() {
                mainElement.closeHtmlElement();
                poolReturn(mainElement);
            }, 300)
            mainElement.hideHtmlElement(0.1);
        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();

    }
}

export { DomEstate }