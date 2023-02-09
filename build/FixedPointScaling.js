var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// 拖动时去用来替换的透明图
var draggingImage = new Image();
draggingImage.src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAQSURBVHgBAQUA+v8AAAAAAAAFAAFkeJU4AAAAAElFTkSuQmCC';
var FixedPointScaling = /** @class */ (function () {
    function FixedPointScaling(options) {
        var _this = this;
        /**
         * 目标元素
         */
        this.target = null;
        /**
         * 是否把滚轮时间绑定在target上，`true` 绑定在target上，`false`绑定在window上，默认为 `true`
         * - `true` 需要鼠标移动到target区域内才会缩放
         * - `false` 只要移动滚轮就会缩放
         */
        this.bindWheelEventOnTarget = true;
        /**
         * 允许window缩放
         */
        // private enableWindowScale: boolean = false
        /**
         * 是否正在拖拽
         */
        this.isDragging = false;
        /**
         * 拖拽开始 按下鼠标时的 translate 值
         */
        this.draggingSrcTranslate = { x: 0, y: 0 };
        /**
         * 按下鼠标时鼠标相对浏览器窗口的位置
         */
        this.cursorSrcPos = { x: 0, y: 0 }; // left top
        /**
         * 当前缩放倍数
         */
        this.scale = 1;
        /**
         * 缩放step，默认为 0.1
         */
        this.scaleStep = 0.1;
        /**
         * 是否允许缩放
         */
        this.enableScale = false;
        /**
         * 滚轮滚动让 target 移动时,移动的 step (px)，默认 10
         */
        this.translateStep = 10;
        /**
         * 最小缩放比例，默认为 0.05
         */
        this.minScale = 0.05;
        /**
         * 是否使用动画过度，默认为 `none`
         */
        this.transition = 'none';
        /**
         * 是否显示transform的状态信息 dev 时使用，默认为 `false`
         */
        this.showLog = false;
        /**
         * 是否使用允许键盘来缩放目标，默认为 `false`
         */
        this.enableKeyboardScale = false;
        /**
         * 未拖拽时的鼠标样式
         */
        this.normalCursorType = 'default';
        /**
         * 拖拽时的鼠标样式，默认为为 `grab`
         */
        this.draggingCursorType = 'grab';
        /**
         * 是否允许滑动滚轮时移动target，默认为 `false`
         * - 为 `true` 的时候，滚轮移动,target也会移动
         * - 为 `false` 的时候滚动不会移动 target
         */
        this.enableWheelSlide = false;
        /**
         * 是否是容器元素，默认 false
         */
        this.isWrapper = false;
        /**
         * 当前的 translate
         */
        this.translate = { x: 0, y: 0 };
        /**
         * 拖拽结束的时候触发
         */
        this.onTranslateChange = undefined;
        /**
         * 缩放的时候触发
         */
        this.onScaleChange = undefined;
        /**
         * 拖拽开始
         */
        this.onDragStart = function (e) {
            e.stopPropagation();
            _this.log('dragstart', e);
            var target = _this.target;
            _this.normalCursorType = target.style.cursor;
            // 删除拖拽时的虚框
            e.dataTransfer.setDragImage(draggingImage, 0, 0);
            e.dataTransfer.effectAllowed = 'move';
            _this.isDragging = true;
            _this.draggingSrcTranslate = __assign({}, _this.translate);
            _this.cursorSrcPos = {
                x: e.clientX,
                y: e.clientY,
            };
        };
        /**
         * 拖拽
         */
        this.onDrag = function (e) {
            e.stopPropagation();
            e.preventDefault();
            _this.log('drag', e);
            if (_this.isDragging) {
                var cursorCurrentPos = {
                    x: e.clientX,
                    y: e.clientY,
                };
                // 负值往左，正值往右
                if (_this.isWrapper) {
                    _this.translate = {
                        x: _this.draggingSrcTranslate.x +
                            cursorCurrentPos.x -
                            _this.cursorSrcPos.x,
                        y: _this.draggingSrcTranslate.y +
                            cursorCurrentPos.y -
                            _this.cursorSrcPos.y,
                    };
                }
                else {
                    _this.translate = {
                        x: _this.draggingSrcTranslate.x +
                            (cursorCurrentPos.x - _this.cursorSrcPos.x) /
                                FixedPointScaling.wrapperScale,
                        y: _this.draggingSrcTranslate.y +
                            (cursorCurrentPos.y - _this.cursorSrcPos.y) /
                                FixedPointScaling.wrapperScale,
                    };
                }
                _this.applyTransform();
            }
        };
        this.onDragOver = function (e) {
            // 防止 drag 事件的最后一次触发鼠标位置是 0
            e.preventDefault();
            e.stopPropagation();
        };
        /**
         * 拖拽结束
         */
        this.onDragEnd = function (e) {
            e.stopPropagation();
            _this.isDragging = false;
            _this.onTranslateChange && _this.onTranslateChange(_this.translate);
            _this.log('dragend', e);
        };
        /**
         * mousemove事件
         */
        this.onMouseMove = function (e) { };
        /**
         * 滚轮在目标区域内滚动
         */
        this.onWheel = function (e) {
            if (_this.enableScale && e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                if (_this.bindWheelEventOnTarget && !_this.checkCursorInTarget(e)) {
                    _this.log('鼠标不在 target 区域内');
                    if (e.deltaY < 0)
                        _this.onScaleUp();
                    else
                        _this.onScaleDown();
                    return;
                }
                var cursorPos = {
                    x: e.clientX,
                    y: e.clientY,
                };
                // 上滑，放大
                if (e.deltaY < 0) {
                    _this.onScaleUp(cursorPos);
                }
                else {
                    _this.onScaleDown(cursorPos);
                }
            }
        };
        /**
         * 在window窗口滚轮滚动
         */
        this.onWindowWheel = function (e) {
            // e.preventDefault()
            if (!e.ctrlKey) {
                // 允许滚轮
                var horizontalFlag = 0, verticalFlag = 0;
                if (e.deltaX < 0)
                    horizontalFlag = -1;
                else if (e.deltaX > 0)
                    horizontalFlag = 1;
                if (e.deltaY < 0)
                    verticalFlag = -1;
                else if (e.deltaY > 0)
                    verticalFlag = 1;
                _this.onTranslate(_this.translate.x + horizontalFlag * _this.translateStep, _this.translate.y + verticalFlag * _this.translateStep);
            }
        };
        /**
         * 键盘事件
         */
        this.onKeyDown = function (e) {
            _this.log('onKeyDown pressed: ', e.code);
            if (_this.enableScale && e.ctrlKey) {
                if (e.code === 'NumpadAdd' || e.code === 'Equal') {
                    e.preventDefault();
                    _this.onScaleUp();
                }
                else if (e.code === 'NumpadSubtract' || e.code === 'Minus') {
                    e.preventDefault();
                    _this.onScaleDown();
                }
                else if (e.code === 'Numpad0' || e.code === 'Digit0') {
                    e.preventDefault();
                    _this.resetTransform();
                }
            }
        };
        /**
         * 普通放大，使用键盘或者滚轮不在target区域内部
         * - `base.x` 基点相对于浏览器窗口左侧的距离 left
         * - `base.y` 基点相对于浏览器窗口顶部的距离 top
         */
        this.onScaleUp = function (base) {
            var target = _this.target;
            base =
                typeof base === 'object'
                    ? base
                    : {
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    };
            var boxEleRect = target.getBoundingClientRect();
            // transform origin 在屏幕中位置
            var originPos = {
                x: boxEleRect.left,
                y: boxEleRect.top,
            };
            // 缩放前的相对位置
            var cursorRelativeBasePosBefore = {
                x: Math.round((base.x - originPos.x) / _this.scale),
                y: Math.round((base.y - originPos.y) / _this.scale),
            };
            // 带放大比例的位置
            var cursorRelativePosBefore = {
                x: base.x - originPos.x,
                y: base.y - originPos.y,
            };
            _this.scale = _this.scale + _this.scaleStep;
            // 缩放后的相对位置
            var cursorRelativePosAfter = {
                x: cursorRelativeBasePosBefore.x * _this.scale,
                y: cursorRelativeBasePosBefore.y * _this.scale,
            };
            var deltaX = (cursorRelativePosAfter.x - cursorRelativePosBefore.x) /
                (_this.isWrapper ? 1 : FixedPointScaling.wrapperScale);
            var deltaY = (cursorRelativePosAfter.y - cursorRelativePosBefore.y) /
                (_this.isWrapper ? 1 : FixedPointScaling.wrapperScale);
            _this.translate = {
                x: Math.round(_this.translate.x - deltaX),
                y: Math.round(_this.translate.y - deltaY),
            };
            _this.applyTransform();
            _this.onScaleChange && _this.onScaleChange(parseFloat(_this.scale.toFixed(2)));
            if (_this.isWrapper) {
                FixedPointScaling.wrapperScale = _this.scale;
            }
        };
        /**
         * 普通缩小，使用键盘或者滚轮不在target区域内部
         * - `base.x` 基点相对于浏览器窗口左侧的距离 left
         * - `base.y` 基点相对于浏览器窗口顶部的距离 top
         */
        this.onScaleDown = function (base) {
            var target = _this.target;
            base =
                typeof base === 'object'
                    ? base
                    : {
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    };
            var boxEleRect = target.getBoundingClientRect();
            // transform origin 在屏幕中位置
            var originPos = {
                x: boxEleRect.left,
                y: boxEleRect.top,
            };
            // 缩放前的相对位置
            var cursorRelativeBasePosBefore = {
                x: Math.round((base.x - originPos.x) / _this.scale),
                y: Math.round((base.y - originPos.y) / _this.scale),
            };
            // 带放大比例的位置
            var cursorRelativePosBefore = {
                x: base.x - originPos.x,
                y: base.y - originPos.y,
            };
            if (_this.scale - _this.scaleStep > _this.minScale) {
                _this.scale = _this.scale - _this.scaleStep;
                // 缩放后的相对位置
                var cursorRelativePosAfter = {
                    x: cursorRelativeBasePosBefore.x * _this.scale,
                    y: cursorRelativeBasePosBefore.y * _this.scale,
                };
                var deltaX = (cursorRelativePosBefore.x - cursorRelativePosAfter.x) /
                    (_this.isWrapper ? 1 : FixedPointScaling.wrapperScale);
                var deltaY = (cursorRelativePosBefore.y - cursorRelativePosAfter.y) /
                    (_this.isWrapper ? 1 : FixedPointScaling.wrapperScale);
                _this.translate = {
                    x: Math.round(_this.translate.x + deltaX),
                    y: Math.round(_this.translate.y + deltaY),
                };
                _this.applyTransform();
                _this.onScaleChange &&
                    _this.onScaleChange(parseFloat(_this.scale.toFixed(2)));
                if (_this.isWrapper) {
                    FixedPointScaling.wrapperScale = _this.scale;
                }
            }
        };
        /**
         * 移动target
         * - `nextX` 接下来的 translateX
         * - `nextY` 接下来的 translateY
         */
        this.onTranslate = function (nextX, nextY) {
            _this.translate = {
                x: nextX,
                y: nextY,
            };
            _this.applyTransform();
            _this.onTranslateChange && _this.onTranslateChange(_this.translate);
        };
        this.init(options);
        this.run();
    }
    FixedPointScaling.prototype.mapBooleanOptions = function (op, defaultValue) {
        if (op === true)
            return true;
        if (op === false)
            return false;
        return defaultValue;
    };
    /**
     * 打印
     */
    FixedPointScaling.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.showLog) {
            console.log.apply(console, args);
        }
    };
    /**
     * 初始化一些信息
     */
    FixedPointScaling.prototype.init = function (options) {
        if (!(options.target instanceof HTMLElement)) {
            throw new Error('请绑定容器');
        }
        this.target = options.target;
        this.bindWheelEventOnTarget = this.mapBooleanOptions(options.bindWheelEventOnTarget, true);
        this.enableScale = this.mapBooleanOptions(options.enableScale, false);
        this.scaleStep =
            typeof options.scaleStep === 'number' ? options.scaleStep : 0.1;
        this.translateStep =
            typeof options.translateStep === 'number' ? options.translateStep : 10;
        this.minScale = options.minScale || 0.05;
        this.showLog = this.mapBooleanOptions(options.showLog, false);
        this.onTranslateChange = options.onTranslateChange;
        this.onScaleChange = options.onScaleChange;
        this.enableKeyboardScale = this.mapBooleanOptions(options.enableKeyboardScale, false);
        this.enableWheelSlide = this.mapBooleanOptions(options.enableWheelSlide, false);
        this.isWrapper = this.mapBooleanOptions(options.isWrapper, false);
        this.scale =
            typeof options.defaultScale === 'number' ? options.defaultScale : 1;
        this.translate =
            typeof options.defaultTranslate === 'object'
                ? options.defaultTranslate
                : { x: 0, y: 0 };
        if (options.draggingCursorType)
            this.draggingCursorType = options.draggingCursorType;
        if (options.transition === false || options.transition === void 0)
            this.transition = 'none';
        else {
            if (typeof this.transition === 'string') {
                this.transition = options.transition;
            }
            else {
                this.transition = 'transform 0.1s';
            }
        }
        this.target.style.transformOrigin = '0 0'; // origin 设置为左上角
        this.target.style.transition = this.transition;
        this.target.draggable = true;
        this.applyTransform();
    };
    /**
     * 开始运行
     */
    FixedPointScaling.prototype.run = function () {
        this.applyListeners();
    };
    FixedPointScaling.prototype.checkCursorInTarget = function (e) {
        var _a = this.target.getBoundingClientRect(), left = _a.left, top = _a.top, width = _a.width, height = _a.height;
        var cursorPos = {
            x: e.clientX,
            y: e.clientY,
        };
        if (cursorPos.x < left ||
            cursorPos.x > left + width ||
            cursorPos.y < top ||
            cursorPos.y > top + height)
            return false;
        return true;
    };
    /**
     * 绑定监听器
     */
    FixedPointScaling.prototype.applyListeners = function () {
        var target = this.target;
        target.addEventListener('dragstart', this.onDragStart);
        target.addEventListener('drag', this.onDrag);
        target.addEventListener('dragover', this.onDragOver);
        target.addEventListener('dragend', this.onDragEnd);
        target.addEventListener('mousemove', this.onMouseMove);
        if (this.enableKeyboardScale) {
            window.addEventListener('keydown', this.onKeyDown);
        }
        if (this.bindWheelEventOnTarget) {
            if (this.enableScale)
                target.addEventListener('wheel', this.onWheel, {
                    passive: false,
                });
        }
        else {
            if (this.enableScale)
                window.addEventListener('wheel', this.onWheel, {
                    passive: false,
                });
        }
        // 是否禁止全局缩放
        if (this.enableWheelSlide) {
            window.addEventListener('wheel', this.onWindowWheel, {
                passive: false,
            });
        }
    };
    /**
     * 移除事件监听器
     */
    FixedPointScaling.prototype.removeListeners = function () {
        var target = this.target;
        target.removeEventListener('dragstart', this.onDragStart);
        target.removeEventListener('drag', this.onDrag);
        target.removeEventListener('dragover', this.onDragOver);
        target.removeEventListener('dragend', this.onDragEnd);
        target.removeEventListener('mousemove', this.onMouseMove);
        if (this.enableWheelSlide) {
            window.removeEventListener('wheel', this.onWindowWheel);
        }
        if (this.enableKeyboardScale) {
            window.removeEventListener('keydown', this.onKeyDown);
        }
        if (this.bindWheelEventOnTarget) {
            if (this.enableScale)
                target.removeEventListener('wheel', this.onWheel);
        }
        else {
            if (this.enableScale)
                window.removeEventListener('wheel', this.onWheel);
        }
        this.log('listeners removed');
    };
    /**
     * 应用transform属性
     */
    FixedPointScaling.prototype.applyTransform = function () {
        this.target.style.transform = "matrix(".concat(this.scale, ", 0, 0, ").concat(this.scale, ", ").concat(this.translate.x, ", ").concat(this.translate.y, ")");
        this.log("translateX: ".concat(this.translate.x, ", translateY: ").concat(this.translate.y, ", scale: ").concat(this.scale));
    };
    /**
     * 重置 translate scale
     */
    FixedPointScaling.prototype.resetTransform = function () {
        this.scale = 1;
        this.translate = { x: 0, y: 0 };
        this.target.style.transform = "matrix(".concat(this.scale, ", 0, 0, ").concat(this.scale, ", ").concat(this.translate.x, ", ").concat(this.translate.y, ")");
        if (this.isWrapper)
            FixedPointScaling.wrapperScale = 1;
        this.onTranslateChange && this.onTranslateChange(this.translate);
        this.onScaleChange && this.onScaleChange(parseFloat(this.scale.toFixed(2)));
        this.log("translateX: ".concat(this.translate.x, ", translateY: ").concat(this.translate.y, ", scale: ").concat(this.scale));
    };
    FixedPointScaling.wrapperScale = 1;
    return FixedPointScaling;
}());
export default FixedPointScaling;
// 修改拖拽时的鼠标样式
// 考虑用户自定义样式
//# sourceMappingURL=FixedPointScaling.js.map