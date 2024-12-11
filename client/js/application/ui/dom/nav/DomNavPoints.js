import {DomWorldButtonLayer} from "../DomWorldButtonLayer.js";
import {DomNavPoint} from "./DomNavPoint.js";
import {getPlayerActor} from "../../../utils/ActorUtils.js";
import {ENUMS} from "../../../ENUMS.js";
import {DomNavBar} from "./DomNavBar.js";

class DomNavPoints {
    constructor() {

        let navPoints = null;
        let buttonLayer = null;
        let domNavPoints = [];
        let domNavBar = null;

        let activeNavPoint = null;

        function activateNavPoint(navPoint) {
            console.log("activateNavPoint: ", navPoint)
            if (activeNavPoint !== null) {
                activeNavPoint.isActive = false;

                if (activeNavPoint.getPos().lengthSq() !== 0) {
                    domNavPoints.push(activeNavPoint);
                }
            }

            activeNavPoint = navPoint;
            navPoint.isActive = true;
            MATH.splice(domNavPoints, navPoint);

            let tPos = navPoint.call.getPos();

            if (tPos.lengthSq() !== 0) {
                let cPos = navPoint.call.getCamPos();
                ThreeAPI.getCameraCursor().getNavLookAt().copy(tPos);
                ThreeAPI.getCameraCursor().getNavLookAt().y += 1;
                ThreeAPI.getCameraCursor().getNavLookFrom().copy(cPos)

                let actor = getPlayerActor();
                if (actor !== null) {
                    actor.setSpatialPosition(navPoint.call.getPlayerPos());
                    setTimeout(function() {
                        actor.turnTowardsPos(tPos);
                    }, 1000)

                }
            }

        }

        function callClick(e) {
            console.log("Nav point clicked: ", e.target.value)
            activateNavPoint(e.target.value)
        }

        function setNavPoints(navPointsCfg) {
            activeNavPoint = null;
            if (navPointsCfg === navPoints) {
                navPointsCfg = null;
            }
            MATH.emptyArray(domNavPoints);
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }

            if (domNavBar !== null) {
                domNavBar.call.close();
                domNavBar = null;
            }

            if (navPointsCfg !== navPoints) {
                navPoints = navPointsCfg;
                if (navPoints) {
                    console.log("setNavPoints", navPoints);

                    domNavBar = new DomNavBar();
                    buttonLayer = new DomWorldButtonLayer();

                    for (let i = 0; i < navPoints.length; i++) {
                        let navPoint = new DomNavPoint();
                        navPoint.call.applyConfig(navPoints[i]);

                        if (navPoint.getPos().lengthSq() !== 0) {
                            domNavPoints.push(navPoint);
                        }
                        domNavBar.call.attachNavPoint(navPoint, activateNavPoint);
                    }

                    buttonLayer.initWorldButtonLayer(domNavPoints, 'label', callClick)
                    activateNavPoint(domNavPoints[0] || domNavBar.navPoints[0])
                }
            }
        }


        function update() {

        }

        function getActiveNavPoint() {
            return activeNavPoint;
        }

        this.call = {
            setNavPoints:setNavPoints,
            getActiveNavPoint:getActiveNavPoint
        }

    }

}

export { DomNavPoints }