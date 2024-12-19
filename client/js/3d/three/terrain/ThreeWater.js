import {getGameTime} from "../../../application/utils/DataUtils.js";
import {WaterMesh} from "../../../../../libs/jsm/objects/WaterMesh.js";
import {PlaneGeometry} from "../../../../../libs/three/geometries/PlaneGeometry.js";
import {Color, RepeatWrapping, TextureLoader, Vector3} from "../../../../../libs/three/Three.Core.js";

class ThreeWater {
    constructor() {

        let statusMap = {}

        let multiplyColor = new Color(0.1, 0.2, 0.5)

        const waterGeometry = new PlaneGeometry(50000, 50000)

        const waterNormals = new TextureLoader().load( '../data/assets/images/textures/tiles/waternormals3.png' );
        waterNormals.wrapS = waterNormals.wrapT = RepeatWrapping;

        let water = new WaterMesh(
            waterGeometry,
            {
                waterNormals: waterNormals,
                sunDirection: new Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7
            }
        );

        water.rotation.x = - Math.PI / 2;

    //    ThreeAPI.addToScene(water);


        function update() {
            let time = getGameTime();
            water.sunDirection.value.copy( statusMap.sun.position ).normalize();
            water.sunColor.value.copy( statusMap.sun.color );
            water.sunColor.value.multiplyScalar(0.6)
            water.sunDirection.value.multiplyScalar(-1)
            water.waterColor.value.copy( statusMap.ambientColor );
            water.waterColor.value.multiply(multiplyColor)
        //    water.waterColor.value.multiplyScalar(0)
        }

        function initWater(env) {
            statusMap.sun = env.world.sun;
            statusMap.fog = env.world.fog;
            statusMap.ambientColor = env.ambientColor;
            console.log("initWater:", water, statusMap)
            ThreeAPI.addPrerenderCallback(update);
        }

        this.call = {
            initWater:initWater
        }

    }



}

export {ThreeWater}