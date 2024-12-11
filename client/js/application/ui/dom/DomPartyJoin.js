import {HtmlElement} from "./HtmlElement.js";
import {activateSeekPartyEncounter} from "../../utils/PlayerUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";

class DomPartyJoin {
    constructor() {

        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }

        let helpRequests;
        let activeSeekers = [];
        let requestsDiv;
        let requestContainers = [];

        let htmlElement = new HtmlElement();

        let seekers = [];

        let statusMap = {
            seekers : ""
        }

        let closeCb = function() {
            console.log("Close... DomPartyJoin")
        }


        function update() {
            for (let i = 0; i < helpRequests.length; i++) {
                let seekerId = helpRequests[i];
                i++;
                let encId = helpRequests[i];
                let reqDiv = htmlElement.call.getChildElement('pr_'+seekerId);
                if (!reqDiv) {
                    addPartySeeker(seekerId, encId);
                    activeSeekers.push(seekerId);
                }
            }

            for (let i = 0; i < activeSeekers.length; i++) {
                if (helpRequests.indexOf(activeSeekers[i]) === -1) {
                    removePartySeeker(activeSeekers[i]);
                }
            }

        }

        let readyCb = function() {
            requestsDiv = htmlElement.call.getChildElement('party_requests')
            ThreeAPI.registerPrerenderCallback(update);
        }

        let rebuild = htmlElement.initHtmlElement('party_join', closeCb, statusMap, 'party_page', readyCb);

        function addPartySeeker(seekerId, encId) {
            seekers.push(seekerId);
            let actor = GameAPI.getActorById(seekerId);
            let name = actor.getStatus(ENUMS.ActorStatus.NAME);

            statusMap.seekers = JSON.stringify(seekers);
            let iHtml = '<h2>JOIN</h2>'
            iHtml += '<h4>'+name+'</h4>'
            let reqDiv = DomUtils.createDivElement(requestsDiv, 'pr_'+seekerId, iHtml, 'party_request');
            DomUtils.addElementClass(reqDiv, 'button_accept');
            requestContainers.push(reqDiv);

            function joinUp() {
                getPlayerActor().setStatusKey(ENUMS.ActorStatus.REQUEST_PARTY, encId);
                close();
            }

            DomUtils.addClickFunction(reqDiv, joinUp)
        }

        function removePartySeeker(seekerId) {
            MATH.splice(seekers, seekerId);
            statusMap.seekers = JSON.stringify(seekers);
            let reqDiv = htmlElement.call.getChildElement('pr_'+seekerId);
            DomUtils.removeElement(reqDiv);
            MATH.splice(requestContainers, reqDiv);
        }

        function close() {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.closeHtmlElement();
        }

        function setSeekerList(seekerList) {
            helpRequests = seekerList;
        }

        this.call = {
            close:close,
            setSeekerList:setSeekerList
        }


    }

}

export {DomPartyJoin}