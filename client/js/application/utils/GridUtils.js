import {Vector3} from "three/webgpu";
import {terrainAt} from "../../3d/three/terrain/ComputeTerrain.js";

let tempVec3 = new Vector3();

function centerByIndexPos(indexPos, sideSize) {
    tempVec3.x = indexPos.x * sideSize;
    tempVec3.y = sideSize*0.5;
    tempVec3.z = indexPos.y * sideSize;
    return tempVec3;
}

function gridIndexForPos(pos, store, sizeSize) {
    store.x = Math.floor(pos.x / sizeSize);
    store.y = Math.floor(pos.z / sizeSize);
}

function positionBoxAtIndexPos(box, indexPos, sizeVec3) {
    let center = centerByIndexPos(indexPos, sizeVec3.x);
    let height = terrainAt(center)
    center.y = height;
    box.setFromCenterAndSize(center, sizeVec3);
    return center;
}

export {
    centerByIndexPos,
    gridIndexForPos,
    positionBoxAtIndexPos
}