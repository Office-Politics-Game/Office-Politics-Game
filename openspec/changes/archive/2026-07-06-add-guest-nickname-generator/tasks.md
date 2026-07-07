## 1. 暱稱產生器資料與合約

- [x] 1.1 交付 Guest nickname generation pool：在 src/constants/guestOptions.js 保留 guestAvatars，新增 50 個 guestNamePrefixes、50 個 guestNameSuffixes 與 createGuestNickname()，且 createGuestNickname() 回傳一個前綴加一個後綴的非空字串；用內容檢查確認兩個陣列長度各為 50、基礎組合數為 2500、每個前綴不超過 4 個中文字。
- [x] 1.2 移除訪客登入對固定 guestNicknames 清單的依賴，同時保留目前仍需要的匯出項目不破壞其他模組；用 npm run build 驗證沒有未解析 import 或匯出錯誤。

## 2. 訪客登入流程整合

- [x] 2.1 交付 Guest login uses generated nicknames：在 src/components/login/GuestLoginModal.vue 讓暱稱欄位初始化時使用 createGuestNickname()，並讓骰子按鈕每次呼叫 createGuestNickname() 且清除既有錯誤訊息；用程式碼檢查與 npm.cmd run build 確認彈窗會使用產生器初始化與更新暱稱。
- [x] 2.2 保留訪客登入既有行為：手動輸入暱稱送出時仍以輸入值作為 createGuestPlayer 的 username，空白暱稱仍顯示「請輸入暱稱」，maxlength 仍為 20，頭像 avatarId 與 success emit 流程不變；用程式碼檢查與 npm.cmd run build 確認。

## 3. 相關引用與驗證

- [x] 3.1 更新 src/views/CardPlayTestView.vue 等仍引用 guestNicknames 的前端程式，使 demo 玩家名稱仍能取得可讀名稱且不依賴已移除的固定暱稱清單；用 npm run build 驗證所有前端引用可編譯。
- [x] 3.2 交付 Rolled combinations are not tracked：確認 createGuestNickname() 不讀寫 localStorage、不呼叫後端 API、不查詢資料庫、不保存已骰歷史，重複骰名只從同一 2500 組基礎組合抽選；用程式碼檢查確認沒有新增持久化或後端改動。
- [x] 3.3 完成整體驗證：執行 npm.cmd run build，並在 handoff 記錄訪客登入彈窗的程式碼檢查結果，包含開啟預設假名、骰子換名、手動輸入、空白驗證與撞名仍交由既有建立訪客 API 處理。
