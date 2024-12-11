import {HtmlElement} from "./HtmlElement.js";
import {poolReturn} from "../../utils/PoolUtils.js";

import {ENUMS} from "../../ENUMS.js";
import {getRemoteClients} from "../../../Transport/io/ServerCommandProcessor.js";

let remClients = [];

function removeClientInfo(clientInfo) {
    console.log("removeClientInfo", clientInfo)
    MATH.splice(remClients, clientInfo);
    DomUtils.removeDivElement(clientInfo.div);
}

function clearDivArray(array) {
    while(array.length) {
        DomUtils.removeDivElement(array.pop());
    }
}
function clearInfoElements(array) {
    while(array.length) {
        let info = array.pop();
        DomUtils.removeDivElement(info.div);
    }
}

function updateClientInfoActors(clientInfo, actors) {
    let actorInfos = clientInfo.actorInfos;

    while (actorInfos.length) {
        let info = actorInfos.pop();
        DomUtils.removeDivElement(info.div);
    }

    for (let i = 0; i < actors.length; i++) {
        let info = {
            actor:actors[i],
            div:DomUtils.createDivElement(clientInfo.div, actors[i].getStatus(ENUMS.ActorStatus.ACTOR_ID), '', 'actor_sync_status'),
            statuses:{}
        }
        actorInfos.push(info);
    }
}

function updateRemoteClientElements(remoteClients, nodesContainer) {

    for (let key in remoteClients) {
        if (key === "-1" || remoteClients[key] === null) {

        } else {
            let remCli = remoteClients[key];
            let add = true;
            if (remCli.isClosed === true) {
                add = false;
            } else {
                for (let i = 0; i < remClients.length; i++) {
                    if (remClients[i].id === key) {
                        if (remClients[i].actorInfos.length !== remCli.actors.length) {
                            updateClientInfoActors(remClients[i], remCli.actors)
                        }
                        add = false
                    }
                }
            }
            if (add === true) {
                let div = DomUtils.createDivElement(nodesContainer, key, '', 'player_sync_box')
                let clientInfo = {
                    id:key,
                    client:remCli,
                    div:div,
                    actorInfos:[],
                    send:DomUtils.createDivElement(div, 'send_'+key, '', 'player_send sync_dot'),
                    receive:DomUtils.createDivElement(div, 'receive_'+key, '', 'player_receive sync_dot'),
                    receiveClass:null,
                    sendClass:null
                }
                remClients.push(clientInfo);
            }
        }
    }

    for (let i = 0; i < remClients.length; i++) {
        if (remClients[i].client.isClosed === true) {
            removeClientInfo(remClients[i])
        }
    }
}

let checkStatuses = [
    ENUMS.ActorStatus.DEAD,
    ENUMS.ActorStatus.DEACTIVATING_ENCOUNTER,
    ENUMS.ActorStatus.ACTIVATED_ENCOUNTER,
    ENUMS.ActorStatus.ACTIVATING_ENCOUNTER,
    ENUMS.ActorStatus.SELECTED_ENCOUNTER,
    ENUMS.ActorStatus.SELECTED_ACTION,
    ENUMS.ActorStatus.NAVIGATION_STATE,
    ENUMS.ActorStatus.RETREATING,
    ENUMS.ActorStatus.EXIT_ENCOUNTER,
    ENUMS.ActorStatus.IN_COMBAT
]

function statusUpdated(statusKey, actor, div, currentStatus, sType) {

    if (currentStatus === false || currentStatus === '' || currentStatus === 0) {
        DomUtils.removeElementClass(div, statusKey);
    } else {
        DomUtils.addElementClass(div, statusKey);
    }

}

function checkStatusChanged(statusKey, actor, div, statuses) {

    let currentStatus = actor.getStatus(statusKey);

    if (!statuses[statusKey]) {
        statuses[statusKey] = {
            key:statusKey,
            lastValue:'init'
        }
    }

    let lastStatus = statuses[statusKey]
    let sType = typeof(currentStatus);

    if (sType === 'object') {
        let checksum = MATH.stupidChecksumArray(currentStatus)
        if (checksum !== lastStatus.lastValue) {
            lastStatus.lastValue = checksum;
            statusUpdated(statusKey, actor, div, currentStatus, sType)
        }

    } else {
        if (lastStatus.lastValue !== currentStatus) {
            lastStatus.lastValue = currentStatus;
            statusUpdated(statusKey, actor, div, currentStatus, sType);
        }
    }

}

function updateActorInfos(info, frame) {
    for (let i = 0; i < info.actorInfos.length; i++) {
        let actor = info.actorInfos[i].actor;
        let div = info.actorInfos[i].div;
        for (let j = 0; j < checkStatuses.length; j++) {
            checkStatusChanged(checkStatuses[i], actor, div, info.actorInfos[i].statuses)
        }
    }
}

function updateInfoFrame(info, frame) {
    let lastMessageFrame = info.client.lastMessageFrame
    let lastRequestFrame = info.client.lastRequestFrame

    updateActorInfos(info, frame)

    if (info.client.isPaused === true) {
        if (info.clientStatusClass !== 'client_status_paused') {
            info.clientStatusClass = 'client_status_paused';
            DomUtils.addElementClass(info.div, info.clientStatusClass)
        }
    } else if (info.clientStatusClass === 'client_status_paused') {
        DomUtils.removeElementClass(info.div, info.clientStatusClass)
        info.clientStatusClass = null;
    }

    if (Math.abs(lastMessageFrame - frame) < 2) {

        if (info.receiveClass !== 'sync_dot_on') {
            info.receiveClass = 'sync_dot_on';
            DomUtils.addElementClass(info.receive, info.receiveClass)
        }

    } else {

        if (info.receiveClass === 'sync_dot_on') {
            DomUtils.removeElementClass(info.receive, info.receiveClass)
            info.receiveClass = null;
        }
    }

    if (Math.abs(lastRequestFrame - frame) < 2) {

        if (info.sendClass !== 'sync_dot_on') {
            info.sendClass = 'sync_dot_on';
            DomUtils.addElementClass(info.send, info.sendClass)
        }

    } else {

        if (info.sendClass === 'sync_dot_on') {
            DomUtils.removeElementClass(info.send, info.sendClass)
            info.sendClass = null;
        }

    }

}


class DomEncounterStatus {
    constructor() {

        let closeTimeout = null;
        let htmlElement = null;
        let nodesContainer;
        let statusMap = {}
        let container;
        let rootElement = null;

        let playerDiv = null;
        let closeAnchor;

        let playerClientInfo = null;

            let readyCb = function () {
                clearInfoElements(remClients);
                if (playerClientInfo !== null) {
                    DomUtils.removeDivElement(playerClientInfo.div)
                }

                statusMap.header = 'Sync:';
                htmlElement.showHtmlElement();
                rootElement = htmlElement.call.getRootElement()
                container = htmlElement.call.getChildElement('encounter_panel')
                nodesContainer = htmlElement.call.getChildElement('nodes_container')
                let header = htmlElement.call.getChildElement('header')
                DomUtils.addClickFunction(container, rebuild)
                ThreeAPI.registerPrerenderCallback(update)

                let id = 'player'
                let div = DomUtils.createDivElement(nodesContainer, id, '', 'player_sync_box')
                playerClientInfo = {
                    id:id,
                    client:client,
                    div:div,
                    actorInfos:[],
                    send:DomUtils.createDivElement(div, 'send_'+id, '', 'player_send sync_dot'),
                    receive:DomUtils.createDivElement(div, 'receive_'+id, '', 'player_receive sync_dot'),
                    receiveClass:null,
                    sendClass:null,
                    clientStatusClass:null
                }
            }

            let activate = function() {
                if (htmlElement !== null) {
                    close();
                }
                htmlElement = new HtmlElement();
                htmlElement.initHtmlElement('encounter_status', null, statusMap, 'encounter_status', readyCb);
            }
            let rebuild = activate;

            function updateStatusFrame(frame) {
                updateInfoFrame(playerClientInfo, frame);
                for (let i = 0; i < remClients.length; i++) {
                    let info = remClients[i]
                    updateInfoFrame(info, frame);
                }
            }

            let update = function () {
                let activeActor = GameAPI.getGamePieceSystem().selectedActor;

                if (activeActor !== null) {
                    if (playerClientInfo.actorInfos.length === 0) {
                        let info = {
                            actor:activeActor,
                            div:DomUtils.createDivElement(playerClientInfo.div, activeActor.getStatus(ENUMS.ActorStatus.ACTOR_ID), '', 'actor_sync_status'),
                            statuses:{}
                        }
                        playerClientInfo.actorInfos[0] = info;
                    }
                }

                let remoteClients = getRemoteClients();
                updateRemoteClientElements(remoteClients, nodesContainer);
                updateStatusFrame(GameAPI.getFrame().frame);
            }

        let clearIframe = function() {
            htmlElement.closeHtmlElement()
        }.bind(this)

        let close = function () {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.hideHtmlElement()
            clearIframe()
        }.bind(this);

        this.call = {
            activate:activate,
            close: close
        }
    }

}

export { DomEncounterStatus }