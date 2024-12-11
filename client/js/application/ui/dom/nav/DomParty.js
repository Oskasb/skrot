import {poolFetch} from "../../../utils/PoolUtils.js";

class DomParty {
    constructor() {

        let statusMap = {};

        let partyElement = null;

        function elemReady() {

        }

        function activate() {
            partyElement = poolFetch('HtmlElement');
            partyElement.initHtmlElement('nav/party', close, statusMap, 'party', elemReady);

        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();

    }
}

export { DomParty }