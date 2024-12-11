import {poolFetch} from "../../utils/PoolUtils.js";
import {getPlayerStatus, setPlayerStatus} from "../../utils/StatusUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getConfigByEditId} from "../../utils/ConfigUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";

class DomCustomCharacter {
    constructor(onCloseCB, statusMap) {

        let isValid = false;

        let mainPanelDiv;
        let buttonNameDiv;
        let buttonPlayDiv;
        let editString = null;
        let charListDiv;
        let isReady = false;
        let actorSelectDivs = [];
        let nameLabelDiv;

        let newPlayerCharOptions;

        function switchSelection() {
            DomUtils.removeElementClass(buttonNameDiv, 'bar_button_active')
            DomUtils.removeElementClass(charListDiv, 'character_list_active')
        }

        function onUpdate(inValue, validationCb) {

            setTimeout(function() {
                if (inValue.length > 2) {

                    if (!/[^a-zA-Z]/.test(inValue)) {
                        validationCb(inValue, 'Name is Ok!')
                        isValid = true;
                    } else {
                        validationCb(statusMap.out, 'Standard letters please')
                        isValid = false;
                    }
                } else {
                    validationCb(statusMap.out, 'Name too short')
                    isValid = false;
                }
            }, 200)

        }

        let validName = false;

        function onSubmit(inValue, sMap) {

            if (isValid === true) {
                setPlayerStatus(ENUMS.PlayerStatus.PLAYER_NAME, inValue);
                statusMap.NAME = inValue;

                if (editString !== null) {
                    editString.closeEditTool();
                    editString = null;
                }

                validName = true;
                DomUtils.removeElementClass(buttonNameDiv, 'animate_button_border')
                DomUtils.removeElementClass(nameLabelDiv, 'animate_button_border')
                nameLabelDiv.style.borderColor = "rgba(88,255,136, 1)";
                DomUtils.addElementClass(buttonNameDiv, 'button_complete')
                setTimeout(selectChar, 500)
            }
        }

        function selectName() {
            switchSelection()

            if (editString === null) {
            DomUtils.addElementClass(buttonNameDiv, 'bar_button_active')

            let stringEditClose = function() {
                console.log("Close String Edit")
                switchSelection();
                editString = null;
            }


            let stringEditReady = function() {
                console.log("String Edit Ready")
                //    editString = null;
            }

                editString = poolFetch('DomEditString')
                editString.initEditTool(stringEditClose, statusMap, stringEditReady)
            } else {
                editString.closeEditTool();
                editString = null;
            }


        }

        function selectChar() {
            if (editString !== null) {
                editString.closeEditTool();
                editString = null;
            }
            switchSelection()
            DomUtils.addElementClass(charListDiv, 'character_list_active')

        }

        let selectedCharDiv = null;
        let selectedCharacterId = null;
        function charSelected(div, id) {
            selectedCharacterId = id;
            statusMap.text_bottom = statusMap[selectedCharacterId].text;
            if (selectedCharDiv !== null) {
                DomUtils.removeElementClass(selectedCharDiv, 'character_select_active')
            }
            selectedCharDiv = div;
            console.log("charSelected", selectedCharacterId, div);
            DomUtils.addElementClass(div, 'character_select_active')


                let value = {
                    pos: statusMap[selectedCharacterId].pos || [-893, 4, 519],
                    actor_id: id,
                    inventory_items: statusMap[selectedCharacterId].inventory_items,
                    equipped_items: statusMap[selectedCharacterId].equipped_items,
                    status: {
                        ATTITUDE: "FRIENDLY",
                        STRONGHOLD_ID: "SH_MANSION"
                    }
                }

            setTimeout(function() {
                evt.dispatch(ENUMS.Event.SELECT_ADVENTURER, value)
            }, 100);


            gtag('event', 'SELECT_ADVENTURER', {
                "event_category": "NEW_PLAYER",
                "event_label": id
            });


        }

        function enterWorld() {
            console.log("Enter World ", selectedCharacterId, statusMap.NAME, statusMap);
            setPlayerStatus(ENUMS.PlayerStatus.PLAYER_NAME, statusMap.NAME)
            htmlElement.closeHtmlElement()
            setTimeout(function() {
                evt.dispatch(ENUMS.Event.SELECT_ADVENTURER, {activate_selection:true})
            }, 100)

            gtag('event', 'ENTER_WORLD', {
                "event_category": "PLAYER_START",
                "event_label": selectedCharacterId
            });

        }

        function customCharacter() {
            console.log("Create Custom Character");
            gtag('event', 'CUSTOM_CHARACTER', {
                "event_category": "PLAYER_START",
                "event_label": "INIT"
            });
            //  htmlElement.closeHtmlElement();
        }


        function poopulateActorList(actors) {
            for (let i = 0; i < actors.length; i++) {

                let actorId = actors[i].id;
                let actorText = actors[i].text;
                statusMap[actorId] = actors[i];

                let div = DomUtils.createDivElement(charListDiv, 'select_'+actorId, actorId, 'character_select')
                DomUtils.addElementClass(div, 'character_'+actorId);
                actorSelectDivs.push(div)
                let onClick = function() {
                    charSelected(div, actorId)
                }
                DomUtils.addClickFunction(div, onClick)

                if (i === 0) {
                    setTimeout(function() {
                        onClick()
                        isValid = true;
                        onSubmit('Tester')
                    }, 100)

                }
            }
        }

        function update() {

            if (!newPlayerCharOptions) {
                newPlayerCharOptions = getConfigByEditId('new_player_character_options')
                console.log(newPlayerCharOptions);
                if (newPlayerCharOptions) {
                    statusMap.text_top = newPlayerCharOptions['info_text_top']
                    statusMap.text_bottom = newPlayerCharOptions['info_text_bottom']
                }
            } else {
                let actors = newPlayerCharOptions.actors;
                if (actorSelectDivs.length !== actors.length) {
                    poopulateActorList(actors)
                }
            }

            if (isReady === false) {
                if (selectedCharacterId !== null && validName === true) {
                    isReady = true;
                    DomUtils.removeElementClass(buttonPlayDiv, 'bar_button_disabled')
                    DomUtils.removeElementClass(buttonPlayDiv, 'button_incomplete')
                    DomUtils.addElementClass(buttonPlayDiv, 'animate_button_border')
                    DomUtils.addElementClass(buttonPlayDiv, 'button_complete')
                    DomUtils.addElementClass(buttonPlayDiv, 'animate_scale_pulsate_p')
                }


            }


        }

            let readyCb = function() {

                let nameDiv = htmlElement.call.getChildElement('NAME');
                mainPanelDiv = htmlElement.call.getChildElement('equipment_container');
                charListDiv = htmlElement.call.getChildElement('character_list');

                buttonNameDiv = htmlElement.call.getChildElement('button_name');
                buttonPlayDiv = htmlElement.call.getChildElement('button_play');

                nameLabelDiv = htmlElement.call.getChildElement('NAME');

                DomUtils.addClickFunction(nameLabelDiv, selectName)
                DomUtils.addClickFunction(buttonNameDiv, selectName)
                DomUtils.addClickFunction(buttonPlayDiv, enterWorld)


                DomUtils.addElementClass(buttonPlayDiv, 'bar_button_disabled')
                DomUtils.addElementClass(buttonPlayDiv, 'button_incomplete')
                DomUtils.addElementClass(buttonNameDiv, 'button_incomplete')
                DomUtils.addElementClass(buttonNameDiv, 'animate_button_border')
                DomUtils.addElementClass(nameLabelDiv, 'animate_button_border')
                //    headerDiv = htmlElement.call.getChildElement('header_container');
                //    topDiv = htmlElement.call.getChildElement('top_container');
                //    bottomDiv = htmlElement.call.getChildElement('bottom_container');
                let reloadDiv = htmlElement.call.getChildElement('reload');
                //    DomUtils.addClickFunction(invDiv, openInventory)
                DomUtils.addClickFunction(reloadDiv, init)

                ThreeAPI.registerPrerenderCallback(update);


            //    setTimeout(selectName, 500);

            }


        let htmlElement = poolFetch('HtmlElement')
        function init() {
            htmlElement.initHtmlElement('new_custom_character', onCloseCB, statusMap, 'full_screen', readyCb);
        }
        init()
    }

}

export { DomCustomCharacter }