import {poolFetch} from "./PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

import {ENUMS} from "../ENUMS.js";
import {getSetting} from "./StatusUtils.js";
import {getFrame} from "./DataUtils.js";
import {evt} from "../event/evt.js";
import {MATH} from "../MATH.js";
import {terrainAt} from "../../3d/three/terrain/ComputeTerrain.js";


let tempObj = new Object3D();
let tempVec = new Vector3();
let tempPos = new Vector3()
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let tempVec4 = new Vector3();
let tempVec5 = new Vector3();
let tempContactPoint = new Vector3()
let normalStore = new Vector3();
let tempNormal = new Vector3()
let tempFrom = new Vector3();
let tempTo = new Vector3();
let tempVel = new Vector3();
let tempAngVel = new Vector3();

let probeResult = {
    halted:false,
    blocked:false,
    requiresLeap:false,
    hitNormal:new Vector3(),
    from:new Vector3(),
    to:new Vector3(),
    translation:new Vector3(),
    destination:new Vector3()
}

let physicalWorld;

function setPhysicalWorld(wrld) {
    physicalWorld = wrld;
}

function getPhysicalWorld() {
    return physicalWorld
}
function addPhysicsToModel(assetId, obj3d, updateCB) {
    let physicalModel = getPhysicalWorld().addPhysicalModel();
    physicalModel.initPhysicalWorldModel(assetId, obj3d, updateCB)
    return physicalModel;
}

function removePhysicalModel(physicalModel) {
    getPhysicalWorld().removePhysicalModel(physicalModel);
    physicalModel.deactivatePhysicalModel();

}



function debugDrawPhysicalModel(physicalModel) {
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: physicalModel.getPos(), color:physicalModel.debugColor, size:1})
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:physicalModel.box.min, max:physicalModel.box.max, color:physicalModel.debugColor})
    let shapes = physicalModel.shapes;
    for (let i = 0; i < physicalModel.rigidBodies.length; i++) {
        let body = physicalModel.rigidBodies[i];
        physicalModel.fitAAB(true);
   //     bodyTransformToObj3d(body, tempObj);
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:ThreeAPI.getCameraCursor().getPos(), color:'GREY'});
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: shape.getPos(), color:shape.debugColor, size:0.5})
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:physicalModel.getPos(), to:shape.getPos(), color:shape.debugColor});
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:shape.getBoundingMin(), max:shape.getBoundingMax(), color:shape.debugColor})
    //    shape.drawDebugBox()
    }
}


function debugDrawPhysicalAABBs() {
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {
        debugDrawPhysicalModel(physicalModels[i])
    }
}

function debugDrawPhysicalWorld() {

    let pos = ThreeAPI.getCameraCursor().getPos();



    pos.y = terrainAt(pos, tempVec3) - 4.0;
 //   let intersects = physicalIntersection(pos, tempVec);

    tempVec3.copy(pos);
    tempVec3.y += 3;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.y += 50;
    tempVec3.x += 10;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.x -= 20;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.z += 10;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);
    tempVec3.z -= 20;
    rayTest(tempVec3, pos, tempVec3, normalStore, true);

    let time = getFrame().gameTime;

    for (let i = 0; i < 50; i++) {
        tempVec.copy(pos)
        tempVec.y = terrainAt(pos)
        tempVec2.set(tempVec.x + Math.sin(time*1.2 +(i+2)*1.2)*(10+(i+2)*0.5), tempVec.y + (i)*1.5 + (Math.cos( time*0.5+i*1.2)+0.8) * (2+i*0.5), tempVec.z + Math.cos( time*1.2+i*1.2) * (10+(i+2)*0.5))

        rayTest(tempVec2, tempVec,  tempVec3, normalStore, true);
        tempVec2.y -= 20;
        rayTest(tempVec, tempVec2,   tempVec3, normalStore, true);

    }


 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:1.0})
  //  if (intersects) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'CYAN', size:0.25})
  //      evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'CYAN'});
 //   }


}


function rayTest(from, to, contactPointStore, contactNormal, debugDraw, staticOnly) {
    if (!contactNormal) {
        contactNormal = tempVec5;
    }

    if (!contactPointStore) {
        contactPointStore = tempContactPoint;
    }

    debugDraw = debugDraw || getSetting(ENUMS.Settings.DEBUG_VIEW_RAYCASTS);
//    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:to, color:'GREEN'});

    tempTo.copy(to).sub(from);
    let hit = AmmoAPI.raycastPhysicsWorld(from, tempTo, contactPointStore, contactNormal, debugDraw, staticOnly)

    if (debugDraw) {
        if (hit) {
            tempVec.copy(tempTo)
        //    console.log(hit)
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:contactPointStore, color:'RED'});

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: contactPointStore, color:'YELLOW', size:0.1})
            tempVec.copy(contactNormal).add(contactPointStore)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:contactPointStore, to:tempVec, color:'CYAN'});
        } else {
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:to, color:'BLUE'});
        }
    }

    return hit;
}

function rayAllIntersects(from, to) {
    tempTo.copy(to).sub(from);
    return AmmoAPI.raycastAllIntersectingBodies(from, tempTo)
}

function ammoTranformToObj3d(trx, obj3d) {
    let p = trx.getOrigin();
    let q = trx.getRotation();

    obj3d.position.set(p.x(), p.y(), p.z());
    obj3d.quaternion.set(q.x(), q.y(), q.z(), q.w());
}

function bodyTransformToObj3d(body, obj3d, debugDraw) {
    let ms = body.getMotionState();

    let TRANSFORM_AUX = AmmoAPI.getAuxTransform();

    ms.getWorldTransform(TRANSFORM_AUX);
    let p = TRANSFORM_AUX.getOrigin();
    let q = TRANSFORM_AUX.getRotation();

    obj3d.position.set(p.x(), p.y(), p.z());
    obj3d.quaternion.set(q.x(), q.y(), q.z(), q.w());
 //   obj3d.rotateY(Math.PI)
 //   if (debugDraw) {
//       evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:obj3d.position, color:'YELLOW'});
 //   }

}

function transformBody(objd3, body) {
     AmmoAPI.setBodyTransform(body, objd3.position, objd3.quaternion);
}

function setBodyVelocity(body, vel) {
  //  const ammoVel = body.getLinearVelocity();
    const VECTOR_AUX = AmmoAPI.getAuxVector3();
    VECTOR_AUX.setX(vel.x*2);
    VECTOR_AUX.setY(vel.y*2);
    VECTOR_AUX.setZ(vel.z*2);
    body.activate();
    body.setLinearVelocity(VECTOR_AUX)
}

function physicalIntersection(pos, insideVec3) {
    if (!insideVec3) {
        insideVec3 = tempVec;
    }
    let physicalModels = getPhysicalWorld().physicalModels;
    for (let i = 0; i < physicalModels.length; i++) {

    //    let intersects = physicalModels[i].testIntersectPos(pos, insideVec3);
    //    if (intersects) {
    //        return insideVec3
    //    }

    }
}

let step = 0;
function detectFreeSpaceAbovePoint(point, marginHeight, contactPoint, contactNormal, maxSteps, debugDraw) {

    tempPos.copy(point);
    tempPos.y = point.y + marginHeight;

    let hit = rayTest(tempPos, point, contactPoint, contactNormal, debugDraw, true);
    if (hit) {
        step++;
        if (step > maxSteps) {
            return hit;
        } else {
    //        console.log(step);
            return detectFreeSpaceAbovePoint(contactPoint, marginHeight, contactPoint, contactNormal, maxSteps, debugDraw)
        }
    }
    step = 0;
}

function getBodyPointer(body) {
    return body.kB;
}

function getBodyByPointer(ptr) {
    let world = getPhysicalWorld();

    if (world.terrainBody.kB === ptr) {
        return world.terrainBody;
    }
    let models = world.physicalModels;
    for (let i = 0; i < models.length; i++){
        let model = models[i];
        let bodies = model.rigidBodies;
        for (let j = 0; j < bodies.length;j++) {
            let body = bodies[j];
            if (body.kB === ptr) {
                return body;
            }
        }

    }
    console.log("no body found for pointer ", ptr);
}

function getModelByBodyPointer(ptr) {
    let world = getPhysicalWorld();

    if (world.terrainBody.kB === ptr) {
        return world.terrainBody;
    }
    let models = world.physicalModels;
    for (let i = 0; i < models.length; i++){
        let model = models[i];
        let bodies = model.rigidBodies;
        for (let j = 0; j < bodies.length;j++) {
            let body = bodies[j];
            if (body.kB === ptr) {
                return model;
            }
        }

    }
    console.log("no body found for pointer ", ptr);
}

function physicalAlignYGoundTest(pos, store, height, nStore, debugDraw) {
    let y = ThreeAPI.terrainAt(pos, nStore)+0.05;
    store.set(pos.x, y, pos.z);
    tempFrom.copy(store);
    tempFrom.y += height+0.1;
    let hit = rayTest(tempFrom, store, store, normalStore, false, true);

    if (hit) {
        store.y += 0.05;
        tempFrom.y = pos.y+height*2;
        hit = rayTest(tempFrom, store, store, null, debugDraw, true);
        if (hit) {
            return false;
        }
        if (nStore) {
            nStore.copy(normalStore);
        }
        return hit;
    }
    return true;

}

function testProbeFitsAtPos(pos, sideSize, debugDraw) {
    let debug = debugDraw;

    let size = sideSize || 0.7;
    let halfSize = size*0.5;

    probeResult.from.copy(pos);
    probeResult.from.y += 0.7;
    probeResult.to.copy(pos);
    probeResult.to.y += 1.2;
    let hit = rayTest(probeResult.from, probeResult.to, tempVec, tempNormal, debug, true)
    if (hit) {
        return hit;
    }
    tempVec2.copy(pos)
    tempVec2.y += 0.5;

    tempVec2.x -= halfSize;
    probeResult.to.x = tempVec2.x;
    probeResult.to.z = tempVec2.z;
    probeResult.to.z += halfSize;
    tempVec2.z -= halfSize;

    hit = rayTest(tempVec2, probeResult.to, tempVec, tempNormal, debug, true)
    if (hit) {
        return hit;
    }


    //    tempVec2.x += 0.5;
    probeResult.to.x = tempVec2.x;
    probeResult.to.z = tempVec2.z;
    tempVec2.x += size;

    hit = rayTest(tempVec2, probeResult.to, tempVec, tempNormal, debug, true)
    if (hit) {
        return hit;
    }

    probeResult.to.x = tempVec2.x;
    probeResult.to.z = tempVec2.z;
    tempVec2.z += size;
    //    tempVec2.z += 0.5;
    hit = rayTest(tempVec2, probeResult.to, tempVec, tempNormal, debug, true)
    if (hit) {
        return hit;
    }

    probeResult.to.x = tempVec2.x;
    probeResult.to.z = tempVec2.z;
    tempVec2.x -= size;

    hit = rayTest(tempVec2, probeResult.to, tempVec, tempNormal, debug, true)
    if (hit) {
        return hit;
    }

    return true;


}



let obstructHhitCb = function(hit) {
    let world = getPhysicalWorld();
 //   console.log(hit);
    let ptr = hit.kB;

//    hit.__destroy__();
    if (ptr === getTerrainBodyPointer()) {
        //    viewObstuctionTest(hit.position, ThreeAPI.getCamera().position, obstructHhitCb);
        return ptr;
    }

    let physicalModel = getModelByBodyPointer(ptr);

    if (!physicalModel) {
        console.log("Hit nothing ", ptr)
        return ptr;
    }

    let model = physicalModel.call.getModel();

    if (!model) {
        model = physicalModel.call.getInstance();
        if (!model) {
            //    console.log("no instance hit (box model)", ptr, physicalModel)
            return ptr;
        }
    }

    if (world.viewObstuctingModels.indexOf(model) === -1) {
        world.viewObstuctingModels.push(model)

        model.call.viewObstructing(true)
    }

}

let lastFrom = null;

function viewObstuctionTest(from, to, hitCb) {

    frameTests++;
    if (frameTests > maxTests) {
        console.log("View Obstruct test max")
        return;
    }
    let hits = rayAllIntersects(from, to);
    while (hits.length) {
        let hit = hits.pop();
        let body = getBodyByPointer(hit);
        if (body) {
            if (body.isStaticObject()) {
                hitCb(hit);
            }
        }


    }
}

let obstructingModels = [];
let maxTests = 8;
let frameTests = 0;
let planeElev = 1.5;
let planeSize = 0.8

function getTerrainBodyPointer() {
    let world = getPhysicalWorld();
    if (world.terrainBody === null) {
        return 0
    }
    return world.terrainBody.kB;
}

function obstuctTestAAPlane(pos, size, elev) {
    tempVec.copy(pos);
//    planeElev = actor.getStatus(ENUMS.ActorStatus.HEIGHT) * 0.6;
    tempVec.y += elev;
    tempVec.z += size;
    tempVec2.z += size;
    frameTests = 0;
    maxTests = 5;
    viewObstuctionTest(tempVec, tempVec2, obstructHhitCb)

//    actor.getSpatialPosition(tempVec);
//    tempVec.y += planeElev;
    tempVec.z -= size*2;
    tempVec2.z -= size*2;
    frameTests = 0;
    viewObstuctionTest(tempVec, tempVec2, obstructHhitCb)

//    actor.getSpatialPosition(tempVec);
//    tempVec.y += planeElev;
    tempVec.x += size;
    tempVec2.x += size;
    frameTests = 0;
    viewObstuctionTest(tempVec, tempVec2, obstructHhitCb)

//    actor.getSpatialPosition(tempVec);
//    tempVec.y += planeElev;
    tempVec.z += size*2;
    tempVec.x -= size*2;
    tempVec2.z += size*2;
    tempVec2.x -= size*2;
    frameTests = 0;
    viewObstuctionTest(tempVec, tempVec2, obstructHhitCb)
}


function updateViewObstruction(pos) {

    let world = getPhysicalWorld();
    tempVec2.copy(ThreeAPI.getCamera().position);
    tempVec5.subVectors(tempVec2, pos);
    tempVec5.normalize();
    tempVec5.multiplyScalar(0.4);
    tempVec5.add(pos);
    //  let viewObstuctingModels
    MATH.copyArrayValues(world.viewObstuctingModels, obstructingModels);
    MATH.emptyArray(world.viewObstuctingModels);

    obstuctTestAAPlane(tempVec5, planeSize, planeElev)
//    obstuctTestAAPlane(pos, planeSize*3, -planeElev)
//    obstuctTestAAPlane(pos, planeSize*3, 0)
    tempVec.copy(tempVec5);
//    tempVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) * 1.2;
    frameTests = 0;
    maxTests = 8;
    viewObstuctionTest(ThreeAPI.getCamera().position, tempVec,  obstructHhitCb)

    while (obstructingModels.length) {
        let model = obstructingModels.pop();
        if (world.viewObstuctingModels.indexOf(model) === -1) {
            model.call.viewObstructing(false);
        }
    }

    let hit = rayTest(tempVec5, ThreeAPI.getCamera().position, tempVec)
    if (hit) {

        let body = getBodyByPointer(hit.ptr);
        if (body) {
            if (body.isStaticObject()) {
                return hit;
            }
        }
    }
}

function getBodyVelocity(body) {
    let ammoVec3 = body.getLinearVelocity();
    tempVel.set(ammoVec3.x(), ammoVec3.y(), ammoVec3.z())
    return tempVel;
}

function getBodyAngularVelocity(body) {
    let ammoVec3 = body.getAngularVelocity();
    tempAngVel.set(ammoVec3.x(), ammoVec3.y(), ammoVec3.z())
    return tempAngVel;
}

function processRayHitKickInfluence(hit, forceDirection, power, hitCb) {
    if (hit.ptr) {
        let ptr = hit.ptr;
        let body = getBodyByPointer(ptr)

        if (!body.isStaticObject()) {

        tempVec.copy(forceDirection);
        tempVec.y = 0.3;
        tempVec.normalize();
        tempVec.multiplyScalar(power);
        AmmoAPI.applyForceAtPointToBody(tempVec, hit.position, body)

            if (typeof (hitCb) === 'function') {
                hitCb(hit.position, forceDirection, power)
            }
        }

    }
}

function applyPhysicalInfluenceRayProbe(pos, origin, probeCount, probeReach, power, hitCb) {

    let time = GameAPI.getGameTime() * 100 / probeCount;

    for (let i = 0; i < probeCount; i++) {
        let timeOffset = i * 5.7 / probeCount;
        let spin = time+timeOffset;
        tempVec4.set(Math.sin(spin) * probeReach, 0, Math.cos(spin) * probeReach);
        tempVec5.addVectors(pos, tempVec4);
        tempVec2.subVectors(pos, tempVec4);

        let hit = rayTest(tempVec5, tempVec2, tempVec3);

        if (hit) {
            tempVec3.sub(origin)
            processRayHitKickInfluence(hit, tempVec3, power, hitCb);
        } else {
            tempVec4.copy(tempVec5);
            tempVec4.y += probeReach;
            let hit = rayTest(tempVec2, tempVec4, tempVec3);
            if (hit) {
                tempVec3.sub(origin)
                processRayHitKickInfluence(hit, tempVec3, power, hitCb);
            } else {
                tempVec4.y -= probeReach*2;
                let hit = rayTest(tempVec2, tempVec4, tempVec3);
                if (hit) {
                    tempVec3.sub(origin)
                    processRayHitKickInfluence(hit, tempVec3, power, hitCb);
                }
            }
        }

    }

}

function activatePhysicalShockwave(pos, size, duration, strength, color) {
    let shockwave = poolFetch('PhysicalShockwave');
    shockwave.call.initPhysicalShockwave(pos, size, duration, strength, color);
}

function calcBoxSubmersion(height, size) {

        let depth = (height - size*0.5);

        if (depth < 0) {
            depth = Math.min(size , MATH.curveQuad(Math.abs(depth)));
            return size * depth * size;
        }
        return 0;

}


export {
    setPhysicalWorld,
    getTerrainBodyPointer,
    getPhysicalWorld,
    detectFreeSpaceAbovePoint,
    rayTest,
    rayAllIntersects,
    bodyTransformToObj3d,
    addPhysicsToModel,
    removePhysicalModel,
    debugDrawPhysicalAABBs,
    debugDrawPhysicalWorld,
    transformBody,
    setBodyVelocity,
    physicalIntersection,
    getBodyPointer,
    getBodyByPointer,
    getModelByBodyPointer,
    physicalAlignYGoundTest,
    testProbeFitsAtPos,
    updateViewObstruction,
    getBodyVelocity,
    getBodyAngularVelocity,
    processRayHitKickInfluence,
    applyPhysicalInfluenceRayProbe,
    activatePhysicalShockwave,
    calcBoxSubmersion,
    ammoTranformToObj3d
}
