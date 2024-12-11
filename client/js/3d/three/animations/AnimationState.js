class AnimationState {
    constructor(key) {
            this.key = key;
            this.weight = 0.01;
            this.targetWeight = 0;
            this.timeScale = 1;
            this.fade = 0.05;
            this.channel = 0;
            this.playing = false;

            this.loop = 1; // [LoopOnce, LoopRepeat, LoopPingPong]
            this.clamp = 0; // clampWhenFinished (0 false, 1 true)

        };

        getAnimationStatePlaying = function() {
            return this.playing;
        };

        animationStatePlay = function(bool) {
            this.playing = bool;
            if (bool) {
                this.weight = this.targetWeight;
            } else {
                this.weight = 0;
            }
        //    this.callbacks.notifyUpdated();
        };

        getAnimationKey = function() {
            return this.key;
        };

        setAnimationChannel = function(channel) {
            this.channel = channel;
        //    this.callbacks.notifyUpdated();
        };

        setAnimationSync = function(sync) {
            this.sync = sync;
        };

        getAnimationSync = function() {
            return this.sync;
        };

        getAnimationChannel = function() {
            return this.channel;
        };

            setAnimationClamp = function(clamp) {
                this.clamp = clamp;
            };

            getAnimationClamp = function() {
                return this.clamp;
            };

        setAnimationLoop = function(loop) {
            this.loop = loop;
        };

        getAnimationLoop = function() {
            return this.loop;
        };

        setAnimationFade = function(fade) {
            this.fade = fade;
         //   this.callbacks.notifyUpdated()
        };

        getAnimationFade = function() {
            return this.fade;
        };

        setAnimationTimeScale = function(timeScale) {
            this.timeScale = timeScale;
         //   this.callbacks.notifyUpdated()
        };

        getAnimationWeight = function() {
            return this.weight;
        };

        setAnimationWeight = function(weight) {
            if (this.targetWeight === weight) return;
            this.targetWeight = weight;
            this.weight = weight;
        //    this.callbacks.notifyUpdated()
        };

        getAnimationTimeScale = function() {
            return this.timeScale;
        };



    }

    export { AnimationState }