import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let calcVec = new Vector3()
let tempVec1 = new Vector3()
let tempVec2 = new Vector3()
let tempVec3 = new Vector3();
let dragDirection = new Vector3();
let tempObj = new Object3D()
let color = {}

function processLookCursorInput(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec) {
    let inputForce = cursorTravelVec.lengthSq();
    let inputAngle = cursorForward.angleTo(cursorTravelVec);
    tempVec3.copy(cursorObj3d.position);
    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)
    tempVec3.y = cursorObj3d.position.y // ThreeAPI.terrainAt(tempVec3);
    dragToVec3.y = tempVec3.y // ThreeAPI.terrainAt(dragToVec3, calcVec)+2;

    calcVec.subVectors(dragToVec3, cursorObj3d.position);

    cursorTravelVec.copy(calcVec);
    cursorTravelVec.y += inputForce * 0.1;

    calcVec.multiplyScalar(Math.cos(inputAngle) * -2);
    calcVec.add(cursorObj3d.position);
    camTargetPos.copy(calcVec);
    calcVec.copy(cursorForward)
    calcVec.multiplyScalar(3)
    camTargetPos.sub(calcVec);

    camTargetPos.y = cursorObj3d.position.y + camTargetPos.distanceTo(cursorObj3d.position) * 0.5 + 0.55 +inputForce * 0.0005;
    return inputAngle;
}

function processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cursorForward, pointerDragVector, distance) {

    tempObj.position.copy(ThreeAPI.getCamera().position);
    tempObj.lookAt(cursorObj3d.position);
    offsetPos.set(pointerDragVector.x*0.01, pointerDragVector.z*0.01, -distance);
    offsetPos.applyQuaternion(tempObj.quaternion);

    return distance;
}

function processTileSelectionCursorInput(tilePath, cursorObj3d, camLookAtVec, dragToVec3, camTargetPos, cursorForward, cursorTravelVec) {
    let inputForce = cursorTravelVec.lengthSq();
    let inputAngle = cursorForward.angleTo(cursorTravelVec);



    tempVec3.copy(cursorObj3d.position);
    cursorObj3d.position.y = ThreeAPI.terrainAt(cursorObj3d.position)
    tempVec3.y = cursorObj3d.position.y // ThreeAPI.terrainAt(tempVec3);
    dragToVec3.y = tempVec3.y // ThreeAPI.terrainAt(dragToVec3, calcVec)+2;

    calcVec.subVectors(dragToVec3, cursorObj3d.position);

    cursorTravelVec.copy(calcVec);

    calcVec.multiplyScalar(Math.cos(inputAngle) * -1.6);
    calcVec.add(cursorObj3d.position);
    camTargetPos.copy(calcVec);
    calcVec.copy(cursorForward)
    calcVec.multiplyScalar(5)
    camTargetPos.sub(calcVec);

    camTargetPos.y = cursorObj3d.position.y + camTargetPos.distanceTo(cursorObj3d.position) * 0.25 + 0.55 +inputForce * 0.0001;

    if (tilePath) {
        if (tilePath.pathTiles.length > 1) {

            let endPos = tilePath.pathTiles[tilePath.pathTiles.length-1].getPos()
            camLookAtVec.copy(endPos)
            calcVec.subVectors(endPos , tilePath.pathTiles[0].getPos() )
            let tileDistance = calcVec.length()
            camTargetPos.y += tileDistance*0.7;

            calcVec.multiplyScalar(-2);
            calcVec.y = 2;
            calcVec.add(cursorObj3d.position)
            camTargetPos.y += calcVec.y;
            camLookAtVec.y += 1.1 - tileDistance*0.5;

        }
    }

    return inputAngle;
}

function processTilePathingCamera(tilePath, cursorObj3d, camLookAtVec, camTargetPos, walkForward) {
    tempVec3.copy(cursorObj3d.position);
    let endPos = tilePath.getEndTile().getPos()
    tempVec1.subVectors(endPos, cursorObj3d.position );
    let inputForce = tempVec1.length();

    calcVec.copy(tempVec1);

    calcVec.multiplyScalar( -0.7);
    calcVec.add(cursorObj3d.position);
    camTargetPos.copy(cursorObj3d.position);
    calcVec.copy(walkForward)
    calcVec.multiplyScalar(2.5)
    camLookAtVec.copy(cursorObj3d.position);
    camLookAtVec.add(calcVec);
    camTargetPos.sub(calcVec);

    camTargetPos.y = cursorObj3d.position.y + 2;

    tempVec1.multiplyScalar(0.5);



    camTargetPos.y += inputForce*0.7;
    camLookAtVec.y += 2;

    return inputForce;
}



function drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cursorForward, cursorTravelVec) {



    dragDirection.copy(cursorTravelVec);
    dragDirection.normalize();
    calcVec.copy(camTargetPos);
    calcVec.y = cursorObj3d.position.y;

    let cursorPos = cursorObj3d.position

//    GuiAPI.printDebugText('x:'+MATH.decimalify(cursorPos.x, 100)+' y:'+MATH.decimalify(cursorPos.y, 100)+' z:'+MATH.decimalify(cursorPos.z, 100))
/*
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:cursorPos, to:dragToVec3, color:'BLUE'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:cursorPos, to:calcVec, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dragToVec3, color:'CYAN', size:0.2})
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE,  {from:calcVec, to:camTargetPos, color:'RED'});
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:camTargetPos, color:'RED', size:0.3})
*/
    return
    tempVec3.copy(cursorForward);
    calcVec.copy(cursorPos);
    calcVec.y += 0.02;
    tempVec3.add(calcVec);

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
    tempVec3.copy(dragDirection);
    tempVec3.add(calcVec);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
}

function processTerrainLodCenter(lodCenter, terrainCenter) {
    let cursorPos = ThreeAPI.getCameraCursor().getPos();
    let camPos = ThreeAPI.getCamera().position
    let elevationFactor = camPos.y*0.1;
//    lodCenter.subVectors(cursorPos , camPos );
    terrainCenter.set(0, 0, -(20+elevationFactor))
    terrainCenter.applyQuaternion(ThreeAPI.getCamera().quaternion)
//    terrainCenter.multiplyScalar(2.0*(1.0+elevationFactor*1))
//    lodCenter.multiplyScalar(-(0.5-elevationFactor*0.5));
//    terrainCenter.sub(lodCenter)
    terrainCenter.add(camPos)
    terrainCenter.y =  elevationFactor // camPos.y // ThreeAPI.terrainAt(terrainCenter);


    terrainCenter.copy(cursorPos);
 //   lodCenter.copy(camPos);
   // lodCenter.y = ThreeAPI.terrainAt(lodCenter);

    if (isNaN(lodCenter.x)) {
        console.log("NAN", lodCenter)
    }

    // terrainCenter.y = 0// lodCenter.y;
 //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:terrainCenter, color:'YELLOW', size:2.2})
    /*
      tempVec3.copy(terrainCenter)
      tempVec3.y = ThreeAPI.terrainAt(terrainCenter);      /*
          evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:terrainCenter, color:'YELLOW', size:1.0})
          evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:terrainCenter, to:tempVec3, color:'YELLOW';
          /*
           */
    // GuiAPI.printDebugText( tempVec3.x)
  //  GuiAPI.printDebugText('x:'+MATH.decimalify(tempVec3.x, 10)+' y:'+MATH.decimalify(tempVec3.y, 10)+' z:'+MATH.decimalify(tempVec3.z, 10))
  //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec3, color:'YELLOW', size:1.0})
    //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:color, size:0.3})
    /*
    ThreeAPI.groundAt(cursorPos, color);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorPos, color:'WHITE', size:0.15})
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorPos, color:color, size:0.3})
    */
}

export {
    processTerrainLodCenter,
    processTileSelectionCursorInput,
    processTilePathingCamera,
    processLookCursorInput,
    processOrbitCursorInput,
    drawInputCursorState
}