import {GLTFLoader} from "../../../../libs/jsm/loaders/GLTFLoader.js";
import {ImageLoader} from "../../../../libs/three/Three.Core.js";



let loaders = {}
loaders['glb'] = new GLTFLoader().setPath('/data/');
loaders['png'] = new ImageLoader().setPath('/data/');

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