## Context

目前個人資料頁已有 `badges` 分頁，但內容仍是鎖定或空狀態，沒有真正的成就資料來源。玩家資料目前存在 `players` 表，尚未有成就目錄或玩家解鎖紀錄。

這個 change 先做最小可用版：讓前端能查詢並顯示玩家成就狀態。成就獎勵只先存成 metadata，不在這版發放。

## Goals / Non-Goals

**Goals:**

- 建立成就目錄與玩家成就解鎖紀錄。
- 提供玩家成就查詢 API。
- 在個人資料頁成就分頁顯示已解鎖與未解鎖成就。
- 回傳成就獎勵資訊，但不改動玩家貨幣。

**Non-Goals:**

- 不做對局結算後自動解鎖。
- 不做成就獎勵發放。
- 不做後台成就管理。
- 不做公開手動解鎖 API。

## Decisions

### 新增 achievements 與 player_achievements schema

使用兩張表：`achievements` 保存成就目錄，`player_achievements` 保存玩家已解鎖紀錄。這比把成就直接塞進 `players` 欄位簡單，也方便之後新增成就，不需要改玩家資料結構。

替代方案是把成就存在 `players` 的 JSON 欄位，但查詢、唯一限制和後續維護都比較麻煩，先不採用。

### 新增 achievementService 查詢流程

後端由 `achievementService` 負責查詢玩家是否存在、取得全部成就，並合併該玩家的解鎖狀態。Controller 只處理 request / response，避免把查詢邏輯塞在 controller。

查詢 API 只做讀取，不會因為讀取成就而更新 coins、gems 或 tickets。

### 新增 AchievementPanel 顯示流程

前端新增 `achievementApi` 與 `achievementStore`，讓個人資料頁只負責切換分頁與渲染畫面。`AchievementPanel` 直接接 store 資料顯示鎖定與解鎖狀態。

訪客開啟成就分頁時不呼叫 API，維持鎖定提示，避免沒有玩家 ID 時送出無效請求。

## Risks / Trade-offs

- [Risk] 成就目前只顯示，不會自動解鎖。→ 之後做對局結算或任務系統時，再新增 unlock service。
- [Risk] 獎勵欄位先存在資料表但不發放，可能讓人誤會已完成獎勵流程。→ API 文件與畫面只顯示獎勵內容，不觸發貨幣異動。
- [Risk] 成就資料需要初始種子資料才有內容。→ 實作時可先在 schema 或 seed 流程加入少量固定成就。
