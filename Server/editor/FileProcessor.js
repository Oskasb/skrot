import {addIndexEntry, getEditIndex, setEditIndex} from "./EditorFunctions.js";

let rootPath;
let server = null;
let edit_index = null;
let editsFolder = "data";
function updateEditWriteIndex(message, deleted) {
    addIndexEntry(message.path, message.root, message.folder, message.id, message.format, deleted);
}

let folder;
let root;
let synchList = {};

function registerEntryUpdate(file, entry) {
    console.log("File Change; ", file, entry);
}

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
                //    console.log("Folder: ", dir)
                    getAllEditFiles(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                //    console.log("File: ", file)
                    let splits = file.split('\\')
                    if (splits.length < 2) {
                        splits = file.split('/')
                    }
                    let entry = splits.pop().split('.');
                    let startIndex = splits.indexOf('data');
                    let iPath = ""
                    for (let i = startIndex+1; i < splits.length-2; i++) {
                        iPath += splits[i]+"/";
                    }
                    entry.push(iPath);
                    entry.push(splits[splits.length-2]);
                    entry.push(splits[splits.length-1]);

                    function notifyFileChanged(curr, prev) {
                        registerEntryUpdate(file, entry);
                    }

                    server.watchFile(file, notifyFileChanged)

                    results.push(entry);
                //    console.log("File: ", file, entry)
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function traverseAndIndexEdits(dir, indexCb) {

    function traverseCB(err, results) {

        for (let i = 0; i < results.length; i++) {
            let res = results[i];
            addIndexEntry(res[2], res[3], res[4], res[0], res[1], false, true);
        }
        indexCb(getEditIndex());
    }

    getAllEditFiles(dir, traverseCB);
}

function loadEditIndex(cb) {
    rootPath = server.resolvePath('./')
    console.log("Root Path ", rootPath+"/"+editsFolder)


    let indexCb = function(data) {
    //    console.log("indexCb:", data);
        let writeCB = function(res) {
            if (res !== null) {
                console.log("writeFile error:", res);
            } else {
                setEditIndex(edit_index);
                cb(edit_index);
            }
        }

        edit_index = data;
        server.writeFile(rootPath+"/"+editsFolder+"/json/setup/index.json", JSON.stringify(data), writeCB)
    }

    setEditIndex({});
    traverseAndIndexEdits(rootPath+"/"+editsFolder, indexCb)
 //   indexCb(getEditIndex)
}

function fileFromMessage(message) {
    return rootPath+"/"+editsFolder+"/"+message.path+message.root+"/"+message.folder+"/"+message.id+"."+message.format;
}

class FileProcessor {
    constructor() {

    }

    initContentData(srvr, onIndexCB) {
        server = srvr
        loadEditIndex(onIndexCB)
    }

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


};

export {FileProcessor}