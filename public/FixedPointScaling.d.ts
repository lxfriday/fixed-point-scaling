interface IOptions {
    /**
     * 目标元素
     */
    target: HTMLElement;
    /**
     * 是否把滚轮时间绑定在target上，`true` 绑定在target上，`false` 绑定在 `window` 上
     * - `true` 默认，需要鼠标移动到target区域内才会缩放
     * - `false` 只要移动滚轮就会缩放
     */
    bindWheelEventOnTarget?: boolean;
    /**
     * 允许window缩放，默认 `false`
     */
    /**
     * 缩放step，默认 0.1
     */
    scaleStep?: number;
    /**
     * 是否允许缩放
     */
    enableScale?: boolean;
    /**
     * 滚轮滚动让 target 移动时,移动的 step (px)
     */
    translateStep?: number;
    /**
     * 最小缩放比例，默认 0.05 => 5%
     */
    minScale?: number;
    /**
     * 变换的时候是否使用动画过度，缩放的时候效果可以，移动的时候效果较差，false | true | `transform 0.1s`
     * - `false` 默认，不使用动画
     * - `true` 使用 `transform 0.1s`
     * - `transform 0.2s` 自定义动画
     */
    transition?: boolean | string;
    /**
     * 是否打印transform的状态信息 dev 时使用，默认 `false`
     */
    logTransformInfo?: boolean;
    /**
     * 是否使用允许键盘来缩放目标，默认 `false`
     */
    enableKeyboardScale?: boolean;
    /**
     * 是否允许滑动滚轮时移动target，默认为 `false`
     * - 为 `true` 的时候，滚轮移动,target也会移动
     * - 为 `false` 的时候滚动不会移动 target
     */
    enableWheelSlide?: boolean;
    /**
     * 拖拽时的鼠标样式，默认 `grab`
     */
    draggingCursorType?: string;
    /**
     * 初始化时的 translate 值
     */
    defaultTranslate?: {
        x: number;
        y: number;
    };
    /**
     * 初始化时的 scale 值
     */
    defaultScale?: number;
    /**
     * 是否是容器元素
     */
    isWrapper?: boolean;
    /**
     * 拖拽结束的时候触发
     */
    onTranslateChange?(translate: {
        x: number;
        y: number;
    }): void;
    /**
     * 缩放的时候触发
     */
    onScaleChange?(scale: number): void;
}
export default class FixedPointScaling {
    /**
     * 目标元素
     */
    private target;
    /**
     * 是否把滚轮时间绑定在target上，`true` 绑定在target上，`false`绑定在window上，默认为 `true`
     * - `true` 需要鼠标移动到target区域内才会缩放
     * - `false` 只要移动滚轮就会缩放
     */
    private bindWheelEventOnTarget;
    /**
     * 允许window缩放
     */
    /**
     * 是否正在拖拽
     */
    private isDragging;
    /**
     * 拖拽开始 按下鼠标时的 translate 值
     */
    private draggingSrcTranslate;
    /**
     * 按下鼠标时鼠标相对浏览器窗口的位置
     */
    private cursorSrcPos;
    /**
     * 当前缩放倍数
     */
    private scale;
    /**
     * 缩放step，默认为 0.1
     */
    private scaleStep;
    /**
     * 是否允许缩放
     */
    private enableScale;
    /**
     * 滚轮滚动让 target 移动时,移动的 step (px)，默认 10
     */
    private translateStep;
    /**
     * 最小缩放比例，默认为 0.05
     */
    private minScale;
    /**
     * 是否使用动画过度，默认为 `none`
     */
    private transition;
    /**
     * 是否显示transform的状态信息 dev 时使用，默认为 `false`
     */
    private logTransformInfo;
    /**
     * 是否使用允许键盘来缩放目标，默认为 `false`
     */
    private enableKeyboardScale;
    /**
     * 未拖拽时的鼠标样式
     */
    private normalCursorType;
    /**
     * 拖拽时的鼠标样式，默认为为 `grab`
     */
    private draggingCursorType;
    /**
     * 是否允许滑动滚轮时移动target，默认为 `false`
     * - 为 `true` 的时候，滚轮移动,target也会移动
     * - 为 `false` 的时候滚动不会移动 target
     */
    private enableWheelSlide?;
    /**
     * 是否是容器元素，默认 false
     */
    private isWrapper;
    /**
     * 拖拽结束的时候触发
     */
    private onTranslateChange;
    /**
     * 缩放的时候触发
     */
    private onScaleChange;
    /**
     * 拖拽开始
     */
    private handleDragStart?;
    /**
     * 拖拽
     */
    private handleDrag?;
    private handleDragOver?;
    /**
     * 拖拽结束
     */
    private handleDragEnd?;
    /**
     * mousemove事件
     */
    private handleMouseMove?;
    /**
     * 滚轮在目标区域内滚动
     */
    private handleWheel?;
    /**
     * 在window窗口滚轮滚动
     */
    private handleWindowWheel?;
    /**
     * 键盘事件
     */
    private handleKeyDown?;
    /**
     * 当前的 translate
     */
    translate: {
        x: number;
        y: number;
    };
    /**
     * 普通放大，使用键盘或者滚轮不在target区域内部
     * - `base.x` 基点相对于浏览器窗口左侧的距离 left
     * - `base.y` 基点相对于浏览器窗口顶部的距离 top
     * - `nextScale` 接下来要放大的倍数
     */
    handleScaleUp?: (base?: {
        x: number;
        y: number;
    }) => void;
    /**
     * 普通缩小，使用键盘或者滚轮不在target区域内部
     * - `base.x` 基点相对于浏览器窗口左侧的距离 left
     * - `base.y` 基点相对于浏览器窗口顶部的距离 top
     * - `nextScale` 接下来要放大的倍数
     */
    handleScaleDown?: (base?: {
        x: number;
        y: number;
    }) => void;
    /**
     * 移动target
     * - `nextX` 接下来的 translateX
     * - `nextY` 接下来的 translateY
     */
    handleTranslate?: (nextX: number, nextY: number) => void;
    private mapBooleanOptions;
    constructor(options: IOptions);
    /**
     * 初始化一些信息
     */
    private init;
    /**
     * 开始运行
     */
    private run;
    private checkCursorInTarget;
    /**
     * 绑定监听器
     */
    private applyListeners;
    /**
     * 移除事件监听器
     */
    removeListeners(): void;
    /**
     * 应用transform属性
     */
    private applyTransform;
    /**
     * 重置 translate scale
     */
    resetTransform(): void;
}
export {};
