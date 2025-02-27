
import {createDivElement, notifyDomResize, removeDivElement, setRefDiv} from "./application/ui/dom/DomUtils.js";
import {evt} from "./application/event/evt.js";
import {
    Clock
} from "../../libs/three/Three.Core.js";
import {getFrame, loadEditIndex} from "./application/utils/DataUtils.js";
import {initPools} from "./application/utils/PoolUtils.js";
import {ENUMS} from "./application/ENUMS.js";
import {updateKeyboardFrame} from "./application/ui/input/KeyboardState.js";
import {MATH} from "./application/MATH.js";
import {setupSocket} from "./application/utils/SocketUtils.js";
import {DomWorldHud} from "./application/ui/dom/DomWorldHud.js";
import {ThreeBloom} from "./3d/three/fx/ThreeBloom.js";
import {DebugLines} from "./application/debug/lines/DebugLines.js";
import {GameWorld} from "./game/world/GameWorld.js";
import {getGameWorld, setGameWorld} from "./application/utils/GameUtils.js";
import {GamePlayer} from "./game/player/GamePlayer.js";
import {PlayerCamera} from "./game/player/PlayerCamera.js";
import {DomThumbstick} from "./application/ui/dom/ui/DomThumbstick.js";
import {DomWorldButtonLayer} from "./application/ui/dom/DomWorldButtonLayer.js";
import {ThreeShadows} from "./3d/three/fx/ThreeShadows.js";
import {DomMinimap} from "./application/ui/dom/DomMinimap.js";
import {GroundBoundLodGrid} from "./application/grids/GroundBoundLodGrid.js";
import {VegetationGrid} from "./game/world/plants/VegetationGrid.js";
import {getSetting} from "./application/utils/StatusUtils.js";
import {debugDrawControllable} from "./application/utils/DebugUtils.js";
import {Vector3} from "three/webgpu";
import {CarrierControl} from "./game/player/CarrierControl.js";


let gameWorld = new GameWorld();
let player = new GamePlayer();
let orbitControls;

function getGamePlayer() {
    return player;
}

function getCameraControls() {
    return orbitControls;
}

let time = 0;
function loadTick() {
    time++
    document.getElementById('load_tick').innerHTML = time;
    tickTO = setTimeout(loadTick, 1000);
}

let tickTO;

function startGameWorld() {
    removeDivElement(document.getElementById('load_splash'));
    clearTimeout(tickTO);
    new DomWorldHud();
    setGameWorld(gameWorld);
    gameWorld.initGameWorld();

    function cvn(boat) {
        console.log("CVN ", boat);
        boat.addToScene();
        let ctrl = new CarrierControl(boat);
        ctrl.call.playerControl(true)
    }

    getGameWorld().call.loadGamePiece('controllable_enterprise', cvn, [-2800, 0, 18000], [0, 0, 0])

}

function init3d(onReady) {

    let store = window.ThreeAPI.initThreeScene(document.body, 1, false)
    window.ThreeAPI.initEnvironment(store, onReady);

    let camera, scene, renderer;
    camera = store.camera;
    scene = store.scene;
    renderer = store.renderer;

    new ThreeBloom().call.initBloom(scene, camera, renderer)
    new ThreeShadows(store)
    new DebugLines()

    orbitControls = new PlayerCamera(camera, renderer, player)

    setRefDiv(document.body)

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        GameScreen.notifyResize()
        notifyDomResize();
    }
    window.addEventListener( 'resize', onWindowResize );

    const clock = new Clock(true);
    let frame = getFrame();

    function triggerFrame() {


        frame.frame ++;
        window.AmmoAPI.updatePhysicsSimulation(frame.tpf);

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

    }

    triggerFrame();


}
let loadDiv;

class Client{
    constructor() {
        evt.setEventKeys(ENUMS.Event)
        initPools()
        loadTick()
    }

    loadDataIndex(loadCB) {

        loadEditIndex("data/json/index.json" ,loadCB)
    }

    initClient() {
        if (window.islocal) {
            setupSocket()
        }

        init3d(startGameWorld);
    }

}

export {
    Client,
    getGamePlayer,
    getCameraControls
}