import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../../libs/three/math/Quaternion.js";
import {LocationModel} from "../../../game/gameworld/LocationModel.js";

let assetConfigs = null;
let assets = [""];
let tempVec = new Vector3();
let tempObj = new Object3D();
let tempQuat = new Quaternion();
let axisRot = ['X', 'Y', 'Z']

let edits = ["NEW", "MODIFY", "DUPES","QUANTIZE"]
let editList = [""];

let quantizeOptions = ["", "ELEVATION", "ROT", "POS_XZ"]

let editPalette = 'ITEMS_MONO';

let locationModelConfigTemplate = {
    "asset": "",
    "pos": [0, 0, 0],
    "rot": [0, 0, 0],
    "scale": [0.01, 0.01, 0.01],
    "solidity": 1.0,
    "visibility": 3,
    "boxes": []
}
class DomEditAttach {
    constructor() {

        if (assetConfigs === null) {
            let onConfig = function(configs) {
                console.log(configs)
                for (let key in configs) {
                    let id = configs[key].id
                    if (assets.indexOf(id) === -1) {
                        let cfg = configs[key].config;
                        let matId = cfg.material;
                        if (matId === "mat_instancing_basic" || matId === "mat_instancing_simple") {
                            assets.push(id)
                        }
                    } else {
                        console.log("entry already added, not right", id);
                    }
                }
            }
            new ConfigData("ASSETS","MODELS",  false, false, false, onConfig)
        }

        let initScaleVec3 = new Vector3();
        let targetScaleVec3 = new Vector3()
        let lastScaleVec3 = new Vector3();
        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let changeModelContainer = null;
        let changeModelSelection = null;
        let selectList = null;
        let editSelect = null;
        let addButtonDiv = null;
        let cursorObj3d = new Object3D();
        let modelCursor = null;
        let configEdit = null;
        let rotateAxisDiv = null;

        let selectionId = "";
        let editTarget = null;
        let activeEdit = null;
        let changeToModel = null;

        let lastGrid = 0;
        let lastSaveString = "";
        let lastSaveTime = 0;
        function autoSaveEdits() {
            let testSave;
            if (editTarget !== null) {
                testSave = JSON.stringify(editTarget.config);
            } else {
                testSave = JSON.stringify(statusMap.parent.config);
            }

            if (testSave !== lastSaveString) {
                saveEdits();
            }
        }

        function getLocModelByEditId(editId) {
            let models = statusMap.parent.locationModels;
                for (let i = 0; i < models.length; i++ ) {
                    if (models[i].config.edit_id === editId) {
                        return models[i];
                    }
                }
        }

        let applyTimeout;

        function saveEditTarget() {
            if (assets.indexOf(editTarget.config.asset) === -1) {
                console.log("Bad config save ", statusMap, editTarget)
                return;
            }

            if (! editTarget.config.paletteKey || editTarget.config.paletteKey === editPalette) {
                editTarget.call.setPaletteKey('DEFAULT');
                editTarget.config.paletteKey = 'DEFAULT';
            }

            if (!statusMap.parent.config.assets) {
                statusMap.parent.config.assets = [];
            }
            let cAssets = statusMap.parent.config.assets;

            let add = true;
            for (let i = 0; i < cAssets.length; i++ ) {
                if (cAssets[i].edit_id === editTarget.config.edit_id) {
                    cAssets[i] = editTarget.config;
                    add = false;
                }
            }
            if (add === true) {
                editTarget.config.edit_id = "";
                editTarget.config = detachConfig(editTarget.config)
                initConfigEdit(editTarget.config)
                cAssets.push(editTarget.config)
            }
        }

        function saveEdits() {
            lastSaveTime = GameAPI.getGameTime();
            if (editTarget !== null) {
                saveEditTarget();
                lastSaveString = JSON.stringify(editTarget.config)
            } else {
                lastSaveString = JSON.stringify(statusMap.parent.config)
            }

            saveWorldModelEdits(statusMap.parent);

            clearTimeout(applyTimeout)
            applyTimeout = setTimeout(function() {
                statusMap.parent.call.applyLoadedConfig(statusMap.parent.config)
            }, 2000)


        }

        function setEditTarget(t) {
            editTarget = t;
            editTarget.config = detachConfig(editTarget.config);


            let cAssets = statusMap.parent.config.assets;
            if (cAssets) {
                for (let i = 0; i < cAssets.length; i++ ) {
                    if (cAssets[i].edit_id === editTarget.config.edit_id) {
                        cAssets[i] = editTarget.config;
                    }
                }
            }

            statusMap.config = editTarget.config;
            changeModelSelection.value = editTarget.config.asset;
            saveEdits();
            initConfigEdit(editTarget.config)
        }
        let closeCursorCB = function() {

        }

        let closeCursor = function() {



            if (modelCursor !== null) { // this gets called twice sometimes
                let crsr = modelCursor;
                modelCursor = null;
                crsr.closeDomEditCursor();
                poolReturn(crsr);

            }

        }


        let attachTool = this;
        function applyOperateButton(x) {
            console.log("Apply applyOperateButton: ", x);
            //  statusMap.activateSelection(selectionId);
            let cAssets = statusMap.parent.config.assets;
            if (activeEdit === 'NEW') {

                if (selectionId === "") {
                    console.log("Setup template handling here...", statusMap)

                    let templateEdit = poolFetch('DomEditTemplate')
                    let config = detachConfig(statusMap.parent.config)
                    config.edit_id = "tpl_"+statusMap.parent.config.edit_id
                    let map = {
                        id:statusMap.parent.id,
                        parent:statusMap.parent,
                        onLoad:statusMap.onLoad,
                        config:config,
                        root:"world",
                        folder:"model"
                    }

                    let closeTmpl = function() {
                        poolReturn(templateEdit);
                    }

                    ThreeAPI.getCameraCursor().getLookAroundPoint().copy(statusMap.parent.getPos())

                    templateEdit.initEditTool(closeTmpl, map)
                    attachTool.closeEditTool();
                    return;
                } else {
                    console.log("Add model again...")
                    selectionId = '';
                }

            }

            if (activeEdit === 'MODIFY') {

                if (pointerSelection !== null) {
                    console.log("Select from pointer", pointerSelection);
               //     selectionId = pointerSelection.config.edit_id;
                    selectList.value = pointerSelection.config.edit_id;
                    pointerSelection = null;
                //    selectionId = pointerSelection.config.edit_id;
                    return;
                }

                let remove = null;
                for (let i = 0; i < cAssets.length; i++ ) {
                    if (cAssets[i].edit_id === editTarget.config.edit_id) {
                        remove = cAssets[i];
                    }
                }
                if (remove !== null) {
                    MATH.splice(cAssets, remove);
                    editTarget.removeLocationModel();
                    editTarget = null;
                    console.log("Remaining model configs ", cAssets)
                    saveWorldModelEdits(statusMap.parent);
                    editSelect.value = 'NEW';
                }
            }

            if (activeEdit === 'QUANTIZE') {
                applyQuantize(selectList.value);
                editSelect.value = 'MODIFY';
            }

            //     }
        }
        function applyEdit(edit) {
            console.log("Apply Edit: ", edit);
          //  statusMap.activateSelection(selectionId);
        }

        function onCursorUpdate(obj3d, grid) {

            if (modelCursor !== null) {
                lastGrid = grid;
                editTarget.config.grid = grid;
                let origin = statusMap.parent.getPos();
                tempObj.position.copy(origin);
                tempObj.lookAt(obj3d.position);
                let distance = MATH.distanceBetween(origin, obj3d.position);
                tempVec.set(0, 0, distance);
                tempQuat.copy(statusMap.parent.obj3d.quaternion);
                tempQuat.normalize()
                tempQuat.invert();
                tempObj.quaternion.premultiply(tempQuat);
                tempVec.applyQuaternion(tempObj.quaternion)
                MATH.vec3ToArray(tempVec, editTarget.config.pos, 100);
                let inputRot = obj3d.rotation.y;
                let axis = statusMap.axis;

                MATH.rotObj3dToArray(obj3d, editTarget.config.rot, 100)

                // editTarget.config.rot[axisRot.indexOf(axis)] = MATH.decimalify(inputRot, 100);
            //    MATH.rotObj3dToArray(obj3d, editTarget.config.rot, 100);

                if (MATH.distanceBetween(lastScaleVec3, obj3d.scale) !== 0) {
                    tempVec.copy(obj3d.scale);
                    tempVec.multiply(initScaleVec3);
                    if (MATH.distanceBetween(targetScaleVec3, tempVec) < 0.001) {
                        initScaleVec3.copy(tempVec);
                    } else {
                        if (tempVec.length() > 0.001) {
                            MATH.vec3ToArray(tempVec, editTarget.config.scale, 1000)
                            targetScaleVec3.copy(tempVec);
                        }
                    }
                    lastScaleVec3.copy(obj3d.scale);
                }

                editTarget.hierarchyUpdated();

            }
        }


        function applyQuantize(quantizeSetting) {

            let locationModels = statusMap.parent.locationModels;
            for (let i = 0; i < locationModels.length; i++) {
                editTarget = locationModels[i];
                let pos = editTarget.getPos()

                MATH.vec3FromArray(pos, editTarget.config.pos);
                let res = 1;
            //    editTarget.config.grid = res;
                if (quantizeSetting === 'POS_XZ') {
                    res = 0.5;
                    MATH.decimalifyVec3(pos, res);
                    MATH.vec3ToArray(pos, editTarget.config.pos);
                }

                if (quantizeSetting === 'ELEVATION') {
                    pos.y = MATH.decimalify(pos.y, res);
                    editTarget.config.pos[1] = pos.y;
                }

                if (quantizeSetting === 'ROT') {

                    tempObj.position.set(0, 0, 0);
                    tempVec.set(0, 0, MATH.curveSqrt(res)*0.72);
                    MATH.rotXYZFromArray(editTarget.obj3d, editTarget.config.rot)
                    tempVec.applyQuaternion(editTarget.obj3d.quaternion);
                    MATH.decimalifyVec3(tempVec, res);
                    tempObj.lookAt(tempVec);
                    //    editTargeteditTarget.obj3d.quaternion.copy(tempObj.quaternion);

                    MATH.rotObj3dToArray(tempObj,  editTarget.config.rot)
                    editTarget.obj3d.quaternion.copy(tempObj.quaternion);
                }

                editTarget.hierarchyUpdated();
                saveEditTarget()
            }
            editTarget = null;
            saveEdits();
        }


        function onCursorClick(val) {

        }

        function closeConfigEdit() {
            if (configEdit !== null) {
                poolReturn(configEdit);
                configEdit.closeEditTool();
                configEdit = null;
            }
        }

        function attachFunction(selectionId, callback) {
            console.log("Attach func: ", selectionId);
            let config = detachConfig(locationModelConfigTemplate);
            if (config.edit_id !== selectionId) {
                config.asset = selectionId;
                config.paletteKey = editPalette;
            }

            setEditTarget(new LocationModel(statusMap.parent.obj3d, config))
            editTarget.call.lodUpdated(0);
            callback(config);
        }

        function initModelCursor() {

            if (modelCursor !== null) {
                modelCursor.call.setGrid(editTarget.config.grid || lastGrid);
            //    modelCursor.statusMap.offsetElevate = editTarget.config.pos[1];
                //          modelCursor.statusMap.applyElevate = editTarget.config.pos[1];
            } else  {
            //    closeCursor()
                modelCursor = poolFetch('DomEditCursor');

                function closeModelCursor() {
                    if (modelCursor !== null) {
                        modelCursor.closeDomEditCursor();
                        poolReturn(modelCursor);
                        modelCursor = null;

                        if (activeEdit === 'MODIFY') {
                            selectList.value = "";
                            pointerSelection = null;
                        }

                    }
                    closeConfigEdit();
                }

                modelCursor.initDomEditCursor(closeModelCursor, cursorObj3d, onCursorUpdate, onCursorClick)
            //    modelCursor.statusMap.offsetElevate = editTarget.config.pos[1];
              modelCursor.statusMap.applyElevate = editTarget.config.pos[1];
                modelCursor.call.setGrid(editTarget.config.grid);
            }

        }



        function initConfigEdit(config) {
            closeConfigEdit()
            configEdit = poolFetch('DomEditConfig');
            let map = {
                id:selectionId,
                root:statusMap.root,
                folder:statusMap.folder,
                parent:statusMap.parent,
                config:config,
                onEditCB:applyEdit
            }
            configEdit.initEditTool(closeConfigEdit, map);
        }

        function selectionUpdate(selectionId) {

            if (selectionId === "") {
                closeCursor()
            } else {
                function attachCallback(config) {
                    MATH.vec3FromArray(initScaleVec3, config.scale);
                    initModelCursor()

                }

                attachFunction(selectionId, attachCallback);
            }
        }

        function editSelectedLocationModel() {
            let config = editTarget.config;
            MATH.vec3FromArray(initScaleVec3, config.scale)
            initModelCursor()

            initConfigEdit(config);
        }

        let htmlReady = function(htmlEl) {
            selectionId = "";
            editTarget = null;
            activeEdit = null;
            changeToModel = null;

            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            rootElem = htmlEl.call.getRootElement();

            let parentConfig = statusMap.parent.config;
            rotateAxisDiv = htmlElem.call.getChildElement('rotate_container');
            editSelect = htmlElem.call.getChildElement('edit');
            htmlElem.call.populateSelectList('edit', edits)

            statusMap.axis = "Y";
            let axisSelect = htmlElem.call.getChildElement('axis');
            htmlElem.call.populateSelectList('axis', axisRot)
            axisSelect.value = statusMap.axis;
            selectList = htmlElem.call.getChildElement('select_list');
            htmlElem.call.populateSelectList('select_list', editList)
            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
            changeModelSelection = htmlElem.call.getChildElement('model_list');
            changeToModel = changeModelSelection.value;
            changeModelContainer = htmlElem.call.getChildElement('model_container');
            htmlElem.call.populateSelectList('model_list', assets);
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            DomUtils.addClickFunction(addButtonDiv, applyOperateButton)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);

        function applyEditMode(mode) {
            MATH.emptyArray(editList)
            if (mode === 'NEW') {


                MATH.copyArrayValues(assets, editList)
                htmlElem.call.populateSelectList('select_list', editList)
                changeModelContainer.style.display = 'none';
            } else if (mode === 'MODIFY') {
                let cAssets = statusMap.parent.config.assets;
                if (!cAssets) {
                    editSelect.value = 'NEW';
                } else if (cAssets.length === 0) {
                    editSelect.value = 'NEW';
                } else {
                    addButtonDiv.innerHTML = "REMOVE"
                    editList.push("");
                    for (let i = 0;i < cAssets.length; i++) {
                        editList.push(cAssets[i].edit_id);
                        htmlElem.call.populateSelectList('select_list', editList)
                    }
                }
            } else if (mode === 'QUANTIZE') {
                htmlElem.call.populateSelectList('select_list', quantizeOptions);
            }
        }

        let applySelection = function(id) {
            selectionId = id;

            let model = getLocModelByEditId(selectionId)

        //    applyContainerDiv.style.display = '';

            if (selectionId === '') {
                rotateAxisDiv.style.display = 'none'
            } else {
                rotateAxisDiv.style.display = ''
            }

            if (model) {
                console.log("model Selection Update ", id);
                changeModelContainer.style.display = ""
                console.log("Set Edit Target ", selectionId);
                setEditTarget( getLocModelByEditId(selectionId))
                console.log( editTarget)
                ThreeAPI.getCameraCursor().getLookAroundPoint().copy(editTarget.getPos())
                editSelectedLocationModel()
            } else {
                console.log("Selection Update ", id);
                selectionUpdate(selectionId);
            }

        };

        let lastCursorPos = new Vector3();
        let pointerSelection = null;

        function updateModifyCursor() {
            let cursorPos = ThreeAPI.getCameraCursor().getLookAroundPoint();

            if (pointerSelection !== null) {
                if (MATH.distanceBetween(cursorPos, lastCursorPos) === 0) {
                    pointerSelection.call.renderDebugAAB(true);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pointerSelection.getPos(), color:'GREEN', size:0.5})
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: pointerSelection.getPos(), to:cursorPos , color:'GREEN'})
                    return;
                }
            }

            pointerSelection = null;
            lastCursorPos.copy(cursorPos);

            let cursorScreenPos = ThreeAPI.toScreenPosition(cursorPos, tempVec);
            let locationModels = statusMap.parent.locationModels;
            let nearestDist = MATH.bigSafeValue();
            let selection = null;
            for (let i = 0; i < locationModels.length; i++) {
                let pos = locationModels[i].getPos()
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: pos, to:cursorPos , color:'BLUE'})
                let screenPos = ThreeAPI.toScreenPosition(pos);
                let dist = screenPos.distanceToSquared(cursorScreenPos);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    selection = locationModels[i];
                }
            }

            if (selection === null) {
                console.log("No model found")
                return;
            }
            pointerSelection = selection;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pointerSelection.getPos(), color:'GREEN', size:0.4})
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: pointerSelection.getPos(), to:cursorPos , color:'GREEN'})

        }

        let points = [];
        let dupes = []

        function showDupes() {
            let cursorPos = ThreeAPI.getCameraCursor().getLookAroundPoint();
            MATH.emptyArray(points);
            MATH.emptyArray(dupes);
            let locationModels = statusMap.parent.locationModels;

            for (let i = 0; i < locationModels.length; i++) {
                let pos = locationModels[i].getPos()

                for (let j = 0; j < points.length; j++) {
                    if (pos.distanceToSquared(points[j]) === 0) {
                        dupes.push(locationModels[i]);
                    }
                }
                points.push(pos);
            }

            for (let i = 0; i < dupes.length; i++) {
                let pos = dupes[i].getPos();
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: pos, to:cursorPos , color:'PURPLE'})
            }
        }


        function modifyChangeModel() {
    //        statusMap.config.model = changeToModel;
            editTarget.call.setAssetId(changeToModel);
        }

        let update = function() {
            cursorObj3d.position.copy(ThreeAPI.getCameraCursor().getLookAroundPoint());

            if (activeEdit !== editSelect.value) {
                applyEditMode(editSelect.value);
                activeEdit = editSelect.value;
            }

            if (modelCursor !== null) {
                modelCursor.call.setPos(cursorObj3d.position);
                ThreeAPI.getCameraCursor().getLookAroundPoint().add(modelCursor.call.getUpdateObj().position)
            }

            if (changeToModel !== changeModelSelection.value) {
                if (changeToModel !== '') {
                    changeToModel = changeModelSelection.value
                    console.log("Change To Model: ", changeToModel);
                    modifyChangeModel();
                }
            }

            if (selectionId !== selectList.value) {
                applySelection(selectList.value);
            }

            if (lastSaveTime < GameAPI.getGameTime() - 1) {
                autoSaveEdits();
            }

            if (activeEdit === 'NEW') {
                let str = 'ADD'
                if (selectionId === "") {
                    str = "TEMPLATE"
                }
                if (addButtonDiv.innerHTML !== str) {
                    addButtonDiv.innerHTML = str
                }
                if (applyContainerDiv.style.display !== '') {
                    applyContainerDiv.style.display = '';
                }

            }

            if (activeEdit === 'MODIFY') {
                if (selectionId === "") {

                    updateModifyCursor()
                    if (pointerSelection !== null) {
                        applyContainerDiv.style.display = '';
                        if (addButtonDiv.innerHTML !== 'SELECT') {
                            addButtonDiv.innerHTML = 'SELECT'
                        }
                    } else {
                        applyContainerDiv.style.display = 'none';
                    }

                } else {
                    if (modelCursor === null) {
                        selectionId = "";
                        editTarget = null;
                        return;
                    }
                    applyContainerDiv.style.display = '';
                    if (addButtonDiv.innerHTML !== 'REMOVE') {
                        addButtonDiv.innerHTML = 'REMOVE'
                    }
                }
            }

            if (activeEdit === 'QUANTIZE') {
                if (selectionId === "") {
                    applyContainerDiv.style.display = 'none';
                } else {
                    if (addButtonDiv.innerHTML !== 'APPLY') {
                        applyContainerDiv.style.display = '';
                        addButtonDiv.innerHTML = 'APPLY'
                    }
                }
            }

            if (activeEdit === 'DUPES') {
                showDupes()
                applyContainerDiv.style.display = '';
                if (addButtonDiv.innerHTML !== 'PRUNE') {
                    addButtonDiv.innerHTML = 'PRUNE'
                }
            }


        };

        let close = function() {
            saveEdits();
            closeCursor();
            closeConfigEdit();
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }
    }

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_attach', closeCb, statusMap, 'edit_frame edit_attach', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        if (!this.htmlElement) { // sometimes called twice
            console.log("Element already removed")
        } else {
            poolReturn(this.htmlElement);
        }
        this.htmlElement = null;
    }

}

export { DomEditAttach }