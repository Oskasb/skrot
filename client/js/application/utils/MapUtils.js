import {ENUMS} from "../ENUMS.js";


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

    let threeTerrain = ThreeAPI.getTerrainSystem().getTerrain();
    let bigGeo = threeTerrain.call.getTerrainBigGeo();
    let heightData = bigGeo.getHeightmapData();
    let groundData = bigGeo.getGroundData();
    let mapWorker = new Worker("client/js/application/utils/WorldMapGeneratorWorker.js", { type: "module" });

    let worldLevel =  GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)



    mapWorker.onmessage = function(msg) {
        console.log("Map Worker Msg ", msg)
        if (msg.data === "Loaded") {
            mapWorker.postMessage({worldLevel: worldLevel, minHeight:-3, maxHeight:97, heightData:heightData, groundData:groundData})
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