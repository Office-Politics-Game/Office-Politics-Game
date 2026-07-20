## 1. 右側抽屜介面

- [x] 1.1 完成「固定尺寸覆蓋式右側抽屜」與 Right-edge drawer presentation：兩檔畫布分別使用 400px／480px 寬且不推擠牌桌；以樣式檢查驗證。
- [x] 1.2 完成「窄欄垂直內容流」與 Drawer content layout：規則採單欄、卡牌維持四欄，溢出只在抽屜內捲動；以內容結構檢查驗證。
- [x] 1.3 完成「獨立位移動畫」與「三分之一高度箭頭入口」：入口位於畫布高度三分之一並顯示 `ArrowLeft`，滑動只改變抽屜自身 transform；以樣式檢查與 GameStage 未套用 transition/transform 驗證。

## 2. 互動與驗證

- [x] 2.1 完成「透明欄外互動層」與 Drawer dismissal and focus behavior：關閉鍵、Escape、欄外點擊及 Tab 焦點循環符合契約；以程式路徑與鍵盤行為檢查驗證。
- [x] 2.2 執行 `npm.cmd run build` 驗證 Vue、Tailwind 與 Vite 編譯，並檢查 `git diff` 確認應用程式碼未超出 `src/components/game/ui/GameRulesModal.vue`。
- [x] 2.3 完成「獨立裁切揭露動畫」：將抽屜 transform 位移改為只作用於面板的 `clip-path` 揭露，並將入口圖示改為 `<` 造型的 `ChevronLeft`；以樣式搜尋確認抽屜進出場沒有 transform transition，並執行 `npm.cmd run build` 驗證。
- [x] 2.4 完成「底部三分之一高度半圓切換鈕」：同一顆按鈕在收合時貼右顯示 `<`、展開時貼住側欄左緣顯示 `>` 並可收合，移除標頭 X；以模板與焦點路徑檢查及 `npm.cmd run build` 驗證。
- [x] 2.5 同步側欄與切換鈕動畫：明確定義側欄 clip-path 的完整起訖狀態，兩者統一使用 `260ms ease`；以樣式檢查及 `npm.cmd run build` 驗證。
- [x] 2.6 將側欄與半圓切換鈕整合為同一個絕對定位容器並統一執行 `translateX()`，收合時只保留凸出的按鈕、展開時整組回到原位；以模板結構、動畫作用域與 `npm.cmd run build` 驗證。
- [x] 2.7 更新側欄內容配置：開啟時預設卡牌分頁、卡牌表格填滿可用高度，規則頁移除「遊戲資訊」並讓剩餘三區等高填滿；以模板資料、CSS grid 結構與 `npm.cmd run build` 驗證。
- [x] 2.8 完成「欄外遮罩互動層」：將欄外透明互動層改為側欄下方的深藍半透明遮罩，保留點擊關閉且不加入全畫面 opacity transition；以層級與樣式檢查及 `npm.cmd run build` 驗證。
- [x] 2.9 將欄外遮罩加深為 `rgba(0, 19, 50, 0.62)`，保持側欄層級與無遮罩動畫行為；以樣式檢查及 `npm.cmd run build` 驗證。
- [x] 2.10 將小型橫向版「遊戲流程」改為標題與流程圖左右 `flex-row` 排列，標準橫向版維持上下排列；以斷點 class 檢查及 `npm.cmd run build` 驗證。
- [x] 2.11 將小型橫向版規則說明與卡牌表格內文縮小為 10px，保留標題與標準橫向版 15px 尺寸；以字級 class/CSS 檢查及 `npm.cmd run build` 驗證。
- [x] 2.12 將小型橫向版規則說明與卡牌表格內文由 10px 進一步縮小為 8px，保留標題與標準橫向版 15px；以字級檢查及 `npm.cmd run build` 驗證。
- [x] 2.13 將「遊戲目標」與「勝利條件」article 從 grid 改為 flex，小型橫向版使用 `flex-row`、標準橫向版使用 `flex-col`；以斷點 class 檢查及 `npm.cmd run build` 驗證。
- [x] 2.14 將小型橫向版卡牌資訊表格內文由 8px 調整為 10px，規則內文維持 8px、標準橫向版維持 15px；以 CSS 字級檢查及 `npm.cmd run build` 驗證。
- [x] 2.15 移除標頭原為 X 按鈕保留的右側間距，讓「規則／卡牌」按鈕群靠齊側欄右側；以 header class 檢查及 `npm.cmd run build` 驗證。
