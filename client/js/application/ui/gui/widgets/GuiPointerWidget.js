import { GuiWidget} from "../elements/GuiWidget.js";

class GuiPointerWidget {
    constructor(inputIndex) {
        let sprite = {x:7, y:0, z:0.1, w:0.1};
        let color = {r:0.3, g:0.5, b:0.8, a:0.5};
        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();
        this.inputIndex = inputIndex;
        this.releaseTime = 2;
        this.releaseProgress = 0;
        this.releaseDuration = 0.75;

        this.numSurfaces = 8;
        this.surfaceElements = [];
        this.hostWidgets = [];
        this.applyInputCallbacks = [];

        let notifyInputUpdated = function(value) {
            console.log("Pointer state callback fires.. ", value, this)
        }.bind(this);

        let applyColorToNineslice = function(bufferElem, r, g, b, a) {
            color.r = r;
            color.g = g;
            color.b = b;
            color.a = a;
            bufferElem.setColorRGBA(color);
        };

        let applySpriteToNineslice = function(bufferElem, x, y, z, w) {
            sprite.x = x;
            sprite.y = y;
            sprite.z = z;
            sprite.w = w;
            bufferElem.setSprite(sprite);
        };

        let applyLifecycle = function(bufferElem, x, y, z, w, end) {
                bufferElem.lifecycle.x = x;
                bufferElem.lifecycle.y = y;
                bufferElem.lifecycle.z = z;
                bufferElem.lifecycle.w = w;
                if (end) {
                    bufferElem.applyDuration(w);
                }
                bufferElem.startLifecycleNow();
        };

        this.callbacks = {
            notifyInputUpdated:notifyInputUpdated,
            applySpriteToNineslice:applySpriteToNineslice,
            applyColorToNineslice:applyColorToNineslice,
            applyLifecycle:applyLifecycle
        }

    };


    initPointerWidget = function(onReady) {

        let widgetRdy = function(widget) {
            let bufferElem = widget.guiSurface.getBufferElement();
            this.hostWidgets.push(widget)
            this.surfaceElements.push(bufferElem);

            if (this.numSurfaces === this.surfaceElements.length) {
                onReady(this)
            }

        }.bind(this);

        for (let i = 0; i < this.numSurfaces; i++) {
            let guiWidget = new GuiWidget("widget_input_pointer");
            guiWidget.initGuiWidget(null, widgetRdy);
        }

    };

    showPointerWidgetSeeking() {
      //  GuiAPI.printDebugText('Element Seek');
        let count =this.surfaceElements.length;
        for (let i = 0; i < this.surfaceElements.length; i++) {

            let offset = i/count * 0.06 - 0.031;
            let fade = 1/Math.sqrt(i);

            this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.4, 999999, 9999);
            this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, offset, offset);
            this.callbacks.applyColorToNineslice(this.surfaceElements[i], 0.2*fade, 0.5*fade, 0.7*fade, 0.8)
        }
    }

    showPointerWidgetHovering() {
     //   GuiAPI.printDebugText('Hovering');
        let count =this.surfaceElements.length;
        for (let i = 0; i < count ; i++) {

            let offset = i/count * 0.03 + 0.01;
            let fade = 1/Math.sqrt(i);

            this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.2, 999999, 0.5, true)
            this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, offset, offset)
            this.callbacks.applyColorToNineslice(this.surfaceElements[i], 0.1*fade, 0.3*fade, 0.6*fade, 0.5)
        }
    }

    showPointerWidgetLongPressOn() {
        //   GuiAPI.printDebugText('World Seek');
        let count =this.surfaceElements.length;
        for (let i = 0; i < this.surfaceElements.length; i++) {

            let offset = i/count * 0.06 - 0.031;
            let fade = 1/Math.sqrt(i);

            this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.4, 999999, 9999);
            this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, offset, offset);
            this.callbacks.applyColorToNineslice(this.surfaceElements[i], 0.2*fade, 0.5*fade, 0.7*fade, 0.8)
        }
    }

    showPointerWorldSeeking() {
     //   GuiAPI.printDebugText('World Seek');
        let count = this.surfaceElements.length
        for (let i = 0; i < count; i++) {
            let offset = (i/count)-0.5;
            let fade = 0.5-Math.abs(offset);
            let offsetX = (0.012 + offset * 0.12) * (1-(1-fade*2));
            let offsetY = (0.012 - offset * 0.12) * (2*fade);

            this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, offsetX, offsetY)
            this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.4, 999999, 99999)
            this.callbacks.applyColorToNineslice(this.surfaceElements[i], 0.3*fade, 0.8*fade, 0.4*fade, 1)
        }
    }

    showPointerWidgetReleased() {

        for (let i = 0; i < this.surfaceElements.length; i++) {
            this.surfaceElements[i].endLifecycleNow()
        //    this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.0, 999999, 0.2, true)
        //    this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, 0.03+i*0.01, 0.03+i*0.01)
        }
    }

    setElementPosition = function(posVec3) {
        this.pos.copy(posVec3);
        for (let i = 0; i < this.hostWidgets.length; i++) {
            this.callbacks.applyLifecycle(this.surfaceElements[i], 0, 0.4, 999999, 0.5, true)
            this.surfaceElements[i].setPositionVec3(this.pos);
        }
    };

    setElementQuaternion = function(quat) {
        for (let i = 0; i < this.hostWidgets.length; i++) {
            this.surfaceElements[i].setQuat(quat);
        }
    }

    addInputUpdateCallback = function(applyInputUpdate) {
        this.applyInputCallbacks.push(applyInputUpdate)
    };

    notifyInputUpdated = function(ang, dist) {

        for (let i = 0; i < this.applyInputCallbacks.length; i++) {
            this.applyInputCallbacks[i](ang, dist);
        }
    };

    removeGuiWidget = function() {
        MATH.emptyArray(this.applyInputCallbacks);
        for (let i = 0; i < this.hostWidgets.length; i++) {
            this.hostWidgets[i].recoverGuiWidget()
            //    this.callbacks.applySpriteToNineslice(this.surfaceElements[i], 7, 0, 0.03+i*0.01, 0.03+i*0.01)
        }
    };

}
export { GuiPointerWidget }