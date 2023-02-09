![](https://qiniu1.lxfriday.xyz/feoffer/1675935749458_35d72d2d-3869-4850-959d-049f7b581b70.png)

# fixed-point-scaling

仅需一行代码，就可以让你的 html 元素支持拖拽缩放

## 使用

在 `/build` 文件夹下选择适合你的模块文件。你可以在 `/public` 文件夹下找到应用案例。

```html
<script src="./index.iife.js"></script>
<script>
  const fixedPointScaling = new FixedPointScaling({
    target: document.querySelector('.box'),
  })
</script>
```

最初级的配置，给 `FixedPointScaling` 构造函数传递 `target` 属性，即可初始化，`target` 表示你将要操作的目标元素。

初始化之后的默认元素支持鼠标拖拽效果，如果要支持缩放，需要添加额外的配置参数。

如果需要支持 **ctrl+滚轮** 实现缩放：

```js
const fixedPointScaling = new FixedPointScaling({
  target: document.querySelector('.box'),
  enableScale: true,
})
```

如果需要支持 **ctrl+ 加号、减号** 缩放：

```js
const fixedPointScaling = new FixedPointScaling({
  target: document.querySelector('.box'),
  enableScale: true,
  enableKeyboardScale: true,
})
```

## 详细配置

```ts
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
```

## 实例方法

```ts
export default class FixedPointScaling {
  translate: {
    x: number
    y: number
  }
  /**
   * 普通放大，使用键盘或者滚轮不在target区域内部
   * - `base.x` 基点相对于浏览器窗口左侧的距离 left
   * - `base.y` 基点相对于浏览器窗口顶部的距离 top
   */
  onScaleUp: (base?: { x: number; y: number }) => void
  /**
   * 普通缩小，使用键盘或者滚轮不在target区域内部
   * - `base.x` 基点相对于浏览器窗口左侧的距离 left
   * - `base.y` 基点相对于浏览器窗口顶部的距离 top
   */
  onScaleDown: (base?: { x: number; y: number }) => void
  /**
   * 移动target
   * - `nextX` 接下来的 translateX
   * - `nextY` 接下来的 translateY
   */
  onTranslate: (nextX: number, nextY: number) => void
  /**
   * 移除事件监听器
   */
  removeListeners(): void
  /**
   * 重置 translate scale
   */
  resetTransform(): void
}
```

## Demo

- [1box](https://qiniu1.lxfriday.xyz/feoffer/1675935874654_7faf40f2-54ad-4dbe-bf6c-1eb0c2b115e7.html)
- [2box](https://qiniu1.lxfriday.xyz/feoffer/1675935885408_038351ef-7c1a-420f-b83f-535f27e51485.html)
- [100 个](https://qiniu1.lxfriday.xyz/feoffer/1675935895983_64ab16fc-da10-41b1-b4a3-8941f06afd6e.html)
- [500 个 box](https://qiniu1.lxfriday.xyz/feoffer/1675935904790_53d4554a-3da6-4975-afd0-ca8a0f7d5c85.html)
- [2000 个 box 卡顿](https://qiniu1.lxfriday.xyz/feoffer/1675935913810_2c9be723-9598-4768-997b-4b11de2cc048.html)
