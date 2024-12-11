import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {detachConfig, listifyConfig, saveAdventureEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {WorldAdventure} from "../../../game/gamescenarios/WorldAdventure.js";
import {addNodeToAdventureAtPos} from "../../utils/AdventureUtils.js";

let applyContainerDiv = null;
let idLabelDiv = null;

let buttonLayer = null;

let toolsList = [
    "EDIT",
    "ADD",
    "CONFIG"
]

let adventures = [""];
let configs = null;

class DomEditAdventure {
    constructor() {

        let addToolStatusMap = {}
        addToolStatusMap.activateSelection = applySelection;
        addToolStatusMap.selectionUpdate = selectionUpdate;
        addToolStatusMap.loadTemplate = loadTemplate;
        addToolStatusMap.root = "world";
        addToolStatusMap.folder = "adventure";

        let editObj3d = new Object3D();

        if (configs === null) {
            configs = {};
            listifyConfig("WORLD_ADVENTURE","ADVENTURES", adventures, configs)
            addToolStatusMap.selectList = adventures;
        }

        this.statusMap = {
            selectedTool: "",
            selection: "--select--"
        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let selectedTool = "";
        let editCursors = {};
        let activeCursor = null;
        let applyOperationDiv = null;
        let toolSelectDiv = null;
        let visibleWorldModels = [];
        let locationModelDivs = [];
        let activeTool = null;


        function onClick(e) {
            console.log("Model Cursor Click", e)
        }

        function applyCursorUpdate(obj3d, elevate, grid) {
            /*
            modelConfig.grid = grid;
            modelConfig.elevate = elevate;
            MATH.vec3ToArray(obj3d.position, modelConfig.pos, 100)
            MATH.rotObj3dToArray(obj3d, modelConfig.rot, 1000);
            if (previewModel !== null) {
                previewModel.call.applyEditCursorUpdate(obj3d);
            }

             */
        }

        function closeActiveCursor() {
            activeCursor.closeDomEditCursor();
            poolReturn(activeCursor);
            activeCursor = null;
        }

        function activateCursor() {
            activeCursor = poolFetch('DomEditCursor')
            activeCursor.initDomEditCursor(closeActiveCursor, editObj3d, applyCursorUpdate, onClick);
            if (typeof (modelConfig.grid) === 'number') {
                activeCursor.call.setGrid(modelConfig.grid)
            }
        }

        function applySelection(id) {
            addToolStatusMap.parent = new WorldAdventure()
            let wAdv = addToolStatusMap.parent;
            wAdv.config = detachConfig(configs[id]);

            wAdv.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
            wAdv.id = wAdv.config.edit_id
            addNodeToAdventureAtPos(wAdv, wAdv.getPos())
            let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
            GameAPI.gameAdventureSystem.registerAdventure(worldLevel, wAdv)
        }

        function selectionUpdate(id) {

            if (id !== "") {

            }

        }

        function loadTemplate(statMap) {
            console.log("loadTemplate:", statMap, addToolStatusMap);
            statMap.parent.call.applyLoadedConfig(addToolStatusMap.config, statMap.id, true);
            saveAdventureEdits(statMap.parent);
        }


        function closeTool() {

            if (activeCursor !== null) {
                activeCursor.closeDomEditCursor()
                poolReturn(activeCursor);
                activeCursor = null;
            }

            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool);
                activeTool = null;
            }
        }

        let setSelectedTool = function(tool) {
            close()

            selectedTool = tool;
            statusMap.selectedTool = tool;
            if (activeTool !== null) {
                closeTool();
            }
            console.log("setSelectedTool", tool)

            if (selectedTool === "ADD") {
                activeTool = poolFetch('DomEditAdd');
                let parent = new WorldAdventure()
                parent.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                addToolStatusMap.parent = parent;
                activeTool.call.setStatusMap(addToolStatusMap)
                activeTool.initEditTool(closeTool);
            }

            if (selectedTool === "CONFIG" || selectedTool === "EDIT") {
                buttonLayer = poolFetch('DomWorldButtonLayer');

                let allAdventures = GameAPI.gameAdventureSystem.getWorldAdventures();

                buttonLayer.initWorldButtonLayer(allAdventures, selectedTool, divClicked)

            }

        }

        let htmlReady = function(el) {
            htmlElem = el;
            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            toolSelectDiv = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            idLabelDiv = htmlElem.call.getChildElement('selection_value');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log([worldModels, locationsData]);
            rootElem = htmlElem.call.getRootElement();
            ThreeAPI.registerPrerenderCallback(update);

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            }

        }


        let closeActiveTool = function() {
            console.log("Adventure Edit Closed");
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool)
                activeTool = null;
            }
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let adventure = htmlElem.adventure;
            if (adventure === null) {
                return;
            }
            editCursors[adventure.id] = false;
            htmlElem.cursor = null;
            htmlElem.adventure = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        let activeAdventure = null;

        function closeActiveAdventure() {
            if (activeAdventure !== null) {
                activeAdventure.call.sleepAdventure();
                activeAdventure.call.despawnWorldAdventure();
                activeAdventure = null;
            }
        }



        let divClicked = function(e) {
            closeActiveAdventure();

            let adventure = e.target.value
            activeAdventure = adventure;
            activeAdventure.call.spawnWorldAdventure(true);

            console.log("Activated", selectedTool, adventure);
            idLabelDiv.innerHTML = adventure.id;
            adventure.config = detachConfig(adventure.config);

            if (selectedTool === "EDIT") {
                if (typeof (editCursors[adventure.id]) !== 'object') {
                //    e.target.style.visibility = "hidden";
                    let cursor = poolFetch('DomEditCursor')

                    let onClick = function(crsr) {
                        console.log("Clicked Cursor", crsr)
                        closeEditCursor(crsr.htmlElement);
                        closeButtonLayer()
                        idLabelDiv.innerHTML = adventure.id;
                    //    close();
                        if (activeTool === null) {
                            activeTool = poolFetch('DomEditAdventureNodes')
                            activeTool.call.setAdventure(adventure);
                            activeTool.initEditTool(closeActiveTool)
                        } else {
                            let adv = activeTool.call.getAdventure();
                            if (adv === adventure) {
                                closeActiveTool();
                            } else {
                                activeTool.call.setAdventure(adventure);
                            }
                        }
                    }


                    let applyCursorUpdate = function(obj3d, grid) {
                        adventure.config.grid = grid;
                        MATH.vec3ToArray(obj3d.position, adventure.config.nodes[0].pos, 10);
                        MATH.vec3FromArray(adventure.getPos(), adventure.config.nodes[0].pos)
                        saveAdventureEdits(adventure);
                    }

                    cursor.initDomEditCursor(closeEditCursor, adventure.obj3d, applyCursorUpdate, onClick);
                    if (typeof (adventure.config.grid) === 'number') {
                        cursor.call.setGrid(adventure.config.grid)
                    }
                    cursor.htmlElement.cursor = cursor;
                    cursor.htmlElement.adventure = adventure;
                    editCursors[adventure.id] = cursor;
                }
            }

            if (selectedTool === 'CONFIG') {
                closeActiveTool();
                activeTool = poolFetch('DomEditConfig');
                let map = {
                    id:adventure.id,
                    root:"adventure",
                    folder: GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL),
                    parent:adventure,
                    config:adventure.config,
                    onEditCB:adventure.call.applyLoadedConfig
                }
                activeTool.initEditTool(closeActiveTool, map)
            }
        }

        let update = function() {

            editObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());

            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                setSelectedTool(toolSelectDiv.value)
            }

        }

        function closeEditCursors() {
            for (let key in editCursors) {
                if (editCursors[key] !== false) {
                    if (typeof(editCursors[key].closeCb) !== 'function' ) {
                        console.log("Bad Edit cursor close",editCursors[key], key, editCursors)
                        return
                    }
                    editCursors[key].closeCb(editCursors[key].htmlElement)
                    editCursors[key] = false;
                }
            }
        }
        function closeButtonLayer() {
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }
        }
        let close = function() {
            closeActiveAdventure()
            idLabelDiv.innerHTML = "--No Selection--";
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }
            closeEditCursors()
            closeButtonLayer()
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('tool_selector', closeCb, this.statusMap, 'edit_frame tool_selector', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditAdventure }