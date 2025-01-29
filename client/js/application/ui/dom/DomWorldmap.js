import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {ENUMS} from "../../ENUMS.js";
import {bodyTransformToObj3d, getBodyPointer, getPhysicalWorld} from "../../utils/PhysicsUtils.js";
import {generateActiveWorldMap} from "../../utils/MapUtils.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";
import {evt} from "../../event/evt.js";
import {
    addClickFunction,
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    createDivElement, removeDivElement
} from "./DomUtils.js";
import {MATH} from "../../MATH.js";
let worldSize = 2048 * 10;
let tempObj = new Object3D();
let pointerVec3 = new Vector3();
let tempVec = new Vector3();
let tempVec2 = new Vector3();

let zoom;
let size;
let minX;
let maxX;
let minZ;
let maxZ;

let gridLinesX = [];
let gridLinesZ = [];
let actorIndicators = [];
let defaultWorldLevel = "20";
let activeWorldLevel = null;

let labelDivs = [];
let worldLevelDivs = [];
let locationDivs = [];
let spawnDivs = [];
let vegetationDivs = [];
let physicsDivs = [];
let lodGridDivs = [];

let estateDivs = [];


let visibleAdvs = [];
let visibleNodes = [];

function posIsVisible(pos) {
    if(pos.x > minX && pos.x < maxX) {
        if (pos.z > minZ && pos.z < maxZ) {
            return true;
        }
    }
    return false;
}

let indicatedAdventures = [];
let advIndicators = [];


function calcMapMeterToDivPercent(zoom, worldSize) {
    return MATH.percentify(zoom, worldSize, true);
}

function calcZoomForSize(size, worldSize)  {
    return worldSize/size;
}

function axisPosToPercent(axisPos) {
    let zoomFactor = calcMapMeterToDivPercent(1, worldSize);
    return axisPos*zoomFactor
}

function positionDiv(div, posVec) {
    let mapPctX = axisPosToPercent(posVec.x)
    let mapPctZ = axisPosToPercent(posVec.z)

    div.style.top = 50 + mapPctZ + '%';
    div.style.left = 50 + mapPctX + '%';
}

function alignDivToX(div, posX, zoom) {
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let mapPctX = posX*zoomFactor
    div.style.left = mapPctX + '%';
}

function alignDivToZ(div, posZ, zoom) {
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let mapPctZ = posZ*zoomFactor
    div.style.top = 50 + mapPctZ + '%';
}


function worldPosDiv(worldPos, cursorPos, div, zoom) {
    ThreeAPI.tempVec3.copy(worldPos).sub(cursorPos)
    ThreeAPI.tempVec3.multiplyScalar(zoom)
//    positionDiv(cameraDiv, tempVec, zoom);
    alignDivToX(div, ThreeAPI.tempVec3.x+worldSize*0.5, 1)
    alignDivToZ(div, ThreeAPI.tempVec3.z, 1)
}


function updateLineDivs(lineCount, mapDiv) {
    while (gridLinesX.length > lineCount) {
        removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length > lineCount) {
        removeDivElement(gridLinesZ.pop())
    }
    while (gridLinesX.length < lineCount) {
        let line = createDivElement(mapDiv, 'grid_x_'+gridLinesX.length, "", 'map_grid_line map_grid_line_x')
        gridLinesX.push(line);
    }
    while (gridLinesZ.length < lineCount) {
        let line = createDivElement(mapDiv, 'grid_z_'+gridLinesZ.length, "", 'map_grid_line')
        gridLinesZ.push(line);
    }
}



function positionLineDivs(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom) {
//    console.log(offsetX);
    let xLines = gridLinesX.length
    let xMin = cursorPos.x - mapWidth*0.5;
    let xMax = xMin+mapWidth;
    let zMin = cursorPos.z -mapHeight*0.5;
    let zMax = zMin+mapHeight;

    let rem = Math.floor(MATH.remainder(-cursorPos.x/lineSpacing)*lineSpacing);
    let midX = Math.ceil(cursorPos.x/lineSpacing)*lineSpacing;
    for (let i = 0; i < xLines; i++) {

        let lineX = Math.floor((i * lineSpacing -mapWidth*0.5)/lineSpacing)*lineSpacing
       let x =  rem + lineX + MATH.remainder(-cursorPos.x)//- mapWidth
        //   let x = Math.ceil((xMin/lineSpacing)*i)*lineSpacing;
    //    tempVec.set(x, 0, 0)
        alignDivToX(gridLinesX[i], x, zoom, offsetX)
        gridLinesX[i].innerHTML = Math.floor(midX + lineX);
    //    positionDiv(gridLinesX[i], tempVec)
    }

    rem = Math.floor(MATH.remainder(-cursorPos.z/lineSpacing)*lineSpacing);
    let midZ = Math.ceil(cursorPos.z/lineSpacing)*lineSpacing;
    let zLines = gridLinesZ.length
    for (let i = 0; i < zLines; i++) {
        let lineZ = Math.floor((i * lineSpacing  -mapWidth*0.5)/lineSpacing)*lineSpacing
        let z = rem + lineZ + MATH.remainder(-cursorPos.z)//- mapWidth
        alignDivToZ(gridLinesZ[i], z, zoom)
        gridLinesZ[i].innerHTML = Math.floor(midZ + lineZ);
    }

}

function updateGridLines(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom, unitScale) {
    let mapScale = zoom
    if (mapScale > 10) {
        lineSpacing*=0.1;
        if (mapScale > 100) {
            lineSpacing*=0.1;
            if (mapScale > 1000) {
                lineSpacing*=0.1;
                if (mapScale > 10000) {
                    lineSpacing*=0.1;
                }
            }
        }
    }
    let lineCount = Math.ceil(mapWidth / lineSpacing) +1;
    updateLineDivs(lineCount, mapDiv)
    positionLineDivs(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, offsetX, offsetY, zoom)
}

function clearGridLines() {
    while (gridLinesX.length) {
        removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length) {
        removeDivElement(gridLinesZ.pop())
    }
}


class DomWorldmap {
    constructor(closeCb) {
        let htmlElement = new HtmlElement();
        let transition = null;
        let mapDiv = null;
        let mapImageDiv = null;
        let cursorDiv = null;
        let destinationDiv = null;
        let posDiv = null;
        let cameraDiv = null;
        let teleportDiv = null;
        let lineSpacing = 1000;

        let offsetXDiv = null;
        let offsetZDiv = null;

        let statusMap = {
            width:0,
            height:0,
            offsetX:0,
            offsetY:0,
            posX : 0,
            posZ : 0,
            zoom : 4,
            layerX:"",
            layerY:"",
            pcntX:"",
            pcntY:"",
            x:"",
            y:"",
            z:"",
            dstX:0,
            dstY:0,
            dstZ:0,
            worldLevel:0
        }

        let remove = function() {
            htmlElement.closeHtmlElement()
        }

        let closeMapCb = function() {
            console.log("Close worldmap...")
            ThreeAPI.unregisterPrerenderCallback(update);
            closeCb()
            setTimeout(remove, 1500);
        }

        let zoomIn = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 2,  1, 128));
        }

        let zoomOut = function() {
            statusMap.zoom = Math.round(MATH.clamp(statusMap.zoom * 0.5, 1, 128));
        }


        function getEventAxis(e, axis) {
            if (e['layer'+axis]) {
                return e['layer'+axis]
            }

            if (typeof(e.targetTouches)==='object') {
                if (e.targetTouches.length === 1) {
                    let touch = e.targetTouches[0];
                    return touch['client'+axis]
                }
            }
            return 0;

        }



        let elemECoords = function(e){
            let elem = e.target;
            let totWidth = elem.clientWidth;
            let totHeight = elem.clientHeight;

            let pointerX = getEventAxis(e,'X')
            let pointerY = getEventAxis(e,'Y')
            let pctX = MATH.percentify(pointerX, totWidth, true)
            let pctY = MATH.percentify(pointerY, totHeight, true)
            statusMap['pcntX'] = MATH.decimalify(pctX, 10)+"%";
            statusMap['pcntY'] = MATH.decimalify(pctY, 10)+"%";
            let x = MATH.decimalify(MATH.calcFraction(0, totWidth, pointerX)*worldSize - worldSize*0.5, 10);
            let z = MATH.decimalify(MATH.calcFraction(0, totHeight, pointerY)*worldSize - worldSize*0.5, 10);
            statusMap['x'] = "x:"+x;
            statusMap['z'] = "z:"+z ;
            ThreeAPI.tempVec3.set(x, 0, z)
            ThreeAPI.tempVec3.y = MATH.decimalify(ThreeAPI.terrainAt(ThreeAPI.tempVec3), 10);
            statusMap['y'] = "y:"+ThreeAPI.tempVec3.y;

        }

        let onArrive = function(endPos, spatTrans) {
            poolReturn(spatTrans);
            console.log("Map Transition Eneded", endPos);
            transition = null;
        }

        let teleport = function(e) {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
            //    selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, "");
            //    selectedActor.setStatusKey(ENUMS.ActorStatus.SELECTED_ADVENTURE, "");
                ThreeAPI.getCameraCursor().getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                setTimeout(function() {
                    ThreeAPI.getCameraCursor().getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                    evt.dispatch(ENUMS.Event.ENTER_PORTAL, {"world_level":getPlayerStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL), pos:ThreeAPI.getCameraCursor().getLookAroundPoint(), prevent_transition:true})
                }, 100);

                // selectedActor.setSpatialPosition()
            }
        }


        let mapClick = function(e) {
            elemECoords(e);
            console.log("Map Click", ThreeAPI.tempVec3, e)
            positionDiv(destinationDiv, pointerVec3, statusMap.zoom);


            tempVec.copy(pointerVec3);
            tempVec.multiplyScalar(1/statusMap.zoom)
            tempVec.add(ThreeAPI.getCameraCursor().getLookAroundPoint())
            tempVec.y = ThreeAPI.terrainAt(tempVec);
            statusMap.dstX = tempVec.x;
            statusMap.dstY = tempVec.y;
            statusMap.dstZ = tempVec.z;
            destinationDiv.style.transition = "font-size 1.2s ease-out";
            destinationDiv.style.fontSize = "1em";
            //    positionDiv(cameraDiv, tempVec, zoom);
        //    alignDivToX(cameraDiv, tempVec.x+worldSize*0.5, 1, statusMap.os_x)
        //    alignDivToZ(cameraDiv, tempVec.z, 1, statusMap.os_z)

            if (transition !== null) {
                transition.cancelSpatialTransition()
            }

            function transitionUpdateCB(pos) {
                ThreeAPI.getCameraCursor().getPos().copy(pos)
            }

            transition = poolFetch('SpatialTransition')
            let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getLookAroundPoint(), tempVec)


            transition.initSpatialTransition(ThreeAPI.getCameraCursor().getLookAroundPoint() , tempVec, 1, onArrive, MATH.curveSqrt(distance*0.4) + distance*0.1, transitionUpdateCB)

        }

        let frameDragX = 0;
        let frameDragY = 0;
        let lastDragX = 0
        let lastDragY = 0;

        function positionDestinationPointer() {
            tempVec.copy(pointerVec3);
            tempVec.multiplyScalar(1/statusMap.zoom)
            tempVec.add(ThreeAPI.getCameraCursor().getLookAroundPoint())
            statusMap.dstX = tempVec.x;
            statusMap.dstY = tempVec.y;
            statusMap.dstZ = tempVec.z;
        }

        let mapHover = function(e) {
        //    console.log("Map Hover",dragListen, e)
            elemECoords(e);
            pointerVec3.copy(ThreeAPI.tempVec3);

            if (dragListen === true) {

                positionDestinationPointer()

            } else {

                update();
            }
            
        }

        let startDragX = 0;
        let startDragY = 0;
        let dragListen = false;


        let mapPressStart = function(e) {
            elemECoords(e);
            frameDragX = 0;
            frameDragY = 0;
            lastDragX = 0
            lastDragY = 0;
            startDragX = ThreeAPI.tempVec3.x;
            startDragY = ThreeAPI.tempVec3.z;
            destinationDiv.style.transition = "font-size 0.1s ease-in";
            destinationDiv.style.fontSize = "2em";
            dragListen = true;
            positionDestinationPointer()
        }

        let mapPressEnd = function(e) {
            elemECoords(e);
            startDragX = ThreeAPI.tempVec3.x;
            startDragY = ThreeAPI.tempVec3.y;
            dragListen = false;
        }

        let readyCb = function() {
            clearGridLines()
            activeWorldLevel = null;

            while (worldLevelDivs.length) {
                removeDivElement(worldLevelDivs.pop())
            }

            while (actorIndicators.length) {
                removeDivElement(actorIndicators.pop())
            }

            mapDiv = htmlElement.call.getChildElement('map_frame')

            mapImageDiv = htmlElement.call.getChildElement('map_image')
            destinationDiv = htmlElement.call.getChildElement('destination')
            cursorDiv = htmlElement.call.getChildElement('cursor')
            posDiv = htmlElement.call.getChildElement('position')
            cameraDiv = htmlElement.call.getChildElement('camera')

            offsetXDiv = htmlElement.call.getChildElement('offset_x')
            offsetZDiv = htmlElement.call.getChildElement('offset_z')
            teleportDiv = htmlElement.call.getChildElement('teleport')

            let reloadDiv = htmlElement.call.getChildElement('reload')
            let generateDiv = htmlElement.call.getChildElement('generate')
            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')

            addClickFunction(mapDiv, mapClick)
            addMouseMoveFunction(mapDiv, mapHover)
            addPressStartFunction(mapDiv, mapPressStart)
            addPressEndFunction(mapDiv, mapPressEnd)
            addClickFunction(reloadDiv, generateWorldMap)

        //    addClickFunction(generateDiv, generateWorldMap)

            addClickFunction(zoomInDiv, zoomIn)
            addClickFunction(zoomOutDiv, zoomOut)
            addClickFunction(teleportDiv, teleport)

            ThreeAPI.unregisterPrerenderCallback(update);
            ThreeAPI.registerPrerenderCallback(update);
        }

        let rebuild = htmlElement.initHtmlElement('worldmap', closeMapCb, statusMap, 'world_map', readyCb);

        let mapHeight = worldSize;
        let mapWidth = worldSize;

        let generateWorldMap = function() {
            generateActiveWorldMap();
        }

        let update = function() {
            let cursorPos =  ThreeAPI.getCameraCursor().getLookAroundPoint();
            let params = ThreeAPI.getTerrainSystem().getTerrain().call.getTerrainParameters();
        //    worldSize = params.tx_width * params.unitScale;
            statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 100);
            statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 100);

            zoom = statusMap.zoom;
            size = worldSize/zoom;
            minX = cursorPos.x -size*0.5;
            maxX = minX+size;
            minZ = cursorPos.z -size*0.5;
            maxZ = minZ+size;

            if (mapDiv) {
                let worldLevel = "20";

                let cam = ThreeAPI.getCamera()
            //    console.log(minimapDiv);
                mapImageDiv.style.scale = zoom;
                mapHeight = worldSize / zoom;
                mapWidth = worldSize / zoom;
                statusMap['height'] = mapHeight+'m';
                statusMap['width'] = mapWidth+'m';

                mapDiv.style.backgroundSize = zoom*100+'%';
                let zoomOffset = 1 + (1 / zoom);
                statusMap.offsetX = MATH.decimalify( MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.x, 5)+worldSize*0.5, worldSize, true), 100);;
                statusMap.offsetY = MATH.decimalify( MATH.percentify(zoomOffset*MATH.decimalify(cursorPos.z, 5)+worldSize*0.5, worldSize, true), 100);;

                let xPcnt = 50 + MATH.percentify(-cursorPos.x, worldSize, true)
                let zPcnt = 50 + MATH.percentify(-cursorPos.z, worldSize, true)

                statusMap.os_x = (statusMap.offsetX-50)*0.005*worldSize;
                statusMap.os_z = (statusMap.offsetY-50)*0.005*worldSize;
                alignDivToX(offsetXDiv, 0, zoom, statusMap.os_x)
                alignDivToZ(offsetZDiv, 0, zoom, statusMap.os_z)
                offsetXDiv.innerHTML = "x:"+MATH.numberToDigits(cursorPos.x, 0, 2);
                offsetZDiv.innerHTML = "z:"+MATH.numberToDigits(cursorPos.z, 0, 2);

                mapImageDiv.style.transform = "translate("+xPcnt+"%, "+zPcnt+"%)"; // xPcnt+"%";
            //    mapImageDiv.style.left = xPcnt+"%";
            //    mapImageDiv.style.bottom = zPcnt+"%";  // statusMap.offsetX+'%';

                updateGridLines(mapDiv, cursorPos, lineSpacing, mapWidth, mapHeight, statusMap.offsetX, statusMap.offsetY, zoom, params.unitScale)
            //    DomUtils.setElementClass()

                /*

                let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
                if (selectedActor) {
                    teleportDiv.style.visibility = 'visible'
                    let angle = selectedActor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);
                    let headingDiv = htmlElement.call.getChildElement('heading');
                    if (headingDiv) {
                        headingDiv.style.rotate = -MATH.HALF_PI*0.5-angle+'rad';
                    }
                } else {
                    teleportDiv.style.visibility = 'hidden'
                }
*/

                if (worldLevel !== activeWorldLevel) {
                    mapDiv.style.backgroundColor = "rgb(66, 71, 98)";
                }

            //    positionDiv(posDiv, cursorPos, zoom);
                alignDivToX(posDiv, worldSize*0.5, 1, statusMap.os_x)
                alignDivToZ(posDiv, 0, 1, statusMap.os_z)
                positionDiv(cursorDiv, pointerVec3, zoom);

                worldPosDiv(cam.position, cursorPos, cameraDiv, zoom)
                tempVec.set(statusMap.dstX, statusMap.dstY, statusMap.dstZ);
                worldPosDiv(tempVec, cursorPos, destinationDiv, zoom)


            }

        }



    }

}



export {DomWorldmap}