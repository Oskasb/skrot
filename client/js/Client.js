
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {setRefDiv} from "./application/ui/dom/DomUtils.js";
import {evt} from "./application/event/evt.js";

import {
    ACESFilmicToneMapping, Clock,
    EquirectangularReflectionMapping,
    PerspectiveCamera,
    Scene
} from "../../libs/three/Three.Core.js";
import {WebGPURenderer} from "../../libs/three/Three.WebGPU.js";
import {getFrame, loadEditIndex, pipelineAPI} from "./application/utils/DataUtils.js";
import {initPools} from "./application/utils/PoolUtils.js";
import {ENUMS} from "./application/ENUMS.js";
import {updateKeyboardFrame} from "./application/ui/input/KeyboardState.js";
import {MATH} from "./application/MATH.js";



function init3d() {

    let store = window.ThreeAPI.initThreeScene(document.body, 1, false)

    let camera, scene, renderer;

    camera = store.camera;
    scene = store.scene;
    renderer = store.renderer;

    init();
    render();

    function init() {

    //    camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
        camera.position.set( - 4, 2, 2.7 );

    //    ThreeAPI.setCamera(camera);

        new RGBELoader()
            .setPath( './data/assets/test/' )
            .load( 'royal_esplanade_1k.hdr', function ( texture ) {

                texture.mapping = EquirectangularReflectionMapping;
                //texture.minFilter = THREE.LinearMipmapLinearFilter;
                //texture.generateMipmaps = true;

                scene.background = texture;
                scene.environment = texture;

                render();

                // model

                const loader = new GLTFLoader().setPath( './data/assets/test/glTF/' );
                loader.load( 'DamagedHelmet.gltf', function ( gltf ) {

                    scene.add( gltf.scene );

                    render();

                } );

            } );

        setRefDiv(document.body)


        const controls = new OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render ); // use if there is no animation loop
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.target.set( 0, 0, - 0.2 );
        controls.update();

        window.addEventListener( 'resize', onWindowResize );

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        render();
    }

    //

    function render() {
        console.log("Render Async")
        renderer.renderAsync( scene, camera );
    }

    const clock = new Clock(true);
    let frame = getFrame();

    function triggerFrame() {
        frame.frame ++;
        updateKeyboardFrame(frame.frame);
        frame.tpf = MATH.clamp(clock.getDelta(), 0, 0.5);
        frame.avgTpf = ThreeAPI.getSetup().avgTpf;
        frame.elapsedTime = clock.elapsedTime;

    //    pingTime+=frame.tpf;

        ThreeAPI.updateCamera();

    //    GuiAPI.updateGui(frame.tpf, frame.elapsedTime);

        ThreeAPI.requestFrameRender(frame)

        evt.dispatch(ENUMS.Event.FRAME_READY, frame);
        requestAnimationFrame( triggerFrame );

    //    GameAPI.getGameCamera().call.applyFrame(frame)
        frame.gameTime = frame.systemTime // GameAPI.getGameTime();
        frame.systemTime += frame.tpf;

        ThreeAPI.applyDynamicGlobalUniforms();

        ThreeAPI.updateAnimationMixers(frame.tpf);
        ThreeAPI.updateSceneMatrixWorld();
    //    client.dynamicMain.tickDynamicMain();
    //    EffectAPI.updateEffectAPI();
    //    pipelineAPI.tickPipelineAPI(frame.tpf)

     //   console.log("Trigger Frame ", frame)
    }

    triggerFrame();


}


class Client{
    constructor() {
        evt.setEventKeys(ENUMS.Event)
        initPools()
    }

    loadDataIndex(loadCB) {
        loadEditIndex("data/json/setup/index.json" ,loadCB)
    }

    initClient() {
        init3d()
    }

}

export {Client}