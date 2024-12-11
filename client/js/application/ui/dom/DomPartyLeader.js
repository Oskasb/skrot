import {HtmlElement} from "./HtmlElement.js";
import {activateSeekPartyEncounter, getActivePlayerActors} from "../../utils/PlayerUtils.js";

class DomPartyLeader {
    constructor(worldEncounter) {

        let closeTimeout = null;
        if (closeTimeout !== null) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        let htmlElement = new HtmlElement();
        let hostActor = worldEncounter.getHostActor()

        let encounterAttitude = hostActor.getStatus(ENUMS.ActorStatus.ATTITUDE)
        let encounterLevel = hostActor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL)

        let statusMap = {
            attitude : encounterAttitude,
            level : "Level:"+encounterLevel,
            text : worldEncounter.id,
            players: 0
        }

        let closeCb = function() {
            console.log("Close...")
            activateSeekPartyEncounter("")
            ThreeAPI.unregisterPrerenderCallback(update);
        }

        function update() {

            let playerParty = GameAPI.getGamePieceSystem().playerParty
            if (playerParty.actors.length !== 1) {
                htmlElement.closeHtmlElement();
            } else {
                statusMap.players = getActivePlayerActors().length;
            }

        }

        let readyCb = function() {
            let partyPanel = htmlElement.call.getChildElement('party_panel')
            let target = htmlElement.call.getChildElement('target')
            target.innerHTML = "Target: "+hostActor.getStatus(ENUMS.ActorStatus.NAME)
            ThreeAPI.registerPrerenderCallback(update);
        }

        let rebuild = htmlElement.initHtmlElement('party_leader', closeCb, statusMap, 'party_page', readyCb);

    }

}

export {DomPartyLeader}