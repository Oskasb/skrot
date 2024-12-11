import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {colorMapFx} from "../../../game/visuals/Colors.js";
import {filterForWalkableTiles} from "../../../game/gameworld/ScenarioUtils.js";
import {
    detachConfig,
    fetchConfigByEditId, getPopulationConfigById,
    loadSavedConfig,
    saveConfigEdits,
    saveEncounterEdits
} from "../../utils/ConfigUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {
    findFreeWalkableTile, getSpawnByTile,
    populateSpawnPatternTiles,
    populateSpawnTile
} from "../../utils/EncounterUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;
let configData;

let spawnPresentEdits = [
    "MOVE",
    "COPY",
    "REMOVE"
]

let noSpawnEdits = [
    "ADD"
]

let spawns = [];
let patterns = {}
let onConfig = function(configs) {
 //   console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let id = configs[i].id;
        if (spawns.indexOf(id) === -1) {
            spawns.push(id);
        }
        patterns[id] = configs[i].data[0].config;
    }
}

setTimeout(function() {
    configData = new ConfigData("SPAWN", "SPAWN_PATTERNS",  false, false, false, onConfig)
}, 2000)

let radiusEvent = {}

let indicateSpawnPointRadius = function(pos, radius, rgba) {
    radiusEvent.heads = 1;
    radiusEvent.speed = 24;
    radiusEvent.radius = radius;
    radiusEvent.pos = pos;
    radiusEvent.rgba = rgba || colorMapFx.GLITTER_FX
    radiusEvent.elevation = 0;
    evt.dispatch(ENUMS.Event.INDICATE_RADIUS, radiusEvent)
}


let populationList = [];
let populationConfigs = null;
function populationConfigsCB(cfg) {
    populationConfigs = cfg['actor_groups'];
    MATH.emptyArray(populationList);
    for (let i=0; i < populationConfigs.length; i++) {
        populationList.push(populationConfigs[i].id);
    }
    console.log("Population configs: ", populationList, populationConfigs)
}

class DomEditSpawns {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();
        fetchConfigByEditId('spawn_population', populationConfigsCB);
        this.encounter = null;
        let updatedActors = [];
        let encounter = null;

        this.statusMap = {
            config_id:"",
            id:""
        };
        let cursorTile = null;
        let selectedPattern = null;
        let selectedPatternId = "";
        let statusMap = this.statusMap;
        let rootElem = null;
        let htmlElem;
        let config = null;
        let activeEncounterGrid = null;
        let selectSpawnPattern = null;
        let selectActivePattern = null;
        let tileDiv = null;
        let operateButtonDiv = null;
        let populationSelect = null;
        let populationContainer = null;
        let selectedPopulation = null;

        let previewActors = [];

        let activeOperation = {
            operation:"",
            pattern:null
        }

        function removeSelectedPattern() {
            MATH.splice(config.spawn.patterns, selectedPattern);
            updatePatternAtCursor(null);
            saveEdits();
        }


        function addPatternAtTile(patternId, tile, populationId) {
            console.log("addPatternAtTile", patternId);
            let addPatternConfig = {
                pattern_id:patternId,
                tile:[tile.gridI, tile.gridJ],
                population_id:populationId
            }
            config.spawn.patterns.push(addPatternConfig);
            let pattern = getSpawnByTile(tile, config);
            updatePatternAtCursor(pattern);
            saveEdits();
        }

        function operateSelection() {
            let operation = selectActivePattern.value;

            console.log("operateSelection", [cursorTile, operation, selectedPattern, config.spawn.patterns]);

            if (operation === "ADD") {
                console.log("Add Pattern ", [cursorTile, selectedPattern]);
                addPatternAtTile(selectSpawnPattern.value, cursorTile, populationSelect.value);
            }

            if (operation === "REMOVE") {
                removeSelectedPattern()
            }

            if (operation === "COPY") {
                activeOperation.operation = operation;
                activeOperation.pattern = selectedPattern;
            }
        }

        function gridLoaded(encGrid) {
            activeEncounterGrid = encGrid;
            ThreeAPI.registerPrerenderCallback(update);
        }

        let saveTimeout;

        let saveEdits = function() {
            //    this.encounter.config = config;
            let enc = this.encounter;
            clearTimeout(saveTimeout);
            saveTimeout =  setTimeout(function() {
                saveEncounterEdits(enc);
            }, 500)

        }.bind(this);

        let configLoaded = function(cfg) {
            console.log("Config Loaded", cfg);
            if (cfg !== null) {
                config = cfg;
                this.encounter.config = config;
            }
        }.bind(this)

        let populateButton;
        let populationActive = false;
        function togglePopulate() {
            populationActive = !populationActive;
            if (populationActive) {
                populateButton.innerHTML = "DESPAWN"
                populatePreviewActors()
            } else {
                populateButton.innerHTML = "SPAWN"
                depopulatePreviewActors()
            }
        }

        let htmlReady = function(htmlEl) {
            console.log(configData)
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            selectSpawnPattern = htmlElem.call.getChildElement('spawns');
            populationContainer = htmlElem.call.getChildElement('population_container');
            populationSelect =  htmlElem.call.getChildElement('population');
            populateButton = htmlElem.call.getChildElement('populate_button');
            selectActivePattern = htmlElem.call.getChildElement('active_spawns');
            tileDiv =   htmlElem.call.getChildElement('tile_value');
            htmlElem.call.populateSelectList('population', populationList);
            htmlElem.call.populateSelectList('spawns', spawns)
            htmlElem.call.populateSelectList('active_spawns', noSpawnEdits)
            operateButtonDiv = htmlElem.call.getChildElement('operate_button');
            DomUtils.addClickFunction(operateButtonDiv, operateSelection)
            DomUtils.addClickFunction(populateButton, togglePopulate)
            console.log("Edit encounter spawns", this.encounter);
            statusMap.id = this.encounter.id;
            statusMap.config_id = statusMap.id;
            config = this.encounter.config;
        //    config = detachConfig(this.encounter.config);
        //    this.encounter.config = config;
        //    loadSavedConfig(statusMap.config_id, configLoaded);
            let loadGrid = poolFetch('EncounterGrid');
            loadGrid.initEncounterGrid(config.grid_id, getPos(), gridLoaded)
        }.bind(this);

        let getPos = function() {
            return this.encounter.getPos();
        }.bind(this)

        function closeGrid() {

            lastCursorTile = null;
            if (activeEncounterGrid !== null) {
                activeEncounterGrid.removeEncounterGrid();
                poolReturn(activeEncounterGrid);
                activeEncounterGrid = null;
            }
        }

        let lastCursorTile = null;
        let spawnerTiles = [];



        function updatePatternAtCursor(pattern) {
            if (pattern === null) {
                htmlElem.call.populateSelectList('active_spawns', noSpawnEdits)
                console.log("updatePatternAtCursor", selectSpawnPattern.value, patterns)
                selectedPattern = patterns[selectSpawnPattern.value];
                selectActivePattern.value = "ADD"
            //    populationContainer.style.display = "none";
            } else {
            //    populationContainer.style.display = "";
                htmlElem.call.populateSelectList('active_spawns', spawnPresentEdits)
                selectActivePattern.value = "REMOVE"
                selectedPattern = pattern;
            }

        }

        function updateSelectedPatternId() {
            if (cursorTile !== null) {
                let pattern = getSpawnByTile(cursorTile, config);
                if (pattern !== null) {
                    if (pattern.pattern_id === selectSpawnPattern.value && pattern.population_id === selectedPopulation) {
                        return;
                    }

                    selectedPattern = pattern;
                    removeSelectedPattern();
                    console.log("addPatternAtTile", selectSpawnPattern.value, patterns)
                    selectedPattern = patterns[selectSpawnPattern.value];
                    selectedPatternId = selectedPattern.pattern_id;
                    addPatternAtTile(selectSpawnPattern.value, cursorTile, selectedPopulation);
                }
            }
        }

        let updateActivePatterns = function() {
            MATH.emptyArray(spawnerTiles)
            populateSpawnPatternTiles(spawnerTiles, activeEncounterGrid, config)
        }

        let patternNodeTiles = [];



        function indicateTilePatternNodes(tile, nodeTiles, updatedActors, level) {

            let pattern = getSpawnByTile(tile, config)
            if (pattern === null) {
                return;
            }
            let patternId = pattern.pattern_id;
            let populationId = pattern.population_id;
        //    console.log(pattern, patterns);
            let patternConfig = patterns[patternId];
            let spawnTiles = patternConfig['spawn_tiles'];

            let popCfg = getPopulationConfigById(populationId);

            for (let i = 0; i < spawnTiles.length; i++) {
                let spawnTile = spawnTiles[i];
                let x = spawnTile[0];
                let y = spawnTile[1];
                let tiles = activeEncounterGrid.gridTiles;
                let ix = MATH.clamp(tile.gridI+x, 0, tiles.length-1);
                let jy = MATH.clamp(tile.gridJ+y, 0, tiles[ix].length-1);
                let gridTile = tiles[ix][jy];

                if (nodeTiles.indexOf(gridTile) !== -1) {
                    gridTile = findFreeWalkableTile(gridTile, tiles, nodeTiles);
                } else if (gridTile.walkable !== true) {
                    gridTile = findFreeWalkableTile(gridTile, tiles, nodeTiles);
                }

                if (gridTile === null) {
                    console.log("No Free Tile found, bad grid + spawns combo")
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tile.getPos(), color:'YELLOW', size:0.35})
                }

                if (nodeTiles.indexOf(gridTile) === -1) {
                    nodeTiles.push(gridTile);

                    populateSpawnTile(level, i, gridTile, popCfg, updatedActors);
                } else {
                    console.log("This should not happen, check it out!")
                }
            }

            for (let i = 0; i < nodeTiles.length; i++){
                let pos = nodeTiles[i].getPos();
                indicateSpawnPointRadius(pos, 0.2, colorMapFx.DAMAGE_FX)

                if (i !== 0) {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:nodeTiles[i-1].getPos(), color:'RED'});
                }
            }
        }

        function populatePreviewActors() {
            depopulatePreviewActors()
            let actors = config.spawn.actors;
            console.log("Populate preview actors:", encounter, actors, patternNodeTiles, previewActors);
            if (actors.length !== patternNodeTiles.length) {
                console.log("This should not happen, expected to be equal")
                return;
            }

            for (let i = 0; i < patternNodeTiles.length; i++) {
                let tile = patternNodeTiles[i];
                let actorTemplate = actors[i].actor;
                let pos = tile.getPos();

                function activated(a) {
                    previewActors.push(a);
                }

                function actorLoadedCB(actor) {
                    actor.activateGameActor(activated)
                }

                evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id:actorTemplate, pos:pos, callback:actorLoadedCB})
            }
        }

        function depopulatePreviewActors() {
            while (previewActors.length) {
                previewActors.pop().removeGameActor();
            }
        }


            let update = function() {
            encounter = this.encounter;
            if (activeEncounterGrid !== null) {

                if (config.spawn.patterns) {
                    updateActivePatterns();
                } else {
                    config.spawn.patterns = [];
                }

                if (selectSpawnPattern.value !== selectedPatternId || populationSelect.value !== selectedPopulation) {
                    selectedPatternId = selectSpawnPattern.value;
                    selectedPopulation = populationSelect.value;
                    updateSelectedPatternId()
                }



                if (operateButtonDiv.innerHTML !== selectActivePattern.value) {
                    operateButtonDiv.innerHTML = selectActivePattern.value;
                }

                cursorTile = activeEncounterGrid.getTileAtPosition(ThreeAPI.getCameraCursor().getPos());

                if (lastCursorTile !== cursorTile) {
                    if (lastCursorTile !== null) {
                        if (lastCursorTile.visualTile) {
                            lastCursorTile.clearPathIndication()
                        }
                    }
                    if (cursorTile.visualTile) {
                        cursorTile.indicatePath()
                        tileDiv.innerHTML = cursorTile.gridI+" | "+cursorTile.gridJ;
                        let pattern = getSpawnByTile(cursorTile, config);
                        if (pattern !== null) {
                            selectSpawnPattern.value = pattern.pattern_id;
                            populationSelect.value = pattern.population_id;
                        }
                        updatePatternAtCursor(pattern);
                    }
                    lastCursorTile = cursorTile;
                }

                let spawnActors = config.spawn.actors;
                MATH.emptyArray(patternNodeTiles);
                MATH.emptyArray(updatedActors)

                for (let i = 0; i < spawnerTiles.length; i++) {
                    let pos = spawnerTiles[i].getPos();
                    indicateSpawnPointRadius(pos, 0.5, colorMapFx.GLITTER_FX)
                    indicateTilePatternNodes(spawnerTiles[i], patternNodeTiles, updatedActors, config.level);
                }

                if (JSON.stringify(spawnActors) !== JSON.stringify(updatedActors)) {
                    config.spawn.actors = updatedActors;
                    saveEdits();
                    if (populationActive) {
                        populatePreviewActors();
                    }
                }

            }

        }.bind(this);

        let close = function() {
            depopulatePreviewActors();
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
        GameAPI.worldModels.deactivateEncounters();
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_spawns', closeCb, this.statusMap, 'edit_frame edit_spawns', readyCb);
    }

    closeEditTool() {
        GameAPI.worldModels.activateEncounters();
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditSpawns }