
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


import {
    ACESFilmicToneMapping,
    EquirectangularReflectionMapping,
    PerspectiveCamera,
    Scene
} from "../../libs/three/Three.Core.js";
import {WebGPURenderer} from "../../libs/three/Three.WebGPU.js";
import {loadEditIndex} from "./application/utils/DataUtils.js";

function init3d() {

    let camera, scene, renderer;

    init();
    render();

    function init() {




        const container = document.createElement( 'div' );
        document.body.appendChild( container );

        camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
        camera.position.set( - 1.8, 0.6, 2.7 );

        scene = new Scene();

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


        renderer = new WebGPURenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.toneMapping = ACESFilmicToneMapping;
        container.appendChild( renderer.domElement );

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
        renderer.renderAsync( scene, camera );
    }

}


class Client{
    constructor() {
    }


    loadDataIndex(loadCB) {
        loadEditIndex("data/json/setup/index.json" ,loadCB)
    }

    initClient() {
        init3d()
    }

}

export {Client}