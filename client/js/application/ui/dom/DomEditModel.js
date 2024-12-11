import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {physicalAlignYGoundTest, testProbeFitsAtPos} from "../../utils/PhysicsUtils.js";
import {
    detachConfig,
    generateEditId,
    listifyConfig,
    saveEncounterEdits,
    saveWorldModelEdits
} from "../../utils/ConfigUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {getPlayerStatus} from "../../utils/StatusUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let applyContainerDiv = null;
let idLabelDiv = null;
let activeTool = null;

let buttonLayer = null;

let toolsList = [
    "EDIT",
    "ADD",
  //  "LOAD_TEMPLATE",
    "CONFIG",
    "CLEAR_WORLD",
    "REBUILD_WORLD"
]

let modelConfigs = null;
let assetConfigs = null;

let locationModelConfigTemplate = {
    "asset": "",
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [0.01, 0.01, 0.01],
    "solidity": 1.0,
    "visibility": 3,
    "boxes": []
}

let worldModelTemplateConfig =                 {
    "model": false,
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [1, 1, 1],
    "on_ground": true,
    "visibility": 3,
    "palette": "DEFAULT",
    "no_lod":true
}

class DomEditModel {
    constructor() {

        let addToolStatusMap = {}
        addToolStatusMap.activateSelection = applySelectedModel;
        addToolStatusMap.selectionUpdate = selectionUpdate;
        addToolStatusMap.loadTemplate = loadTemplate;
        addToolStatusMap.root = "world";
        addToolStatusMap.folder = "model";



        let previewModel = null;
        let cursor = null;
        let editObj3d = new Object3D();
        this.statusMap = {
            selectedTool: "",
            selection: "--select--"
        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let selectedTool = "";
        let editCursors = {};
        let previewCursor = null;
        let applyOperationDiv = null;
        let toolSelectDiv = null;
        let visibleWorldModels = [];
        let locationModelDivs = [];
        let activeTool = null;
        let modelConfig = {
            "model": "",
            "pos": [0, 0, 0],
            "rot": [0, 0, 0],
            "scale": [1, 1, 1],
            "on_ground": false,
            "palette": "DEFAULT",
            "visibility": 3,
            "no_lod": true
        }

        function onClick(e) {
            console.log("Model Cursor Click", e)
        }

        function applyCursorUpdate(obj3d, elevate, grid) {
            modelConfig.grid = grid;
            modelConfig.elevate = elevate;
            MATH.vec3ToArray(obj3d.position, modelConfig.pos, 100)
            MATH.rotObj3dToArray(obj3d, modelConfig.rot, 1000);
            if (previewModel !== null) {
                previewModel.call.applyEditCursorUpdate(obj3d);
            }
        }

        function closePreviewCursor() {
            previewCursor.closeDomEditCursor();
            poolReturn(previewCursor);
            previewCursor = null;
        }


        function applySelectedModel(id) {
        //    let wMdlId = previewModel.generateModelId()
            modelConfig.no_lod = false;
            modelConfig.palette = "DEFAULT";
            modelConfig.edit_id = false;
            modelConfig.pos = [0, 0, 0];
            modelConfig.rot = [0, 0, 0];
            modelConfig.scale = [1, 1, 1];

            let newConfig = detachConfig(modelConfig);
            MATH.vec3ToArray(ThreeAPI.getCameraCursor().getLookAroundPoint(), newConfig.pos, 1);
            let newWmodel = GameAPI.worldModels.addConfigModel(newConfig, newConfig.edit_id)
            console.log("new model config:", newConfig)
            MATH.vec3FromArray(newWmodel.getPos(),  newConfig.pos);
            modelConfig.no_lod = true;
            saveWorldModelEdits(newWmodel);
        }

        function selectionUpdate(id) {

            if (id !== "") {

                if (typeof (modelConfigs[id]) === 'object') {
                    modelConfig = detachConfig(modelConfigs[id]);
                    console.log("Selected Model Config ", id, statusMap, modelConfigs)
                } else {

                }

                modelConfig.edit_id = "";
                addToolStatusMap.config = modelConfig;
            }

        }

        function loadTemplate(templateId) {
        //    console.log("loadTemplate:", templateId, addToolStatusMap);
            let pos = ThreeAPI.getCameraCursor().getLookAroundPoint();

            let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
            console.log("Selected Model Template ", templateId, loadedTemplates)
            let map = loadedTemplates[templateId];
            modelConfig = detachConfig(map.config);
            modelConfig.edit_id = generateEditId();
            MATH.vec3ToArray(pos, modelConfig.pos);

            let worldModel = new WorldModel(modelConfig)
            saveWorldModelEdits(worldModel);
            worldModel.call.worldModelLodUpdate(0);
        }



        let models = [""];
        let assets = [""];

        if (modelConfigs === null) {
            modelConfigs = {};
            listifyConfig("WORLD_LOCATIONS","LOCATION_MODELS", models, modelConfigs)
            addToolStatusMap.selectList = models;
        }

        if (assetConfigs === null) {
            assetConfigs = {};
            listifyConfig("ASSETS","MODELS", assets, assetConfigs)
        }

        function closeTool() {
            if (previewCursor !== null) {
                previewCursor.closeDomEditCursor()
                poolReturn(previewCursor);
                previewCursor = null;
            }
            if (previewModel !== null) {
                previewModel.removeLocationModels();
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
            if (tool === "_ADD") {
                applyOperationDiv.innerHTML = tool;
                applyContainerDiv.style.display = ""
            } else {
                applyContainerDiv.style.display = "none"
            }

            if (selectedTool === "ADD") {
                activeTool = poolFetch('DomEditAdd');

                let addModelInstance = function(instance) {
                    //    console.log("Load model instance: ", instance);
                    instance.getSpatial().obj3d.copy(ThreeAPI.getCameraCursor().getCursorObj3d())
                    instance.getSpatial().obj3d.position.y +=2;
                    instance.getSpatial().obj3d.scale.multiplyScalar(1)
                    instance.getSpatial().stickToObj3D(instance.getSpatial().obj3d)
                    ThreeAPI.addToScene(instance.obj3d)
                    console.log("Load model instance: ", instance, ThreeAPI.getScene());

                    let addChildModel = function(child) {
                        instance.attachInstancedModel(child);

                        console.log("Load child model: ", child, ThreeAPI.getScene());
                        /*
                        let rigObj3d = instance.obj3d.children[0];
                        let skinnedMeshes = [];
                        child.obj3d.traverse(function (node) {
                            if (node) {
                                if (node.isSkinnedMesh) {
                                    skinnedMeshes.push(node);
                                    console.log("Child SkinnedMesh:", node);

                                    //    skinnedMeshes[node.name] = node;
                                }
                            }
                        });

                        while (skinnedMeshes.length) {
                            rigObj3d.add(skinnedMeshes.pop());
                        }
                        */
                    }


                    client.dynamicMain.requestAssetInstance("f14_surfaces", addChildModel)
                    client.dynamicMain.requestAssetInstance("f14_cockpit", addChildModel)
                    client.dynamicMain.requestAssetInstance("f14_decals", addChildModel)
                    client.dynamicMain.requestAssetInstance("f14_glass", addChildModel)
                    client.dynamicMain.requestAssetInstance("f14_instrument_glass", addChildModel)
                    client.dynamicMain.requestAssetInstance("f14_lights", addChildModel)

                }
                client.dynamicMain.requestAssetInstance("f14_fuselage_rig", addModelInstance)


                let parent = new WorldModel()
                parent.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                let config = detachConfig(parent.config)
                MATH.vec3ToArray(parent.getPos(), config.pos, 1);
                config.edit_id = "tpl_"+config.edit_id
                addToolStatusMap.parent = parent;
                addToolStatusMap.config = config;
                activeTool.call.setStatusMap(addToolStatusMap)
                activeTool.initEditTool(closeTool);
            }
/*
            if (selectedTool === "LOAD_TEMPLATE") {
                activeTool = poolFetch('DomEditAdd');

                let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
                console.log("LOAD_TEMPLATE ", loadedTemplates)
                let map = loadedTemplates[id];
                modelConfig = detachConfig(map.config);

                let parent = new WorldModel()
                parent.getPos().copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
                let config = detachConfig(parent.config)
                MATH.vec3ToArray(parent.getPos(), config.pos, 1);
                config.edit_id = "tpl_"+config.edit_id
                addToolStatusMap.parent = parent;
                addToolStatusMap.config = config;
                activeTool.call.setStatusMap(addToolStatusMap)
                activeTool.initEditTool(closeTool);
            }
*/
            if (selectedTool === "CONFIG" || selectedTool === "EDIT") {
                buttonLayer = poolFetch('DomWorldButtonLayer');
                buttonLayer.initWorldButtonLayer(GameAPI.worldModels.getActiveWorldModels(), selectedTool, divClicked)
            }


            if (selectedTool === 'CLEAR_WORLD') {
                GameAPI.leaveActiveGameWorld();
                worldCleared = true;
            }

            if (selectedTool === 'REBUILD_WORLD') {

                if (worldCleared === true) {
                    GameAPI.activateWorldLevel(getPlayerStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL));
                    worldCleared = false;
                }

            }

        }
        let worldCleared = false;
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
            console.log("Model Edit Closed");
            if (activeTool !== null) {
                activeTool.closeEditTool();
                poolReturn(activeTool)
                activeTool = null;
            }
        }

        let closeEditCursor = function(htmlElem) {
            let cursor = htmlElem.cursor;
            let model = htmlElem.model;
            if (model === null) {
                return;
            }
            editCursors[model.id] = false;
            htmlElem.cursor = null;
            htmlElem.model = null;
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        let divClicked = function(e) {
            let model = e.target.value
            console.log("Activated", selectedTool, model);
            idLabelDiv.innerHTML = model.id;
            model.config = detachConfig(model.config);

            if (selectedTool === "EDIT") {
                if (typeof (editCursors[model.id]) !== 'object') {
                //    e.target.style.visibility = "hidden";
                    let cursor = poolFetch('DomEditCursor')

                    let onClick = function(crsr) {
                        console.log("Clicked Cursor", crsr)
                        closeEditCursor(crsr.htmlElement);
                        idLabelDiv.innerHTML = model.id;
                        if (activeTool === null) {
                            activeTool = poolFetch('DomEditWorldModel')
                            activeTool.call.setWorldModel(model);
                            activeTool.initDomEditWorldModel(closeActiveTool)
                        } else {
                            let mdl = activeTool.call.getWorldModel();
                            if (mdl === model) {
                                closeActiveTool();
                            } else {
                                activeTool.call.setWorldModel(model);
                            }
                        }
                    }

                    cursor.initDomEditCursor(closeEditCursor, model.obj3d, model.call.applyEditCursorUpdate, onClick);
                    if (typeof (model.config.grid) === 'number') {
                        cursor.call.setGrid(model.config.grid)
                    }
                    cursor.htmlElement.cursor = cursor;
                    cursor.htmlElement.model = model;
                    editCursors[model.id] = cursor;
                }
            }

            if (selectedTool === 'CONFIG') {
                closeActiveTool();
                activeTool = poolFetch('DomEditConfig');
                let map = {
                    id:model.id,
                    root:"model",
                    folder: GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL),
                    parent:model,
                    config:model.config,
                    onEditCB:model.call.applyLoadedConfig
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

        let close = function() {

            idLabelDiv.innerHTML = "--No Selection--";
            while (locationModelDivs.length) {
                DomUtils.removeDivElement(locationModelDivs.pop());
            }
            closeEditCursors()
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }
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

export { DomEditModel }