import {Vegetation} from "./Vegetation.js";

let vegetation = new Vegetation();
let lodCenter = null;
let skippedFrames = 0;
let updateVegetationSystem = function() {
    let tpf = GameAPI.getFrame().tpf;
    if (tpf < 0.03 + skippedFrames*0.01) {
        vegetation.updateVegetation(lodCenter)
        skippedFrames= 0;
    } else {
        skippedFrames++
    //    console.log("Slow frame, skipping vegetation update");
    }

}

class VegetationSystem {
    constructor() {

    }

    activateVegetationSystem(lodCenterVec3) {
    //    console.log("activateVegetationSystem")
        lodCenter = lodCenterVec3;
        let vegReadyCB = function() {
            ThreeAPI.addPostrenderCallback(updateVegetationSystem)
        }

        vegetation.initVegetation(vegReadyCB);

    }

    processGroundDataUpdate() {

        vegetation.resetVegetationGrids()
    }

    getVegetation() {
        return vegetation;
    }

}

export {VegetationSystem}