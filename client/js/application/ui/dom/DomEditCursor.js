import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {ENUMS} from "../../ENUMS.js";


let tempVec = new Vector3();
let tempObj3d = new Object3D()
let frustumFactor = 0.828;

let index = 0;

let frameRotObj3d = new Object3D()

function applyStatusUpdate(statusMap, updateObj3d) {

    frameRotObj3d.quaternion.set(0, 0, 0, 1);
    frameRotObj3d.rotateX(statusMap.rotX)
    frameRotObj3d.rotateY(statusMap.rotY)
    frameRotObj3d.rotateZ(statusMap.rotZ)
    // MATH.eulerFromQuaternion()
    updateObj3d.quaternion.copy(frameRotObj3d.quaternion)
 //   updateObj3d.rotation.x = statusMap.rotX // - model.obj3d.rotation.x)
 //   updateObj3d.rotation.y = statusMap.rotY
 //   updateObj3d.rotation.z = statusMap.rotZ

    statusMap.applyScale = statusMap.offsetScale + statusMap.scale*0.1;
    if (statusMap.elevate === 0) {
        statusMap.offsetElevate = 0;
    }
    statusMap.applyElevate += statusMap.offsetElevate + statusMap.elevate;

}

class DomEditCursor {
    constructor() {
        index++
        this.id = "edit_cursor_"+index;

        this.initObj3d = new Object3D();
        let targetObj3d = new Object3D();
        let updateObj3d = new Object3D();

        let lastUpdateObj3d = new Object3D();

        let rotYDiv = null;
        let rotYSlider = null;
        let scaleDiv = null;
        let scaleSlider = null;
        let elevateDiv = null;
        let elevateSlider = null;
        this.onUpdateCallbacks = [];
        this.onClickCallbacks = [];

        let initGrid = 0;

        this.statusMap = {
            rotX:0,
            rotY:0,
            rotZ:0,
            posX:0,
            posY:0,
            posZ:0,
            scale:0,
            elevate:0,
            offsetScale:1,
            applyScale:1,
            offsetElevate:0,
            applyElevate:0,
            grid:0
        };

        let rootElem = null;
        let htmlElem;

        let dragY = 0;
        let dragX = 0;
        let startDragX = 0;
        let startDragY = 0;
        let startOffsetTop = 0;
        let startOffsetLeft = 0;
        let dragDistanceY = 0;
        let dragDistanceX = 0;
        let moveX = 0;
        let moveY = 0;
        let dragActive = false;

        let mouseMove = function(e) {
            if (dragActive === true) {
                tempObj3d.position.copy(ThreeAPI.getCamera().position);
                let camDist = MATH.distanceBetween(tempObj3d.position, targetObj3d.position)
                tempObj3d.lookAt(targetObj3d.position);
                tempVec.set(0, 0, 1);
                tempVec.applyQuaternion(tempObj3d.quaternion);
                dragDistanceY = rootElem.offsetTop-startOffsetTop;
                dragDistanceX = rootElem.offsetLeft-startOffsetLeft

                if (e.touches) {
                    moveY = e.touches[0].pageY;
                    moveX = e.touches[0].pageX;
                } else {
                    moveY = e.pageY;
                    moveX = e.pageX;
                }


                dragY = moveY -startDragY + dragDistanceY;
                dragX = moveX -startDragX + dragDistanceX;

                tempObj3d.position.y = targetObj3d.position.y;
                tempObj3d.lookAt(targetObj3d.position);

                updateObj3d.position.set(dragX * -(0.01 * MATH.curveSqrt(camDist*0.2)), 0, (dragY* -0.01 * (Math.abs(MATH.curveQuad((0.1*camDist/(0.2+MATH.curveSqrt(tempVec.y)))*0.25))+0.01)));
                updateObj3d.position.applyQuaternion(tempObj3d.quaternion);

            }
        }


        let centerClicked = function() {
            if (Math.abs(dragDistanceY) + Math.abs(dragDistanceX) < 0.5) {
                MATH.callAll(this.onClickCallbacks, this)
            }
            dragDistanceY = 0;
            dragDistanceX = 0;
        }.bind(this)

        let sourceTransition = null;

        let startDrag = function(e) {
            dragY = 0;
            dragX = 0;
            updateObj3d.position.set(0, 0, 0);
            dragActive = true;
            if (e.touches) {
                startDragY = e.touches[0].pageY;
                startDragX = e.touches[0].pageX;
            } else {
                startDragY = e.pageY;
                startDragX = e.pageX;
            }

            startOffsetTop = rootElem.offsetTop;
            startOffsetLeft = rootElem.offsetLeft;
        //    console.log("Drag Cursor", e);
            rootElem.style.zIndex = 5000;
        }

        let endDrag = function(e) {
            dragActive = false;
            rootElem.style.zIndex = '';
            dragY = 0;
            dragX = 0;
            this.initObj3d.copy(targetObj3d);
            initEditStatus(this.initObj3d);
            targetObj3d.scale.set(1, 1, 1);
        }.bind(this);

        let initEditStatus = function(obj3d) {
            targetObj3d.copy(obj3d);
            updateObj3d.position.set(0, 0, 0);
            updateObj3d.scale.set(1, 1, 1);
            updateObj3d.quaternion.set(0, 0, 0, 1);
            this.statusMap.rotX = 0;
            this.statusMap.rotY = 0;
            this.statusMap.rotZ = 0;
            this.statusMap.scale = 0;
            this.statusMap.elevate = 0;
            rotYSlider.value = "0";
            scaleSlider.value = "0";
            elevateSlider.value = "0";
            this.statusMap.offsetElevate = 0;
            this.statusMap.applyScale = 1;
            this.statusMap.offsetScale = 1;
            this.statusMap.grid = initGrid;
            htmlElem.call.getChildElement('grid').value = initGrid;
        }.bind(this);

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            let translateDiv = htmlEl.call.getChildElement('translate')
            rotYDiv = htmlEl.call.getChildElement('rot_y')
            rotYSlider = htmlElem.call.getChildElement('rotY');
            scaleSlider = htmlElem.call.getChildElement('scale');
            elevateSlider = htmlElem.call.getChildElement('elevate');
            htmlElem.call.getChildElement('grid').value = initGrid;
            DomUtils.addPressStartFunction(translateDiv, startDrag)
            DomUtils.addMouseMoveFunction(translateDiv, mouseMove);
            DomUtils.addPressEndFunction(translateDiv, endDrag);
            DomUtils.addClickFunction(translateDiv, centerClicked);
            DomUtils.addPointerExitFunction(translateDiv, endDrag);
            DomUtils.addPressEndFunction(rotYSlider, endDrag);
            DomUtils.addPointerExitFunction(rotYSlider, endDrag);
            DomUtils.addPressEndFunction(scaleSlider, endDrag);
            DomUtils.addPointerExitFunction(scaleSlider, endDrag);
            DomUtils.addPressEndFunction(elevateSlider, endDrag);
            DomUtils.addPointerExitFunction(elevateSlider, endDrag);
            initEditStatus(this.initObj3d);
            rootElem.style.transition = 'none';
            ThreeAPI.registerPrerenderCallback(update);
        }.bind(this);

        let nodeDivs = [];

        let applyEdits = function() {
            applyStatusUpdate(this.statusMap, updateObj3d)

        //    this.initObj3d.quaternion.copy(updateObj3d.quaternion);
        }.bind(this);

        let update = function() {

            rootElem.style.transition = 'none';
            rootElem.style.transform = "translate3d(-50%, -50%, 0)";
            applyEdits()

         //   if (dragActive === true) {
           //     console.log("mouse Move", updateObj3d.position);
                targetObj3d.position.copy(this.initObj3d.position);
                targetObj3d.position.add(updateObj3d.position);
         //   }


            targetObj3d.position.y = Math.max(ThreeAPI.terrainAt(targetObj3d.position), 0) + this.statusMap.applyElevate + 0.4;
            targetObj3d.quaternion.copy(this.initObj3d.quaternion);
            targetObj3d.quaternion.multiply(updateObj3d.quaternion);
            targetObj3d.scale.copy(this.initObj3d.scale);
            targetObj3d.scale.multiplyScalar(this.statusMap.applyScale)

            let grid = this.statusMap.grid;
            if (grid !== 0) {
                let res = 1/grid;
                MATH.decimalifyVec3(targetObj3d.position, res);
                let ground = ThreeAPI.terrainAt(targetObj3d.position)
                let gridY = MATH.decimalify(ground, res);
                if (gridY < ground-0.25) {
                    gridY += grid;
                }
                targetObj3d.position.y = gridY + MATH.decimalify(this.statusMap.applyElevate, res);
                tempObj3d.position.set(0, 0, 0);
                tempVec.set(0, 0, MATH.curveSqrt(res)*0.72);
                tempVec.applyQuaternion(targetObj3d.quaternion);
                MATH.decimalifyVec3(tempVec, res);
                tempObj3d.lookAt(tempVec);
                targetObj3d.quaternion.copy(tempObj3d.quaternion);

                tempVec.add(targetObj3d.position)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:targetObj3d.position, to:tempVec, color:'YELLOW'});


            }

        //    updateObj3d.quaternion.copy(targetObj3d.quaternion)

            let relay = false;

            if (lastUpdateObj3d.position.distanceToSquared(targetObj3d.position) > 0.01) {
                relay = true;
            } else if (MATH.distanceBetween(lastUpdateObj3d.quaternion, targetObj3d.quaternion) > 0.001) {
                console.log("Quat Changed")
                relay = true;
            } else if (lastUpdateObj3d.scale.distanceToSquared(targetObj3d.scale) > 0.001) {
                relay = true;
            } else if (lastUpdateObj3d.grid !== grid) {
                relay = true;
            }

            lastUpdateObj3d.grid = grid;
            lastUpdateObj3d.copy(targetObj3d)
            if (relay === true) {
                MATH.callAll(this.onUpdateCallbacks, targetObj3d, grid);

            }

            rotYDiv.style.rotate = -updateObj3d.rotation.y+"rad"

            let pos = targetObj3d.position;
            ThreeAPI.toScreenPosition(pos, tempVec);
            rootElem.style.top = 50-tempVec.y*(100/frustumFactor)+"%";
            rootElem.style.left = 50+tempVec.x*(100/frustumFactor)+"%";

        }.bind(this);

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            while (nodeDivs.length) {
                DomUtils.removeDivElement(nodeDivs.pop());
            }
        }.bind(this);

        let setPos = function(pos) {
            this.initObj3d.position.copy(pos);
            targetObj3d.position.copy(this.initObj3d.position);
        }.bind(this);

        function getUpdateObj() {
            return updateObj3d
        }


        function setGrid(value) {
            if (typeof (value) === "number") {
                initGrid = value
            }
        }

        this.call = {
            setGrid:setGrid,
            htmlReady:htmlReady,
            update:update,
            setPos:setPos,
            getUpdateObj:getUpdateObj,
            close:close
        }

    }

    initDomEditCursor(closeCb, initObj3d, onUpdate, onClick) {
        this.statusMap.scale =0;
        this.statusMap.elevate =0;
        this.statusMap.offsetScale =1;
        this.statusMap.offsetElevate = 0;
        this.statusMap.applyScale =1;
        this.statusMap.applyElevate = 0;
        this.statusMap.grid = 0;
        this.call.setGrid(0);
        this.closeCb = closeCb;
        this.onClickCallbacks.push(onClick);
        this.onUpdateCallbacks.push(onUpdate);
        this.initObj3d.copy(initObj3d);
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_cursor', closeCb, this.statusMap, 'edit_cursor', this.call.htmlReady);
    }

    closeDomEditCursor() {
        MATH.emptyArray(this.onUpdateCallbacks);
        MATH.emptyArray(this.onClickCallbacks);
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        if (this.htmlElement === null) {
            console.log("Element already removed")
        } else {

            poolReturn(this.htmlElement);
        }
        this.htmlElement = null;
    }

}

export { DomEditCursor }