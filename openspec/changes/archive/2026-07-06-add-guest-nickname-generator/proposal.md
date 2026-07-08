## Why

目前訪客登入只從固定暱稱清單抽選，名稱數量少且重複感高。改成短前綴與中文名詞後綴的組合式產生器，可以用可維護的素材池提供更豐富的訪客暱稱。

## What Changes

- 將訪客暱稱來源從固定完整暱稱清單改為 50 個短前綴與 50 個中文名詞後綴組合，共 2500 種基礎組合。
- 訪客登入彈窗開啟時會自動取得一個組合暱稱，骰子按鈕會重新產生一個組合暱稱。
- 產生器不記錄已骰過的組合，因此同一使用者重複按骰子時可能再次看到同一組名稱。
- 保留手動輸入暱稱、空白驗證、輸入長度限制與既有訪客建立 API 流程。
- 保留後端玩家名稱唯一性檢查，不新增後端 API、資料庫欄位或資料表。
- 更新仍引用舊訪客暱稱清單的前端 demo 程式，避免移除舊清單後造成建置失敗。

## Non-Goals

- 不追蹤已骰過的名稱，也不使用 localStorage 或資料庫保存骰名紀錄。
- 不查詢全站資料庫來排除已建立玩家名稱；撞名仍由既有建立訪客流程回傳錯誤。
- 不新增數字尾碼、權重抽選、敏感詞審查或管理後台。
- 不調整訪客登入彈窗的視覺版面、按鈕樣式、頭像選擇或後端玩家建立合約。

## Capabilities

### New Capabilities

- guest-nickname-generator: 定義訪客登入使用的 50x50 組合式假名產生能力。

### Modified Capabilities

(none)

## Impact

- Affected specs: guest-nickname-generator
- Affected code:
  - New: none
  - Modified: src/constants/guestOptions.js, src/components/login/GuestLoginModal.vue, src/views/CardPlayTestView.vue
  - Removed: none
