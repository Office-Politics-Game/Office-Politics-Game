## Context

`/friend` 目前以 `w-screen`、`h-[92vh]`、`w-[94vw]`、`md:flex-row` 與百分比欄寬同時控制版面，小螢幕會改成上下排列。這和 Square UI 只允許 960 x 540px、1280 x 720px 兩檔橫向固定畫布的規則衝突，也讓好友列表、聊天訊息與輸入區的捲動邊界隨 viewport 改變。

此 change 只處理社交頁 UI。好友與聊天 stores、HTTP API、Socket.IO、路由與後端契約保持不變。全域 `RotateDeviceNotice` 已負責直向提示，因此社交頁只需維持橫向畫布。

## Goals / Non-Goals

**Goals:**

- 以可測試的固定資料模型解析 960 x 540px 與 1280 x 720px 畫布。
- viewport 小於畫布時只縮放完整畫布，內部元件仍使用目前斷點的固定像素尺寸。
- 兩檔皆維持左側社交功能區與右側聊天區，並固定各區捲動責任。
- 保留 Square UI、鍵盤焦點、reduced-motion 與所有既有功能狀態。

**Non-Goals:**

- 不修改 `FriendPanel`、store、API、Socket、router、backend 或 database。
- 不提供直向重排版面。
- 不建立全站共用畫布框架。
- 不新增未讀、已讀、typing、附件、群聊或其他社交能力。
- 不進行好友元件的全面視覺重構。

## Decisions

### Resolve a page-specific fixed canvas model

新增 `src/composables/UseFriendSocialCanvas.js`，提供純函式 `resolveFriendSocialCanvas(viewportWidth, viewportHeight)` 與 Vue composable。純函式依 viewport 寬度選擇唯一斷點，回傳設計畫布、主面板、左右欄、縮放比例與縮放後尺寸；composable 只負責監聽 resize 並暴露 reactive model。

此方案讓縮放邊界能以 Node 測試直接驗證，同時保持 friend-specific，不形成全站框架。替代方案是在 `FriendView.vue` 內直接讀取 window，但會讓 view 同時承擔資料、動畫與 viewport 演算法，也較難測試。

### Render a scaled frame around fixed-pixel content

`FriendView` 外層維持 viewport 背景與置中責任；新增 frame 使用縮放後寬高保留版面空間，內層 canvas 使用固定設計寬高並以 transform scale 縮放。transform origin 固定在左上角，避免縮放後定位偏移。

小型模式使用 960 x 540px 畫布、920 x 520px 主面板、340px 左欄與 580px 右欄；標準模式使用 1280 x 720px 畫布、1180 x 688px 主面板、420px 左欄與 760px 右欄。替代方案是純 CSS viewport 單位，但無法同時依寬、高限制精確選出整體縮放比例，並會重新引入規範禁止的 viewport 單位。

### Keep social navigation and chat in two fixed columns

移除 `md:flex-row`、`max-h-[40%]` 與百分比欄寬，兩檔都採固定像素雙欄。社交 tabs 保持單列且可直接操作；每個 tab 內容自行垂直捲動。聊天 toolbar 與 composer 固定，只有 message body 垂直捲動。小型模式改成上下排列或全頁聊天的替代方案會違反固定畫布不重排規則。

### Preserve Square UI states with breakpoint-specific fixed dimensions

好友列、表單、邀請、封鎖與聊天元件只調整會導致溢出的尺寸、gap、padding、文字截斷及訊息泡泡寬度。小型與標準模式只使用 1024px breakpoint；按鈕維持固定尺寸，內容填滿容器僅用於非按鈕的內部排版。全面重做視覺會擴大範圍並增加功能回歸風險，因此不採用。

## Implementation Contract

#### Observable behavior

- viewport 寬度小於 1024px 時使用 960 x 540px 畫布；大於或等於 1024px 時使用 1280 x 720px 畫布。
- viewport 任一邊小於畫布時，縮放比例為 `min(viewportWidth / designWidth, viewportHeight / designHeight, 1)`，且不得放大超過 1。
- 縮放後畫布在 viewport 水平、垂直置中；兩檔都顯示固定雙欄。
- 小型欄寬為 340px 與 580px；標準欄寬為 420px 與 760px。
- 直向畫面由既有全域旋轉提示遮罩，社交頁不建立直向重排。
- 四個 tabs 不需要橫向捲動；列表內容與聊天訊息各自在指定區域垂直捲動。
- 聊天 toolbar 與 composer 在長對話中持續可見。
- 長名稱與狀態不改變欄寬；長訊息在固定像素最大寬度內換行。
- 既有載入、空資料、錯誤、登入限制、處理中、Realtime 重試、聊天送出與返回大廳行為維持不變。

#### Interface and data shape

- `resolveFriendSocialCanvas(viewportWidth, viewportHeight)` 回傳 `{ mode, designWidth, designHeight, panelWidth, panelHeight, leftColumnWidth, rightColumnWidth, scale, scaledWidth, scaledHeight }`。
- `mode` 只允許 `compact` 或 `standard`。
- `scale` 介於 0 與 1，所有尺寸皆為有限且非負的 number。
- `useFriendSocialCanvas()` 暴露 reactive canvas model 與供 `FriendView` 綁定的 frame/canvas style；它只監聽 viewport resize，不讀寫好友或聊天狀態。
- `FriendView` 使用 model 設定固定畫布與主面板 CSS custom properties，不將 viewport 單位當作內部元件主要尺寸。

#### Failure modes

- resize 後必須重新解析 mode 與 scale，不保留過期尺寸。
- viewport 尺寸為非有限值或負值時，resolver 將該值正規化為 0，不回傳 NaN、Infinity 或負尺寸。
- viewport 過小時允許完整畫布繼續縮小，不得用局部壓縮、第三 breakpoint 或直向重排取代整體縮放。
- 既有資料或 realtime 錯誤只在原 UI 狀態顯示，畫布 composable 不攔截或改寫錯誤。

#### Acceptance criteria

- `node tests/friend-social-rwd.test.mjs` 驗證斷點、精確尺寸、寬高限制縮放、scale 上限與無效輸入正規化。
- `node tests/friend-chat-layout.test.mjs` 驗證雙欄與聊天內部捲動契約。
- `npm run build` 成功。
- 人工檢查 960 x 540、1280 x 720、小於 960 x 540 的橫向 viewport 與代表性直向 viewport。
- Source review 確認沒有新增 store、API、Socket、route 或 backend 行為，且沒有第三個 responsive breakpoint。

#### Scope boundaries

- In scope: friend-specific canvas resolver/composable、`FriendView` 畫布組裝、必要的 friend component 固定尺寸與 overflow 樣式、兩個前端 Node 測試。
- Out of scope: `FriendPanel`、全域 font token 重構、其他頁面 RWD、任何資料契約或社交功能變更。

## Risks / Trade-offs

- [Risk] 低解析度 viewport 的整體縮放會讓文字變小。→ Mitigation: 保留 960 x 540px 小型畫布以降低縮小幅度。
- [Risk] transform 不影響一般 flow，可能造成置中或 overflow 計算錯誤。→ Mitigation: 使用縮放後尺寸的 frame 保留空間，canvas 固定由左上角縮放。
- [Risk] 既有測試綁定 `md` 重排 class。→ Mitigation: 先更新 RWD 測試並確認 RED，再移除舊 class。
- [Risk] 修改多個好友元件可能帶入視覺回歸。→ Mitigation: 只調整與固定尺寸、文字邊界、按鈕狀態及 overflow 直接相關的樣式。
