import {poolFetch} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {populateInvStatusMap} from "../../utils/PlayerUtils.js";
import {getStashItemCountByTemplateId} from "../../utils/StashUtils.js";
import {DomBattleHud} from "./DomBattleHud.js";

class DomWorldHud {
    constructor() {

        let rightBarElement = null;
        let walletBarElement = null;
        let walletContainer = null;
        let statusMap = {};

        let invDiv;
        let stashDiv;
        let inv = null;
        let stash = null;
        let actor = null;

        let walletElements = [];

        let domBattleHud = null;


        function update() {

            rightBarElement.call.applyTransformSettings(
                ENUMS.Settings.OFFSET_RBAR_X,
                ENUMS.Settings.OFFSET_RBAR_Y,
                ENUMS.Settings.SCALE_RBAR
            )

            let inCombat = GameAPI.checkInCombat();

            if (statusMap[ENUMS.ActorStatus.IN_COMBAT] !== inCombat) {
                statusMap[ENUMS.ActorStatus.IN_COMBAT] = inCombat;

                if (inCombat === true) {
                    domBattleHud = new DomBattleHud();
                    hide();
                } else {
                    if (domBattleHud) {
                        domBattleHud.call.close();
                    }

                    domBattleHud = null;
                    show();
                }

            }

            populateInvStatusMap(statusMap);
            let countGold = getStashItemCountByTemplateId('ITEM_CURRENCY_GOLD');
            let countDiamonds = getStashItemCountByTemplateId('ITEM_CURRENCY_DIAMOND');
        //    statusMap['char_name'] = getPlayerActor().getStatus(ENUMS.ActorStatus.NAME);
            statusMap['ITEM_CURRENCY_GOLD'] = countGold;
            statusMap['ITEM_CURRENCY_DIAMOND'] = countDiamonds;
        }


        function close() {
        //    ThreeAPI.unregisterPrerenderCallback(update);
        }

        let closeInv = function() {
            if (inv !== null) {
                inv.call.release()
                inv = null;
            }
        }

        let closeStash = function() {
            if (stash !== null) {
                stash.call.release()
                stash = null;
            }
        }



        let openInventory = function() {
            if (stash !== null) {
                closeStash();
            }
            if (inv !== null) {
                closeInv();
            } else {
                actor = getPlayerActor();
                inv = poolFetch('DomInventory');
                inv.call.activate(actor, invDiv, closeInv);
            }
        }

        let openStash = function() {
            if (inv !== null) {
                closeInv();
            }
            if (stash !== null) {
                closeStash();
            } else {
                actor = getPlayerActor();
                stash = poolFetch('DomStash');
                stash.call.activate(actor, stashDiv, closeStash);
            }
        }

        function openCharacter() {
            getPlayerActor().setStatusKey(ENUMS.ActorStatus.NAVIGATION_STATE, ENUMS.NavigationState.CHARACTER);
        }

        function rightBarReady() {
            actor = getPlayerActor();

            invDiv = rightBarElement.call.getChildElement('button_inventory');
            stashDiv = rightBarElement.call.getChildElement('button_stash');
            let charDiv = rightBarElement.call.getChildElement('button_character');
            DomUtils.addClickFunction(invDiv, openInventory)
            DomUtils.addClickFunction(stashDiv, openStash)
            DomUtils.addClickFunction(charDiv, openCharacter)
            ThreeAPI.registerPrerenderCallback(update);
        }

        function walletBarReady() {
            walletContainer = walletBarElement.call.getChildElement('wallet_bar');
        }

        function activate() {
            rightBarElement = poolFetch('HtmlElement');
            rightBarElement.initHtmlElement('bar_right', close, statusMap, 'bar_right', rightBarReady);

            walletBarElement = poolFetch('HtmlElement');
            walletBarElement.initHtmlElement('bar_wallet', close, statusMap, 'bar_wallet', walletBarReady);

        }

        function hide() {
            rightBarElement.hideHtmlElement(0.3)
        //    walletBarElement.hideHtmlElement(0.3)
        }

        function show() {
            rightBarElement.showHtmlElement(0.3)
        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();
    }

}

export { DomWorldHud }