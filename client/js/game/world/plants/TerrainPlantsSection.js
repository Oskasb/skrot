import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";

class TerrainPlantsSection {
    constructor() {

        let pantsConfig = null;


        function processPlantsConfig() {

        }


        function setConfig(json) {
            pantsConfig = json;
            processPlantsConfig()
        }

        function removeSector() {

        }


        function unregisterCallbacks() {
            removeSector()
            unregisterGroundLodCallback(indexPos, lodUpdated)
            sectionInfo.isActive = false;
        }

        function activateBox(lodBox, configFileName) {
            unregisterCallbacks()
            //    console.log("activateBox", indexPos.x, indexPos.y, lodBox.indexPos.x, lodBox.indexPos.y)
            indexPos.copy(lodBox.indexPos);
            box.copy(lodBox.box);
            jsonAsset(configFileName, setConfig)
        }

        this.call = {
            unregisterCallbacks:unregisterCallbacks,
            activateBox:activateBox
        }

    }
}

export { TerrainPlantsSection}