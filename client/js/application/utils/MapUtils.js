import {ENUMS} from "../ENUMS.js";
import {getGroundDataArray, getHeightmapData, getTerrainParams} from "../../3d/three/terrain/ComputeTerrain.js";


function saveBufferAsPng(buffer, filenmae) {
    let side = Math.sqrt(buffer.length/4)
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    let context = canvas.getContext('2d');
    let imgData = new ImageData(buffer, side, side);
    context.putImageData(imgData, 0, 0);

    //     let png = context.canvas.toDataURL( 'image/png' );
    //     window.open(png);

    let png = canvas.toDataURL( 'image/png' )
    let link = document.createElement('a');
    link.download = filenmae;
    link.href = png;
    link.click();
}

function generateActiveWorldMap() {

    console.log("generateActiveWorldMap")

    let heightData = getHeightmapData();
    let groundData = getGroundDataArray();
    let mapWorker = new Worker("/client/js/application/utils/WorldMapGeneratorWorker.js", { type: "module" });

    let tParams = getTerrainParams();

    let worldLevel =  "20";


    mapWorker.onmessage = function(msg) {
        console.log("Map Worker Msg ", msg)
        if (msg.data === "Loaded") {
            mapWorker.postMessage({worldLevel: worldLevel, minHeight:tParams.minHeight, maxHeight:tParams.maxHeight, heightData:heightData, groundData:groundData})
        } else {
            console.log("Result: ", msg.data);
            let buffer = msg.data.buffer;
            let worldLevel = msg.data.worldLevel;

            saveBufferAsPng(buffer, 'worldmap_w01_'+worldLevel+'.png')

            let groundData = msg.data.groundData;
            saveBufferAsPng(groundData, 'terrainmap_w01_'+worldLevel+'.png')

            mapWorker.terminate();
        }
    }
}

export { generateActiveWorldMap }