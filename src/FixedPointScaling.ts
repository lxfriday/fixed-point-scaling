interface IOptions {
  /**
   * 目标元素
   */
  target: HTMLElement
  /**
   * 是否把滚轮时间绑定在target上，`true` 绑定在target上，`false` 绑定在 `window` 上
   * - `true` 默认，需要鼠标移动到target区域内才会缩放
   * - `false` 只要移动滚轮就会缩放
   */
  bindWheelEventOnTarget?: boolean
  /**
   * 允许window缩放，默认 `false`
   */
  // enableWindowScale?: boolean
  /**
   * 缩放step，默认 0.1
   */
  scaleStep?: number
  /**
   * 是否允许缩放
   */
  enableScale?: boolean
  /**
   * 滚轮滚动让 target 移动时,移动的 step (px)
   */
  translateStep?: number
  /**
   * 最小缩放比例，默认 0.05 => 5%
   */
  minScale?: number
  /**
   * 变换的时候是否使用动画过度，缩放的时候效果可以，移动的时候效果较差，false | true | `transform 0.1s`
   * - `false` 默认，不使用动画
   * - `true` 使用 `transform 0.1s`
   * - `transform 0.2s` 自定义动画
   */
  transition?: boolean | string
  /**
   * 是否打印transform的状态信息 dev 时使用，默认 `false`
   */
  showLog?: boolean
  /**
   * 是否使用允许键盘来缩放目标，默认 `false`
   */
  enableKeyboardScale?: boolean
  /**
   * 是否允许滑动滚轮时移动target，默认为 `false`
   * - 为 `true` 的时候，滚轮移动,target也会移动
   * - 为 `false` 的时候滚动不会移动 target
   */
  enableWheelSlide?: boolean
  /**
   * 拖拽时的鼠标样式，默认 `grab`
   */
  draggingCursorType?: string
  /**
   * 初始化时的 translate 值
   */
  defaultTranslate?: { x: number; y: number }
  /**
   * 初始化时的 scale 值
   */
  defaultScale?: number
  /**
   * 是否是容器元素
   */
  isWrapper?: boolean
  /**
   * 拖拽结束的时候触发
   */
  onTranslateChange?(translate: { x: number; y: number }): void
  /**
   * 缩放的时候触发
   */
  onScaleChange?(scale: number): void
}

// 拖动时去用来替换的透明图
const draggingImage = new Image()
draggingImage.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAQSURBVHgBAQUA+v8AAAAAAAAFAAFkeJU4AAAAAElFTkSuQmCC'

export default class FixedPointScaling {
  static wrapperScale: number = 1
  /**
   * 目标元素
   */
  private target: HTMLElement | null = null
  /**
   * 是否把滚轮时间绑定在target上，`true` 绑定在target上，`false`绑定在window上，默认为 `true`
   * - `true` 需要鼠标移动到target区域内才会缩放
   * - `false` 只要移动滚轮就会缩放
   */
  private bindWheelEventOnTarget: boolean = true
  /**
   * 允许window缩放
   */
  // private enableWindowScale: boolean = false
  /**
   * 是否正在拖拽
   */
  private isDragging: boolean = false
  /**
   * 拖拽开始 按下鼠标时的 translate 值
   */
  private draggingSrcTranslate = { x: 0, y: 0 }

  /**
   * 按下鼠标时鼠标相对浏览器窗口的位置
   */
  private cursorSrcPos = { x: 0, y: 0 } // left top
  /**
   * 当前缩放倍数
   */
  private scale: number = 1
  /**
   * 缩放step，默认为 0.1
   */
  private scaleStep: number = 0.1
  /**
   * 是否允许缩放
   */
  private enableScale: boolean = false
  /**
   * 滚轮滚动让 target 移动时,移动的 step (px)，默认 10
   */
  private translateStep: number = 10
  /**
   * 最小缩放比例，默认为 0.05
   */
  private minScale: number = 0.05
  /**
   * 是否使用动画过度，默认为 `none`
   */
  private transition: boolean | string = 'none'
  /**
   * 是否显示transform的状态信息 dev 时使用，默认为 `false`
   */
  private showLog: boolean = false
  /**
   * 是否使用允许键盘来缩放目标，默认为 `false`
   */
  private enableKeyboardScale: boolean = false
  /**
   * 未拖拽时的鼠标样式
   */
  private normalCursorType: string = 'default'
  /**
   * 拖拽时的鼠标样式，默认为为 `grab`
   */
  private draggingCursorType: string = 'grab'
  /**
   * 是否允许滑动滚轮时移动target，默认为 `false`
   * - 为 `true` 的时候，滚轮移动,target也会移动
   * - 为 `false` 的时候滚动不会移动 target
   */
  private enableWheelSlide?: boolean = false
  /**
   * 是否是容器元素，默认 false
   */
  private isWrapper: boolean = false
  /**
   * 当前的 translate
   */
  public translate = { x: 0, y: 0 }
  /**
   * 拖拽结束的时候触发
   */
  private onTranslateChange:
    | ((translate: { x: number; y: number }) => void)
    | undefined = undefined
  /**
   * 缩放的时候触发
   */
  private onScaleChange: ((scale: number) => void) | undefined = undefined
  private mapBooleanOptions(op: boolean | undefined, defaultValue: boolean) {
    if (op === true) return true
    if (op === false) return false
    return defaultValue
  }
  /**
   * 打印
   */
  private log(...args: any[]) {
    if (this.showLog) {
      console.log(...args)
    }
  }
  constructor(options: IOptions) {
    this.init(options)
    this.run()
  }
  /**
   * 初始化一些信息
   */
  private init(options: IOptions) {
    if (!(options.target instanceof HTMLElement)) {
      throw new Error('请绑定容器')
    }
    this.target = options.target
    this.bindWheelEventOnTarget = this.mapBooleanOptions(
      options.bindWheelEventOnTarget,
      true,
    )
    this.enableScale = this.mapBooleanOptions(options.enableScale, false)
    this.scaleStep =
      typeof options.scaleStep === 'number' ? options.scaleStep : 0.1
    this.translateStep =
      typeof options.translateStep === 'number' ? options.translateStep : 10
    this.minScale = options.minScale || 0.05
    this.showLog = this.mapBooleanOptions(options.showLog, false)
    this.onTranslateChange = options.onTranslateChange
    this.onScaleChange = options.onScaleChange
    this.enableKeyboardScale = this.mapBooleanOptions(
      options.enableKeyboardScale,
      false,
    )
    this.enableWheelSlide = this.mapBooleanOptions(
      options.enableWheelSlide,
      false,
    )
    this.isWrapper = this.mapBooleanOptions(options.isWrapper, false)
    this.scale =
      typeof options.defaultScale === 'number' ? options.defaultScale : 1
    this.translate =
      typeof options.defaultTranslate === 'object'
        ? options.defaultTranslate
        : { x: 0, y: 0 }

    if (options.draggingCursorType)
      this.draggingCursorType = options.draggingCursorType
    if (options.transition === false || options.transition === void 0)
      this.transition = 'none'
    else {
      if (typeof this.transition === 'string') {
        this.transition = options.transition
      } else {
        this.transition = 'transform 0.1s'
      }
    }
    this.target.style.transformOrigin = '0 0' // origin 设置为左上角
    this.target.style.transition = this.transition as string
    this.target.draggable = true
    this.applyTransform()
  }
  /**
   * 开始运行
   */
  private run() {
    this.applyListeners()
  }
  /**
   * 拖拽开始
   */
  private onDragStart = (e: DragEvent) => {
    e.stopPropagation()
    this.log('dragstart', e)
    const target = this.target
    this.normalCursorType = target!.style.cursor
    // 删除拖拽时的虚框
    e.dataTransfer!.setDragImage(draggingImage, 0, 0)
    e.dataTransfer!.effectAllowed = 'move'
    this.isDragging = true
    this.draggingSrcTranslate = { ...this.translate }
    this.cursorSrcPos = {
      x: e.clientX,
      y: e.clientY,
    }
  }
  /**
   * 拖拽
   */
  private onDrag = (e: DragEvent) => {
    e.stopPropagation()
    e.preventDefault()
    this.log('drag', e)
    if (this.isDragging) {
      const cursorCurrentPos = {
        x: e.clientX,
        y: e.clientY,
      }
      // 负值往左，正值往右
      if (this.isWrapper) {
        this.translate = {
          x:
            this.draggingSrcTranslate.x +
            cursorCurrentPos.x -
            this.cursorSrcPos.x,
          y:
            this.draggingSrcTranslate.y +
            cursorCurrentPos.y -
            this.cursorSrcPos.y,
        }
      } else {
        this.translate = {
          x:
            this.draggingSrcTranslate.x +
            (cursorCurrentPos.x - this.cursorSrcPos.x) /
              FixedPointScaling.wrapperScale,
          y:
            this.draggingSrcTranslate.y +
            (cursorCurrentPos.y - this.cursorSrcPos.y) /
              FixedPointScaling.wrapperScale,
        }
      }

      this.applyTransform()
    }
  }
  private onDragOver = (e: DragEvent) => {
    // 防止 drag 事件的最后一次触发鼠标位置是 0
    e.preventDefault()
    e.stopPropagation()
  }
  /**
   * 拖拽结束
   */
  private onDragEnd = (e: DragEvent) => {
    e.stopPropagation()
    this.isDragging = false
    this.onTranslateChange && this.onTranslateChange(this.translate)
    this.log('dragend', e)
  }
  /**
   * mousemove事件
   */
  private onMouseMove = (e: MouseEvent) => {}
  /**
   * 滚轮在目标区域内滚动
   */
  private onWheel = (e: WheelEvent) => {
    if (this.enableScale && e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      if (this.bindWheelEventOnTarget && !this.checkCursorInTarget(e)) {
        this.log('鼠标不在 target 区域内')
        if (e.deltaY < 0) this.onScaleUp!()
        else this.onScaleDown!()
        return
      }
      const cursorPos = {
        x: e.clientX,
        y: e.clientY,
      }
      // 上滑，放大
      if (e.deltaY < 0) {
        this.onScaleUp!(cursorPos)
      } else {
        this.onScaleDown!(cursorPos)
      }
    }
  }
  /**
   * 在window窗口滚轮滚动
   */
  private onWindowWheel = (e: WheelEvent) => {
    // e.preventDefault()
    if (!e.ctrlKey) {
      // 允许滚轮
      let horizontalFlag = 0,
        verticalFlag = 0
      if (e.deltaX < 0) horizontalFlag = -1
      else if (e.deltaX > 0) horizontalFlag = 1
      if (e.deltaY < 0) verticalFlag = -1
      else if (e.deltaY > 0) verticalFlag = 1
      this.onTranslate!(
        this.translate.x + horizontalFlag * this.translateStep,
        this.translate.y + verticalFlag * this.translateStep,
      )
    }
  }
  /**
   * 键盘事件
   */
  private onKeyDown = (e: KeyboardEvent) => {
    this.log('onKeyDown pressed: ', e.code)
    if (this.enableScale && e.ctrlKey) {
      if (e.code === 'NumpadAdd' || e.code === 'Equal') {
        e.preventDefault()
        this.onScaleUp!()
      } else if (e.code === 'NumpadSubtract' || e.code === 'Minus') {
        e.preventDefault()
        this.onScaleDown!()
      } else if (e.code === 'Numpad0' || e.code === 'Digit0') {
        e.preventDefault()
        this.resetTransform()
      }
    }
  }
  /**
   * 普通放大，使用键盘或者滚轮不在target区域内部
   * - `base.x` 基点相对于浏览器窗口左侧的距离 left
   * - `base.y` 基点相对于浏览器窗口顶部的距离 top
   */
  public onScaleUp = (base?: { x: number; y: number }) => {
    const target = this.target
    base =
      typeof base === 'object'
        ? base
        : {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          }
    const boxEleRect = target!.getBoundingClientRect()
    // transform origin 在屏幕中位置
    const originPos = {
      x: boxEleRect.left,
      y: boxEleRect.top,
    }
    // 缩放前的相对位置
    const cursorRelativeBasePosBefore = {
      x: Math.round((base.x - originPos.x) / this.scale),
      y: Math.round((base.y - originPos.y) / this.scale),
    }
    // 带放大比例的位置
    const cursorRelativePosBefore = {
      x: base.x - originPos.x,
      y: base.y - originPos.y,
    }
    this.scale = this.scale + this.scaleStep
    // 缩放后的相对位置
    const cursorRelativePosAfter = {
      x: cursorRelativeBasePosBefore.x * this.scale,
      y: cursorRelativeBasePosBefore.y * this.scale,
    }
    const deltaX =
      (cursorRelativePosAfter.x - cursorRelativePosBefore.x) /
      (this.isWrapper ? 1 : FixedPointScaling.wrapperScale)
    const deltaY =
      (cursorRelativePosAfter.y - cursorRelativePosBefore.y) /
      (this.isWrapper ? 1 : FixedPointScaling.wrapperScale)
    this.translate = {
      x: Math.round(this.translate.x - deltaX),
      y: Math.round(this.translate.y - deltaY),
    }
    this.applyTransform()
    this.onScaleChange && this.onScaleChange(parseFloat(this.scale.toFixed(2)))
    if (this.isWrapper) {
      FixedPointScaling.wrapperScale = this.scale
    }
  }
  /**
   * 普通缩小，使用键盘或者滚轮不在target区域内部
   * - `base.x` 基点相对于浏览器窗口左侧的距离 left
   * - `base.y` 基点相对于浏览器窗口顶部的距离 top
   */
  public onScaleDown = (base?: { x: number; y: number }) => {
    const target = this.target
    base =
      typeof base === 'object'
        ? base
        : {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          }
    const boxEleRect = target!.getBoundingClientRect()
    // transform origin 在屏幕中位置
    const originPos = {
      x: boxEleRect.left,
      y: boxEleRect.top,
    }
    // 缩放前的相对位置
    const cursorRelativeBasePosBefore = {
      x: Math.round((base.x - originPos.x) / this.scale),
      y: Math.round((base.y - originPos.y) / this.scale),
    }
    // 带放大比例的位置
    const cursorRelativePosBefore = {
      x: base.x - originPos.x,
      y: base.y - originPos.y,
    }
    if (this.scale - this.scaleStep > this.minScale) {
      this.scale = this.scale - this.scaleStep
      // 缩放后的相对位置
      const cursorRelativePosAfter = {
        x: cursorRelativeBasePosBefore.x * this.scale,
        y: cursorRelativeBasePosBefore.y * this.scale,
      }
      const deltaX =
        (cursorRelativePosBefore.x - cursorRelativePosAfter.x) /
        (this.isWrapper ? 1 : FixedPointScaling.wrapperScale)
      const deltaY =
        (cursorRelativePosBefore.y - cursorRelativePosAfter.y) /
        (this.isWrapper ? 1 : FixedPointScaling.wrapperScale)
      this.translate = {
        x: Math.round(this.translate.x + deltaX),
        y: Math.round(this.translate.y + deltaY),
      }
      this.applyTransform()
      this.onScaleChange &&
        this.onScaleChange(parseFloat(this.scale.toFixed(2)))
      if (this.isWrapper) {
        FixedPointScaling.wrapperScale = this.scale
      }
    }
  }
  /**
   * 移动target
   * - `nextX` 接下来的 translateX
   * - `nextY` 接下来的 translateY
   */
  public onTranslate = (nextX: number, nextY: number) => {
    this.translate = {
      x: nextX,
      y: nextY,
    }
    this.applyTransform()
    this.onTranslateChange && this.onTranslateChange(this.translate)
  }
  private checkCursorInTarget(e: WheelEvent): boolean {
    const { left, top, width, height } = this.target!.getBoundingClientRect()
    const cursorPos = {
      x: e.clientX,
      y: e.clientY,
    }
    if (
      cursorPos.x < left ||
      cursorPos.x > left + width ||
      cursorPos.y < top ||
      cursorPos.y > top + height
    )
      return false
    return true
  }

  /**
   * 绑定监听器
   */
  private applyListeners() {
    const target = this.target
    target!.addEventListener('dragstart', this.onDragStart)
    target!.addEventListener('drag', this.onDrag)
    target!.addEventListener('dragover', this.onDragOver)
    target!.addEventListener('dragend', this.onDragEnd)
    target!.addEventListener('mousemove', this.onMouseMove)
    if (this.enableKeyboardScale) {
      window.addEventListener('keydown', this.onKeyDown)
    }
    if (this.bindWheelEventOnTarget) {
      if (this.enableScale)
        target!.addEventListener('wheel', this.onWheel, {
          passive: false,
        })
    } else {
      if (this.enableScale)
        window.addEventListener('wheel', this.onWheel, {
          passive: false,
        })
    }
    // 是否禁止全局缩放
    if (this.enableWheelSlide) {
      window.addEventListener('wheel', this.onWindowWheel, {
        passive: false,
      })
    }
  }
  /**
   * 移除事件监听器
   */
  public removeListeners() {
    const target = this.target
    target!.removeEventListener('dragstart', this.onDragStart!)
    target!.removeEventListener('drag', this.onDrag!)
    target!.removeEventListener('dragover', this.onDragOver!)
    target!.removeEventListener('dragend', this.onDragEnd!)
    target!.removeEventListener('mousemove', this.onMouseMove!)
    if (this.enableWheelSlide) {
      window.removeEventListener('wheel', this.onWindowWheel!)
    }
    if (this.enableKeyboardScale) {
      window.removeEventListener('keydown', this.onKeyDown!)
    }
    if (this.bindWheelEventOnTarget) {
      if (this.enableScale) target!.removeEventListener('wheel', this.onWheel!)
    } else {
      if (this.enableScale) window!.removeEventListener('wheel', this.onWheel!)
    }
    this.log('listeners removed')
  }
  /**
   * 应用transform属性
   */
  private applyTransform() {
    this.target!.style.transform = `matrix(${this.scale}, 0, 0, ${this.scale}, ${this.translate.x}, ${this.translate.y})`
    this.log(
      `translateX: ${this.translate.x}, translateY: ${this.translate.y}, scale: ${this.scale}`,
    )
  }
  /**
   * 重置 translate scale
   */
  public resetTransform() {
    this.scale = 1
    this.translate = { x: 0, y: 0 }
    this.target!.style.transform = `matrix(${this.scale}, 0, 0, ${this.scale}, ${this.translate.x}, ${this.translate.y})`
    if (this.isWrapper) FixedPointScaling.wrapperScale = 1
    this.onTranslateChange && this.onTranslateChange(this.translate)
    this.onScaleChange && this.onScaleChange(parseFloat(this.scale.toFixed(2)))
    this.log(
      `translateX: ${this.translate.x}, translateY: ${this.translate.y}, scale: ${this.scale}`,
    )
  }
}

// 修改拖拽时的鼠标样式
// 考虑用户自定义样式
