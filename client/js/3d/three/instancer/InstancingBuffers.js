class InstancingBuffers {
    constructor(bufferSysKey, assetId, elementCount, renderOrder) {

        this.adds = 0;
        this.relCount = 0;
        this.actCount = 0;
        this.attributes = {
            "index"          : { "dimensions":1, "dynamic":false},
            "position"       : { "dimensions":3, "dynamic":false},
            "offset"         : { "dimensions":3, "dynamic":false},
            "startTime"      : { "dimensions":1, "dynamic":true },
            "duration"       : { "dimensions":1, "dynamic":false},
            "texelRowSelect" : { "dimensions":4, "dynamic":false},
            "tileindex"      : { "dimensions":2                 },
            "sprite"         : { "dimensions":4, "dynamic":false},
            "lifecycle"      : { "dimensions":4, "dynamic":false},
            "diffusors"      : { "dimensions":4, "dynamic":false},
            "vertexColor"    : { "dimensions":4, "dynamic":false},
            "scale3d"        : { "dimensions":3, "dynamic":false},
            "orientation"    : { "dimensions":4, "dynamic":false}
        };

        this.useBuffers = [
            "offset",
            "scale3d",
            "vertexColor",
            "orientation",
            "sprite",
            "lifecycle",
            "texelRowSelect"
        ];

            this.highestRenderingIndex = 0;
            this.activeCount = 0;

            this.renderOrder = renderOrder;

            this.elementBook = [];
            this.elementBook[ENUMS.IndexState.INDEX_BOOKED] = [];
            this.elementBook[ENUMS.IndexState.INDEX_RELEASING] = [];
            this.elementBook[ENUMS.IndexState.INDEX_FRAME_CLEANUP] = [];
            this.elementBook[ENUMS.IndexState.INDEX_AVAILABLE] = [];


            this.uiSysKey = bufferSysKey;
            this.assetId = assetId;
            this.buffers = {};
            this.activeElements = [];
            this.needsUpdate = false;
            this.initAttributeBuffers(elementCount);
        };


        initAttributeBuffers = function(elementCount) {
            let buffers = [];

            for (let i = 0; i < this.useBuffers.length; i++) {
                let attrib = this.attributes[this.useBuffers[i]];
                let sab = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * elementCount * attrib.dimensions);
                let buffer = new Float32Array(sab);
                buffers.push(buffer);
                this.buffers[this.useBuffers[i]] = buffer;
            };

            let msg = [this.uiSysKey, this.assetId, this.useBuffers, buffers, this.renderOrder];
            InstanceAPI.setupInstancingBuffers(msg)

        };

        setAttribX = function(name, index, x) {

            let buffer = this.buffers[name];
            let dims = this.attributes[name].dimensions;
            let idx = dims*index;
            buffer[idx] = x;
            this.setUpdated(buffer);
        };

        setAttribXY = function(name, index, x, y) {
            let buffer = this.buffers[name];
            let dims = this.attributes[name].dimensions;
            let idx = dims*index;
            buffer[idx] = x;
            buffer[idx+1] = y;
            this.setUpdated(buffer);
        };

        setAttribXYZ = function(name, index, x, y, z) {

            let buffer = this.buffers[name];
            let dims = this.attributes[name].dimensions;
            let idx = dims*index;
            buffer[idx] = x;
            buffer[idx+1] = y;
            buffer[idx+2] = z;
            this.setUpdated(buffer);
        };

        setAttribXYZW = function(name, index, x, y, z, w) {

            let buffer = this.buffers[name];
            let dims = this.attributes[name].dimensions;
            let idx = dims*index;
            buffer[idx] = x;
            buffer[idx+1] = y;
            buffer[idx+2] = z;
            buffer[idx+3] = w;
            this.setUpdated(buffer);
        };

        setUpdated = function(buffer) {
            buffer[buffer.length-1] = 1
        };

        updateReleaseIndices = function(releasedIndices) {

            while (releasedIndices.length) {
                let elemIndex = releasedIndices.pop();
                let element = this.activeElements[elemIndex];
                if (element.testLifetimeIsOver()) {
                    this.activeCount--;
                    this.setIndexBookState(elemIndex, ENUMS.IndexState.INDEX_AVAILABLE);
                } else {
                    this.setIndexBookState(elemIndex, ENUMS.IndexState.INDEX_FRAME_CLEANUP);
                }
            }
        };

        updateCleanupIndices = function(cleanupIndices) {
            while (cleanupIndices.length) {
                let elemIndex = cleanupIndices.pop();
                this.setIndexBookState(elemIndex, ENUMS.IndexState.INDEX_RELEASING);
            }
        };


        updateActiveCount = function() {

            if (!this.activeCount) {
                this.highestRenderingIndex = -1;
                this.updateDrawRange();
                let clears = this.getBookState(ENUMS.IndexState.INDEX_RELEASING);
                while (clears.length) {
                    clears.pop();
                }
                clears = this.getBookState(ENUMS.IndexState.INDEX_FRAME_CLEANUP);
                while (clears.length) {
                    clears.pop();
                }
            }
        };

        updateGuiBuffer = function() {

            let releasedIndices = this.getBookState(ENUMS.IndexState.INDEX_RELEASING);

            this.relCount+=releasedIndices.length;

            this.updateReleaseIndices(releasedIndices);
            let cleanupIndices = this.getBookState(ENUMS.IndexState.INDEX_FRAME_CLEANUP);
            this.updateCleanupIndices(cleanupIndices);
            this.updateActiveCount();

            this.actCount+=  this.activeCount;

        };

        setElementReleased = function(guiElement) {
            guiElement.endLifecycleNow();
            this.setIndexBookState(guiElement.index, ENUMS.IndexState.INDEX_RELEASING);
        };


        bufferRangeOk = function() {
            let buffer = this.buffers['offset'];
            let currentDrawRange = buffer[buffer.length-3];

            if (Math.floor(currentDrawRange) !== currentDrawRange) {
                console.log("Buffer not int!", currentDrawRange,  buffer);
                return false;
            }

            if (this.highestRenderingIndex > (buffer.length-3) / 3) {
                console.log("Buffer out of draw range...")
                return false;
            }
            return true
        };

        updateDrawRange = function() {
            let buffer = this.buffers['offset'];
            buffer[buffer.length-3] = this.highestRenderingIndex+1;
        //    let instBufs = InstanceAPI.getUiSysInstanceBuffers(this.uiSysKey);
       //     for (let i = 0; i<instBufs.length;i++) {
        // Incorrect use for these
        //                instBufs[i].setInstancedCount(buffer[buffer.length-3])
        //    }
        };

        drawFromAvailableIndex = function() {

            if (this.getBookState(ENUMS.IndexState.INDEX_AVAILABLE).length) {
                return this.getBookState(ENUMS.IndexState.INDEX_AVAILABLE).shift();
            }

            return this.highestRenderingIndex+1;
        };

        getAvailableIndex = function() {

            let availableIndex = this.drawFromAvailableIndex();

        //    console.log(availableIndex)

            if (availableIndex > this.highestRenderingIndex) {

                if (!this.bufferRangeOk()) {
                    return false;
                }

                this.highestRenderingIndex = availableIndex;
                this.updateDrawRange();
            }

            return availableIndex;
        };

        setIndexBookState = function(index, state) {
            this.elementBook[state].push(index);
        };

        getBookState = function(state) {
            return this.elementBook[state];
        };


        registerElement = function(guiElement) {
            this.adds++;
            this.activeCount++;
            this.activeElements[guiElement.index] = guiElement;
        };

        monitorBufferStats = function() {
            DebugAPI.trackStat('gui_releases', this.relCount);
            DebugAPI.trackStat('gui_active', this.actCount);
            DebugAPI.trackStat('gui_adds', this.adds);
            this.relCount = 0;
            this.actCount = 0;
            this.adds = 0;
        };

    }

export { InstancingBuffers }