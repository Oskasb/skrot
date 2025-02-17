import {poolFetch} from "../../../utils/PoolUtils.js";
import {getSetting} from "../../../utils/StatusUtils.js";
import {ENUMS} from "../../../ENUMS.js";
import {createDivElement, transformElement3DPercent, translateElement3DPercent} from "../DomUtils.js";
import {Object3D} from "../../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../../libs/three/math/Vector3.js";
import {MATH} from "../../../MATH.js";
import {Quaternion} from "../../../../../../libs/three/math/Quaternion.js";

// ref:  https://www.mecaflux.com/en/portance.htm

let tempObj = new Object3D();
let tempVec = new Vector3();
let tempVec2 = new Vector3();

let tempQuat = new Quaternion();

class DomInspectAerodynamics {
    constructor(controllable) {

        const statusMap = {}
        const surfaceContainers = [];

        const elements = {};

        const surfaces = controllable.surfaces;

        const rootObj = controllable.getObj3d();

        function alignAirfoil(key, surface) {

            const divFoilX = elements[key+'_FOIL_X'];
            const divFoilY = elements[key+'_FOIL_Y'];

            tempObj.quaternion.set(
                surface.getStatus(ENUMS.SurfaceStatus.QUAT_X),
                surface.getStatus(ENUMS.SurfaceStatus.QUAT_Y),
                surface.getStatus(ENUMS.SurfaceStatus.QUAT_Z),
                surface.getStatus(ENUMS.SurfaceStatus.QUAT_W)
            );

            tempObj.position.set(
                surface.getStatus(ENUMS.SurfaceStatus.POS_X),
                surface.getStatus(ENUMS.SurfaceStatus.POS_Y),
                surface.getStatus(ENUMS.SurfaceStatus.POS_Z)
            );

        //    let rootTrx = controllable.getObj3d();

            divFoilX.style.rotate = -tempObj.rotation.x +'rad' ;
            divFoilY.style.rotate = -tempObj.rotation.y +'rad';

        }

        function alignSurfaceAirflow(key, surface) {

            const divFlowX = elements[key+'_FLOW_X'];
            const divFlowY = elements[key+'_FLOW_Y'];

            tempVec.set(
                surface.getStatus(ENUMS.SurfaceStatus.VEL_X),
                surface.getStatus(ENUMS.SurfaceStatus.VEL_Y),
                surface.getStatus(ENUMS.SurfaceStatus.VEL_Z)
            );

            tempQuat.copy(rootObj.quaternion)
            tempQuat.conjugate();
            tempObj.position.set(0, 0, 0);
            tempVec.applyQuaternion(tempQuat);
            tempObj.lookAt(tempVec);
            const angles = MATH.eulerFromQuaternion(tempObj.quaternion, 'XYZ')
            divFlowX.style.rotate = angles.x + Math.PI +'rad';
            const anglesY = MATH.eulerFromQuaternion(tempObj.quaternion, 'YXZ')
            divFlowY.style.rotate = -anglesY.y - MATH.HALF_PI  +'rad';

        }

        function indicateAoA(key, surface) {
            const aoaxKey = key+'_AOA_X';
            const aoayKey = key+'_AOA_Y';

            const aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X);
            const aoaY = surface.getStatus(ENUMS.SurfaceStatus.AOA_Y);

            const txX = '<h3>α '+MATH.numberToDigits(aoaX, 3)+'</h3>'
            const txY = '<h3>α '+MATH.numberToDigits(aoaY, 3)+'</h3>'

            elements[aoaxKey].innerHTML = txX
            elements[aoayKey].innerHTML = txY
        }

        function updateForceLines(key, surface) {

        const liftX = surface.getStatus(ENUMS.SurfaceStatus.LIFT_X);
        const liftY = surface.getStatus(ENUMS.SurfaceStatus.LIFT_Y);
        const dragN = surface.getStatus(ENUMS.SurfaceStatus.DRAG_N);

            elements[key+'_LIFT_X'].style.transform = "scale3d("+(MATH.curveSqrt(Math.abs(liftX))*0.02 + 0.5)+", "+MATH.curveSqrt(liftX)*0.1+", 1)";

            let attitudeHz = MATH.gAttitudeFromQuaternion(rootObj.quaternion);

            elements[key+'_FORCE_G'].style.rotate = -attitudeHz+'rad';
            elements[key+'_DRAG_N'].style.transform = "scale3d("+(MATH.curveSqrt(dragN)*0.005 + 0.2)+", "+MATH.curveSqrt(dragN)*0.01+", 1)";
            elements[key+'_LIFT_Y'].style.transform = "scale3d("+(MATH.curveSqrt(Math.abs(liftY))*0.002 + 0.5)+", "+MATH.curveSqrt(liftY)*0.01+", 1)";

            curvePointFromAngle(surface.getStatus(ENUMS.SurfaceStatus.AOA_X))
            elements[key+'_SAMPLE_X'].style.left = bottomLeft.left;
            elements[key+'_SAMPLE_X'].style.bottom = bottomLeft.bottom;

            curvePointFromAngle(surface.getStatus(ENUMS.SurfaceStatus.AOA_Y))
            elements[key+'_SAMPLE_Y'].style.left = bottomLeft.left;
            elements[key+'_SAMPLE_Y'].style.bottom = bottomLeft.bottom;

        }

        function update() {

            for (let key in surfaces) {
                alignSurfaceAirflow(key, surfaces[key]);
                alignAirfoil(key, surfaces[key])
                indicateAoA(key, surfaces[key])
                updateForceLines(key, surfaces[key])
            }


            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 0) {
                ThreeAPI.unregisterPrerenderCallback(update);
                htmlElement.closeHtmlElement();
            }
        }


        function addAirflowLines(key, parentX, parentY) {

            elements[key+'_FLOW_X'] = createDivElement(parentX, key+'_FLOW_X', '', 'airflow_root')
            elements[key+'_FLOW_Y'] = createDivElement(parentY, key+'_FLOW_Y', '', 'airflow_root')

            for (let i = 0; i < 30; i++) {
                createDivElement(elements[key+'_FLOW_X'], key+'_FLOW_X_'+i, '', 'airflow_line')
                createDivElement(elements[key+'_FLOW_Y'], key+'_FLOW_Y_'+i, '', 'airflow_line')
            }
        }

        const bottomLeft = {
            bottom:"",
            left:""
        }

        function curvePointFromAngle(incidence) {

            const frac = MATH.calcFraction(-Math.PI, Math.PI, incidence);
            const lift = MATH.curveLift(incidence);
            bottomLeft.left = frac*100+'%';
            bottomLeft.bottom = -45+ lift*45+'%';
            return bottomLeft;
        }

        function addLiftCurvePlot(key, parentX, parentY) {

            const count = 100;

            for (let i = 0; i < count; i++) {
                let frac = MATH.calcFraction(0, count, i);
                let curveAngle = frac*MATH.TWO_PI - Math.PI;
                let px = createDivElement(parentX, key+'_curve_plot_x_'+i, '', 'line_node')
                let py = createDivElement(parentY, key+'_curve_plot_y_'+i, '', 'line_node')

                const bl = curvePointFromAngle(curveAngle);

                px.style.left = bl.left;
                py.style.left = bl.left;
                px.style.bottom = bl.bottom;
                py.style.bottom = bl.bottom;

                createDivElement(px, key+'_curve_line_x_'+i, '', 'line_segment')
                createDivElement(py, key+'_curve_line_y_'+i, '', 'line_segment')
            }

            elements[key+'_SAMPLE_X'] = createDivElement(parentX, key+'_curve_sample_x', '', 'line_node')
            createDivElement(elements[key+'_SAMPLE_X'], key+'_curve_sample_x_dot', '', 'line_sampled')

            elements[key+'_SAMPLE_Y'] = createDivElement(parentY, key+'_curve_sample_y', '', 'line_node')
            createDivElement(elements[key+'_SAMPLE_Y'], key+'_curve_sample_y_dot', '', 'line_sampled')

        }

        const trxScaleFactor = 4.8

        function addAirfoils(key, parentX, parentY) {

            const surface = surfaces[key];
            const sizeX = surface.getStatus(ENUMS.SurfaceStatus.SCALE_X);
            const sizeY = surface.getStatus(ENUMS.SurfaceStatus.SCALE_Y);
            const sizeZ = surface.getStatus(ENUMS.SurfaceStatus.SCALE_Z)

            elements[key+'_FOIL_X'] = createDivElement(parentX, key+'_FOIL_X', '', 'airfoil_line')
            elements[key+'_FOIL_X'].style.width = 0.1+sizeZ * 2+'em';
            elements[key+'_FOIL_X'].style.height = 0.1+sizeY * 2+'em';
            elements[key+'_FOIL_X'].style.left =  -sizeZ+'em';
            elements[key+'_FOIL_X'].style.top = -sizeY+'em';
            elements[key+'_FOIL_Y'] = createDivElement(parentY, key+'_FOIL_Y', '', 'airfoil_line')
            elements[key+'_FOIL_Y'].style.width = 0.1+sizeX*2+'em';
            elements[key+'_FOIL_Y'].style.height = 0.1+sizeZ*2+'em';
            elements[key+'_FOIL_Y'].style.left =  -sizeX+'em';
            elements[key+'_FOIL_Y'].style.top = -sizeZ+'em';
        }

        function addForceLines(key, parentX, parentY) {
            elements[key+'_LIFT_X']  = createDivElement(parentY, key+'_LIFT_X', '', 'force_line line_lift_x');
            elements[key+'_FORCE_G'] = createDivElement(parentX, key+'_FORCE_G', '', 'force_line line_force_g');
            elements[key+'_DRAG_N']  = createDivElement(parentY, key+'_DRAG_N', '', 'force_line line_drag_n');
            elements[key+'_LIFT_Y']  = createDivElement(parentX, key+'_LIFT_Y', '', 'force_line line_lift_y');
        //    elements[key+'_UP_X']  = createDivElement(parentX, key+'_UP_X', '', 'force_line line_up_x');
        //    elements[key+'_UP_Y']  = createDivElement(parentY, key+'_UP_Y', '', 'force_line line_up_y');
        }

        function elemReady() {
            elements['surface_container'] = htmlElement.call.getChildElement('surface_container')


            let count = Object.keys(surfaces).length;

            let width = MATH.percentify(1, count + 0.5);

            for (let key in surfaces) {

                const surface = surfaces[key];
                const posX = surface.getStatus(ENUMS.SurfaceStatus.POS_X);
                const posY = surface.getStatus(ENUMS.SurfaceStatus.POS_Y);
                const posZ = surface.getStatus(ENUMS.SurfaceStatus.POS_Z)

                let boxKey =  'box_'+key
                elements[boxKey] = createDivElement(elements['surface_container'], boxKey, null, 'surface_inspect_box')
                elements[boxKey].style.width = width+'%';
                let labelKey = 'label_'+key;
                elements[labelKey] = createDivElement(elements[boxKey], labelKey, '<h2>'+key+'</h2>', 'surface_label')
                let aoaXKey = 'aoax_'+key;
                elements[aoaXKey] = createDivElement(elements[boxKey], aoaXKey, '', 'surface_aoa_box')



                let xKey = 'x_'+key;
                elements[xKey] = createDivElement(elements[aoaXKey], xKey, '<h2>X</h2>', 'surface_label')

                let aoaxKey = key+'_AOA_X';
                elements[aoaxKey] = createDivElement(elements[aoaXKey], aoaxKey, '<h3>AOA X:</h3>', 'surface_label')

                let origXKey = 'origx_'+key;
                elements[origXKey] = createDivElement(elements[aoaXKey], origXKey, '', 'origin')
                const planeX = createDivElement(elements[origXKey], key+'_img_x', '', 'plane_node plane_left')

                transformElement3DPercent(planeX, 2 +posZ * trxScaleFactor, posY * trxScaleFactor -5, 0);

                let aoaYKey = 'aoay_'+key;
                elements[aoaYKey] = createDivElement(elements[boxKey], aoaYKey, '', 'surface_aoa_box')

                let yKey = 'y_'+key;
                elements[xKey] = createDivElement(elements[aoaYKey], yKey, '<h2>Y</h2>', 'surface_label')

                let aoayKey = key+'_AOA_Y';
                elements[aoayKey] = createDivElement(elements[aoaYKey], aoayKey, '<h3>AOA Y:</h3>', 'surface_label')

                let origYKey = 'origy_'+key;
                elements[origYKey] = createDivElement(elements[aoaYKey], origYKey, '', 'origin')

                const planeY = createDivElement(elements[origYKey], key+'_img_y', '', 'plane_node plane_top')
                transformElement3DPercent(planeY, posX*3.6, -10 +posZ * trxScaleFactor, 0);
                addAirflowLines(key, elements[origXKey], elements[origYKey])

                const plotBoxX = createDivElement(elements[aoaXKey], key+'_plot_x', '', 'plot_container')
                const plotBoxY = createDivElement(elements[aoaYKey], key+'_plot_x', '', 'plot_container')
                addLiftCurvePlot(key, plotBoxX, plotBoxY)
                addAirfoils(key, elements[origXKey], elements[origYKey])
                addForceLines(key, elements[origXKey], elements[origYKey])
            }

            ThreeAPI.registerPrerenderCallback(update);
        }

        const htmlElement = poolFetch('HtmlElement');
        htmlElement.initHtmlElement('inspect/inspect_aerodynamics', null, statusMap, 'inspect_aerodynamics', elemReady);

    }
}

export { DomInspectAerodynamics }