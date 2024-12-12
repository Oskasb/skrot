import {TerrainElement} from "./TerrainElement.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let calcVec = new Vector3()


function levelSpaceFree(pos, elements) {
    for (let i = 0; i < elements.length; i++) {
        let elemPos = elements[i].getPos();
        if (Math.abs(pos.x - elemPos.x) < 2) {
            if (Math.abs(pos.z - elemPos.z) < 2) {
                return false;
            }
        }
    }
    return true;
}

function checkSpaceIsFree(pos, lodLevels) {

    for (let i = 0; i < lodLevels.length; i++) {
        if (lodLevels[i]) {
            let levelClear = levelSpaceFree(pos, lodLevels[i])
            if (levelClear === false) {
                return false;
            }
        }
    }
    return true;
}



function attachGroundElement(sectionInfo, lodLevel, groundElements, size, xElems, yElems, xFrac, yFrac, i, j) {

    sectionInfo.elementCount++
    let seed = MATH.remainder( (lodLevel+sectionInfo.minExtents.x) * 0.001 + (i+j+sectionInfo.minExtents.x)*0.1 + sectionInfo.minExtents.z*sectionInfo.minExtents.z*0.0001)+sectionInfo.elementCount*0.01
    calcVec.x = sectionInfo.minExtents.x + xFrac*size + 1*MATH.sillyRandom(seed)*(size-5)/xElems;
    calcVec.z = sectionInfo.minExtents.z + yFrac*size + 1*MATH.sillyRandom(seed+0.3+lodLevel*0.1)*(size-5)/yElems;
    let terrainElement = new TerrainElement(lodLevel);
    let spaceOk = checkSpaceIsFree(calcVec, sectionInfo.lodLevels)

    if (spaceOk === true) {
        let posY = terrainElement.setTerrainElementPosition(calcVec);
        groundElements.push(terrainElement);
        sectionInfo.terrainGeometry.registerContainsHeight(posY);
    } else {
    //    console.log("Retry")
        attachGroundElement(sectionInfo, lodLevel, groundElements, size, xElems, yElems, xFrac, yFrac, i, j)
    }

}

class TerrainSectionInfo {
    constructor(terrainGeo, sectionInfoConfig) {
        this.terrainGeometry = terrainGeo;
        this.lodConfig = sectionInfoConfig['lod_levels'];
        this.lodLevels = [];
        this.minLodLevel = -1;
        this.minY = -MATH.bigSafeValue();
        this.maxY = MATH.bigSafeValue();
        this.minExtents = new THREE.Vector3();
        this.maxExtents = new THREE.Vector3();
        this.physicsActive = false
        this.elementCount = 0;
    }


    setupLodLevelGrid(lodLevel, grid) {
        let groundElements = [];
        this.lodLevels[lodLevel] = groundElements;

        this.terrainGeometry.getExtentsMinMax(this.minExtents, this.maxExtents);
        this.minExtents.y = this.minY;
        this.maxExtents.y = this.maxY;
        let size = this.terrainGeometry.size;
        let xElems = grid[0]
        let yElems = grid[1]

        for (let i = 0; i < xElems; i++) {
            let xFrac = MATH.calcFraction(0, xElems, i);

            for (let j = 0; j < yElems; j++) {
                let yFrac = MATH.calcFraction(0, yElems, j);
                attachGroundElement(this, lodLevel, groundElements, size, xElems, yElems, xFrac, yFrac, i, j)

            }
        }
    }

    updateLodLevel(lodLevel) {
        if (this.lodLevels.indexOf(lodLevel) === -1) {
            this.lodLevels[lodLevel] = [];
            let lodLevelCfg = this.lodConfig[lodLevel]
            let lodGrid = lodLevelCfg['grid'];
            this.setupLodLevelGrid(lodLevel, lodGrid);
        }
    }

    applyLodLevel(lodLevel, maxLodLevel) {
        if (lodLevel !== -1) {
            for (let i = lodLevel; i < maxLodLevel; i++) {
                if (!this.lodLevels[i]) {
                    this.updateLodLevel(i)
                }
            }
        }
    }

    getLodLevelGroundElements(lodLevel) {
        return this.lodLevels[lodLevel];
    }

    getAllGroundElements() {
        return this.lodLevels;
    }


    activateTerrainSectionPhysics() {
        for (let i = 0; i < this.lodLevels.length; i++) {
            let level = this.lodLevels[i];
            if (level) {
                for (let j = 0; j < level.length; j++) {
                    let terrainElem = level[j];
                    if (terrainElem.assetId) {
                        terrainElem.activateElementPhysics()
                    }
                }
            }
        }
        this.physicsActive = true;
    }

    deactivateTerrainSectionPhysics() {
        for (let i = 0; i < this.lodLevels.length; i++) {
            let level = this.lodLevels[i];
            if (level) {
                for (let j = 0; j < level.length; j++) {
                    let terrainElem = level[j];
                    if (terrainElem.assetId) {
                        terrainElem.deactivateElementPhysics()
                    }
                }
            }
        }
        this.physicsActive = false;
    }

    deactivateTerrainSection() {
        this.deactivateTerrainSectionPhysics();
        this.elementCount = 0;

        while (this.lodLevels.length) {
            let level = this.lodLevels.pop();
            if (level) {
                while (level.length) {
                    let elem = level.pop();
                }
            }

        }

    }

}

export { TerrainSectionInfo }