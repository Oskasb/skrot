import {GLTFLoader} from "../../../../libs/jsm/loaders/GLTFLoader.js";

let loaders = {}
loaders['glb'] = new GLTFLoader().setPath('/data/')

function getLoader(fileType) {
    return loaders[fileType] || null;
}


export {
    getLoader
}