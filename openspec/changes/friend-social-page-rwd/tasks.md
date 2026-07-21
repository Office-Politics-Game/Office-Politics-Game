## 1. 固定畫布模型測試與實作

- [x] 1.1 以 TDD 為 `Dual fixed landscape canvases`、`Whole-canvas viewport fitting` 與 `Resolve a page-specific fixed canvas model` 新增 `tests/friend-social-rwd.test.mjs`，覆蓋 1024px 邊界、兩檔精確尺寸、寬高限制縮放、scale 上限及無效輸入正規化；執行 `node tests/friend-social-rwd.test.mjs` 並確認因 `src/composables/UseFriendSocialCanvas.js` 尚不存在而 RED。
- [x] 1.2 在 `src/composables/UseFriendSocialCanvas.js` 實作純 resolver 與 reactive resize composable，使所有模型欄位符合 Implementation Contract 且 resize 不保留過期尺寸；執行 `node tests/friend-social-rwd.test.mjs` 並確認 GREEN。

## 2. 社交頁固定雙欄畫布

- [x] 2.1 更新 `tests/friend-chat-layout.test.mjs` 與 `tests/friend-social-rwd.test.mjs` 的 `Stable two-column social layout`、`Render a scaled frame around fixed-pixel content`、`Keep social navigation and chat in two fixed columns` 契約，要求縮放 frame、固定像素主面板、兩檔欄寬、單列 tabs 與移除 `md` 上下重排；執行兩個測試並確認舊 `FriendView` 造成預期 RED。
- [x] 2.2 在 `src/views/FriendView.vue` 接入 friend-specific canvas model，建立縮放 frame 與固定 canvas，套用 920 x 520px／1180 x 688px 主面板及 340+580px／420+760px 雙欄，保留背景、返回動畫與既有資料生命週期；執行 `node tests/friend-social-rwd.test.mjs` 與 `node tests/friend-chat-layout.test.mjs` 並確認 GREEN。

## 3. 內容邊界與 Square UI 狀態

- [x] 3.1 以 TDD 擴充 `tests/friend-chat-layout.test.mjs` 與 `tests/friend-social-rwd.test.mjs` 的 `Bounded scrolling and long content`、`Landscape orientation and interaction preservation`、`Preserve Square UI states with breakpoint-specific fixed dimensions` 契約，要求 tabs 不橫向捲動、固定像素訊息泡泡、長文字安全處理、chat body 單獨捲動及 focus-visible/disabled 狀態；執行兩個測試並確認現有好友元件造成預期 RED。
- [x] 3.2 最小化調整必要的 `src/components/friend/*.vue` 尺寸、padding、overflow、文字截斷、訊息換行與按鈕狀態，使兩檔畫布都不產生頁面級溢出且不修改事件或資料流程；執行 `node tests/friend-social-rwd.test.mjs` 與 `node tests/friend-chat-layout.test.mjs` 並確認 GREEN。

## 4. 完整驗證

- [x] 4.1 執行 `node tests/friend-social-rwd.test.mjs`、`node tests/friend-chat-layout.test.mjs` 與 `npm run build`，並以 source review 確認沒有第三 breakpoint、`FriendPanel`、store、API、Socket、route 或 backend 變更；人工檢查 960 x 540、1280 x 720、小型橫向縮放與直向旋轉提示後，確認全部驗收條件成立。
