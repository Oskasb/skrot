import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {MATH} from "../../MATH.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {detachConfig, saveAdventureEdits} from "../../utils/ConfigUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {addNodeToAdventureAtPos, saveAdventureNodeEdit} from "../../utils/AdventureUtils.js";

let operationsList = [
    "ADD_NODE",
    "EDIT_NODES"
]

let tempVec = new Vector3();
let tempVec2 = new Vector3();
let buttonLayer = null;

class DomEditAdventureNodes {
    constructor() {

        let stausMap = {
            header:"xx",
            operation:"xx"
        };
        this.statusMap = stausMap;
        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let selectedOperation = "";

        let visualEdgeCircle;

        let adventure = null;
        let operationSelect = null;

        let pathLineToNext = null;

        let pathLines = [];
        let pathPoints = [];

        let cursors = [];
        let lastDst = new Vector3();


        let divClicked = function(e) {
            let node = e.target.value
            console.log('Select node for edit: ', node);
            let cursor = poolFetch('DomEditCursor')
            cursors.push(cursor);

            let onClick = function(crsr) {
                console.log("Apply Edit to Node", node, node.call.getConfig())
                closeButtonLayer()
                crsr.closeDomEditCursor();
                poolReturn(crsr);
                let editNode = poolFetch('DomEditAdventureNode');
                editNode.call.setAdventureNode(node);
            }

            let applyCursorUpdate = function(obj3d, grid) {
                let config = node.call.getConfig();
                MATH.vec3ToArray(obj3d.position, config.pos, 10);
                saveAdventureNodeEdit(node)
            }

            let closeEditCursor = function() {
                MATH.splice(cursors, cursor)
            }

            cursor.initDomEditCursor(closeEditCursor, node.obj3d, applyCursorUpdate, onClick);

        }

        let updateSelectedOperation = function() {
       //     closeEditAttach()
            closeButtonLayer()

            console.log("updateSelectedOperation", selectedOperation)
            if (selectedOperation === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedOperation;

            if (selectedOperation === "EDIT_NODES") {
                console.log("Set operation EDIT_NODES")
                buttonLayer = poolFetch('DomWorldButtonLayer');
                buttonLayer.initWorldButtonLayer(adventure.getNodes(), selectedOperation, divClicked)
            }

        }


        let applyOperation = function(e) {
            console.log("Apply", selectedOperation);

            if (selectedOperation === 'ADD_NODE') {
                let pos = ThreeAPI.getCameraCursor().getLookAroundPoint();
                addNodeToAdventureAtPos(adventure, pos);
            }

            if (selectedOperation === 'EDIT_NODES') {
                updateSelectedOperation();
            }

        }

        let htmlReady = function(htmlEl) {
            selectedOperation = operationsList[0];
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();

            applyOperationDiv = htmlElem.call.getChildElement('apply_operation');
            operationSelect = htmlElem.call.getChildElement('operation');
            operationSelect.value = selectedOperation;
            DomUtils.addClickFunction(applyOperationDiv, applyOperation)

            rootElem.style.transition = 'none';
            rootElem.style.top = "30%";
            htmlElem.call.populateSelectList('operation', operationsList)
            updateSelectedOperation();
            ThreeAPI.registerPrerenderCallback(update);
        }

        function setAdventure(adv) {
            adventure = adv;
            visualEdgeCircle = poolFetch('VisualEdgeCircle')
            visualEdgeCircle.on();
        }


        function getAdventure() {
            return adventure;
        }

        function clearIndicators() {
            if (visualEdgeCircle !== null) {
                visualEdgeCircle.off();
                poolReturn(visualEdgeCircle);
                visualEdgeCircle = null;
            }


            if (pathLineToNext !== null) {
                pathLineToNext.off();
                poolReturn(pathLineToNext);
                pathLineToNext = null;
            }

            while (pathLines.length) {
                let line = pathLines.pop();
                line.off();
                poolReturn(line);
            }

            while (pathPoints.length) {
                let circle = pathPoints.pop();
                circle.off();
                poolReturn(circle);
            }
        }

        function update() {

            if (operationSelect.value !== selectedOperation) {
                selectedOperation = operationSelect.value;
                updateSelectedOperation();
            }

            let pos = adventure.getPos();
            let radius = 3;

            let nodes = adventure.config.nodes

            tempVec.copy(pos);
            for (let i = 0; i < nodes.length; i++) {
                let circle;
                let line;

                if (pathLines.length-1 < i) {
                    circle = poolFetch('VisualEdgeCircle')
                    circle.on();
                    pathPoints.push(circle);
                    line = poolFetch(('VisualEdgeLine'))
                    line.on();
                    pathLines.push(line);
                }

                MATH.vec3FromArray(tempVec2, nodes[i].pos)
                circle = pathPoints[i];
                line = pathLines[i];
                circle.setPosition(tempVec2);
                circle.setRadius(2);
                if (line.from.distanceToSquared(tempVec) !== 0) {
                    line.from.copy(tempVec);
                    line.recalcPoints = true;
                }

                if (line.to.distanceToSquared(tempVec2) !== 0) {
                    line.to.copy(tempVec2);
                    line.recalcPoints = true;
                }

                tempVec.copy(tempVec2);

                MATH.vec3FromArray(tempVec, nodes[i].pos)
            }

            if (nodes.length !== 0) {
                MATH.vec3FromArray(tempVec, nodes[nodes.length -1].pos)
            }

            visualEdgeCircle.setPosition(pos);
            visualEdgeCircle.setRadius(radius);

            if (selectedOperation === 'ADD_NODE') {
                let dst = ThreeAPI.getCameraCursor().getLookAroundPoint();

                if (MATH.distanceBetween(tempVec, dst) > 0.5) {
                    if (pathLineToNext === null) {
                        pathLineToNext = poolFetch(('VisualEdgeLine'))
                        pathLineToNext.on()
                    }
                    if ( lastDst.distanceToSquared(dst) > 0.001) {
                        pathLineToNext.from.copy(tempVec);
                        pathLineToNext.to.copy(dst);
                        pathLineToNext.recalcPoints = true;
                    }

                } else {
                    if (pathLineToNext !== null) {
                        pathLineToNext.off();
                        poolReturn(pathLineToNext);
                        pathLineToNext = null;
                    }
                }

                lastDst.copy(dst);

            } else {
                if (pathLineToNext !== null) {
                    pathLineToNext.off();
                    poolReturn(pathLineToNext);
                    pathLineToNext = null;
                }
            }

            if (selectedOperation === 'EDIT_NODES') {



            }


        }

        function closeButtonLayer() {
            if (buttonLayer !== null) {
                buttonLayer.closeWorldButtonLayer();
                buttonLayer = null;
            }
        }

        let close = function() {
            clearIndicators()
            adventure = null;
            closeButtonLayer()
        }

        this.call = {
            close:close,
            update:update,
            htmlReady:htmlReady,
            setAdventure:setAdventure,
            getAdventure:getAdventure
        }

    }

    initEditTool(closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_adventure_nodes', closeCb, this.statusMap, 'edit_frame edit_frame_taller', this.call.htmlReady);
    }

    closeEditTool() {
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.call.close();
        this.htmlElement.closeHtmlElement();
        if (!this.htmlElement) {
            console.log("Element already removed")
        } else {
            poolReturn(this.htmlElement);
        }
        this.htmlElement = null;
    }

}

export { DomEditAdventureNodes }