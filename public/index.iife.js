var FixedPointScaling = (function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
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
            this.draggingCursorType = 'grabbing';
            /**
             * target 默认的ZIndex
             */
            this.normalZIndex = '';
            /**
             * 拖拽时的 ZIndex
             */
            this.draggingZIndex = '5000';
            /**
             * 默认的 border
             */
            this.normalBorder = '';
            /**
             * 拖拽时的 border
             */
            this.draggingBorder = '1px solid #7176fb';
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
            this.onMouseDown = function (e) {
                _this.log('onMouseDown', e);
                // 找到最近的父目标元素
                var draggingTarget = e.target;
                while (draggingTarget && draggingTarget !== _this.target) {
                    draggingTarget = draggingTarget.parentNode;
                }
                if (!draggingTarget)
                    return;
                FixedPointScaling.draggingTarget = draggingTarget;
                e.stopPropagation();
                _this.log('onMouseDown target', draggingTarget);
                var targetStyles = getComputedStyle(_this.target);
                var bodyStyles = getComputedStyle(document.body);
                _this.normalCursorType = bodyStyles.cursor;
                _this.normalZIndex = targetStyles.zIndex;
                _this.normalBorder = targetStyles.border;
                _this.log('normalBorder', _this.normalBorder);
                // 删除拖拽时的虚框
                document.body.style.cursor = _this.draggingCursorType;
                _this.target.style.zIndex = _this.draggingZIndex;
                _this.target.style.border = _this.draggingBorder;
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
            this.onMouseMove = function (e) {
                if (_this.isDragging && _this.target === FixedPointScaling.draggingTarget) {
                    _this.log('onMouseMove', e);
                    e.stopPropagation();
                    e.preventDefault();
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
            /**
             * 拖拽结束
             */
            this.onMouseUp = function (e) {
                if (_this.isDragging && _this.target === FixedPointScaling.draggingTarget) {
                    e.stopPropagation();
                    _this.isDragging = false;
                    _this.onTranslateChange && _this.onTranslateChange(_this.translate);
                    document.body.style.cursor = _this.normalCursorType;
                    _this.target.style.zIndex = _this.normalZIndex;
                    _this.target.style.border = _this.normalBorder;
                    _this.log('onMouseUp', e);
                    FixedPointScaling.draggingTarget = null;
                }
            };
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
            if (options.draggingZIndex)
                this.draggingZIndex = String(options.draggingZIndex);
            if (options.draggingBorder)
                this.draggingBorder = options.draggingBorder;
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
            this.target.draggable = false;
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
            target.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseup', this.onMouseUp);
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
            target.removeEventListener('mousedown', this.onMouseDown);
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('mouseup', this.onMouseUp);
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
        /**
         * 正在拖拽的目标
         */
        FixedPointScaling.draggingTarget = null;
        return FixedPointScaling;
    }());
    // 修改拖拽时的鼠标样式
    // 考虑用户自定义样式
    // 拖拽过快导致元素飘动到左上角，鼠标点失真

    return FixedPointScaling;

})();
