// import { ServerConnection } from "./io/ServerConnection.js";
// import {setEditorServerConnection} from "./game/utils/EditorFunctions.js";
class ServerMain {
	constructor() {
		console.log("Construct Server Main");
	//	this.serverConnection = new ServerConnection();
	}

	initServerConnection = function (wss, server) {
	//	this.serverConnection.setupSocket(wss, server);
	//	setEditorServerConnection(this.serverConnection);
	};

}

export {ServerMain}