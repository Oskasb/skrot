import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {saveEncounterEdits} from "../../utils/ConfigUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let configData;
let grids = []

let onConfig = function(configs) {
 //   console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let gridId = configs[i].id;
        if (grids.indexOf(gridId) === -1) {
            grids.push(gridId);
        }
    }
}

setTimeout(function() {
    configData = new ConfigData("GRID", "ENCOUNTER_GRIDS",  false, false, false, onConfig)
}, 2000)



class DomEditGrid {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.encounter = null;

        this.statusMap = {

        };

        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;

        let rayTestDiv = null;



        let activeEncounterGrid = null;
        let selectGrid = null;

        let rayTestOn = false;
        function rayTest() {
            rayTestOn =! rayTestOn;
        }

        let htmlReady = function(htmlEl) {
               console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectGrid = htmlElem.call.getChildElement('grid');
            htmlElem.call.populateSelectList('grid', grids)
            rayTestDiv = htmlElem.call.getChildElement('ray_test');
            DomUtils.addClickFunction(rayTestDiv, rayTest)
            console.log("Edit encounter grid", this.encounter);
            let json = JSON.stringify(this.encounter.config);
            let config = JSON.parse(json);
            this.encounter.config = config;
            selectGrid.value = config.grid_id;
            ThreeAPI.registerPrerenderCallback(update);
        }.bind(this);

        let viewGridId = "";

        let getPos = function() {
            return this.encounter.getPos();
        }.bind(this)

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
        }

        function closeGrid() {
            viewGridId = "";
            if (activeEncounterGrid !== null) {
                activeEncounterGrid.removeEncounterGrid();
                poolReturn(activeEncounterGrid);
                activeEncounterGrid = null;
            }
        }

        let applyGridId = function(gId) {
            closeGrid()
            viewGridId = gId;
            if (viewGridId !== "") {
                this.encounter.config.grid_id = viewGridId;
                saveEncounterEdits(this.encounter);
                let loadGrid = poolFetch('EncounterGrid');
                loadGrid.initEncounterGrid(viewGridId, getPos(), gridLoaded)
            }
        }.bind(this);

        let update = function() {
            if (viewGridId !== selectGrid.value) {
                applyGridId(selectGrid.value);
            }

            if (rayTestOn) {
                if (activeEncounterGrid !== null) {
                    let tiles = activeEncounterGrid.getWalkableTiles();
                    for (let i = 0; i < tiles.length; i++) {
                        let tile = tiles[i];
                        let fits = tile.rayTestTile(true);
                    }
                }
            }

        }.bind(this);

        let close = function() {
            closeGrid()
        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    setWorldEncounter(encounter) {
        this.encounter = encounter;
    }


    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_grid', closeCb, this.statusMap, 'edit_frame edit_grid', readyCb);
    }

    closeEditTool() {
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditGrid }