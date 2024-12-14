import {GLTFLoader} from "../../../../libs/jsm/loaders/GLTFLoader.js";
import {Loader as BitmapLoader} from "../../../../libs/three/loaders/Loader.js";


let loaders = {}
loaders['glb'] = new GLTFLoader().setPath('/data/');
loaders['png'] = new BitmapLoader().setPath('/data/');

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