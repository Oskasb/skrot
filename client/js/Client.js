
import {notifyDomResize, setRefDiv} from "./application/ui/dom/DomUtils.js";
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



let gameWorld = new GameWorld();
let player = new GamePlayer();
let orbitControls;

function startGameWorld() {
    setGameWorld(gameWorld);
    gameWorld.initGameWorld();

    let elementList = [];
    function worldElementClick(e) {
        console.log("Click Controllable Button", e.target.value);
        player.call.setPlayerActiveControllable(e.target.value);
        MATH.splice(elementList, e.target.value);
        thumbstick.call.close()
    }
    let buttonLayer = new DomWorldButtonLayer();
    buttonLayer.initWorldButtonLayer(elementList, 'PICK', worldElementClick);

    let thumbstick = new DomThumbstick();
    let sMap = {
        controls:orbitControls,
        camera:ThreeAPI.getCamera(),
        player:player
    }

    function stickReady() {

    }

    thumbstick.call.initElement(sMap, 'ui/ui_thumb_stick', 'ui_flight_stick', stickReady)


    function plane(plane) {
        console.log("plane ", plane);
        plane.addToScene();
        elementList.push(plane);

        setTimeout(function() {
            getGameWorld().call.loadGamePiece('controllable_enterprise', cvn)
        },2000)

    }

 //   player.enterWorld('controllable_f14')
    function cvn(boat) {
        console.log("CVN ", boat);
        boat.addToScene();
        elementList.push(boat);

        function updatePhys() {
            let obj3d = boat.getObj3d();
            let body = obj3d.userData.body;
            ThreeAPI.tempVec3.set(0, 0, -5999999);
            ThreeAPI.tempVec3.applyQuaternion(obj3d.quaternion);
            ThreeAPI.tempVec3b.set(2, 3, -100);
            ThreeAPI.tempVec3b.applyQuaternion(obj3d.quaternion);
        //    ThreeAPI.tempVec3b.add(obj3d.position)
            AmmoAPI.applyForceAtPointToBody(ThreeAPI.tempVec3, ThreeAPI.tempVec3b, body)

        }

        AmmoAPI.registerPhysicsStepCallback(updatePhys)
    }

    setTimeout(function() {
        getGameWorld().call.loadGamePiece('controllable_f14', plane)
    },3000)


}

function init3d() {

    let store = window.ThreeAPI.initThreeScene(document.body, 1, false)
    window.ThreeAPI.initEnvironment(store);

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