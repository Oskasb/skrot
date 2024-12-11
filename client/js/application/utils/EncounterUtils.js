import {filterForWalkableTiles} from "../../game/gameworld/ScenarioUtils.js";
import {getPopulationConfigById} from "./ConfigUtils.js";
import {ENUMS} from "../ENUMS.js";
import {colorMapFx} from "../../game/visuals/Colors.js";
import {ConfigData} from "./ConfigData.js";

let patterns = {}
let onConfig = function(configs) {
    //   console.log(configs)
    for (let i = 0; i < configs.length; i++) {
        let id = configs[i].id;
        patterns[id] = configs[i].data[0].config;
    }
}

setTimeout(function() {
    new ConfigData("SPAWN", "SPAWN_PATTERNS",  false, false, false, onConfig)
}, 2000)

function getConfigListByLevel(cfg, lvl) {
    let levels = cfg.levels;

    for (let i = 0; i < levels.length; i++) {
        let level = levels[i];
        if (MATH.valueIsBetween(lvl, level.min, level.max)) {
            return level
        }
    }

    return levels[levels.length - 1];
}

function populateSpawnTile(level, spawnIndex, gridTile, populationConfig, actorStore) {

    let levelCfg = populationConfig;
    if (populationConfig.levels) {
        levelCfg = getConfigListByLevel(populationConfig, level);
    }

    let list = levelCfg['followers'];
    if (spawnIndex === 0) {
        list = levelCfg['leaders'];
    }
    let actorId = MATH.getSillyRandomArrayEntry(list, gridTile.gridI+gridTile.gridJ);

    let entry = {
        actor: actorId,
        rot: [0, 0, 0],
        on_ground: true,
        tile:[gridTile.gridI, gridTile.gridJ]
    }

    actorStore.push(entry);

}

function findFreeWalkableTile(conflictTile, gridTiles, occupiedTiles) {
    let i = conflictTile.gridI;
    let j = conflictTile.gridJ;
    let walkableTiles = filterForWalkableTiles(gridTiles);
    let testCount = walkableTiles.length - occupiedTiles.length;
    if (testCount < 1) {
        console.log("All tiles Taken... bigger grid or less spawns to fix");
        return null;
    }

    let minDist = 99999;
    let foundTile = null;
    while (walkableTiles.length) {
        let candidate = walkableTiles.pop();
        if (occupiedTiles.indexOf(candidate) === -1) {
            let distance = MATH.distanceBetween(candidate.getPos(), conflictTile.getPos());
            if (distance < minDist) {
                foundTile = candidate;
                minDist = distance;
            }
        }
    }

    return foundTile;

}

function populateSpawnPatternTiles(spawnerTiles, encounterGrid, encounterConfig) {

    let patterns = encounterConfig.spawn.patterns;
    for (let i = 0; i < patterns.length; i++) {
        let gridTiles = encounterGrid.gridTiles
        let gridI = MATH.clamp(patterns[i].tile[0], 0, gridTiles.length-1);
        let gridJ = MATH.clamp(patterns[i].tile[1], 0, gridTiles[gridI].length-1);
        let tile = gridTiles[gridI][gridJ];
        if (spawnerTiles.indexOf(tile) === -1) {
            spawnerTiles.push(tile)
        } else {
            tile = findFreeWalkableTile(tile, gridTiles, spawnerTiles);
            spawnerTiles.push(tile)
        }
    }
}

function getSpawnByTile(tile, encounterConfig) {
    let patterns = encounterConfig.spawn.patterns;
    for (let i = 0; i < patterns.length; i++) {
        let gridI = patterns[i].tile[0];
        let gridJ = patterns[i].tile[1];
        if (tile.gridI === gridI && tile.gridJ === gridJ) {
            return patterns[i]
        }
    }
    return null;
}

function indicateTilePatternNodes(encounterGrid, tile, nodeTiles, updatedActors, encounterConfig) {

    let level = encounterConfig.level;
    let pattern = getSpawnByTile(tile, encounterConfig)
    if (pattern === null) {
        console.log("No pattern found for tile")
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
        let tiles = encounterGrid.gridTiles;
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

}

function populatePreviewActors(configList, patternNodeTiles, actorStore) {

        let actors = configList;

        if (actors.length !== patternNodeTiles.length) {
            console.log("This should not happen, expected to be equal")
            return;
        }

        for (let i = 0; i < patternNodeTiles.length; i++) {
            let tile = patternNodeTiles[i];
            let actorTemplate = actors[i].actor;
            let pos = tile.getPos();

            function activated(a) {
                actorStore.push(a);
            }

            function actorLoadedCB(actor) {
                actor.activateGameActor(activated)
            }

            evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id:actorTemplate, pos:pos, callback:actorLoadedCB})
        }

}

function depopulateActorList(actors) {
    while (actors.length) {
        actors.pop().removeGameActor();
    }
}

export {
    populateSpawnTile,
    findFreeWalkableTile,
    getSpawnByTile,
    populateSpawnPatternTiles,
    indicateTilePatternNodes,
    populatePreviewActors,
    depopulateActorList
};