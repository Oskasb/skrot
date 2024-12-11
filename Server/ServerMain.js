// import { ServerConnection } from "./io/ServerConnection.js";
// import {setEditorServerConnection} from "./game/utils/EditorFunctions.js";

import {FileProcessor} from "./editor/FileProcessor.js";

let fileProcessor = new FileProcessor()

class ServerMain {
	constructor() {
		console.log("Construct Server Main");
	//	this.serverConnection = new ServerConnection();
	}

	indexContentData(server) {

		function onIndexCB(index) {
			console.log("file index loaded");
		}

		fileProcessor.initContentData(server, onIndexCB)
	}

	initServerConnection = function (wss, server) {
	//	this.serverConnection.setupSocket(wss, server);
	//	setEditorServerConnection(this.serverConnection);
	};

}

export {ServerMain}