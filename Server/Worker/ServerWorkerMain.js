import {WorkerConnection} from "../../client/js/Transport/io/WorkerConnection.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";
import {ConnectedClient} from "../game/player/ConnectedClient.js";
import {GameServer} from "../game/GameServer.js";
import {setGameServer} from "../game/utils/GameServerFunctions.js";


let workerConnection = new WorkerConnection()
let connectedClients = []; // will hold only the localClient here, but the list will have many on the node server
let gameServer = new GameServer(connectedClients)
gameServer.initServerLoop(100);
setGameServer(gameServer)
let messageLocalClient = function(messageData) {
    postMessage([ENUMS.Protocol.SERVER_DISPATCH, messageData])
}

let localClient = new ConnectedClient(messageLocalClient, true)
connectedClients.push(localClient);
localClient.activateConnectedClient()
let onConnected = function(event, serverStamp) {
    console.log("Connected Event:", event, serverStamp);



    localClient.setStamp(serverStamp);
    workerConnection.call.sendJson(JSON.stringify({request:ENUMS.ClientRequests.REGISTER_PLAYER, stamp:serverStamp}))
    localClient.sendToServer = workerConnection.call.sendJson;
    postMessage([ENUMS.Protocol.SET_SERVER_STAMP, serverStamp])
}

let onError = function(event) {
    console.log("Worker socket error: ", event)
}

let onDisconnect = function() {
    console.log("Worker socket disconnected")
}

let onMessage = function(data) {
//    console.log("handle message from SOCKET", data);
    localClient.handleMessage(data, "SOCKET")
}


function initWorkerConnection(runLocally) {
    if (runLocally === true) {
        localClient.handleMessage({request:ENUMS.ClientRequests.REGISTER_PLAYER, stamp:-1}, "LOCAL")
        postMessage([ENUMS.Protocol.SET_SERVER_STAMP, -1])
    } else {
        workerConnection.setupSocket(onConnected, onError, onDisconnect, onMessage)
    }
}


let handleMessage = function(oEvent) {
  // console.log("handle message:", oEvent.data[0], oEvent.data[1]);
    if (oEvent.data[0] === ENUMS.Protocol.CLIENT_TO_WORKER) {
        localClient.handleMessage(oEvent.data[1], 'WORKER');
    } else if (oEvent.data[0] === ENUMS.Protocol.WORKER_LOADED) {
        initWorkerConnection(oEvent.data[1]['runLocally'])
    } else {
        console.log("Not Parsed message:", oEvent.data);
    }

};

 console.log("Load Worker Main")

onmessage = function (oEvent) {
 //   console.log("oEvent", oEvent)
    handleMessage(oEvent);
};

postMessage([ENUMS.Protocol.WORKER_LOADED, {}])