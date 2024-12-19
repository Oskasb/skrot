
import {setRefDiv} from "./application/ui/dom/DomUtils.js";
import {evt} from "./application/event/evt.js";

import {
    Clock
} from "../../libs/three/Three.Core.js";
import {getFrame, loadEditIndex, loadModelAsset, pipelineAPI} from "./application/utils/DataUtils.js";
import {initPools} from "./application/utils/PoolUtils.js";
import {ENUMS} from "./application/ENUMS.js";
import {updateKeyboardFrame} from "./application/ui/input/KeyboardState.js";
import {MATH} from "./application/MATH.js";
import {loadAssetInstance} from "./application/utils/AssetUtils.js";
import {setupSocket} from "./application/utils/SocketUtils.js";
import {DomWorldHud} from "./application/ui/dom/DomWorldHud.js";
import {ThreeBloom} from "./3d/three/fx/ThreeBloom.js";
import {DebugLines} from "./application/debug/lines/DebugLines.js";
import {GameWorld} from "./game/world/GameWorld.js";
import {setGameWorld} from "./application/utils/GameUtils.js";
import {GamePlayer} from "./game/player/GamePlayer.js";
import {OrbitControls} from "../../libs/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "../../libs/jsm/loaders/GLTFLoader.js";

let gameWorld = new GameWorld();


function startGameWorld() {
    setGameWorld(gameWorld);
    gameWorld.initGameWorld();
    let player = new GamePlayer();
    player.enterWorld('controllable_f14')

}

function init3d() {

    let store = window.ThreeAPI.initThreeScene(document.body, 1, false)
    console.log("Call Init Env")
    window.ThreeAPI.initEnvironment(store);

    let camera, scene, renderer;
    camera = store.camera;
    scene = store.scene;
    renderer = store.renderer;

    new ThreeBloom().call.initBloom(scene, camera, renderer)
    new DebugLines()

    init();

    function init() {

        camera.position.set( - 24, 14, 2.7 );

        /*

        setTimeout(function() {
                const loader = new GLTFLoader().setPath( './data/assets/' );
                loader.load( 'test/glTF/DamagedHelmet.gltf', function ( gltf ) {
                    console.log(gltf.scene)
                    scene.add( gltf.scene );
                } );

        }, 1000)
*/
        setRefDiv(document.body)


        const controls = new OrbitControls( camera, renderer.domElement );
    //    dynamics.addEventListener( 'change', render ); // use if there is no animation loop
        controls.minDistance = 2;
        controls.maxDistance = 200;
        controls.target.set( 0, 14, 0);
        controls.update();

        window.addEventListener( 'resize', onWindowResize );

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        GameScreen.notifyResize()
    }




    const clock = new Clock(true);
    let frame = getFrame();

    function triggerFrame() {
        frame.frame ++;

        updateKeyboardFrame(frame.frame);
        frame.tpf = MATH.clamp(clock.getDelta(), 0, 0.5);
        frame.avgTpf = window.ThreeAPI.getSetup().avgTpf;
        frame.elapsedTime = clock.elapsedTime;

    //    pingTime+=frame.tpf;

        window.ThreeAPI.updateCamera();

    //    GuiAPI.updateGui(frame.tpf, frame.elapsedTime);

        window.ThreeAPI.requestFrameRender(frame)

        evt.dispatch(ENUMS.Event.FRAME_READY, frame);
        requestAnimationFrame( triggerFrame );

    //    GameAPI.getGameCamera().call.applyFrame(frame)
        frame.gameTime = frame.systemTime // GameAPI.getGameTime();
        frame.systemTime += frame.tpf;

        window.ThreeAPI.applyDynamicGlobalUniforms();

        window.ThreeAPI.updateAnimationMixers(frame.tpf);
        window.ThreeAPI.updateSceneMatrixWorld();
        window.ThreeAPI.applyPostrenderUpdates()

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
        if (window.islocal) {
            setupSocket()
        }
        let worldHud = new DomWorldHud();
        init3d();
        setTimeout(startGameWorld, 1)
        //startGameWorld()
    }

}

export {Client}