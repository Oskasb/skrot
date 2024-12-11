import {HtmlElement} from "./HtmlElement.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";

class DomInteract {
    constructor(worldEncounter, interactionOptions, text) {
        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        let htmlElement = new HtmlElement();
        let hostActor = worldEncounter.getHostActor()

        let encounterAttitude = ENUMS.Attitude.HOSTILE
        let encounterLevel = worldEncounter.config.level || 1;

        if (hostActor) {
            encounterAttitude = hostActor.getStatus(ENUMS.ActorStatus.ATTITUDE)
            encounterLevel = hostActor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL)
        }

        let statusMap = {
            posX : 0,
            posZ : 0,
            zoom : 4,
            text : text || "Options"
        }

        let closeCb = function() {
            console.log("Close...")

        }

        let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
        function attachInteractionOption(container, option) {
            let optElem = DomUtils.createDivElement(container, 'option_'+option['interaction'], option['text'], 'option_container '+option['interaction'])

            let addIcon = function() {
                let iconElem = DomUtils.createDivElement(optElem, 'icon_'+option['interaction'], '', 'interact_icon')
            }

            setTimeout(addIcon, 100)

            function triggerEvent(dispatch, text) {
                let eventId = dispatch.event;
                let value = dispatch.value;
                if (!value.pos) {
                    if (hostActor) {
                        value.pos = hostActor.getSpatialPosition();
                    } else {
                        value.pos = getPlayerActor().getPos();
                    }

                }

                if (value.close === true) {
                    value.closeDialogue = close;
                }

                value.worldEncounter = worldEncounter;
                evt.dispatch(ENUMS.Event[eventId], value);

                if (typeof (text) === 'string') {
                    getPlayerActor().actorText.say(text);
                }

            }

            let actFunc = function() {
                if (option['dispatch']) {
                    let dispatch = option['dispatch'];
                    if (dispatch.length) {
                        for (let i = 0; i < dispatch.length; i++) {
                            triggerEvent(dispatch[i], option['text'])
                        }
                    } else {
                        triggerEvent(dispatch, option['text'])
                    }

                    close();
                } else {
                    selectedActor.actorText.say('No bound event '+option['interaction'])

                }
            }

            DomUtils.addClickFunction(optElem, actFunc)
        }

        function validateOption(option) {
            if (option['interaction'] === 'PARTY') {
                let playerParty = GameAPI.getGamePieceSystem().playerParty
                if ( playerParty.actors.length !== 1) {
                    return false;
                }
            }
            return true;
        }

        let readyCb = function() {
            let optsContainer = htmlElement.call.getChildElement('interact_container')
            let header = htmlElement.call.getChildElement('header')
            if (hostActor) {
                header.innerHTML = hostActor.getStatus(ENUMS.ActorStatus.NAME)
            } else {
                header.innerHTML = "ENEMY"
            }


            let attitude = htmlElement.call.getChildElement('attitude')
            statusMap.attitude = encounterAttitude;
            statusMap.level = "Level:"+encounterLevel
        //    alignment.innerHTML = ""+encounterAlignment;
            attitude.className ="attitude "+encounterAttitude;
            DomUtils.addClickFunction(header, rebuild)
            for (let i = 0; i < interactionOptions.length; i++) {
                let isValid = validateOption(interactionOptions[i]);
                if (isValid) {
                    attachInteractionOption(optsContainer, interactionOptions[i]);
                }

            }

            /*
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
            */
        }

        let rebuild = htmlElement.initHtmlElement('interact', closeCb, statusMap, 'interact_page', readyCb);

        let update = function() {
            let optsContainer = htmlElement.call.getChildElement('interact_container')
            if (optsContainer) {
                let gameTime = GameAPI.getGameTime();
                let flash = Math.sin(gameTime*2.7)*0.5 + 0.5;
                let shadowSize = flash*0.55+0.65
                let color = 'rgba(99, 255, 255, 0.7)';
                optsContainer.style.boxShadow = '0 0 '+shadowSize+'em '+color;
            }

        }

        ThreeAPI.registerPrerenderCallback(update);

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ENCOUNTER, "");
            htmlElement.hideHtmlElement()
            closeTimeout = setTimeout(clearIframe,1500)
        //    htmlElement.closeHtmlElement()
        }

        this.call = {
            close:close
        }

    }


}



export {DomInteract}