import {centerByIndexPos, gridIndexForPos, positionBoxAtIndexPos} from "../utils/GridUtils.js";
import {Vector2} from "../../../../libs/three/math/Vector2.js";
import {MATH} from "../MATH.js";
import {evt} from "../event/evt.js";
import {ENUMS} from "../ENUMS.js";
import {Vector3} from "three/webgpu";
import {Box3} from "three";

const physicsSideSize = 50
const physicsActivationCBs = []
const activeIndexPositions = [];
const indexVec = new Vector2();
const tempVec3 = new Vector3();
const box = new Box3();
box.color = 'YELLOW'

const neighborOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0,  -1], [0,  0], [0,  1],
    [1,  -1], [1,  0], [1,  1]
]

function registerPhysIndexPos(indexPos) {
    if (!physicsActivationCBs[indexPos.x]) {
        physicsActivationCBs[indexPos.x] = [];
    }

    if (!physicsActivationCBs[indexPos.x][indexPos.y]) {
        physicsActivationCBs[indexPos.x][indexPos.y] = [];
    }
}

function activateAroundIndexPos(iPos, activationLevel) {
    const originX = iPos.x;
    const originY = iPos.y;

    for (let i = 0; i < neighborOffsets.length; i++) {
        const pX = neighborOffsets[i][0] + originX;
        const pY = neighborOffsets[i][1] + originY;
        if (!activeIndexPositions[pX]) {
            activeIndexPositions[pX] = [];
        }

        if (!activeIndexPositions[pX][pY]) {
            activeIndexPositions[pX][pY] = 0;
        }

        if (activeIndexPositions[pX][pY] < activationLevel) {
            activeIndexPositions[pX][pY] = activationLevel;
        }
    }

}

class PhysicsLodGrid {
    constructor() {

    }

}

const plg = new PhysicsLodGrid();

function registerPhysicsGridCallback(indexVec, cb) {

    registerPhysIndexPos(indexVec)

    let cbs = physicsActivationCBs[indexVec.x][indexVec.y];
    if (cbs.indexOf(cb) === -1) {
        cbs.push(cb);
    }

}

function unregisterPhysicsGridCallback(indexVec, cb) {
    gridIndexForPos(pos, indexVec, physicsSideSize)
    registerPhysIndexPos(indexVec);
    MATH.splice(physicsActivationCBs[indexVec.x][indexVec.y], cb);
}

function debugDrawPhysLodGrid() {

    for (let i = 0; i < physicsActivationCBs.length; i++) {
        if (physicsActivationCBs[i]) {
            for (let j = 0; j < physicsActivationCBs[i].length; j++) {
                if (physicsActivationCBs[i][j]) {
                    if (physicsActivationCBs[i][j].length !== 0) {
                        const ix = i;
                        const iy = j;
                        const cb = physicsActivationCBs[i][j]
                        indexVec.set(ix, iy);
                        tempVec3.set(physicsSideSize, physicsSideSize, physicsSideSize);
                        const center = positionBoxAtIndexPos(box, indexVec, tempVec3);
                        tempVec3.set(1, 1, 1);
                        box.max.add(tempVec3);
                        box.min.sub(tempVec3);
                        box.max.y += 1000;
                        box.color = 'GREEN';
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, box);
                    }
                }
            }
        }
    }

    for (let i = 0; i < activeIndexPositions.length; i++) {
        if (activeIndexPositions[i]) {
            for (let j = 0; j < activeIndexPositions[i].length; j++) {
                if (typeof (activeIndexPositions[i][j]) === 'number') {
                    if (activeIndexPositions[i][j] !== 0) {
                        indexVec.set(i, j);
                        tempVec3.set(physicsSideSize, physicsSideSize, physicsSideSize);
                        const center = positionBoxAtIndexPos(box, indexVec, tempVec3);
                        box.max.y += 900;
                        box.color = 'YELLOW';
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, box);
                    }
                }
            }
        }
    }
}

function physIndexForPos(pos, store) {
    gridIndexForPos(pos, store, physicsSideSize)
}

let updateActive = false;

function activatePhysicsProbe(pos) {
    gridIndexForPos(pos, indexVec, physicsSideSize);
    activateAroundIndexPos(indexVec, 5);

    if (updateActive === false) {
        AmmoAPI.registerPhysicsStepCallback(updatePhysicsGrid)
        updateActive = true;
    }
}

function notifyIndexPosActivation(i, j, value) {
    if (physicsActivationCBs[i]) {
        if (physicsActivationCBs[i][j]) {
            if (physicsActivationCBs[i][j].length !== 0) {
                MATH.callAll(physicsActivationCBs[i][j], value)
            }
        }
    }
}


function updatePhysicsGrid() {

    for (let i = 0; i < activeIndexPositions.length; i++) {
        if (activeIndexPositions[i]) {
            for (let j = 0; j < activeIndexPositions[i].length; j++) {
                if (typeof (activeIndexPositions[i][j]) === 'number') {
                    if (activeIndexPositions[i][j] !== 0) {
                        activeIndexPositions[i][j]--;
                        notifyIndexPosActivation(i, j, activeIndexPositions[i][j])
                    }
                }
            }
        }
    }
}

export {
    registerPhysicsGridCallback,
    unregisterPhysicsGridCallback,
    physIndexForPos,
    debugDrawPhysLodGrid,
    activatePhysicsProbe,
    updatePhysicsGrid
}