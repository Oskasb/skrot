import {fetchConfigByEditId} from "./ConfigUtils.js";

let dndData = {}

let onLoadCompleted = [];
let loadRequests = 0;
let loadsCompleted = 0;

function classLoaded(classConfig) {
    console.log("Class Loaded", classConfig);
    dndData.classes.push(classConfig);
    loadsCompleted++;
}

function loadClass(editId) {
    loadRequests++;
    fetchConfigByEditId(editId, classLoaded);
}


function checkLoadCompleted() {
    if (loadsCompleted === loadRequests) {
        onLoadCompleted.pop()(dndData);
        ThreeAPI.unregisterPrerenderCallback(checkLoadCompleted);
    }
}

function loadDndFromIndex(dndIndex, onLoadedCB) {
    onLoadCompleted.push(onLoadedCB);
    let classIndex = dndIndex['class_index'];

    dndData.classes = [];

    for (let i = 0; i < classIndex.length; i++) {
        loadClass(classIndex[i])
    }

    let tables = dndIndex['tables']

    dndData.tables = {};

    for (let i = 0; i < tables.length; i++) {
        dndData.tables[tables[i]['table']] = tables[i]['values']
    }

    let dice = dndIndex['dice']
    dndData.dice = {};

    for (let i = 0; i < dice.length; i++) {
        dndData.dice[dice[i]['die']] = dice[i]['sides']
    }

    ThreeAPI.registerPrerenderCallback(checkLoadCompleted);

}

function rollDie(dieSides) {
    if (typeof (dieSides) === 'number') {
        return Math.floor(Math.random() * dieSides) + 1;
    } else if (typeof (dieSides) === 'string') {
        if (!dndData.dice[dieSides]) {
            console.log("no such die in table ", dieSides, dndData.dice);
            return 1;
        } else {
            return Math.floor(Math.random() * dndData.dice[dieSides]) + 1;
        }
    }
}


export {
    loadDndFromIndex,
    rollDie
}