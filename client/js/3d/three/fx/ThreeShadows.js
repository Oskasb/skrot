import {PCFSoftShadowMap} from "../../../../../libs/three/constants.js";
import {CSMShadowNode} from "../../../../../libs/jsm/csm/CSMShadowNode.js";
import {CSMHelper} from "../../../../../libs/jsm/csm/CSMHelper.js";

class ThreeShadows {
    constructor(store) {
        let camera, scene, renderer;
        camera = store.camera;
        scene = store.scene;
        renderer = store.renderer;

        let sunDirLight = store.env.sun;

        const params = {
            orthographic: false,
            fade: true,
            shadows: true,
            maxFar: 800,
            mode: 'practical',
            lightX: - 1,
            lightY: - 1,
            lightZ: - 1,
            margin: 1000,
            shadowNear: 1,
            shadowFar: 1200,
            autoUpdateHelper: true
        };
        renderer.shadowMap.enabled = params.shadows;
        renderer.shadowMap.type = PCFSoftShadowMap;

        sunDirLight.castShadow = true;
        sunDirLight.shadow.mapSize.width = 1024;
        sunDirLight.shadow.mapSize.height = 1024;
        sunDirLight.shadow.camera.near = params.shadowNear;
        sunDirLight.shadow.camera.far = params.shadowFar;
        sunDirLight.shadow.camera.top = 1000;
        sunDirLight.shadow.camera.bottom = - 1000;
        sunDirLight.shadow.camera.left = - 1000;
        sunDirLight.shadow.camera.right = 1000;
        sunDirLight.shadow.bias = - 0.001;

        let csm = new CSMShadowNode( sunDirLight, { cascades: 4, maxFar: params.maxFar, mode: params.mode } );
        sunDirLight.shadow.shadowNode = csm;

        let csmHelper = new CSMHelper( csm );
        csmHelper.visible = false;
        scene.add( csmHelper );

    }

}

export { ThreeShadows }