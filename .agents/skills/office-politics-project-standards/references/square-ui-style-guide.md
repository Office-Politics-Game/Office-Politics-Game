# Square UI 視覺規範

本文件是 Office Politics Game 前端視覺與互動的正式規範。所有 UI 預設採無圓角的方形設計。

## 色彩 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--brand-primary` | `#86B3E0` | Corporate Sky Blue，輔助背景與預設識別 |
| `--brand-hover` | `#0046F4` | Royal Blue，Hover 與 CTA 強調 |
| `--brand-active` | `#465563` | Charcoal Blue Gray，Click、Active 與主要文字 |
| `--brand-focus` | `rgba(0, 70, 244, 0.24)` | Focus ring |
| `--brand-disabled` | `#A0A6B3` | Disabled 與次要文字 |
| `--brand-navy` | `#001332` | Deep Navy，深色背景與 Header |
| `--gray-100` | `#D6D7DC` | 淺灰 |
| `--gray-200` | `#A0A6B3` | 冷灰 |
| `--gray-300` | `#8C96A5` | 中灰 |
| `--gray-400` | `#6F7B8A` | 深灰 |
| `--gray-500` | `#465563` | Charcoal Blue Gray |

## Surface Token

```css
--surface-glass: rgba(255, 255, 255, 0.3);
--surface-glass-hover: rgba(255, 255, 255, 0.72);
--surface-glass-active: rgba(70, 85, 99, 0.88);
--shadow: 0 20px 60px rgba(0, 19, 50, 0.14);
```

## 方形介面

- `--radius-md` 與 `--radius-lg` 固定為 `0px`。
- 按鈕、卡片、區塊、表格、面板與預覽容器預設 `border-radius: 0`。
- 未經使用者明確同意，不新增圓角膠囊、圓角卡片或圓形主要控制項。

## 字體

```css
--font-sans: Inter, "Noto Sans TC", "PingFang TC",
  "Microsoft JhengHei", Arial, sans-serif;
```

建議字重：

- Regular：400
- Medium：500
- SemiBold：600
- Bold：700
- Black：900

## 橫向字級

遊戲只支援橫向畫面，字級只分為兩檔，並使用固定 `px` 尺寸。不得使用 `clamp()`、`vw` 或 `vh` 讓文字隨 viewport 連續縮放。

| Token | 小型橫向 `< 1024px` | 標準橫向 `≥ 1024px` | 用途 |
| --- | ---: | ---: | --- |
| `--text-xs` | 12px | 13px | Caption、註解、Label |
| `--text-sm` | 14px | 15px | 按鈕、表格、輔助文字 |
| `--text-md` | 16px | 18px | 一般內文 |
| `--text-lg` | 18px | 22px | 小標題、導覽主項 |
| `--text-xl` | 24px | 36px | 區塊標題 |
| `--text-display` | 36px | 64px | Hero 主標 |

## Glass Button

預設狀態：

- 小型橫向固定寬高 `144px × 44px`；標準橫向固定寬高 `160px × 48px`。
- 小型橫向 Padding `10px 18px`；標準橫向 Padding `12px 22px`。
- 使用半透明白色 `--surface-glass`、玻璃模糊與細白邊框。
- 文字使用 `--brand-navy`、粗體與 `0.04em` 字距。
- 使用內部高光與深藍陰影。

互動狀態：

- Hover：背景與邊框使用 `--brand-hover`，文字白色，向上位移 `1px`。
- Active / Click：背景與邊框使用 `--brand-active`，文字白色，向下位移 `1px`。
- Focus Visible：移除預設 outline，使用 `0 0 0 5px var(--brand-focus)` focus ring。
- Disabled：不可點擊，白色文字、`rgba(160, 166, 179, 0.62)` 背景、透明邊框且無陰影。
- 動畫時間以 `0.18s ease` 為基準，涵蓋 transform、background、color、shadow 與 border-color。

## 版面與背景

- 小型橫向使用 `960px × 540px` 固定設計畫布；標準橫向使用 `1280px × 720px` 固定設計畫布。
- 畫布內容安全距離固定為：小型橫向 `10px`，標準橫向 `16px`。
- 一般內容區在標準橫向畫布中的固定寬度為 `1180px`；小型橫向畫布中的固定寬度為 `920px`。
- 主要背景採白色到 `#F4F7FB` 的淺色漸層，可搭配 `rgba(134, 179, 224, 0.36)` 淡藍 radial gradient。
- 深色 Hero 採 `#001332` 到 `#465563` 的漸層。
- 玻璃區塊可使用 `rgba(255, 255, 255, 0.74)`、`blur(16px)` 與淡藍灰邊框。
- 內文預設行高 `1.65`。

## 響應式行為

- 遊戲僅支援橫向，不提供直向版面；偵測到直向時應顯示旋轉裝置提示，不重排遊戲內容。
- Breakpoint 只允許兩檔：viewport 寬度 `< 1024px` 使用小型橫向規格，`≥ 1024px` 使用標準橫向規格。
- 元件寬、高、間距、字級與定位預設使用固定 `px`；不得以 `vw`、`vh`、百分比或 `clamp()` 作為元件尺寸的主要計算方式。
- viewport 小於設計畫布時，允許整個遊戲畫布依寬高限制等比例縮放；不得個別壓縮、換行重排或將多欄改為單欄。
- viewport 大於設計畫布時，畫布維持固定尺寸並水平、垂直置中；多餘空間由背景延伸填滿。
- 按鈕維持所屬斷點的固定寬高，不使用 `width: 100%`。
- 表格固定使用 `--text-sm`，欄寬由各斷點明確指定。
- 大型裝飾背景使用各斷點明確指定的固定尺寸與位置，不隨 viewport 連續縮放。

## 驗收檢查

- 色彩只能引用本規範 token 或由它們衍生的透明值。
- 所有互動元件需涵蓋 default、hover、active、focus-visible 與 disabled 狀態。
- UI 不得出現未經核准的圓角。
- 小型橫向與標準橫向字級需符合表格，且不得出現第三組 breakpoint。
- 直向畫面必須顯示旋轉提示；橫向畫面不得因個別元件尺寸造成水平或垂直溢出。
- 檢查元件樣式不得以 `clamp()`、`vw`、`vh` 或 `width: 100%` 規避固定尺寸規格。
