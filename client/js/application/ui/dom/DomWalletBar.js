import {poolFetch} from "../../utils/PoolUtils.js";
import {getStashItemCountByTemplateId} from "../../utils/StashUtils.js";

class DomWalletBar {
    constructor() {

        let walletBarElement = null;
        let walletContainer = null;
        let statusMap = {};

        function update() {
            let countGold = getStashItemCountByTemplateId('ITEM_CURRENCY_GOLD');
            let countDiamonds = getStashItemCountByTemplateId('ITEM_CURRENCY_DIAMOND');
            statusMap['ITEM_CURRENCY_GOLD'] = countGold;
            statusMap['ITEM_CURRENCY_DIAMOND'] = countDiamonds;
        }


        function close() {
        //    ThreeAPI.unregisterPrerenderCallback(update);
        }

        function walletBarReady() {
            walletContainer = walletBarElement.call.getChildElement('wallet_bar');
            ThreeAPI.registerPrerenderCallback(update);
        }

        function activate() {
            walletBarElement = poolFetch('HtmlElement');
            walletBarElement.initHtmlElement('bar_wallet', close, statusMap, 'bar_wallet', walletBarReady);

        }

        function hide() {
            walletBarElement.hideHtmlElement(0.3)
        }

        function show() {
            walletBarElement.showHtmlElement(0.3)
        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();
    }

}

export { DomWalletBar }