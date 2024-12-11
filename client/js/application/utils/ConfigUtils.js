import { ConfigData } from "./ConfigData.js";
import {ENUMS} from "../ENUMS.js";
import {isDev} from "./DebugUtils.js";
import {processJsonVariation} from "./VariationUtils.js";
import {storeBufferImage} from "../setup/Database.js";


let deletedByIndex = [];
let deletedConfigs = {};
let savedConfigs = {};
let editIndex = {};
let requestListeners = [];
let bufferListeners = [];
let requestedLoads = [];
let savedImageBuffers = {};
let configKeyMap = null;
let activeSaves = [];


let activeVariations = [];

let onReadyCBs = [];
let isReady = false;

let populationConfigs = null;
function populationConfigsCB(cfg) {
    populationConfigs = cfg['actor_groups'];
    console.log("Population configs: ", populationConfigs)
    isReady=true;
    while (onReadyCBs.length) {
        onReadyCBs.pop()()
    }
}

function configsReady() {
    return isReady;
}

function addConfigsReadyCallback(cb) {
    onReadyCBs.push(cb)
}

function getPopulationConfigById(popId) {
    for (let i=0; i < populationConfigs.length; i++) {
        if (populationConfigs[i].id === popId) {
            return populationConfigs[i];
        }
    }
    return populationConfigs[0];
}

function variationsData(data) {
    for (let i = 0; i < data.active.length; i++) {
        activeVariations.push(data.active[i].id);
    }
    console.log("Active variations: ", activeVariations);
}
function loadVariationConfigs() {
    let varCfgs = new ConfigData("WORLD_SYSTEMS", "VARIATIONS");
    varCfgs.addUpdateCallback(variationsData);
}

function processLoadedBuffer(id, timestamp) {
    for (let i = 0; i < bufferListeners.length; i++) {
        if (bufferListeners[i].id === id) {
            let entry = bufferListeners[i];
            if (savedImageBuffers[id].timestamp < timestamp) {
                savedImageBuffers[id].timestamp = timestamp;
                entry.callback(savedImageBuffers[id]);
            }
        }
    }
}

let index = 0;

function generateEditId() {
    index++;
    return new Date().getTime()+"_"+index;
}

function generateSaveId() {
    return client.getStamp() + "_"+new Date().getTime();
}

function processLoadedFile(id) {

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config")
        return;
    }

    if (savedConfigs[id]['DELETED'] === true) {
        console.log("Is deleted..")
        return;
    }

    for (let i = 0; i < requestListeners.length; i++) {
        if (requestListeners[i].id === id) {
            let entry = requestListeners[i];
            entry.callback(savedConfigs[id], savedConfigs[id].edit_id);
        }
    }


    let indexEntry = editIndex[id];
 //   console.log("Load from index", id, indexEntry);
    if (!indexEntry) {
        console.log("No index entry", id, editIndex);
        return;
    }

    let root = indexEntry.root;
    let folder = indexEntry.folder;
    let format = indexEntry.format
    let path = indexEntry.path;

    if (format === 'json') {
        if (path === 'configs/') {

            GameAPI.worldModels.setLoadedConfig(root, folder, id, savedConfigs[id]);
        }
        if (path === 'templates/') {

            GameAPI.worldModels.setLoadedTemplate(root, folder, id, savedConfigs[id]);
        }
    }



    if (format === "buffer") {
        console.log("Load saved image buffer")
    }


}

function requestFileRead(id) {

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config", id)

        return;
    }



    if (requestedLoads.indexOf(id) === -1) {
        requestedLoads.push(id);
        evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
            request:ENUMS.ClientRequests.READ_FILE,
            id:id,
            root:editIndex[id].root,
            folder:editIndex[id].folder,
            path:editIndex[id].path,
            format:editIndex[id].format
        })
    }
}

function streamLoadEditsFromIndexInit() {

    let loadStrem = [];

    for (let id in editIndex) {
        if (editIndex.deleted === true) {
            deletedByIndex.push(id);
        } else {
            if (requestedLoads.indexOf(id) === -1) {
                loadStrem.push(id)
            }
        }
    }


    // console.log("Deleted by index: ", deletedByIndex);
    let hold = 0;
    function processStream(tpf) {
        hold += tpf;
        if (hold > 0.1 && Math.random() < 0.1) {
            hold = 0;
            return;
        }

        let id = loadStrem.pop()
        requestFileRead(id);
    //    GuiAPI.screenText('EDITS', ENUMS.Message.SYSTEM, loadStrem.length);
        if (loadStrem.length === 0) {
            ThreeAPI.unregisterPrerenderCallback(processStream)
        } else {
            if (loadStrem.length > 2) {
                processStream(tpf)
            }
        }
    }

    if (loadStrem.length !== 0) {
        ThreeAPI.registerPrerenderCallback(processStream)
    }

}

function processIndexEntry(id, indexEntry) {
    if (indexEntry.format === 'json') {
        for (let i = 0; i < requestListeners.length; i++) {
            if (requestListeners[i].id === id) {
                let entry = requestListeners[i];
                loadSavedConfig(id, entry.callback)
            }
        }
    }
    if (indexEntry.format === 'buffer') {
        requestFileRead(id)
    }
}

function setEditIndexClient(eIndex) {
    if (isDev()) {
        console.log("Loaded Edit Index: ", [[eIndex], [requestListeners]]);
    }

    editIndex = eIndex;
    for (let key in eIndex) {
        processIndexEntry(key, eIndex[key]);

    }
    streamLoadEditsFromIndexInit()
}

function remoteUpdateEditIndex(id, root, folder, entry, operation, message) {
    console.log("Register new index entry", message.id, message);

    if (operation === 'add') {
        if (editIndex[id]) {
            console.log("entry already loaded, return to creator")
        }
        editIndex[id] = entry;
        processIndexEntry(id, entry)
    }

}

let configDataList = function(root, folder, onData) {
    let storeList = {};

    let storeData = function(data) {
        storeList[data.id] = data.data;
    }

    let initData = function(config) {
        for (let i = 0; i < config.length;i++) {
            storeData(config[i]);
        }
        onData(storeList);
    }

    new ConfigData(root, folder, null, null, null, initData)
}

function parseConfigDataKey(root, folder, dataId, id, callback) {
    let configData =  new ConfigData(root, folder, dataId, 'data_key', 'config')
    configData.addUpdateCallback(callback);
    configData.parseConfig(id, callback)
    configKeyMap = configData.getConfigKeyMap();
}

let idUpdateTimestamps = {};

function loadSavedBuffer(id, callback) {
    let add = true;
    let lastUpdateTime = 0;
    for (let i = 0; i < bufferListeners.length; i++) {

        if (bufferListeners[i].callback === callback) {
            bufferListeners[i].id = id;
            add = false;
        }
    }

    let timestamp = 0;

    if (savedImageBuffers[id]) {
        timestamp = savedImageBuffers[id].timestamp;

    }

    if (add === true) {
        bufferListeners.push({id:id, callback:callback, timestamp:timestamp});
    }

    if (savedImageBuffers[id]) {
        if (idUpdateTimestamps[id] !== timestamp) {
            callback(savedImageBuffers[id].buffer, timestamp)
        }
        idUpdateTimestamps[id] = timestamp;
    }
}

function loadSavedConfig(id, callback) {
//    console.log("Request", id)

    if (typeof(deletedConfigs[id]) === 'object') {
        console.log("Block load of deleted config")
        return;
    }

    if (typeof (savedConfigs[id]) === 'object') {
        callback(savedConfigs[id], savedConfigs[id].edit_id)
    } else {
        let add = true;
        for (let i = 0; i < requestListeners.length; i++) {
            if (requestListeners[i].id === id) {
                add = false;
            }
        }
        if (add === true) {
            requestListeners.push({id:id, callback:callback});
        }
        if (typeof(editIndex[id]) === 'object') {
            requestFileRead(id);

        //    console.log("Load from index", id);
        } else {
            // console.log("Not in Index", id, editIndex);
            callback(null);
        }
    }
}



function applyRemoteConfigMessage(message) {
    let id = message.id;
    let data = message.data;

    if (message.save) {
        if (activeSaves.indexOf(message.save) !== -1) {
            MATH.splice(activeSaves, message.save);
            return;
        }
    }

    if (data['DELETED'] === true) {
        if (isDev()) {
            console.log("Not loading deleted config", id, message)
        }

        deletedConfigs[id] = data
    } else {
        if (message.format === 'index_entry') {
            console.log("Add Index by Remote ", message);
            remoteUpdateEditIndex(message.id, message.root, message.folder, message.data, message.operation, message)
        }

        if (message.format === 'json') {
            savedConfigs[id] = processJsonVariation(data, activeVariations);
            processLoadedFile(id);
        }
        if (message.format === 'buffer') {
            let array = [];
        //    console.log(data);
            for (let key in data) {
                array.push(data[key]);
            }
        //    console.log(array);

            if (!savedImageBuffers[id]) {
                savedImageBuffers[id] = {};
            }

            savedImageBuffers[id].buffer = new Uint8ClampedArray(array);
            savedImageBuffers[id].timestamp = message.timestamp;
    //        console.log(savedImageBuffers[id])
            processLoadedBuffer(id, message.timestamp);
        }
    }
}

function saveConfigEdits(root, folder, id, editedConfig, path) {
    if (!editedConfig.edit_id) {
        editedConfig.edit_id = generateEditId();
    }
    let saveId = generateSaveId();
    activeSaves.push(saveId)
    let json = JSON.stringify(editedConfig);

    savedConfigs[id] = JSON.parse(json);

    if (path === 'template/') {
        GameAPI.worldModels.setLoadedTemplate(root, folder, id, savedConfigs[id]);
    }

    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:editedConfig.edit_id,
        root:root,
        folder:folder,
        format:"json",
        path: path || "configs/",
        save:saveId,
        data:json,
    })
    GuiAPI.screenText("SAVE: "+editedConfig.edit_id,  ENUMS.Message.SAVE_STATUS, 1.5)
    return savedConfigs[id].edit_id;
}

function detachConfig(config) {
    if (!config.edit_id) {
        config.edit_id = generateEditId();
    }
    return JSON.parse(JSON.stringify(config));
}

function saveEncounterEdits(encounter) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    encounter.id = saveConfigEdits("encounter", worldLevel, encounter.id, encounter.config)
    console.log("Save Enc config ", encounter);
}

function saveWorldModelEdits(wModel) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    wModel.id = saveConfigEdits("model", worldLevel, wModel.id, wModel.config)
    wModel.config = savedConfigs[wModel.id];
    console.log("Save World Model config ", wModel, wModel.config);
}

function saveAdventureEdits(adv) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    adv.id = saveConfigEdits("adventure", worldLevel, adv.id, adv.config)
    adv.config = savedConfigs[adv.id];
    console.log("Save Adventure config ", adv, adv.config);
}


let imgSaveTimeouts = {};


function relayBufferToServer(saveId, root, folder, id, buffer) {
    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:id,
        root:root,
        folder:folder,
        format:"buffer",
        path: "images/",
        save:saveId,
        data:JSON.stringify(buffer)
    })
    GuiAPI.screenText("SAVE: "+id,  ENUMS.Message.SAVE_STATUS, 1.2)
}

function saveDataTexture(root, folder, id, buffer) {

    let saveId = generateSaveId();
    activeSaves.push(saveId)

    if (!savedImageBuffers[id]) {
        savedImageBuffers[id] = {};
    }

    savedImageBuffers[id] = {buffer:buffer, timestamp:new Date().getTime()};
    //    console.log("saveDataTexture", root, folder, id)

    clearTimeout(imgSaveTimeouts[id])

    imgSaveTimeouts[id] = setTimeout(function() {
        relayBufferToServer(saveId, root, folder, id, buffer)
    }, 2000)
  /*
    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
        request:ENUMS.ClientRequests.WRITE_FILE,
        id:id,
        root:root,
        folder:folder,
        format:"buffer",
        path: "images/",
        save:saveId,
        data:JSON.stringify(buffer)
    })
*/
  //  GuiAPI.screenText("SAVE: "+id,  ENUMS.Message.SAVE_STATUS, 0.2)
    storeBufferImage(id, buffer);

}

let reverseMap = null;
function mappedConfigKey(key) {
    if (reverseMap === null) {
        reverseMapConfigs();
    }
    if (typeof (reverseMap[key]) !== 'object') {
        console.log("Key not in map", key, [reverseMap])
        return null;
    }
    return reverseMap[key];
}

let configList = {};

function addToReverseMap(configKey, root, folder) {
    if (!reverseMap[configKey]) {
        reverseMap[configKey] = [];
    }

    if (!configList[root]) {
        configList[root] = {};
    }

    if (!configList[root][folder]) {
        configList[root][folder] = []
    }

    configList[root][folder].push(configKey);

    reverseMap[configKey].push({source:"config", root:root, folder:folder});
}

function reverseMapConfigs() {
    let configs = window.CONFIGS;
    reverseMap = {};
    for (let root in configs) {
        for (let folder in configs[root]) {
            let entry =configs[root][folder]
            if (Array.isArray(entry[0])) {
                entry = entry[0]
            }

            if (Array.isArray(entry)) {
                let list = entry
                for (let i = 0; i < list.length; i++) {
                    if (typeof (list[i].id) === 'string') {
                        addToReverseMap(list[i].id, root, folder)
                    } else if (typeof (list[i]) === 'number') {
                        addToReverseMap(list[i], root, folder)
                    } else if (Array.isArray(list[i])) {
                        console.log("Figure out Array entry:", i, list[i], root, folder)

                    //    addToReverseMap(list[i], root, folder)
                    } else {

                        if (typeof(entry[i]) === 'object') {
                            if (typeof (entry[i].id) === 'string') {
                                addToReverseMap(entry[i].id, root, folder)
                            } else {
                      //          console.log("No id for object entry:", root, folder, entry[i])
                            }
                        } else {
                     //       console.log("Not reverse mapped:", root, folder, entry[i])
                        }

                    }
                }
            } else {
                if (typeof(entry) === 'object') {
                    if (typeof (entry.id) === 'string') {
                        addToReverseMap(entry.id, root, folder)
                    } else {
                //        console.log("No id for object entry:", root, folder , entry)
                    }
                } else {
                //    console.log("Not reverse mapped:", root, folder, entry)
                }

            }
        }
    }
    console.log("Reverse Map ", reverseMap);
}

function getReversedConfigs() {
    if (reverseMap === null) {
        reverseMapConfigs();
    }
    return reverseMap;
}

function getConfigListAt(root, folder) {
    if (!configList[root]) {
        reverseMapConfigs();
    }
    return configList[root][folder]
}

function listifyConfig(root, folder, idArray, configStore) {
    let onConfig = function(configs) {
        MATH.emptyArray(idArray);
        console.log(configs)
        for (let key in configs) {
            let id = configs[key].id

            if (idArray.indexOf(id) === -1) {
                if (!configs[key].data) {
                //    console.log("No Data", configs, key)
                    configStore[id] = configs[key].config;
                    idArray.push(id)
                } else {
                    configStore[id] = configs[key].data[0].config;
                    idArray.push(id)
                }

            } else {
                console.log("entry already added, not right", id);
            }
        }
    }
    new ConfigData(root,folder,  false, false, false, onConfig)

}


function readConfig(root, folder) {
    if (window) {
        return window.CONFIGS[root][folder];
    } else {
        let serverConfigs = getServerConfig()[root];
        if (!serverConfigs) {
            console.log("No configs found.", root);
        } else {
            if (!serverConfigs[folder]) {
                console.log("No folder for server configs ", root, folder)
            } else {
                return serverConfigs[folder]
            }
        }
    }

}


function getConfigByEditId(editId) {
    return savedConfigs[editId]
}

function fetchConfigByEditId(editId, callback) {

    if (typeof (savedConfigs[editId]) === 'object') {
        // processJsonVariation(savedConfigs[editId], activeVariations);
        callback(savedConfigs[editId])
    } else {
    //    console.log("Config loading ", editId)
        setTimeout(function() {
            fetchConfigByEditId(editId, callback)
        }, 200)
    }
}

function getActiveVariations() {
    return activeVariations;
}

function getItemConfigByTemplateId(itemId) {
    let cfgs = readConfig("GAME","ITEMS")
//    console.log("getItemConfigByItemId", cfgs)
    for (let i = 0; i < cfgs.length; i++) {
        if (cfgs[i].id === itemId) {
            return cfgs[i];
        }
    }

    return null;
}

fetchConfigByEditId('spawn_population', populationConfigsCB);

export {
    loadVariationConfigs,
    readConfig,
    generateEditId,
    detachConfig,
    setEditIndexClient,
    configDataList,
    parseConfigDataKey,
    loadSavedConfig,
    loadSavedBuffer,
    applyRemoteConfigMessage,
    saveConfigEdits,
    saveEncounterEdits,
    saveWorldModelEdits,
    saveAdventureEdits,
    saveDataTexture,
    mappedConfigKey,
    getReversedConfigs,
    getConfigListAt,
    listifyConfig,
    getConfigByEditId,
    fetchConfigByEditId,
    getActiveVariations,
    getItemConfigByTemplateId,
    getPopulationConfigById,
    addConfigsReadyCallback,
    configsReady
 }
