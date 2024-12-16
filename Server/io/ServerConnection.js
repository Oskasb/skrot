import {onMessage, setEditorSocket} from "../editor/EditorFunctions.js";

class ServerConnection {
	constructor() {

	}

	setupSocket = function(wss) {

		wss.on("connection", function(ws) {

			setEditorSocket(ws);
			console.log("websocket connection open");

			ws.on("message", function message(data, isBinary) {
				const message = isBinary ? data : data.toString();
				onMessage(message);
			});

			ws.on("close", function() {
				console.log("connection closed ");
			})

		});
	};

};

export {ServerConnection}