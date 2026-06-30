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

## RWD 字級

| Token | 手機 ≤ 767px | 平板 768-1199px | 電腦 ≥ 1200px | 用途 |
| --- | ---: | ---: | ---: | --- |
| `--text-xs` | 12px | 13px | 13px | Caption、註解、Label |
| `--text-sm` | 14px | 14px | 15px | 按鈕、表格、輔助文字 |
| `--text-md` | 16px | 17px | 18px | 一般內文 |
| `--text-lg` | 18px | 20px | 22px | 小標題、導覽主項 |
| `--text-xl` | 24px | 30px | 36px | 區塊標題 |
| `--text-display` | 36px | 48px | 64px | Hero 主標 |

## Glass Button

預設狀態：

- 最小寬度 `144px`，最小高度 `48px`。
- Padding `12px 22px`。
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

- 頁面最大內容寬度 `1180px`，桌面左右安全距離 `16px`。
- 主要背景採白色到 `#F4F7FB` 的淺色漸層，可搭配 `rgba(134, 179, 224, 0.36)` 淡藍 radial gradient。
- 深色 Hero 採 `#001332` 到 `#465563` 的漸層。
- 玻璃區塊可使用 `rgba(255, 255, 255, 0.74)`、`blur(16px)` 與淡藍灰邊框。
- 內文預設行高 `1.65`。

## 響應式行為

- `768px` 起套用平板字級，`1200px` 起套用桌面字級。
- `760px` 以下，多欄 Grid 收為單欄。
- 行動版頁面左右安全距離縮為 `10px`。
- 行動版按鈕寬度為 `100%`。
- 表格在行動版使用 `--text-sm`。
- 大型裝飾背景在行動版縮小並移至右上，避免遮擋內容。

## 驗收檢查

- 色彩只能引用本規範 token 或由它們衍生的透明值。
- 所有互動元件需涵蓋 default、hover、active、focus-visible 與 disabled 狀態。
- UI 不得出現未經核准的圓角。
- 手機、平板與桌面字級需符合表格。
- 手機版不得產生水平版面溢出。
