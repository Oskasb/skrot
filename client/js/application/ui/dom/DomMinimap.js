import {HtmlElement} from "./HtmlElement.js";
import {DomWorldmap} from "./DomWorldmap.js";
import {Vector2} from "../../../../../libs/three/math/Vector2.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {PerformanceMonitorUiSystem} from "../gui/systems/PerformanceMonitorUiSystem.js";
import {isDev} from "../../utils/DebugUtils.js";
import {getPlayerStatus, getSetting, setPlayerStatus} from "../../utils/StatusUtils.js";
import {DomSettings} from "./DomSettings.js";
import {
    addClickFunction,
    addElementClass,
    createDivElement,
    removeDivElement,
    removeElementClass, transformElement3DPercent,
    translateElement3DPercent
} from "./DomUtils.js";
import {getCameraControls, getGamePlayer} from "../../../Client.js";
import {getFrame} from "../../utils/DataUtils.js";
import {MATH} from "../../MATH.js";

let tempVec2 = new Vector2()
let worldSize = 2048 * 10;
let tenMeterIndicators = [];
let actorIndicators = [];
let itemIndocators = [];
let gridTileIndicators = [];
let pathIndicators = [];
let preCombatZoom = 0;

let defaultWorldLevel = "20";
let activeWorldLevel = null;

function calcMapBackgroundOffset(zoom, axisCenter, worldSize) {
    let zoomOffset = 1 + (1 / zoom);
    return MATH.percentify(zoomOffset*MATH.decimalify(axisCenter, 5)-0.5*worldSize/zoom, worldSize, true);
}

function calcMapMeterToDivPercent(zoom, worldSize) {
    return MATH.percentify(zoom, worldSize, true);
}

function calcZoomForSize(size, worldSize)  {
    return worldSize/size;
}

function updateMinimapCenter(htmlElement, minimapDiv, statusMap, centerPos, inCombat) {
    statusMap.posX = 'x:'+MATH.numberToDigits(centerPos.x, 1, 4);
    statusMap.posZ = 'z:'+MATH.numberToDigits(centerPos.z, 1, 4);

    let zoom = statusMap.zoom;
    let size = zoom*100+'%'
    if (minimapDiv.style.backgroundSize !== size) {
        minimapDiv.style.backgroundSize = size;
    }


    let trX = calcMapBackgroundOffset(zoom, centerPos.x, worldSize)
    let trY = calcMapBackgroundOffset(zoom, centerPos.z, worldSize)

    let bpXs = trX+'%';
    let bpYs = trY+'%'

    if (minimapDiv.style.backgroundPositionX !== bpXs) {
        minimapDiv.style.backgroundPositionX = bpXs;
    }

    if (minimapDiv.style.backgroundPositionY !== bpYs) {
        minimapDiv.style.backgroundPositionY = bpYs;
    }


    if (inCombat === true) {
        let gameTime = getFrame().gameTime;
        let flash = Math.sin(gameTime*8)*0.5 + 0.5;
        let shadowSize = flash*1.5+0.2
        minimapDiv.style.boxShadow = '0 0 '+shadowSize+'em rgba(255, 125, 75, 0.75)';
        minimapDiv.style.borderColor = "rgb(255, "+flash*180+20+", "+(flash)*100+5+")";
    }

}


function addGridTiles(htmlElement, minimapDiv, statusMap, centerPos, encounterGrid) {

    let tiles = filterForWalkableTiles(encounterGrid.gridTiles, 'walkable');
    let zoomFactor = calcMapMeterToDivPercent(statusMap.zoom, worldSize);
    while (tiles.length) {
        let tile = tiles.pop();
        let pos = tile.getPos();
        tempVec2.set((pos.x-centerPos.x)*zoomFactor, (pos.z-centerPos.z)*zoomFactor);
        let indicator = createDivElement(minimapDiv, 'tile'+tempVec2.x+"_"+tempVec2.y, '', 'indicator_tile')
        indicator.style.top = 50 + tempVec2.y + '%';
        indicator.style.left = 50 + tempVec2.x + '%';
        indicator.style.padding = zoomFactor*0.35+'%';
        gridTileIndicators.push(indicator);
    }
}

function clearGridTiles() {
    while (gridTileIndicators.length) {
        removeDivElement(gridTileIndicators.pop())
    }
}

function switchCombatMode(htmlElement, minimapDiv, statusMap, centerPos, inCombat) {

}

function indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap) {

    while (tenMeterIndicators.length < 4) {
        let indicator = createDivElement(minimapDiv, 'indicator_10m_'+tenMeterIndicators.length, '', 'indicator_10m')
        tenMeterIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize) * 600;
    let trY0 = -zoomFactor
    let trY1 = zoomFactor

    translateElement3DPercent(tenMeterIndicators[0], 0, trY0, 0);
    translateElement3DPercent(tenMeterIndicators[1], 0, trY1, 0);
    translateElement3DPercent(tenMeterIndicators[2], trY0, 0, 0);
    translateElement3DPercent(tenMeterIndicators[3], trY1, 0, 0);

}

let adventureIndicators = []

function updateActiveAdventures(activeAdventures, htmlElement, minimapDiv, statusMap, centerPos) {
    while (activeAdventures.length < adventureIndicators.length) {
        removeDivElement(adventureIndicators.pop())
    }
    while (activeAdventures.length > adventureIndicators.length) {
        let indicator = createDivElement(minimapDiv, 'indicator_adv_'+adventureIndicators.length, '', 'heading')
        adventureIndicators.push(indicator);
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let cursorPos = centerPos;

    for (let i = 0; i < activeAdventures.length; i++) {
        let adv = activeAdventures[i];
        let indicator = adventureIndicators[i];
        let pos = adv.getPos();

        tempVec2.set(pos.x-cursorPos.x, pos.z-cursorPos.z);
        let distance = tempVec2.length(); // is in units m from cursor (Center of minimap)

        if (distance > 150) {
            if (indicator.style.display !== 'none') {
                indicator.style.display = 'none';
            }
        } else {
            if (indicator.style.display === 'none') {
                indicator.style.display = 'block';
            }

            let mapPctX = tempVec2.x*zoomFactor
            let mapPctZ = tempVec2.y*zoomFactor

            let top = -25 + mapPctZ * 19 // + '%';
            let left = 50 + mapPctX * 19 // + '%';
            let angle = 0.74;

            transformElement3DPercent(indicator, left, top, 0, angle);

            let rgba2 = "rgba(255, 255, 0, 1)";
            let rgba = "rgba(155, 155, 0, 0.3)";

            if (indicator.style.borderColor !== rgba2) {
                indicator.style.borderColor = rgba2
            }

                if (indicator.style.backgroundColor !== rgba) {
                    indicator.style.backgroundColor = rgba;
                }

        }
    }
}

let playerIndicator = null;

function indicateGamePlayer(htmlElement, minimapDiv, statusMap, centerPos) {

    let player = getGamePlayer();

    if (playerIndicator === null) {
        playerIndicator = createDivElement(minimapDiv, 'indicator_actor_'+actorIndicators.length, '', 'heading')
    }

    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let cursorPos = centerPos;

        let actorPos = player.getPos();
        tempVec2.set(actorPos.x-cursorPos.x, actorPos.z-cursorPos.z);
            let mapPctX = tempVec2.x*zoomFactor
            let mapPctZ = tempVec2.y*zoomFactor

            let top = -25 + mapPctZ * 19 // + '%';
            let left = 50 + mapPctX * 19 // + '%';
            let angle = -MATH.eulerFromQuaternion(player.getQuat()).y + MATH.HALF_PI * 2.5 // Math.PI //;

            transformElement3DPercent(playerIndicator, left, top, 0, angle);

            let rgba = "rgba(255, 255, 255, 1)"

            if (playerIndicator.style.borderColor !== rgba) {
                playerIndicator.style.borderColor = rgba
            }


}

let cameraIndicator = null;
let camAngle = 0;
let lastAspect = 0;
let lastScale = 0;
function makeGradientString(angle, edgeRgba, centerRgba) {
    let edgeAnglePos = angle;
    let edgeAngleNeg = (360-angle)

    let edge = 0.2;
    let fade = 3;

    let grad = "conic-gradient("+centerRgba+" "+(edgeAnglePos-fade)+"deg, "+edgeRgba+" "+edgeAnglePos+"deg, rgba(0, 0, 0, 0) "+(edgeAnglePos+edge)+"deg, rgba(0, 0, 0, 0) "+(edgeAngleNeg-edge)+"deg,"+edgeRgba+" "+edgeAngleNeg+"deg, "+centerRgba+" "+(edgeAngleNeg+fade)+"deg)";
 //   console.log(grad)
     return grad

}

function indicateCameraFrustum(htmlElement, minimapDiv, statusMap, centerPos) {

    if (cameraIndicator === null) {
        cameraIndicator = createDivElement(minimapDiv, 'indicator_camera', '', 'camera')
    }

    let cam = ThreeAPI.getCamera()
    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    let actorPos = cam.position;

    tempVec2.set(actorPos.x-centerPos.x, actorPos.z-centerPos.z);
    // let distance = tempVec2.length(); // is in units m from cursor (Center of minimap)

        let mapPctX = tempVec2.x*zoomFactor
        let mapPctZ = tempVec2.y*zoomFactor

    let angle = -MATH.eulerFromQuaternion(cam.quaternion).y

    transformElement3DPercent(cameraIndicator, mapPctX, mapPctZ, 0, angle, null)

    if (lastAspect !== GameScreen.getAspect()) {
        lastAspect = GameScreen.getAspect();
        cameraIndicator.style.backgroundImage = makeGradientString(MATH.curveSqrt( lastAspect*0.4)*45, "rgba(127, 255, 255, 0.8)", "rgba(127, 255, 255, 0.15)")
    }

    let scale = zoom / 30

    if (lastScale !== scale) {
        lastScale = scale;
        cameraIndicator.style.scale = scale;
    }


}

function populateTravelPath(minimapDiv) {
    while (pathIndicators.length) {
        let ind = pathIndicators.pop();
        removeDivElement(ind.div);
        poolReturn(ind.pos);
    }

    while (pathIndicators.length < 16) {
        
        let ind = {
            div: createDivElement(minimapDiv, 'path_'+pathIndicators.length, '', 'indicator_path'),
            pos: poolFetch('Vector3'),
            time:getFrame().gameTime
        };
        pathIndicators.push(ind);
    }
    
}

function markTravelPath(pos, timeElapsed) {
    if (pathIndicators.length === 0) {
        console.log("No path indocators")
        return;
    }
    let indicator = pathIndicators.pop();
    pathIndicators.unshift(indicator);
    indicator.pos.copy(pos);
    indicator.time = timeElapsed;
}

function updateTravelPath(pos, statusMap) {
    let zoom = statusMap.zoom;
    let zoomFactor = calcMapMeterToDivPercent(zoom, worldSize);
    for (let i = 0; i < pathIndicators.length; i++) {
        let ind = pathIndicators[i];
        let x = ind.pos.x - statusMap.x;
        let z = ind.pos.z - statusMap.z;

        let trY = z*zoomFactor // * 0.74;
        let trX = x*zoomFactor // * 0.74;

        //   ind.div.style.top  = (50+z*zoomFactor)+'%';
        //   ind.div.style.left = (50+x*zoomFactor)+'%';

        translateElement3DPercent(ind.div, trX, trY, 0)
    }
}

function updatePathTime(markTime, timeElapsed) {
    let now = timeElapsed;
    for (let i = 0; i < pathIndicators.length; i++) {
        let ind = pathIndicators[i];
        let startTime = ind.time;
        let fraction = 1 - MATH.calcFraction(startTime, startTime+markTime*pathIndicators.length, now);
        ind.div.style.opacity  = fraction;
    }
}

class DomMinimap {
    constructor() {
        let htmlElement = new HtmlElement();
        let inCombat = false;

        let statusMap = {
            x :0,
            y: 0,
            z :0,
            posX : 0,
            posZ : 0,
            zoom : 60
        }

        let closeMapCb = function() {
            htmlElement.showHtmlElement()
            console.log("Close Minimap...")
        }

        let zoomIn = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 1.2, 10, 200);
        }

        let zoomOut = function() {
            statusMap.zoom = MATH.clamp(statusMap.zoom * 0.8, 10, 200);
        }

        let openWorldMap = function() {
            htmlElement.hideHtmlElement()
            new DomWorldmap(closeMapCb);
        }

        let openChat = function() {
            let open = getPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE);
            setPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE, !open);
        }

        let openSettings = function() {
            GuiAPI.setNavigationState(ENUMS.NavigationState.SETTINGS);
            setTimeout(function() {
                client.setClientStatus(ENUMS.ActorStatus.NAVIGATION_STATE, ENUMS.NavigationState.SETTINGS)
                let settingsPage = new DomSettings();

                function onCloseCB() {
                    console.log("Settings Page closed")
                }
                settingsPage.initDomSettings(onCloseCB)

            }, 200)
        }

        let editWorld = null;

        let perfMonOn = false;
        let perfMonSys = new PerformanceMonitorUiSystem();
        let monitorPerformance = function() {
            perfMonOn = !perfMonOn;

            if (perfMonOn === true) {
                perfMonSys.initPerformanceMonitorUiSystem()
            } else {
                perfMonSys.closePerformanceMonitorUiSystem();
            }
        }

        let openLocEdit = function() {
            if (client.page) {
                GuiAPI.closePage(client.page)
                client.page = null;
            }
            if (editWorld === null) {
                editWorld = poolFetch('DomEditWorld');
                editWorld.initDomEditWorld(openLocEdit)
            } else {
                editWorld.closeDomEditWorld();
                poolReturn(editWorld);
                editWorld = null;
            }
        }

        let readyCb = function() {
            lastAspect = 0;
            let mapDiv = htmlElement.call.getChildElement('minimap')
        //    let closeDiv = htmlElement.call.getChildElement(htmlElement.id+'_close')
            let zoomInDiv = htmlElement.call.getChildElement('zoom_in')
            let zoomOutDiv = htmlElement.call.getChildElement('zoom_out')

            addClickFunction(mapDiv, openWorldMap)
            addClickFunction(zoomInDiv, zoomIn)
            addClickFunction(zoomOutDiv, zoomOut)
            populateTravelPath(mapDiv);
        }


        let rebuild = function() {

            htmlElement.closeHtmlElement()
            htmlElement.initHtmlElement('minimap', null, statusMap, 'minimap', readyCb);
            setTimeout(function() {
                activeWorldLevel = null;

                if (cameraIndicator !== null) {
                    removeDivElement(cameraIndicator)
                    cameraIndicator = null;
                }

                while (actorIndicators.length) {
                    removeDivElement(actorIndicators.pop())
                }
                while (tenMeterIndicators.length) {
                    removeDivElement(tenMeterIndicators.pop())
                }

            }, 200);

            console.log("Rebuild Minimap...")
        }

        htmlElement.initHtmlElement('minimap', null, statusMap, 'minimap', readyCb);
        let centerPos = ThreeAPI.getCameraCursor().getLookAroundPoint()

        let frameTravelDistance = 0;
        let travelTime = 0;
        let lastFramePos = new Vector3();
        let lastZoom = statusMap.zoom;
        let markTime = 0.05;
        let timeElapsed = 0;
        let mapUpdated = true;
        let update = function() {

            let minimapDiv = htmlElement.call.getChildElement('minimap');


            let params = ThreeAPI.getTerrainSystem().getTerrain().call.getTerrainParameters();
        //    worldSize = params.tx_width * params.unitScale;

        //    console.log("Update Minimap")

            if (minimapDiv) {

                htmlElement.call.applyTransformSettings(ENUMS.Settings.OFFSET_MINIMAP_X, ENUMS.Settings.OFFSET_MINIMAP_Y, ENUMS.Settings.SCALE_MINIMAP)

                frameTravelDistance = MATH.distanceBetween(lastFramePos, centerPos);

                let worldLevel = "20";

                if (frameTravelDistance !== 0 || lastZoom !== statusMap.zoom) {
                    mapUpdated = true;
                } else {
                    mapUpdated = false;
                }

                centerPos = ThreeAPI.getCameraCursor().getPos()


                statusMap.x = centerPos.x;
                statusMap.y = centerPos.y;
                statusMap.z = centerPos.z;
                
                if (worldLevel !== activeWorldLevel) {
                    if (activeWorldLevel !== null) {
                        removeElementClass(minimapDiv, 'level_'+activeWorldLevel)
                    }
                    addElementClass(minimapDiv, 'level_'+worldLevel)
                    activeWorldLevel = worldLevel;
                }

                frameTravelDistance = MATH.distanceBetween(lastFramePos, centerPos);
                lastFramePos.copy(centerPos);
                if (frameTravelDistance !== 0) {

                    travelTime += getFrame().tpf;
                    timeElapsed+=getFrame().tpf
                    if (travelTime > markTime) {
                        travelTime -= markTime;
                        markTravelPath(lastFramePos, timeElapsed)
                    }
                    updatePathTime(markTime, timeElapsed)
                }
                if (mapUpdated === true) {
                    lastZoom = statusMap.zoom;
                    updateTravelPath(lastFramePos, statusMap);
                    updateMinimapCenter(htmlElement, minimapDiv, statusMap, centerPos, inCombat);
                    indicateTenMeterScale(tenMeterIndicators, htmlElement, minimapDiv, statusMap)
                }


                indicateGamePlayer(htmlElement, minimapDiv, statusMap, centerPos)
                indicateCameraFrustum(htmlElement, minimapDiv, statusMap, centerPos)
            }

        }

        ThreeAPI.registerPrerenderCallback(update);

    }


}



export {DomMinimap}