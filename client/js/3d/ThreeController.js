import {getSetting} from "../application/utils/StatusUtils.js";

class ThreeController {
    constructor() {
        this.pxRatio;
        this.divId = 'canvas_window';
}

    
    setupThreeRenderer = function() {

        this.pxRatio = window.devicePixelRatio;

        let antialias = PipelineAPI.readCachedConfigKey('SETUP', 'ANTIALIAS');
    //    antialias = false;
     //   this.pxRatio =  PipelineAPI.readCachedConfigKey('SETUP', 'PX_SCALE');

        ThreeAPI.initThreeScene(GameScreen.getElement(), this.pxRatio, antialias);

        PipelineAPI.setCategoryKeyValue('GAME_DATA', 'CAMERA', ThreeAPI.getCamera());

        let notRez = this.notifyResize;
        window.addEventListener('resize', notRez);
        this.monkeypatchCustomEngine();

    };

    notifyRezize = function() {
    //    console.log("notifyRezize")
        let pxScale = getSetting(ENUMS.Settings.RENDER_SCALE);
        ThreeAPI.updateWindowParameters(GameScreen.getWidth(), GameScreen.getHeight(), GameScreen.getAspect(), this.pxRatio / pxScale);
        GuiAPI.setCameraAspect(GameScreen.getAspect())
    };

    monkeypatchCustomEngine = function() {

        let width = window.innerWidth;
        let height = window.innerHeight;
        let landscape = false;
        let timeout;
        let _this = this;
        let divId = this.divId;

        let handleResize = function() {

            width = window.innerWidth;
            height = window.innerHeight;

            if (width > height) {
            /*
                document.getElementById(divId).style.left = '122em';
                document.getElementById(divId).style.right = '122em';
                document.getElementById(divId).style.top = '0em';
                document.getElementById(divId).style.bottom = '0em';
*/
                GameScreen.setLandscape(true);
                landscape = true;

            } else {
             /*
                document.getElementById(divId).style.left = '0em';
                document.getElementById(divId).style.right = '0em';
                document.getElementById(divId).style.top = '122em';
                document.getElementById(divId).style.bottom = '122em';
*/
                GameScreen.setLandscape(false);
                landscape = false;

            }

            width = document.getElementById(divId).offsetWidth;
            height = document.getElementById(divId).offsetHeight;

            PipelineAPI.setCategoryData('SETUP', {SCREEN:[width, height], LANDSCAPE:landscape});
            GameScreen.notifyResize();
            GameScreen.setLandscape(landscape);
            setTimeout(function() {
                GameScreen.notifyResize();
                _this.notifyRezize();
            }, 1)


        };

        let fireResize = function() {
            handleResize();

            clearTimeout(timeout, 1);
            timeout = setTimeout(function() {
                handleResize();
            }, 50)
        };

        window.addEventListener('resize', fireResize);

        window.addEventListener('load', function() {
            fireResize()
        });

        setTimeout(function() {
            fireResize();
        }, 100);




    };
}

export { ThreeController };