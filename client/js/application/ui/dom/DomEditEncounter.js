import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";
import {detachConfig, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {encounterTemplates} from "../../../game/ConfigTemplates.js";
import {WorldEncounter} from "../../../game/encounter/WorldEncounter.js";
import {ProceduralEncounterConfig} from "../../../game/encounter/ProceduralEncounterConfig.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let encounterConfigs = null;
let worldEncounters = null;
let buttonLayer = null;

let templateList = [""]

for (let key in encounterTemplates) {
    templateList.push(key);
}

let toolsList = [
    "MOVE",
    "GRID",
    "SPAWN",
    "HOST",
    "CONFIG",
    "ADD"
]

class DomEditEncounter {
    constructor() {

        let updateObj3d = new Object3D();

        this.statusMap = {
            selectedTool: "",
            selection: "--select--"
        };

        let statusMap = this.statusMap;

        let rootElem = null;
        let htmlElem;
        let applyOperationDiv = null;
        let nodeDivs = [];

        let worldModel = null;
        let toolSelect = null;
        let selectedTool = "";
        let editCursors = {};
        let encounterEdit = null;
        let visibleWorldEncounters = [];
        let worldEncounterDivs = [];
        let applyContainerDiv = null;
        let idLabelDiv = null;
        let activeTool = null;

        let addToolStatusMap = {
            selectList: templateList
        }

        let forcedId = false;

        let nodeId = "";

        let setNodeId = function(id) {
            forcedId = true;
            nodeId = id;
        }

        function initConfig(cfg) {
            let config = detachConfig(cfg);

            if (forcedId !== false) {
                config.edit_id = "enc_adv_"+nodeId;
                config.node_id = nodeId;
            }

            let pos = ThreeAPI.getCameraCursor().getLookAroundPoint();
            MATH.vec3ToArray(pos, config.pos, 1);
            MATH.vec3FromArray(config.pos, pos);
            config.pos[1] = MATH.decimalify(ThreeAPI.terrainAt(pos), 10);
            return config;
        }

        function applySelection(id) {
            let config = initConfig(encounterTemplates[id]);


            console.log("Selection applySelection: ", id, config);
            let wl = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
            GameAPI.worldModels.addConfigEncounter(wl, config, config.edit_id, true);
        }

        let selectedTemplateId = null;
        function selectionUpdate(id) {
            selectedTemplateId = id;
            console.log("Selection Update: ", id);
        }

        function loadTemplate(statMap) {

            let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
            console.log("loadTemplate Selected Template ", statMap, selectedTemplateId)
            let map = loadedTemplates[selectedTemplateId];
            map.config.edit_id = "";
            let config = initConfig(map.config);
            let wl = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
            GameAPI.worldModels.addConfigEncounter(wl, config, config.edit_id, true);
        }

        addToolStatusMap.loadTemplate = loadTemplate;
        addToolStatusMap.activateSelection = applySelection;
        addToolStatusMap.selectionUpdate = selectionUpdate;
        addToolStatusMap.root = "world";
        addToolStatusMap.folder = "encounter";

        function loadConfigTemplate(statMap) {
            console.log("loadConfigTemplate", selectedTemplateId, statMap)

            let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
        //    console.log("loadTemplate Selected Template ", selectedTemplateId)
            let map = loadedTemplates[selectedTemplateId];
            let config = detachConfig(map.config);
            MATH.vec3ToArray(statMap.parent.getPos(), config.pos);
            statMap.parent.call.applyConfig(config)

        }

        function closeTool() {
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
            if (tool === "ADD") {
                applyOperationDiv.innerHTML = tool;
                applyContainerDiv.style.display = "none"
                let cfg = new ProceduralEncounterConfig()
                cfg.generateConfig(ThreeAPI.getCameraCursor().getLookAroundPoint(), 1);

                if (forcedId !== false) {
                    cfg.config.edit_id = forcedId;
                }

                addToolStatusMap.config = detachConfig(cfg.config)


                addToolStatusMap.id = addToolStatusMap.config.edit_id;
                activeTool = poolFetch('DomEditAdd');
                activeTool.call.setStatusMap(addToolStatusMap)
                activeTool.initEditTool(closeTool);

            } else {

                applyContainerDiv.style.display = "none"
                buttonLayer = poolFetch('DomWorldButtonLayer')
                buttonLayer.initWorldButtonLayer(GameAPI.worldModels.getWorldEncounters(), tool, divClicked)

            }

        }


        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            encounterConfigs = GameAPI.worldModels.getEncounterConfigs();
            worldEncounters = GameAPI.worldModels.getWorldEncounters();
            toolSelect = htmlElem.call.getChildElement('tool');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            idLabelDiv = htmlElem.call.getChildElement('selection_value');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log(worldEncounters, encounterConfigs);
            rootElem = htmlElem.call.getRootElement();
            ThreeAPI.registerPrerenderCallback(update);
        }

        let closeEditCursor = function(htmlElem) {
            if (htmlElem === null) {
                console.log("This needs its elem.. ")
                return;
            }
            let cursor = htmlElem.cursor;
            let encounter = htmlElem.encounter;
            if (encounter !== null) {
                editCursors[encounter.id] = false;
                htmlElem.cursor = null;
                htmlElem.encounter = null;
                cursor.closeDomEditCursor();
                poolReturn(cursor);
            }
        }

        let divClicked = function(e) {
            let encounter = e.target.value
            encounter.config = detachConfig(encounter.config);
            console.log("Edit Activated", encounter);
            idLabelDiv.innerHTML = encounter.id;
            updateObj3d.quaternion.set(0, 0, 0, 1);
            if (selectedTool === "MOVE") {
                if (typeof (editCursors[encounter.id]) !== 'object') {
                //    e.target.style.visibility = "hidden";
                    let cursor = poolFetch('DomEditCursor')

                    let onClick = function(crsr) {
                        console.log("Clicked Cursor", crsr)
                    }

                    let onCursorUpdate = function(obj3d) {
                        if (MATH.distanceBetween(updateObj3d.position, obj3d.position) < 0.5) {
                            if (MATH.distanceBetween(updateObj3d.quaternion, obj3d.quaternion) < 0.01) {
                                return;
                            }
                        }
                        updateObj3d.quaternion.copy(obj3d.quaternion);
                        updateObj3d.position.x = Math.round(obj3d.position.x);
                        updateObj3d.position.y = MATH.decimalify(obj3d.position.y, 10);
                        updateObj3d.position.z = Math.round(obj3d.position.z);
                        physicalAlignYGoundTest(updateObj3d.position, updateObj3d.position, 3)
                        let fits = testProbeFitsAtPos(updateObj3d.position, 2)
                        if (fits === true) {
                            updateObj3d.position.y = MATH.decimalify(updateObj3d.position.y, 10);
                            MATH.vec3ToArray(updateObj3d.position, encounter.config.pos)
                            saveEncounterEdits(encounter);
                            encounter.obj3d.position.copy(updateObj3d.position);
                            encounter.getHostActor().setSpatialPosition(encounter.obj3d.position);
                            encounter.getHostActor().setSpatialQuaternion(updateObj3d.quaternion);
                        }
                    }

                    cursor.initDomEditCursor(closeEditCursor, encounter.obj3d, onCursorUpdate, onClick);
                    cursor.htmlElement.cursor = cursor;
                    cursor.htmlElement.encounter = encounter;
                    editCursors[encounter.id] = cursor;
                }
            }

            if (selectedTool === "GRID") {
                closeTool();
                activeTool = poolFetch('DomEditGrid');
                activeTool.setWorldEncounter(encounter)
                activeTool.initEditTool(closeTool);
            }

            if (selectedTool === "SPAWN") {
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(encounter.getPos())
                closeTool();
                activeTool = poolFetch('DomEditSpawns');
                activeTool.setWorldEncounter(encounter)
                activeTool.initEditTool(closeTool);
            }


            if (selectedTool === "CONFIG") {
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(encounter.getPos())
                closeTool();
                activeTool = poolFetch('DomEditConfig');
                let host = encounter.getHostActor();
                let id = "host_"+encounter.id
                let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
                let map = {
                    id:id,
                    root:"world",
                    folder:"encounter",
                    parent:encounter,
                    config:encounter.config,
                    selectionUpdate:selectionUpdate,
                    loadTemplate:loadConfigTemplate,
                    selections:["", "TEMPLATE"]
                }
                activeTool.initEditTool(closeTool, map);
            }

            if (selectedTool === "HOST") {
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(encounter.getPos())
                closeTool();
                activeTool = poolFetch('DomEditConfig');
                let host = encounter.getHostActor();
                let id = "host_"+encounter.id
                let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
                let map = {
                    id:id,
                    root:"host",
                    folder:worldLevel,
                    parent:host,
                    config:host.config
                }
                activeTool.initEditTool(closeTool, map);
            }
        }

        let update = function() {
        //    rootElem.style.transition = 'none';

            if (selectedTool !== toolSelect.value) {
                setSelectedTool(toolSelect.value)
            }

            MATH.emptyArray(visibleWorldEncounters)

            if (selectedTool === "_ADD") {

                if (activeTool === null) {
                    if (selectedTool !== "MOVE") {
                        idLabelDiv.innerHTML = "--No Selection--";
                    }
                    worldEncounters = GameAPI.worldModels.getWorldEncounters();
                    let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)
                    for (let i = 0; i < worldEncounters.length; i++) {
                        let pos = worldEncounters[i].getPos();
                        let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                        if (distance < 25 + camCursorDist*0.5) {
                            if (ThreeAPI.testPosIsVisible(pos)) {
                                visibleWorldEncounters.push(worldEncounters[i]);
                            }
                        }
                    }

                    while (worldEncounterDivs.length < visibleWorldEncounters.length) {
                        let div = DomUtils.createDivElement(document.body, 'encounter_'+visibleWorldEncounters.length, selectedTool, 'button button_encounter_edit')
                        DomUtils.addClickFunction(div, divClicked);
                        worldEncounterDivs.push(div);
                    }
                }
            }
            
            while (worldEncounterDivs.length > visibleWorldEncounters.length) {
                DomUtils.removeDivElement(worldEncounterDivs.pop());
            }

            for (let i = 0; i < visibleWorldEncounters.length; i++) {
                let encounter = visibleWorldEncounters[i];
                let div = worldEncounterDivs[i];
                let pos = encounter.getPos();
                div.value = encounter;

                ThreeAPI.toScreenPosition(pos, tempVec);
                div.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
                div.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'RED'});
                tempVec.x = pos.x;
                tempVec.z = pos.z;
                tempVec.y = 0;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'RED'});
            }

        };

        function closeEditCursors() {
            for (let key in editCursors) {
                if (typeof (editCursors[key]) === 'object') {
                    editCursors[key].closeCb(editCursors[key].htmlElement)
                }
            }
        }

        let close = function() {
            idLabelDiv.innerHTML = "--No Selection--";
            while (worldEncounterDivs.length) {
                DomUtils.removeDivElement(worldEncounterDivs.pop());
            }
            closeEditCursors()
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }
        }

        this.call = {
            setNodeId:setNodeId,
            initConfig:initConfig,
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }


    initEditTool(closeCb, onReadyCB) {

        let tool = this;
        function onReady(htmlEl) {
            onReadyCB(tool);
            tool.call.htmlReady(htmlEl);
        }

        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('tool_selector', closeCb, this.statusMap, 'edit_frame tool_selector', onReady);
    }

    closeEditTool() {
        this.call.close();
        this.call.setNodeId(false)
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditEncounter }