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

function log() {
    var arg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arg[_i] = arguments[_i];
    }
    console.log.apply(console, arg);
}
var FixedPointScaling = /** @class */ (function () {
    function FixedPointScaling(options) {
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
        this.logTransformInfo = false;
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
         * 当transform状态发生变化时的监听函数
         */
        this.onTransformChange = undefined;
        /**
         * 当前的 translate
         */
        this.translate = { x: 0, y: 0 };
        this.target = options.target;
        this.bindWheelEventOnTarget = this.mapBooleanOptions(options.bindWheelEventOnTarget, true);
        // this.enableWindowScale = this.mapBooleanOptions(
        //   options.enableWindowScale,
        //   false,
        // )
        this.scaleStep =
            typeof options.scaleStep === 'number' ? options.scaleStep : 0.1;
        this.translateStep =
            typeof options.translateStep === 'number' ? options.translateStep : 10;
        this.minScale = options.minScale || 0.05;
        this.logTransformInfo = this.mapBooleanOptions(options.logTransformInfo, false);
        this.onTransformChange = options.onTransformChange;
        this.enableKeyboardScale = this.mapBooleanOptions(options.enableKeyboardScale, false);
        this.enableWheelSlide = this.mapBooleanOptions(options.enableWheelSlide, false);
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
        this.init();
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
     * 初始化一些信息
     */
    FixedPointScaling.prototype.init = function () {
        if (!(this.target instanceof HTMLElement)) {
            throw new Error('请绑定容器');
        }
        var target = this.target;
        target.style.transformOrigin = '0 0'; // origin 设置为左上角
        target.style.transition = this.transition;
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
        var _this = this;
        var target = this.target;
        // window 发生滚动事件
        this.handleWindowWheel = function (e) {
            // e.preventDefault()
            if (!e.ctrlKey && _this.enableWheelSlide) {
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
                _this.handleTranslate(_this.translate.x + horizontalFlag * _this.translateStep, _this.translate.y + verticalFlag * _this.translateStep);
            }
        };
        // target 发生鼠标按下事件
        this.handleMouseDown = function (e) {
            var target = _this.target;
            _this.normalCursorType = target.style.cursor;
            target.style.cursor = _this.draggingCursorType;
            _this.isDragging = true;
            _this.draggingSrcTranslate = __assign({}, _this.translate);
            _this.cursorSrcPos = {
                x: e.clientX,
                y: e.clientY,
            };
        };
        // target 发生鼠标移动事件
        this.handleMouseMove = function (e) {
            if (_this.isDragging) {
                var cursorCurrentPos = {
                    x: e.clientX,
                    y: e.clientY,
                };
                // 负值往左，正值往右
                _this.translate = {
                    x: _this.draggingSrcTranslate.x +
                        cursorCurrentPos.x -
                        _this.cursorSrcPos.x,
                    y: _this.draggingSrcTranslate.y +
                        cursorCurrentPos.y -
                        _this.cursorSrcPos.y,
                };
                _this.applyTransform();
            }
        };
        // target 发生鼠标松开事件
        this.handleWindowMouseUp = function (e) {
            _this.isDragging = false;
            target.style.cursor = _this.normalCursorType;
        };
        // target 发生鼠标滚动事件
        this.handleWheel = function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                if (_this.bindWheelEventOnTarget && !_this.checkCursorInTarget(e)) {
                    log('鼠标不在 target 区域内');
                    if (e.deltaY < 0)
                        _this.handleScaleUp();
                    else
                        _this.handleScaleDown();
                    return;
                }
                var cursorPos = {
                    x: e.clientX,
                    y: e.clientY,
                };
                // 上滑，放大
                if (e.deltaY < 0) {
                    _this.handleScaleUp(cursorPos);
                }
                else {
                    _this.handleScaleDown(cursorPos);
                }
            }
        };
        /**
         * 放大
         * - `baseX` 基点相对于浏览器窗口左侧的距离 left
         * - `baseY` 基点相对于浏览器窗口顶部的距离 top
         */
        this.handleScaleUp = function (base) {
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
            var deltaX = cursorRelativePosAfter.x - cursorRelativePosBefore.x;
            var deltaY = cursorRelativePosAfter.y - cursorRelativePosBefore.y;
            _this.translate = {
                x: Math.round(_this.translate.x - deltaX),
                y: Math.round(_this.translate.y - deltaY),
            };
            _this.applyTransform();
        };
        // 键盘缩小
        this.handleScaleDown = function (base) {
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
                var deltaX = cursorRelativePosBefore.x - cursorRelativePosAfter.x;
                var deltaY = cursorRelativePosBefore.y - cursorRelativePosAfter.y;
                _this.translate = {
                    x: Math.round(_this.translate.x + deltaX),
                    y: Math.round(_this.translate.y + deltaY),
                };
            }
            _this.applyTransform();
        };
        this.handleTranslate = function (nextX, nextY) {
            console.log('handleTranslate', nextX, nextY);
            _this.translate = {
                x: nextX,
                y: nextY,
            };
            _this.applyTransform();
        };
        this.handleKeyDown = function (e) {
            log('handleKeyDown pressed: ', e.code);
            if (e.ctrlKey) {
                if (e.code === 'NumpadAdd' || e.code === 'Equal') {
                    e.preventDefault();
                    _this.handleScaleUp();
                }
                else if (e.code === 'NumpadSubtract' || e.code === 'Minus') {
                    e.preventDefault();
                    _this.handleScaleDown();
                }
                else if (e.code === 'Numpad0' || e.code === 'Digit0') {
                    e.preventDefault();
                    _this.resetTransform();
                }
            }
        };
        target.addEventListener('mousedown', this.handleMouseDown);
        target.addEventListener('mousemove', this.handleMouseMove);
        // 这里需要window级监听，防止鼠标移动到浏览器外松开
        window.addEventListener('mouseup', this.handleWindowMouseUp);
        if (this.enableKeyboardScale) {
            window.addEventListener('keydown', this.handleKeyDown);
        }
        if (this.bindWheelEventOnTarget) {
            target.addEventListener('wheel', this.handleWheel, {
                passive: false,
            });
        }
        else {
            window.addEventListener('wheel', this.handleWheel, {
                passive: false,
            });
        }
        // 是否禁止全局缩放
        window.addEventListener('wheel', this.handleWindowWheel, {
            passive: false,
        });
    };
    /**
     * 移除事件监听器
     */
    FixedPointScaling.prototype.removeListeners = function () {
        var target = this.target;
        target.removeEventListener('mousedown', this.handleMouseDown);
        target.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleWindowMouseUp);
        window.removeEventListener('wheel', this.handleWindowWheel);
        if (this.enableKeyboardScale) {
            window.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.bindWheelEventOnTarget) {
            target.removeEventListener('wheel', this.handleWheel);
        }
        else {
            window.removeEventListener('wheel', this.handleWheel);
        }
        log('listeners removed');
    };
    /**
     * 应用transform属性
     */
    FixedPointScaling.prototype.applyTransform = function () {
        this.target.style.transform = "matrix(".concat(this.scale, ", 0, 0, ").concat(this.scale, ", ").concat(this.translate.x, ", ").concat(this.translate.y, ")");
        this.onTransformChange &&
            this.onTransformChange(parseFloat(this.scale.toFixed(2)), this.translate.x, this.translate.y);
        if (this.logTransformInfo) {
            log("translateX: ".concat(this.translate.x, ", translateY: ").concat(this.translate.y, ", scale: ").concat(this.scale));
        }
    };
    /**
     * 重置 transform transform-origin
     */
    FixedPointScaling.prototype.resetTransform = function () {
        this.scale = 1;
        this.translate = { x: 0, y: 0 };
        this.target.style.transform = "matrix(".concat(this.scale, ", 0, 0, ").concat(this.scale, ", ").concat(this.translate.x, ", ").concat(this.translate.y, ")");
        this.onTransformChange &&
            this.onTransformChange(parseFloat(this.scale.toFixed(2)), this.translate.x, this.translate.y);
        if (this.logTransformInfo) {
            log("translateX: ".concat(this.translate.x, ", translateY: ").concat(this.translate.y, ", scale: ").concat(this.scale));
        }
    };
    return FixedPointScaling;
}());
// 默认要绑定到target上
// 滚轮默认禁用
// 默认禁止缩放

module.exports = FixedPointScaling;
