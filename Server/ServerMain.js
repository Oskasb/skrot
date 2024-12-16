import { ServerConnection } from "./io/ServerConnection.js";
import {FileProcessor} from "./editor/FileProcessor.js";

let fileProcessor = new FileProcessor()

class ServerMain {
	constructor() {
		this.serverConnection = new ServerConnection();
	}

	indexContentData(server) {

		function onIndexCB(index) {
			console.log("file index loaded");
		}

		fileProcessor.initContentData(server, onIndexCB)
	}

	initServerConnection = function (wss) {
		this.serverConnection.setupSocket(wss);
	};

}

export {ServerMain}