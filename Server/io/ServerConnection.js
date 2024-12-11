import {ConnectedClient} from "../game/player/ConnectedClient.js";
import {GameServer} from "../game/GameServer.js";
import {applyMessageToClient, setGameServer} from "../game/utils/GameServerFunctions.js";
import {trackIncomingBytes, trackOutgoingBytes} from "../game/utils/ServerStatusTracker.js";
import {addIndexEntry, getEditIndex, setEditIndex} from "../game/utils/EditorFunctions.js";

let rootPath;
let sockets = [];
let connectedPlayers = [];
let gameServer = new GameServer(connectedPlayers)
gameServer.initServerLoop(100);
setGameServer(gameServer)

let sends = 0;
let server = null;
let edit_index = null;
let editsFolder = "edits";
function updateEditWriteIndex(message, deleted) {
	addIndexEntry(message.path, message.root, message.folder, message.id, message.format, deleted);
	let writeCB = function(res) {
		if (res !== null) {
			console.log("index error:", res);
		} else {
			console.log("index updated:", message.id);
		}
	}
//	server.writeFile(indexFile, JSON.stringify(edit_index), writeCB)
}

let folder;
let root;
function getAllEditFiles(dir, done) {
	let results = [];
	server.readdir(dir, function(err, list) {
		if (err) return done(err);
		let pending = list.length;
		if (!pending) return done(null, results);
		list.forEach(function(file) {
			file = server.resolvePath(dir, file);
			server.lstat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					root = folder;
					folder = stat;
					getAllEditFiles(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
					});
				} else {
					let splits = file.split('\\')
					if (splits.length < 2) {
						splits = file.split('/')
					}
					let entry = splits.pop().split('.');
					let startIndex = splits.indexOf('edits');
					let iPath = ""
					for (let i = startIndex+1; i < splits.length-2; i++) {
						iPath += splits[i]+"/";
					}
					entry.push(iPath);
					entry.push(splits[splits.length-2]);
					entry.push(splits[splits.length-1]);
					results.push(entry);
					if (!--pending) done(null, results);
				}
			});
		});
	});
}

function traverseAndIndexEdits(dir, folder, root) {

	function traverseCB(err, results) {

		for (let i = 0; i < results.length; i++) {
			let res = results[i];
			addIndexEntry(res[2], res[3], res[4], res[0], res[1], false, true);
		}
	}

	getAllEditFiles(dir, traverseCB);
}

function loadEditIndex(cb) {
	rootPath = server.resolvePath('./')
	console.log("Root Path ", rootPath+"/"+editsFolder)
	let indexCb = function(data) {
			edit_index = data;
			console.log("Edit Index Loaded");
		//	console.log(edit_index);
			cb(edit_index);
	}
	setEditIndex({});
	traverseAndIndexEdits(rootPath+"/"+editsFolder)
	indexCb(getEditIndex())
}

function fileFromMessage(message) {
	return rootPath+"/"+editsFolder+"/"+message.path+message.root+"/"+message.folder+"/"+message.id+"."+message.format;
}

class ServerConnection {
	constructor() {

	}

	shutdownSocket = function() {
		this.wss.close();
	};

	writeDataToFile(message) {
		let data = message.data;
		if (message.format === 'buffer') {

		}

		let deleted = false;
		if (data['DELETED'] === true) {
			deleted = true;
		}
		let file = fileFromMessage(message)
		console.log("PATH FILE: ", message.path,  file);
		let timestamp = addIndexEntry(message.path, message.root, message.folder, message.id, message.format, deleted);
		message.timestamp = timestamp;

		let writeCB = function(res) {
			if (res !== null) {
				console.log("writeFile error:", res);
			} else {
				if (deleted === false) {
					updateEditWriteIndex(message, deleted);
				}
			}
		}
		console.log("writeDataToFile", message.id, file);

		let path = rootPath+"/"+editsFolder+"/"+message.path  //  +message.root+"/"+message.folder;
		try {
			if (!server.existsSync(path)) {
				console.log("Make dir for path: ", path)
				server.mkdirSync(path);
			}
			path += message.root+"/"
			if (!server.existsSync(path)) {
				console.log("Make dir for path: ", path)
				server.mkdirSync(path);
			}
			path += message.folder
			if (!server.existsSync(path)) {
				console.log("Make dir for path: ", path)
				server.mkdirSync(path);
			}

		} catch (err) {
			console.error(err);
		}

		server.writeFile(file, data, writeCB)

	}

	readDataFromFile(message, callback) {
		let file = fileFromMessage(message)

	//	console.log("Read File: ",file, indexEntry, message)

		let dataCb = function(error, data) {
			if (error) {
				console.log("Data Read Error: ", message.id, file, error);
			} else {
				let value = JSON.parse(data);
			//	console.log("File Loaded", message.id, file);
			//	console.log(value);
				callback(value)
			}
		}
	//	console.log("readDataFromFile", message.id, file);
		server.readFile(file, dataCb)
	}

	setupSocket = function(wss, srvr) {
		this.wss = wss;
		server = srvr;


		loadEditIndex(setEditIndex);

		wss.on("connection", function(ws) {
			sockets.push(ws);
			let sends = 0;

			let returnFromPlayer = function(message) {
				sends++
			//	console.log("Pass to socket ", sends, message)
				let bytes = message.length
				trackOutgoingBytes(bytes)
				ws.send(message)
			}

			ws.connectedClient = new ConnectedClient(returnFromPlayer, false)
			ws.connectedClient.activateConnectedClient();
			connectedPlayers.push(ws.connectedClient);
			console.log("websocket connection open");

			ws.on("message", function message(data, isBinary) {
				const message = isBinary ? data : data.toString();
				let bytes = message.length;
				trackIncomingBytes(bytes);
			//	console.log(message + "\n\n");
				ws.connectedClient.handleMessage(message, "NODE WS")
			});

			ws.on("close", function() {
				console.log("connection closed "+sockets.indexOf(ws));

				sockets.splice(sockets.indexOf(ws), 1)
				connectedPlayers.splice(connectedPlayers.indexOf(ws.connectedClient), 1)
				ws.connectedClient.deactivateConnectedClient();
			})

		});
	};

};

export {ServerConnection}