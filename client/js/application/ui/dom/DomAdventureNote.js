import {HtmlElement} from "./HtmlElement.js";
import {poolReturn} from "../../utils/PoolUtils.js";
import {
    getItemConfigByItemId,
    getItemIconClass,
    getItemRarity,
    getVisualConfigByItemId,
    getVisualConfigIconClass
} from "../../utils/ItemUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getSetting} from "../../utils/StatusUtils.js";
import {DomBattleHud} from "./DomBattleHud.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";

let noticeQueue = [];

function clearDivArray(array) {
    while(array.length) {
        DomUtils.removeDivElement(array.pop());
    }
}

class DomAdventureNote {
    constructor() {

        let worldAdventure = null;

        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }


        let htmlElement = new HtmlElement();

        let nodesContainer;

        let statusMap = {
            selected:false,
            active:false,
            completed:false,
            sortindex:-1,
            reward:"Reward:"
        }
        let sortingIndex = -1;

        let closeCb = function () {
            console.log("Close...")
        }

        let container;

        let rootElement = null;

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();


        let isSelected = false;

        let applySelect = function() {

            let selectedAdv = GameAPI.gameAdventureSystem.call.getSelectedAdventure();
            if (selectedAdv === worldAdventure) {
                isSelected = false;
                GameAPI.gameAdventureSystem.call.setSelectedAdventure(null)
            } else {
                isSelected = true;
                GameAPI.gameAdventureSystem.call.setSelectedAdventure(worldAdventure)
            }

        }

        function applySelected(bool) {
            if (bool) {
                statusMap.selected = true;
                DomUtils.addElementClass(container, 'adventure_panel_selected')
            } else {
                statusMap.selected = false;
                DomUtils.removeElementClass(container, 'adventure_panel_selected')
            }
        }


        function applyActive(bool)  {
            if (bool) {
                statusMap.active = true;
                DomUtils.addElementClass(container, 'adventure_panel_active')
                closeAnchor.style.display = "";
            } else {
                statusMap.active = false;
                DomUtils.removeElementClass(container, 'adventure_panel_active')
                closeAnchor.style.display = "none";
            }
        }

        function applyCompleted(bool) {
            if (bool) {
                statusMap.completed = true;
                DomUtils.addElementClass(container, 'adventure_panel_completed')
                closeAnchor.style.display = "none";
            } else {
                statusMap.completed = false;
                DomUtils.removeElementClass(container, 'adventure_panel_completed')
                closeAnchor.style.display = "";
            }
        }


        let nodeIndicatorDivs = [];


        let nodes = null;
        function attachNodeIndicators() {
            clearDivArray(nodeIndicatorDivs)



            for (let i = 0; i < nodes.length; i++) {
                let div = DomUtils.createDivElement(nodesContainer, worldAdventure.id+'_node_'+i, '', 'adventure_node_indicator')
                nodeIndicatorDivs.push(div);
            }

        }

        let closeAnchor;
        let rewardDiv;
        let rewardsContainer;

            let readyCb = function () {
                rootElement = htmlElement.call.getRootElement()
                closeAnchor =  htmlElement.call.getChildElement('anchor_close')
                closeAnchor.style.display = "none";
                container = htmlElement.call.getChildElement('notice_container')
                nodesContainer = htmlElement.call.getChildElement('nodes_container')
                rewardDiv = htmlElement.call.getChildElement('reward')
                rewardsContainer = htmlElement.call.getChildElement('rewards_container')
            //    DomUtils.addElementClass(container, statusMap.rarity)
                let header = htmlElement.call.getChildElement('header')
                DomUtils.addClickFunction(container, applySelect)
                ThreeAPI.registerPrerenderCallback(update);


                let innerHtml = ""
                let reward = worldAdventure.config.reward || null;

                if (typeof (reward) === "string") {
                    attachItemReward(reward, innerHtml)
                } else if (reward !== null) {
                    if (typeof(reward.length) === 'number') {
                        for (let i = 0; i < reward.length; i++) {
                            attachItemReward(reward[i])
                        }
                    }
                } else {
                    innerHtml += "No Reward!";
                }

                statusMap.reward = innerHtml




            }

            let rebuild // = htmlElement.initHtmlElement('loot_notice', closeCb, statusMap, 'loot_notice', readyCb);



        let rewardDivs = [];

        function attachItemReward(itemId) {

            //    let config = getItemConfigByItemId(itemId);

                let vconfig = getVisualConfigByItemId(itemId);

                let itemClass = getVisualConfigIconClass(vconfig)

           //     console.log("Reward Item Config ", itemClass ,  config, vconfig);

                let frame = DomUtils.createDivElement(rewardsContainer, 'frame_'+itemId, '', 'adventure_reward_icon_frame')
            let rarity = getItemRarity(itemId);
            DomUtils.addElementClass(frame, rarity);

            let div = DomUtils.createDivElement(frame, 'rew_'+itemId, '', 'item_icon')
            if (itemClass) {
                DomUtils.addElementClass(div, itemClass);
            }
            rewardDivs.push(frame);
        }

            let activate = function() {
                lastSortIdx = -1;
                statusMap.selected = false;
                statusMap.active = false;
                rebuild = htmlElement.initHtmlElement('adventure_note', close, statusMap, 'adventure_note', readyCb);
                statusMap.header = worldAdventure.config.name || worldAdventure.id;

                htmlElement.showHtmlElement();
            }

            let lastSortIdx = -1;
            let idxOffset = 60;

            let autoSelected = false;

            let update = function () {
                let activeActor = getPlayerActor();


                let inCombat = GameAPI.checkInCombat();

            //    if (statusMap[ENUMS.ActorStatus.IN_COMBAT] !== inCombat) {
                    statusMap[ENUMS.ActorStatus.IN_COMBAT] = inCombat;
                    if (inCombat === true) {
                        htmlElement.hideHtmlElement(0.5)
                    } else {
                        htmlElement.showHtmlElement(0.5)
                    }
            //    }

                nodes = worldAdventure.adventureNodes;
                statusMap.sortindex = sortingIndex;
                if (lastSortIdx !== sortingIndex) {
                        lastSortIdx = sortingIndex;
                        let offset = sortingIndex * idxOffset;
                        rootElement.style.top = offset +  270 + 'em'
                }

                htmlElement.call.applyTransformSettings(ENUMS.Settings.OFFSET_ADVENTURES_X, ENUMS.Settings.OFFSET_ADVENTURES_Y, ENUMS.Settings.SCALE_ADVENTURES)


                if (sortingIndex === -1) {
                    close()
                }

                if (worldAdventure.call.isCompleted() === false) {

                    let distance = worldAdventure.call.getCursorDistance()

                    if (worldAdventure.config['auto_select'] === true) {
                        if (distance < getSetting(ENUMS.Settings.ADVENTURE_AUTO_SELECT_DISTANCE)) {
                            if (autoSelected === false) {
                                autoSelected = true;
                                applySelect();
                            }
                        } else {
                            autoSelected = false;
                        }
                    }

                    statusMap.distance = MATH.numberToDigits(distance, 1, 1)+'m'

                    let lvl = worldAdventure.config.level || '??';
                    statusMap.level = 'Level: ' + lvl

                    let isActive = worldAdventure.call.adventureIsActive();

                    if (statusMap.active !== isActive) {
                        applyActive(isActive);
                    }

                    let isSelected = worldAdventure.call.adventureIsSelected()
                    if (statusMap.selected !== isSelected) {
                        applySelected(isSelected);
                    }

                    if (nodes.length !== nodeIndicatorDivs.length) {
                        attachNodeIndicators()
                    }

                } else {

                    if (statusMap.completed === false) {
                        statusMap.distance = "Completed";
                        applyActive(false);
                        applySelected(false);
                        applyCompleted(true)
                    }

                }

                if (nodeIndicatorDivs.length) {

                    let progress = 0;

                    if (activeActor) {
                        progress = activeActor.getAdventureProgress(worldAdventure.id);
                    }

                    for (let i = 0; i < nodes.length; i++) {
                        let node = nodes[i];
                        let div = nodeIndicatorDivs[i];

                        if (node.isActive) {
                            if (div.isActive !== true) {
                                div.isActive = true;
                                DomUtils.addElementClass(div, 'indicator_active')
                            }

                        } else {
                            if (div.isActive === true) {
                                DomUtils.removeElementClass(div, 'indicator_active')
                                div.isActive = false;
                            }
                        }

                        if (progress === i) {

                            if (div.isCurrent !== true) {
                                div.isCurrent = true;
                                DomUtils.addElementClass(div, 'indicator_current')
                            }

                        } else {
                            if (div.isCurrent === true) {
                                DomUtils.removeElementClass(div, 'indicator_current')
                                div.isCurrent = false;
                            }

                            if (progress > i) {
                                if (div.isCompleted !== true) {
                                    div.isCompleted = true;
                                    DomUtils.addElementClass(div, 'indicator_completed')
                                }
                            } else {
                                if (div.isCompleted === true) {
                                    DomUtils.removeElementClass(div, 'indicator_completed')
                                    div.isCompleted = false;
                                }
                            }

                        }
                    }
                }

            }

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
            poolReturn(this);
            lastSortIdx = -2;
        }.bind(this)

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
            clearDivArray(nodeIndicatorDivs)
            clearDivArray(rewardDivs);
            statusMap.selected = false;

            if (statusMap.active === true) {
                GameAPI.gameAdventureSystem.call.playerAdventureDeActivated(worldAdventure);
            }

            statusMap.active = false;
            sortingIndex = -1;

        }.bind(this);

        let setSortingIndex = function(idx) {
            if (htmlElement.container === null) {
                activate();
            }
            sortingIndex = idx;
        }


        let setWorldAdventure = function(wAdv) {
            worldAdventure = wAdv;
            activate()
        }

        let getWorldAdventure = function() {
            return worldAdventure;
        }

        this.call = {
            close: close,
            setWorldAdventure:setWorldAdventure,
            getWorldAdventure:getWorldAdventure,
            setSortingIndex:setSortingIndex
        }
    }


}

export { DomAdventureNote }