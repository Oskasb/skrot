import {GLTFLoader} from "../../../../libs/jsm/loaders/GLTFLoader.js";
import {ImageLoader} from "../../../../libs/three/Three.Core.js";


let path = './data/'
if (window.islocal === true) {
//    path = './data/'
}

let loaders = {}
loaders['glb'] = new GLTFLoader().setPath(path);
loaders['png'] = new ImageLoader().setPath(path);

function getLoader(fileType) {

    if (loaders[fileType]) {
        return loaders[fileType];
    } else {
        return null;
    }

}


export {
    getLoader
}