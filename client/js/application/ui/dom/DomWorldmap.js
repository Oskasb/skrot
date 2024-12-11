import {HtmlElement} from "./HtmlElement.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {ENUMS} from "../../ENUMS.js";
import {bodyTransformToObj3d, getBodyPointer, getPhysicalWorld} from "../../utils/PhysicsUtils.js";
import {generateActiveWorldMap} from "../../utils/MapUtils.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";
import {getStatusPosition} from "../../../../../Server/game/actor/ActorStatusFunctions.js";
import {evt} from "../../event/evt.js";
let worldSize = 2048;
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


function clearDivArray(array) {
    while(array.length) {
        DomUtils.removeDivElement(array.pop());
    }
}

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

function clearAdventureDivs() {
    MATH.emptyArray(indicatedAdventures);
    while (advIndicators.length) {
        let mapElems = advIndicators.pop();
        clearDivArray(mapElems.nodeDivs);
        clearDivArray(mapElems.lineDivs);
        if (mapElems.posDiv !== null) {
            DomUtils.removeDivElement(mapElems.posDiv);
        }
    }
}

function indicateAdventure(adv, htmlElement, mapDiv, statusMap, cursorPos) {

    if (indicatedAdventures.indexOf(adv) === -1) {
        indicatedAdventures.push(adv);
        let mapElems = {
            posDiv: null,
            nodeDivs:[],
            lineDivs:[]
        }
        advIndicators.push(mapElems);
    }

    let mapElements = advIndicators[indicatedAdventures.indexOf(adv)];

    let nodes = adv.config.nodes;
    let pos = adv.getPos();
    tempVec2.copy(pos);

    let visible = posIsVisible(pos);

    if (visible === true) {
        if (mapElements.posDiv === null) {
            mapElements.posDiv = DomUtils.createDivElement(mapDiv, 'adv_'+adv.id, '', 'adv_start_point')

        }

        let div = mapElements.posDiv;
        let rad = 3;

        worldPosDiv(pos, cursorPos, div, zoom);

        let w = rad*zoom*0.1
        let h = rad*zoom*0.1
        //    //    div.style.padding = 0.5*w+"%";
        div.style.borderWidth = 0.01*w+"em";
        div.style.width = w+"%";
        div.style.height = h+"%";

        if (zoom > 17) {
            div.innerHTML = '<p>'+adv.id+'</p>'
        } else {
            div.innerHTML = ''
        }

    } else {
        if (mapElements.posDiv !== null) {
            DomUtils.removeDivElement(mapElements.posDiv);
            mapElements.posDiv = null;
        }
    }

    let wasVisible = visible;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        MATH.vec3FromArray(tempVec, node.pos);

        visible = posIsVisible(tempVec);
             if(visible === true) {
                 if (!mapElements.nodeDivs[i]) {
                     mapElements.nodeDivs[i] = DomUtils.createDivElement(mapDiv, adv.id + '_node_'+i, '', 'adv_point')

                     mapElements.lineDivs[i] = DomUtils.createDivElement(mapDiv, adv.id + '_line_'+i, '', 'adv_line')


                 }

                 let div = mapElements.nodeDivs[i]
                 let line = mapElements.lineDivs[i]
                 MATH.vec3FromArray(tempVec, node.pos);
                 let rad = 2 // visibleAdvs[i].config.radius;
                 //    let lod = visibleLods[i].lodLevel
                 //    let spacing = visibleLods[i].spacing
                 worldPosDiv(tempVec, cursorPos, div, zoom);
                 worldPosDiv(tempVec, cursorPos, line, zoom);

                 let dst = MATH.distanceBetween(tempVec, tempVec2);

                 if (i !== 0) {
                     let angZ = Math.atan2(tempVec.z-tempVec2.z, tempVec.x-tempVec2.x)  + Math.PI*0.5;
                     line.style.rotate = angZ+'rad';
                 }

                 tempVec2.copy(tempVec);
                 let w = rad*zoom*0.1
                 let h = rad*zoom*0.1
                 //    //    div.style.padding = 0.5*w+"%";
                 div.style.borderWidth = 0.02*w+"em";
                 div.style.width = w+"%";
                 div.style.height = h+"%";
                 line.style.borderWidth = 0.00101*zoom+"em";
                 line.style.width = 0.0001*zoom+"%";
                 line.style.height = dst*zoom*0.0483+"%";
                 /*
                         let lodClass = "lod_"+lod
                         div.className = "grid_tile";
                         DomUtils.addElementClass(div, lodClass);
                         /*
                             let r = Math.floor(255*(1-(lod+1)*0.2))
                             let g = Math.floor(155+Math.cos(lod)*200)
                             let b = Math.floor(255*((lod+1)*0.2))
                             let a = 0.3
                             div.style.borderColor = "rgba("+r+", 255, "+b+", "+a+")"
                        //  */
                 if (zoom > 32) {
                     div.innerHTML = '<p>'+i+'</p>'
                 } else {
                     div.innerHTML = ''
                 }

             } else {
                 if (mapElements.nodeDivs[i]) {
                     DomUtils.removeDivElement(mapElements.nodeDivs[i]);
                     mapElements.nodeDivs[i] = false;
                 }
                 if (mapElements.lineDivs[i]) {
                     DomUtils.removeDivElement(mapElements.lineDivs[i]);
                     mapElements.lineDivs[i] = false;
                 }
             }

        tempVec2.copy(tempVec);
        wasVisible = visible;
    }

}

function indicateAdventures(htmlElement, mapDiv, statusMap, cursorPos){
    MATH.emptyArray(visibleAdvs);
    MATH.emptyArray(visibleNodes);
    let advs = GameAPI.gameAdventureSystem.getWorldAdventures();

    for (let i = 0; i < advs.length; i++) {
        let adv = advs[i];
        indicateAdventure(adv, htmlElement, mapDiv, statusMap, cursorPos)
    }
}

let visibleLods = [];

function indicateLodGrid(htmlElement, mapDiv, statusMap, cursorPos){
    MATH.emptyArray(visibleLods);
    let grid = ThreeAPI.getTerrainSystem().getTerrain().getLodGrid()
        let tiles = grid.getTiles();
        for (let j = 0; j < tiles.length; j++) {
            for (let k = 0; k < tiles[j].length; k++) {
                let tile = tiles[j][k];
                let spacing = tile.spacing
                let pos = tile.getPos();
                if(pos.x+spacing > minX && pos.x-spacing < maxX) {
                    if (pos.z+spacing > minZ && pos.z-spacing < maxZ) {
                        visibleLods.push(tile);
                    }
                }
            }
        }


    while (lodGridDivs.length < visibleLods.length) {
        let div = DomUtils.createDivElement(mapDiv, 'lods_'+lodGridDivs.length, '', 'grid_tile')
        lodGridDivs.push(div);
    }

    while (lodGridDivs.length > visibleLods.length) {
        DomUtils.removeDivElement(lodGridDivs.pop());
    }

    for (let i = 0; i < lodGridDivs.length; i++) {
        let div = lodGridDivs[i];
        let pos = visibleLods[i].getPos();
        let lod = visibleLods[i].lodLevel
        let spacing = visibleLods[i].spacing
        worldPosDiv(pos, cursorPos, div, zoom);

        let w = spacing*zoom*0.048
        let h = spacing*zoom*0.048
        //    //    div.style.padding = 0.5*w+"%";
        div.style.borderWidth = 0.005*w+"em";
        div.style.width = w+"%";
        div.style.height = h+"%";
        let lodClass = "lod_"+lod
        div.className = "grid_tile";
        DomUtils.addElementClass(div, lodClass);
    /*
        let r = Math.floor(255*(1-(lod+1)*0.2))
        let g = Math.floor(155+Math.cos(lod)*200)
        let b = Math.floor(255*((lod+1)*0.2))
        let a = 0.3
        div.style.borderColor = "rgba("+r+", 255, "+b+", "+a+")"
     */
        if (zoom > 7) {
            div.innerHTML = '<p>'+lod+'</p>'
        } else {
            div.innerHTML = ''
        }
    }
}


let visibleVegs = [];
function indicateVegetation(htmlElement, mapDiv, statusMap, cursorPos){
    MATH.emptyArray(visibleVegs);
    console.log()
    let vegetation = ThreeAPI.getTerrainSystem().getVegetationSystem().getVegetation();
    let grids = vegetation.vegetationLodGrids;
    for (let i = 0; i < grids.length; i++) {
        let tiles = grids[i].dynamicLodGrid.getTiles();
        for (let j =0; j < tiles.length; j++) {
            for (let k = 0; k < tiles[j].length; k++) {
                let tile = tiles[j][k];
                let spacing = tile.spacing
                let pos = tile.getPos();
                if(pos.x+spacing > minX && pos.x-spacing < maxX) {
                    if (pos.z+spacing > minZ && pos.z-spacing < maxZ) {
                        visibleVegs.push(tile);
                    }
                }
            }
        }
    }

    while (vegetationDivs.length < visibleVegs.length) {
        let div = DomUtils.createDivElement(mapDiv, 'vegs_'+vegetationDivs.length, '', 'grid_tile')
        vegetationDivs.push(div);
    }

    while (vegetationDivs.length > visibleVegs.length) {
        DomUtils.removeDivElement(vegetationDivs.pop());
    }

    for (let i = 0; i < vegetationDivs.length; i++) {
        let div = vegetationDivs[i];
        let pos = visibleVegs[i].getPos();
        let lod = visibleVegs[i].lodLevel
        let spacing = visibleVegs[i].spacing
        worldPosDiv(pos, cursorPos, div, zoom);
        div.style.width = spacing*zoom*0.046+"%";
        div.style.height = spacing*zoom*0.046+"%";
        let lodClass = "lod_"+lod
        div.className = "grid_tile";
        DomUtils.addElementClass(div, lodClass);
        if (zoom > 5) {
            div.innerHTML = '<p>'+lod+'</p>'
        } else {
            div.innerHTML = ''
        }
    }
}

let visiblePhysicals = [];
function indicatePhysics(htmlElement, mapDiv, statusMap, cursorPos){
    MATH.emptyArray(visiblePhysicals);

    let world = getPhysicalWorld();
    let models = world.physicalModels;

    for (let i = 0; i < models.length; i++){
        let model = models[i];
        let bodies = model.rigidBodies;
        for (let j = 0; j < bodies.length;j++) {
            let body = bodies[j];
            bodyTransformToObj3d(body, tempObj);
            let pos = tempObj.position
            if(pos.x > minX && pos.x < maxX) {
                if (pos.z > minZ && pos.z < maxZ) {
                    visiblePhysicals.push(body);
                }
            }
        }
    }


    while (physicsDivs.length < visiblePhysicals.length) {
        let div = DomUtils.createDivElement(mapDiv, 'phys_'+physicsDivs.length, '', 'physical_point')
        physicsDivs.push(div);
    }

    while (physicsDivs.length > visiblePhysicals.length) {
        DomUtils.removeDivElement(physicsDivs.pop());
    }

    for (let i = 0; i < physicsDivs.length; i++) {
        let div = physicsDivs[i];
        let body = visiblePhysicals[i];
        bodyTransformToObj3d(body, tempObj);
        let pos = tempObj.position;
        worldPosDiv(pos, cursorPos, div, zoom);

        if (zoom > 100) {
            let ptr = getBodyPointer(body)
            div.innerHTML = '<p>'+ptr+'</p>'
        } else {
            div.innerHTML = ''
        }
    }
}

let visibleSpawns = [];
function indicateSpawns(htmlElement, mapDiv, statusMap, cursorPos){
    MATH.emptyArray(visibleSpawns);
    let spawnPoints = GameAPI.worldModels.getDynamicSpawnPoints();

    for (let i= 0; i<spawnPoints.length; i++) {
        let spawnPoint = spawnPoints[i];
        if (spawnPoint.isActive) {
            let pos = spawnPoint.getPos();
            if(pos.x > minX && pos.x < maxX) {
                if (pos.z > minZ && pos.z < maxZ) {
                    visibleSpawns.push(spawnPoint);
                }
            }
        }
    }

    while (spawnDivs.length < visibleSpawns.length) {
        let div = DomUtils.createDivElement(mapDiv, 'spawn_p_'+spawnDivs.length, '', 'spawn_point')
        spawnDivs.push(div);
    }

    while (spawnDivs.length > visibleSpawns.length) {
        DomUtils.removeDivElement(spawnDivs.pop());
    }

    for (let i = 0; i < spawnDivs.length; i++) {
        let div = spawnDivs[i];
        let spawnPoint = visibleSpawns[i];
        let pos = spawnPoint.getPos();
        worldPosDiv(pos, cursorPos, div, zoom);
        let lodLevel = spawnPoint.call.getLodLevel()
        if (lodLevel === 0) {
            div.style.borderColor = "rgb(255,187,228)";
        } else if (lodLevel === 1) {
            div.style.borderColor = "rgb(233,55,255)";
        } else if (lodLevel === 2) {
            div.style.borderColor = "rgb(156,7,255)";
        } else if (lodLevel === 3) {
            div.style.borderColor = "rgb(43,85,255)";
        } else if (lodLevel === 4) {
            div.style.borderColor = "rgb(12,219,255)";
        } else if (lodLevel === 5) {
            div.style.borderColor = "rgb(29,238,77)";
        } else if (lodLevel === -1) {
            div.style.borderColor = "rgb(0, 0, 0)";
        } else {
            div.style.borderColor = "rgb(140,0,0)";
        }

        if (zoom > 20) {
            let x = MATH.decimalify(spawnPoint.terrainData.x, 100);
            let y = MATH.decimalify(spawnPoint.terrainData.y, 100);
            let z = MATH.decimalify(spawnPoint.terrainData.z, 100);
            let w = MATH.decimalify(spawnPoint.terrainData.w, 100);
            div.innerHTML = '<p>Level: '+spawnPoint.encounterLevel+'<br>x: '+x+'<br> y: '+y+'<br>z: '+z+'<br>w: '+w+'</p>'
        } else if (zoom > 10) {
            div.innerHTML = '<p>Level: '+spawnPoint.encounterLevel+'</p>'
        } else {
            div.innerHTML = ''
        }
    }
}

let visibleLabels = [];

function indicateLabels(htmlElement, mapDiv, statusMap, cursorPos) {
   let locationsData = GameAPI.worldModels.getActiveLocationData();
   MATH.emptyArray(visibleLabels);

   for (let i = 0; i < locationsData.length; i++) {
       let config = locationsData[i].config;
       if (typeof (config['location']) === 'object') {
           let loc = config.location;
           let pos = MATH.vec3FromArray(tempVec, loc.pos);

           if(pos.x > minX && pos.x < maxX) {
               if (pos.z > minZ && pos.z < maxZ) {
                   visibleLabels.push(loc)
               }
           }
       }
   }

    while (labelDivs.length < visibleLabels.length) {
        let div = DomUtils.createDivElement(mapDiv, 'label_'+labelDivs.length, '', 'label')
        labelDivs.push(div);
    }

    while (labelDivs.length > visibleLabels.length) {
        DomUtils.removeDivElement(labelDivs.pop());
    }

    for (let i = 0; i < labelDivs.length; i++) {
        let div = labelDivs[i];
        let label = visibleLabels[i];
        let text = "<p>"+label.name || "Name Missing"+"</p>";
        if (div.innerHTML !== text) {
            div.innerHTML = text;
        }

        let pos = MATH.vec3FromArray(tempVec, label.pos);
        worldPosDiv(pos, cursorPos, div, zoom)
    }

}

let visibleEstates = []

function indicateEstates(htmlElement, mapDiv, statusMap, cursorPos) {
    let activeEstates = GameAPI.worldModels.getActiveWorldEstates();
    MATH.emptyArray(visibleEstates);

    for (let i = 0; i < activeEstates.length; i++) {
        let estate = activeEstates[i];
            let pos = MATH.vec3FromArray(tempVec, estate.call.getStatusPos());
            let size = estate.call.getStatusSize();
            if(pos.x > (minX-size[0]*0.5) && pos.x < (maxX+size[0]*0.5)) {
                if (pos.z > (minZ-size[2]*0.5) && pos.z < (maxZ+size[2]*0.5)) {
                    visibleEstates.push(estate)
                }
            }
    }

    while (estateDivs.length < visibleEstates.length) {
        let div = DomUtils.createDivElement(mapDiv, 'estate_'+estateDivs.length, '', 'estate_area')
        estateDivs.push(div);
    }

    while (estateDivs.length > visibleEstates.length) {
        DomUtils.removeDivElement(estateDivs.pop());
    }

    for (let i = 0; i < estateDivs.length; i++) {
        let div = estateDivs[i];
        let estate = visibleEstates[i];

        let size = estate.call.getStatusSize();

        let pos = MATH.vec3FromArray(tempVec, estate.call.getStatusPos());
    //    pos.x += size[0]*0.48;
    //    pos.z += size[2]*0.48;
        worldPosDiv(pos, cursorPos, div, zoom)

        let w = size[0]*zoom*0.048
        let h = size[2]*zoom*0.048
        //    //    div.style.padding = 0.5*w+"%";
        div.style.borderWidth = 0.05+"em";
        div.style.width = w+"%";
        div.style.height = h+"%";


        if (zoom > 5) {
            let status = estate.call.getStatusMap();
            let name = status[ENUMS.ItemStatus.NAME];
            div.innerHTML = '<p>'+name+'</p>';
        } else {
            div.innerHTML = '';
        }

    }

}


let visibleModels = [];
function indicateLocations(htmlElement, mapDiv, statusMap, cursorPos) {
    MATH.emptyArray(visibleModels);
    let worldModels = GameAPI.worldModels.getActiveWorldModels();
//    console.log(statusMap, [worldModels], locationData);

    for (let i= 0; i<worldModels.length; i++) {
        let model = worldModels[i];
        let pos = model.getPos();

        if(pos.x > minX && pos.x < maxX) {
            if (pos.z > minZ && pos.z < maxZ) {
                if (zoom > 7) {
                    for (let j = 0; j < model.locationModels.length; j++) {
                        visibleModels.push(model.locationModels[j])
                        if (zoom >30) {
                            let boxes = model.locationModels[j].boxes;
                            for (let k = 0; k<boxes.length; k++) {
                                visibleModels.push(boxes[k]);
                            }
                        }
                    }
                } else {
                    visibleModels.push(model);
                }

            }
        }
    }

    while (locationDivs.length < visibleModels.length) {
        let div = DomUtils.createDivElement(mapDiv, 'loc_'+locationDivs.length, '', 'location')
        locationDivs.push(div);
    }

    while (locationDivs.length > visibleModels.length) {
        DomUtils.removeDivElement(locationDivs.pop());
    }

    for (let i = 0; i < locationDivs.length; i++) {
        let div = locationDivs[i];
        let model = visibleModels[i];
        let pos = model.getPos();
        worldPosDiv(pos, cursorPos, div, zoom)
    }

}
function indicateActors(htmlElement, minimapDiv, statusMap, centerPos) {
    let actors = GameAPI.getGamePieceSystem().getActors()
    while (actors.length < actorIndicators.length) {
        DomUtils.removeDivElement(actorIndicators.pop())
    }
    while (actors.length > actorIndicators.length) {
        let indicator = DomUtils.createDivElement(minimapDiv, 'indicator_actor_'+actorIndicators.length, '', 'actor')
        actorIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let cursorPos = centerPos;

    let selectedActor = GameAPI.getGamePieceSystem().selectedActor

    for (let i = 0; i < actors.length; i++) {
        let actor = actors[i];
        let indicator = actorIndicators[i];
        let actorPos = actor.actorObj3d.position;

        tempVec2.set(actorPos.x-cursorPos.x, actorPos.z-cursorPos.z);
        let distance = tempVec2.length(); // is in units m from cursor (Center of minimap)

        if (distance > 0.48*worldSize/zoom) {
            indicator.style.display = 'none';
        } else {
            if (indicator.style.display === 'none') {
                indicator.style.display = 'block';
            }

            worldPosDiv(actorPos, cursorPos, indicator, zoom);

            //    let angle = actor.getStatus(ENUMS.ActorStatus.STATUS_ANGLE_EAST);
            let angle = -MATH.eulerFromQuaternion(actor.getSpatialQuaternion(actor.actorObj3d.quaternion)).y + MATH.HALF_PI * 0.5 // Math.PI //;

            //    let headingDiv = htmlElement.call.getChildElement('heading');
            //    if (headingDiv) {
            indicator.style.rotate = angle + 'rad';

            //    console.log(angle)

            if (actor === selectedActor) {
                indicator.style.borderColor = "rgba(255, 255, 255, 1)";
            } else if (actor.getStatus(ENUMS.ActorStatus.ATTITUDE) === ENUMS.Attitude.FRIENDLY) {
                indicator.style.borderColor = "rgba(76, 255, 76, 1)";
            } else if (actor.getStatus(ENUMS.ActorStatus.ATTITUDE) === ENUMS.Attitude.HOSTILE) {
                indicator.style.borderColor = "rgba(255, 76, 76, 1)";
            } else {
                indicator.style.borderColor = "rgba(255, 255, 0, 1)";
            }

            if (selectedActor) {
                if (actor.getStatus(ENUMS.ActorStatus.ACTOR_ID) === selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET)) {
                    indicator.style.backgroundColor = "rgba(128, 128, 78, 1)";
                    indicator.style.boxShadow = "0 0 5px rgba(255, 255, 175, 0.75)";
                } else {
                    indicator.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                    indicator.style.boxShadow = "0 0 2px rgba(5, 0, 0, 0.75)";
                }

            }

            if (zoom > 60) {
                indicator.innerHTML = '<p>'+actor.getStatus(ENUMS.ActorStatus.NAME)+'<br>Level: '+actor.getStatus(ENUMS.ActorStatus.ACTOR_LEVEL)+'</p>';
            } else {
                indicator.innerHTML = '';
            }


        }

    }

}

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
        DomUtils.removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length > lineCount) {
        DomUtils.removeDivElement(gridLinesZ.pop())
    }
    while (gridLinesX.length < lineCount) {
        let line = DomUtils.createDivElement(mapDiv, 'grid_x_'+gridLinesX.length, "", 'map_grid_line map_grid_line_x')
        gridLinesX.push(line);
    }
    while (gridLinesZ.length < lineCount) {
        let line = DomUtils.createDivElement(mapDiv, 'grid_z_'+gridLinesZ.length, "", 'map_grid_line')
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
        DomUtils.removeDivElement(gridLinesX.pop())
    }
    while (gridLinesZ.length) {
        DomUtils.removeDivElement(gridLinesZ.pop())
    }
}


function attachWorldLevelNavigation(container) {
   // let terrainSys = ThreeAPI.getTerrainSystem();
    let worldLevelConfigs = GameAPI.gameMain.getWorldLevelConfig();
    console.log("worldLevelConfigs",worldLevelConfigs)

    let levelList = [];

    for (let key in worldLevelConfigs) {
        levelList[parseInt(worldLevelConfigs[key].id)] = worldLevelConfigs[key]
    }

    while (levelList.length) {
        let levelConf = levelList.pop();

        if (levelConf) {
            function clickLevel() {
                clearDivArray(locationDivs)
                defaultWorldLevel = levelConf.id;
            //    GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL, levelConf.id);
                evt.dispatch(ENUMS.Event.ENTER_PORTAL, {"world_level": levelConf.id, "world_encounters": []})


            }

            let div = DomUtils.createDivElement(container, "wls_"+levelConf.id, levelConf.id, "world_level_select")
            DomUtils.addClickFunction(div, clickLevel);
            worldLevelDivs.push(div);
        }
    }

}

class DomWorldmap {
    constructor(closeCb) {
        let htmlElement = new HtmlElement();
        let activeAdventures = GameAPI.gameAdventureSystem.getActiveWorldAdventures()
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
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
        //        selectedActor.setSpatialPosition(endPos)
                // selectedActor.transitionTo(endPos, 1);
            }
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


        let showSpawns = false;
        let showLocations = false;
        let showPhysics = false;
        let showVegetation = false;
        let showLodGrid = false;
        let showAdventures = false;
        let showLabels = false;
        let showEstates = false;

        let toggleAdventures = function(e) {
            showAdventures = !showAdventures;
        }

        let toggleLodGrid = function(e) {
            console.log(ThreeAPI.getTerrainSystem().getTerrain());
            showLodGrid = !showLodGrid;
        }
        let togglePhysics = function(e) {
            console.log(getPhysicalWorld());
            showPhysics = !showPhysics;
        }

        let toggleVegs = function(e) {
            console.log(ThreeAPI.getTerrainSystem().getVegetationSystem().getVegetation());
            showVegetation = !showVegetation;
        }

        let toggleSpawns = function(e) {
            console.log(GameAPI.worldModels.getDynamicSpawnPoints());
            showSpawns = !showSpawns;
        }

        let toggleLocations = function(e) {
            console.log(GameAPI.worldModels.getActiveWorldModels());
            showLocations = !showLocations;
        }

        let toggleLabels = function(e) {
            console.log(GameAPI.worldModels.getActiveLocationData());
            showLabels = !showLabels;
        }

        let toggleEstates = function(e) {
            console.log(GameAPI.worldModels.getActiveWorldEstates());
            showEstates = !showEstates;
        }

        let readyCb = function() {
            clearGridLines()
            activeWorldLevel = null;
            while (worldLevelDivs.length) {
                DomUtils.removeDivElement(worldLevelDivs.pop())
            }

            while (actorIndicators.length) {
                DomUtils.removeDivElement(actorIndicators.pop())
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
            let labelsDiv = htmlElement.call.getChildElement('labels')
            let physicsDiv = htmlElement.call.getChildElement('physics')
            let vegsDiv = htmlElement.call.getChildElement('vegetation')
            let locationsDiv = htmlElement.call.getChildElement('locations')
            let spawnsDiv = htmlElement.call.getChildElement('spawns')
            let lodsDiv = htmlElement.call.getChildElement('lod')

            let advsDiv = htmlElement.call.getChildElement('adv')

            let estatesDiv = htmlElement.call.getChildElement('estates')

            let levelsContainer = htmlElement.call.getChildElement('levels_container')
            let reloadDiv = htmlElement.call.getChildElement('reload')

            let generateDiv = htmlElement.call.getChildElement('generate')

            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')
            DomUtils.addClickFunction(mapDiv, mapClick)
            DomUtils.addMouseMoveFunction(mapDiv, mapHover)
            DomUtils.addPressStartFunction(mapDiv, mapPressStart)
            DomUtils.addPressEndFunction(mapDiv, mapPressEnd)
            DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(generateDiv, generateWorldMap)
            DomUtils.addClickFunction(zoomInDiv, zoomIn)
            DomUtils.addClickFunction(zoomOutDiv, zoomOut)
            DomUtils.addClickFunction(teleportDiv, teleport)
            DomUtils.addClickFunction(physicsDiv, togglePhysics)
            DomUtils.addClickFunction(vegsDiv, toggleVegs)
            DomUtils.addClickFunction(labelsDiv, toggleLabels)
            DomUtils.addClickFunction(locationsDiv, toggleLocations)
            DomUtils.addClickFunction(spawnsDiv, toggleSpawns)
            DomUtils.addClickFunction(lodsDiv, toggleLodGrid)
            DomUtils.addClickFunction(advsDiv, toggleAdventures)
            DomUtils.addClickFunction(estatesDiv, toggleEstates)

            attachWorldLevelNavigation(levelsContainer);
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
            worldSize = params.tx_width * params.unitScale;
            statusMap.posX = 'x:'+MATH.decimalify(cursorPos.x, 100);
            statusMap.posZ = 'z:'+MATH.decimalify(cursorPos.z, 100);

            zoom = statusMap.zoom;
            size = worldSize/zoom;
            minX = cursorPos.x -size*0.5;
            maxX = minX+size;
            minZ = cursorPos.z -size*0.5;
            maxZ = minZ+size;

            if (mapDiv) {
                let worldLevel = activeWorldLevel;

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

                worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
                if (worldLevel === getPlayerStatus(ENUMS.PlayerStatus.PLAYER_ID)) {
                    worldLevel = "19";
                }


                if (worldLevel !== activeWorldLevel) {
                    clearDivArray(spawnDivs);
                    clearDivArray(locationDivs);
                    clearDivArray(vegetationDivs);
                    clearDivArray(physicsDivs);
                    clearDivArray(locationDivs);
                    clearAdventureDivs();

                    statusMap.worldLevel = GameAPI.gameMain.getWorldLevelConfig(worldLevel).name;

                    if (activeWorldLevel !== null) {
                        DomUtils.removeElementClass(mapImageDiv, 'level_'+activeWorldLevel)
                    }
                    DomUtils.addElementClass(mapImageDiv, 'level_'+worldLevel)
                    activeWorldLevel = worldLevel;

                    if (worldLevel > 15) {
                        mapDiv.style.backgroundColor = "rgb(66, 71, 98)";
                    } else {
                        mapDiv.style.backgroundColor = "rgb(0, 0, 0)";
                    }

                }

            //    positionDiv(posDiv, cursorPos, zoom);
                alignDivToX(posDiv, worldSize*0.5, 1, statusMap.os_x)
                alignDivToZ(posDiv, 0, 1, statusMap.os_z)
                positionDiv(cursorDiv, pointerVec3, zoom);

                worldPosDiv(cam.position, cursorPos, cameraDiv, zoom)
                tempVec.set(statusMap.dstX, statusMap.dstY, statusMap.dstZ);
                worldPosDiv(tempVec, cursorPos, destinationDiv, zoom)
                indicateActors(htmlElement, mapDiv, statusMap, cursorPos)

                if (showEstates) {
                    indicateEstates(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(estateDivs);
                }

                if (showLabels) {
                    indicateLabels(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(labelDivs);
                }

                if (showLocations) {
                    indicateLocations(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(locationDivs);
                }

                if (showSpawns) {
                    indicateSpawns(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(spawnDivs);
                }

                if (showPhysics) {
                    indicatePhysics(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(physicsDivs);
                }

                if (showVegetation) {
                    indicateVegetation(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(vegetationDivs);
                }

                if (showLodGrid) {
                    indicateLodGrid(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearDivArray(lodGridDivs);
                }

                if (showAdventures) {
                    indicateAdventures(htmlElement, mapDiv, statusMap, cursorPos)
                } else {
                    clearAdventureDivs();
                }

            }

        }



    }

}



export {DomWorldmap}