## Why

目前 `/profile` 主要由前端 store、訪客 localStorage 與預設假資料組合顯示，正式會員缺少從 Supabase/Postgres 讀取權威玩家資料的 API。這會讓會員個人資料與資料庫狀態脫節，也讓訪客與正式會員的可用功能界線不清楚。

## What Changes

- 新增正式會員 profile 讀取能力：前端可透過 `GET /api/profile` 取得目前登入會員的個人資料。
- 新增 `profileStore` 管理 `/profile` 頁面資料、載入狀態、錯誤狀態與 refresh 行為，避免把完整 profile 狀態塞進 `authStore`。
- 後端使用 Bearer token 經 Supabase Auth 驗證目前會員，再從 `players` 表回傳 profile 所需欄位。
- `/profile` 採混合鎖定：訪客可看自己的基本資料；對戰紀錄、成就、收藏與可編輯入口顯示登入提示。
- 前端移除未登入且無訪客資料時的假玩家預設資料，改顯示可行動的登入/訪客提示。

## Capabilities

### New Capabilities

- `profile-data`: 定義 `/profile` 對正式會員與訪客的資料來源、鎖定狀態與 profile API 契約。

### Modified Capabilities

(none)

## Impact

- Affected specs: profile-data
- Affected code:
  - New: server/src/routes/profileRoutes.js, server/src/controllers/profileController.js, server/src/services/profileService.js, src/services/profileApi.js, src/stores/profileStore.js
  - Modified: server/src/app.js, src/views/ProfileView.vue, src/components/profile/ProfileInfoPanel.vue, src/components/profile/ProfileTabs.vue
  - Removed: none
