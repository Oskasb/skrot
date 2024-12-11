import {getPlayerActor} from "../utils/ActorUtils.js";
import {getUrlParam} from "../utils/DebugUtils.js";
import {saveDataTexture} from "../utils/ConfigUtils.js";
import {Storage} from "./Storage.js";



let stores = [
    {name:'account', keyPath:'PLAYER_ID', version:0, index:[]},
    {name:'players', keyPath:'PLAYER_ID', version:0, index:[]},
    {name:'actors',  keyPath:'ACTOR_ID',  version:0, index:[]},
    {name:'items',   keyPath:'ITEM_ID',   version:0, index:[]},
    {name:'images',  keyPath:'id',        version:0, index:[]}
]

let dbs = {};

for (let i = 0; i < stores.length; i++) {
    dbs[stores[i].name] = new Storage(stores[i]);
}

let db = {};
db.stores = {};
db.account= {};
db.images = {};

function initLocalDB() {
    if (getUrlParam('reset_db') === true) {
        resetDatabase()
    }

    for (let key in db) {
        let localData = localStorage.getItem(key);
        if (localData === '[object Object]')
            localData = null;
        if (typeof (localData) === 'string') {
            db[key] = JSON.parse(localData);
            console.log("Load Local DB", key, db[key]);
        } else {
            localStorage.setItem(key, JSON.stringify(db[key]));
            console.log("Init Local DB", key, db[key]);
        }
    }
    console.log("DB version stores", db.stores);
    for (let i = 0; i < stores.length; i++) {
        stores[i].version = db.stores[stores[i].name] || 0;
    }
}



function updateStoresDbVersion(name, version) {
    db.stores[name] = version;
    localStorage.setItem('stores', JSON.stringify(db.stores));
}

function resetDatabase() {
    let dbVersionStores = {};
    for (let key in db) {
        localStorage.setItem(key, JSON.stringify({}));
        console.log("Reset Local DB", db);
    }
    for (let i = 0; i < stores.length; i++) {
        stores[i].version = 0;
        dbVersionStores[stores[i].name] = 0;
        dbs[stores[i].name].clearAllData();
    }
}

function storeLocalAccountStatus(key, value) {
    db.account[key] = value;
    localStorage.setItem('account', JSON.stringify(db.account));
    console.log("Store Account Data ", db.account);
    dbs['account'].set(db.account['PLAYER_ID'], db.account);
}

function getLocalAccountStatus(key) {
    return db.account[key] || null;
}


function getLocalAccount(accountCallback) {
//    initLocalDB();
    getLoadedAccount(accountCallback)
}

function getLoadedAccount(accountCallback) {
    if (typeof (db.account['PLAYER_ID']) === 'string') {
        dbs['account'].get(db.account['PLAYER_ID'], accountCallback);
    } else {
        accountCallback(null)
    }
    return;
    if (typeof (db.account[ENUMS.PlayerStatus.PLAYER_ID])=== 'string') {
        setTimeout(function() {
            accountCallback(db.account)
        }, 10)

        //    return db.account;
    } else {
        accountCallback(null)
    }
}

function saveActorStatus(statusMap) {
    let id = statusMap[ENUMS.ActorStatus.ACTOR_ID];

 //   db.actors[id] = statusMap;
 //   statusMap[ENUMS.ActorStatus.EQUIP_REQUESTS] = [];
 //   statusMap[ENUMS.ActorStatus.EQUIPPED_ITEMS] = [];
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
 //   localStorage.setItem('actors', JSON.stringify(db.actors));
    dbs['actors'].set(id, statusMap);
}

function saveItemStatus(statusMap) {
    let id = statusMap[ENUMS.ItemStatus.ITEM_ID];

    let checkString = id.split('_')[0];
    if (checkString !== 'item') {
        console.error("Checking item", id, statusMap);
        return;
    }


    if (statusMap[ENUMS.ItemStatus.ITEM_TYPE] === ENUMS.itemTypes.RECIPE) {
    //    console.log("Not storing Recipes, they are global", statusMap[ENUMS.ItemStatus.ITEM_ID]);
    //    return;
    }

   // console.log("Save Item Status ", id, [db.items]);
 //   db.items[id] = statusMap;
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }
//    localStorage.setItem('items', JSON.stringify(db.items));
    console.log("Save item Status map", id, [statusMap]);
    dbs['items'].set(id, statusMap);
}

function savePlayerStatus(statusMap) {
    let id = statusMap[ENUMS.PlayerStatus.PLAYER_ID];
    if (!id) {
        console.log("No id set yet", statusMap);
        return;
    }
//    db.players[id] = statusMap;
    if (typeof (statusMap['undefined']) !== 'undefined') {
        console.log("Status map containes undefined", statusMap['undefined'], [statusMap]);
        delete statusMap['undefined']
    }

//    console.log("savePlayerStatus", id, statusMap);
//    localStorage.setItem('players', JSON.stringify(db.players));
    dbs['players'].set(id, statusMap);
}

function loadActorStatus(actorId, aStatusCB) {
    dbs['actors'].get(actorId, aStatusCB);
}

function loadItemStatus(itemId, iStatusCB) {




    if (!itemId || typeof (itemId) === 'undefined') {
        console.log("Loading bad itemId", itemId);
        return;
    }

    let checkString = itemId.split('_');
    if (checkString[1] === 'RECIPE') {
        console.log("load recipe item status from DB");
        // console.error("Check item id fail", itemId);
    //    return;
    } else {

    }

    dbs['items'].get(itemId, iStatusCB);
}


function applyBufferImageByKey(playerId, key, bufferData) {
    let playerComps = playerId.split('_');
    let components = key.split('_');

    let root = "terrain";
    let folder = components[0];
 //   let worldLevel = components{1};
    let xIndex = 2;
    let zIndex = 3;

    if (components[1] === playerComps[0]) {
   //     worldLevel = playerId;
        if (components[2] === playerComps[1]) {
            xIndex++;
            zIndex++
        } else {
            console.log("Not Loading some other players buffer data")
            return;
        }

    }
    let array = []

    for (let key in bufferData) {
        array.push(bufferData[key])
    }

    saveDataTexture(root, folder, key, new Uint8ClampedArray(array))
}

function loadStoredImages(playerId) {
    let images = db.images;
    for (let key in images) {
        function onData(imgData) {
            applyBufferImageByKey(playerId, key, imgData)
        }
        dbs['images'].get(key, onData)
    }
}

function loadPlayerStatus(playerId, statusCb) {
    dbs['players'].get(playerId, statusCb)
}

function storePlayerActorStatus() {
    let actor = getPlayerActor();
    if (actor === null) {
        console.log("no player actor to store");
        return;
    }
    let statusMap = actor.actorStatus.statusMap;
    saveActorStatus(statusMap);
}

function storePlayerStatus() {
    let player = GameAPI.getPlayer();
    let statusMap = player.status.statusMap;
    savePlayerStatus(statusMap);
}

let imgTimeout;

function storeBufferImage(id, bufferData) {
    db.images[id] = true;

    console.log("storeBufferImage", id, db.images);
    clearTimeout(imgTimeout);
    dbs['images'].set(id, bufferData);
    imgTimeout = setTimeout(function() {
        localStorage.setItem('images', JSON.stringify(db.images));
    }, 100)

}

export {
    initLocalDB,
    resetDatabase,
    updateStoresDbVersion,
    storeLocalAccountStatus,
    getLocalAccountStatus,
    getLocalAccount,
    getLoadedAccount,
    saveActorStatus,
    saveItemStatus,
    savePlayerStatus,
    loadActorStatus,
    loadItemStatus,
    loadPlayerStatus,
    loadStoredImages,
    storePlayerActorStatus,
    storePlayerStatus,
    storeBufferImage
}