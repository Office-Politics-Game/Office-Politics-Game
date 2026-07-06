## 1. 後端 Profile API

- [x] 1.1 依照 `Use a dedicated member profile endpoint` 建立 `GET /api/profile` 路由、controller 與 service，完成 `Member profile API`：有效 Bearer token 會回傳目前會員的 `profile` DTO；以後端 profile API 測試或手動 curl 驗證 200 response。
- [x] 1.2 依照 `Keep Supabase access server-side` 重用後端 Supabase Auth 驗證邏輯，確保缺 token 或無效 token 回傳 401、有效 token 但無玩家資料回傳 404；以後端測試覆蓋 401 與 404 response。
- [x] 1.3 依照 `Read existing player fields only` 將 `profile` DTO 限制為頁面安全欄位，且不包含 `account` 與 `authUserId`；以後端測試斷言 response body 欄位集合。

## 2. 前端資料來源與頁面狀態

- [x] 2.1 建立前端 profile API 封裝，讓會員頁面可用 auth token 呼叫 `GET /api/profile`；以元件行為檢查或 mock API 測試驗證 request header 帶有 Bearer token。
- [x] 2.2 依照 `Store profile page data in profileStore` 建立 `profileStore`，完成 `Profile page Pinia state`：store 持有 normalized profile display data、`isLoading`、`errorMessage` 與會員/訪客載入 actions；以 store 單元檢查或元件 mock 驗證會員與訪客資料都會寫入 profile store。
- [x] 2.3 在 `/profile` 完成 `Member profile page data source`：會員載入時透過 `profileStore` 只顯示簡化 loading 動畫，成功後顯示 API profile，失敗時顯示錯誤狀態與登入引導且不顯示假玩家資料；以手動流程或前端測試驗證三種狀態。
- [x] 2.4 在 `/profile` 完成 `Guest profile basic display`：無會員 token 但有 `guestPlayer` 或 `playerStore.currentPlayer` 時透過 `profileStore` 顯示訪客基本資料，且不呼叫 `GET /api/profile`；以 mock API 或瀏覽器 Network 手動檢查驗證。
- [x] 2.5 在 `/profile` 完成 `Anonymous profile state`：無會員且無訪客資料時不顯示需要玩家身分彈窗，不渲染預設假玩家，且登入引導只在資料請求失敗後出現；以清空 localStorage 後開啟 `/profile` 的手動檢查驗證。

## 3. 訪客鎖定與唯讀互動

- [x] 3.1 依照 `Use mixed guest locking on profile` 完成 `Guest restricted profile areas`：訪客切到對戰紀錄、成就或收藏分頁時顯示登入提示與既有登入入口；以訪客流程手動檢查三個分頁驗證。
- [x] 3.2 完成 `Guest restricted profile areas` 的編輯入口限制：訪客啟用暱稱、稱號或自我介紹等可編輯控制時，只看到登入提示或 disabled control，不出現可儲存表單；以訪客流程手動檢查所有 profile edit controls 驗證。
- [x] 3.3 依照 `Read existing player fields only` 調整稱號、地區與自我介紹顯示，使缺少資料庫欄位時顯示「尚未設定」或清楚的未開放狀態；以會員與訪客各一次 profile 檢查驗證文字不再冒充真實資料。

## 4. 驗證與回歸

- [x] 4.1 執行 `npm run build`，驗證 profile 資料載入與鎖定 UI 變更沒有破壞前端建置。
- [x] 4.2 在 `server/` 執行 `npm test`，驗證新增或更新的後端 profile API 測試通過；若環境缺少資料庫或 Supabase 變數，記錄阻塞原因與已完成的替代手動驗證。
- [x] 4.3 檢查 `/profile` 會員、訪客、匿名三條手動流程，確認 `Member profile page data source`、`Guest profile basic display`、`Guest restricted profile areas` 與 `Anonymous profile state` 的可觀察行為都符合 spec。
