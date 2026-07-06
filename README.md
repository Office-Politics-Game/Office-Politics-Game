# 🏢 OFFICE GAME：職場風雲 (Game of Office Politics)

[![Game Status](https://img.shields.io/badge/Status-Prototype-orange.svg)]()
[![Players](https://img.shields.io/badge/Players-2--4-blue.svg)]()
[![Play Time](https://img.shields.io/badge/Play_Time-10--15_mins-green.svg)]()

![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-f7d336?logo=pinia&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg-336791?logo=postgresql&logoColor=white)

> **"In the game of office politics, you win or you get fired."**  
> 在辦公室的權力遊戲中，你不贏，就是捲鋪蓋走人。

《OFFICE GAME：職場風雲》是一款充滿爾虞我詐、快節奏的職場生存卡牌桌遊（改編自經典遊戲《情書》）。玩家將扮演身處風暴中心的各階層員工，在年終將至的考核修羅場中，利用派系調動、八卦爆料與績效評比，不擇手段地淘汰競爭對手，爭奪唯一的終極年終分紅！

---

## 技術應用 (Tech Stack)

### Frontend

- **Vue 3**: 前端 UI 框架。
- **Vite**: 開發伺服器與前端建置工具。
- **Vue Router**: 前端路由管理。
- **Pinia**: 前端狀態管理。
- **Axios**: HTTP API client。
- **Tailwind CSS 4**: Utility-first CSS 與版面樣式。
- **Lucide Vue**: 圖示元件。

### Animation & Realtime UI

- **GSAP**: 卡牌發牌、抽牌、出牌與效果動畫。
- **Socket.IO Client**: 前端即時遊戲事件連線。

### Backend

- **Node.js**: 後端執行環境。
- **Express 5**: API server 與路由處理。
- **Socket.IO**: 即時房間、遊戲狀態與玩家事件同步。
- **CORS**: 前後端跨來源設定。
- **dotenv**: 環境變數載入。

### Database & Auth

- **PostgreSQL**: 主要資料庫。
- **pg**: Node.js PostgreSQL client。
- **Supabase JS**: Supabase client 整合。
- **bcryptjs**: 密碼雜湊處理。

### Auth API

- `POST /api/auth/login`
  - 登入成功後回傳 `token` 與 `player`。
- `GET /api/auth/me`
  - 透過 `Authorization: Bearer <AuthToken>` 取得目前登入玩家資料。
- 前端會將 `AuthToken` 存在 localStorage，重新整理或重新進站時自動驗證並還原登入狀態。

### Testing & Development

- **Jest**: 後端測試。
- **nodemon**: 後端開發時自動重啟。
- **Vite Vue DevTools**: Vue/Vite 開發除錯工具。

### Deployment

- **Vercel**: 前端部署。
- **Render**: 後端部署。
- **Environment Variables**: 使用 `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `CORS_ORIGIN`, `DATABASE_URL` 設定前後端與資料庫連線。

---

## 開發指令 (Development Commands)

Frontend commands are run from the repository root.

```powershell
npm run dev
npm run build
npm run preview
```

Backend commands are run from `server/`.

```powershell
cd server
npm run dev
npm start
npm test
npm run seed:cards
```

---

## 🎯 遊戲核心 (Core Mechanics)

- **一元化手牌：** 你的手上**永遠只能留 1 張職位牌**，它代表你當前在公司的秘密身份與權力籌碼。
- **回合抉擇：** 輪到你時，**抽 1 張牌，打 1 張牌**，並強制執行該職位帶來的職場效應。
- **倖存條件：** 當辦公室被清算到**只剩 1 人存活**，或**牌庫抽完時手牌點數最大**的人，贏得該局並獲得一枚【年終支票 Token】。

---

## 🃏 組織架構與職位權能 (The 16-Card Deck)

遊戲牌組共由 16 張職位牌組成，點數（1-8）代表權力高低：

| 點數 (Rank) | 職位名稱 (Role) | 張數 (Qty) | 核心效應 (Mechanics)                           | 職場現形記設定 (Flavor Text)               |
| :---------: | :-------------- | :--------: | :--------------------------------------------- | :----------------------------------------- |
|    **8**    | **執行長**      |     1      | 迫使丟棄此牌時，你直接淘汰。                   | _「公司營收沒達標，執行長引咎辭職。」_     |
|    **7**    | **資深顧問**    |     1      | 若同時持有 人資主管 或 專案經理 必須強制打出。 | _「顧問只出嘴，不直接參與高層權力鬥爭。」_ |
|    **6**    | **人資主管**    |     1      | 與一名玩家秘密交換手牌。                       | _「人事異動，你被調到其他部門了。」_       |
|    **5**    | **專案經理**    |     2      | 指定一名玩家棄牌重抽。                         | _「你的提案被專案經理打槍了！」_           |
|    **4**    | **職場老鳥**    |     2      | 直到下個回合前，免疫所有卡牌效果。             | _「下週我請特休，不要來問我」_             |
|    **3**    | **部門主管**    |     2      | 與一名玩家秘密比大小，點數小者淘汰。           | _「KPI沒達標，你就滾蛋吧。」_              |
|    **2**    | **打掃阿姨**    |     2      | 秘密觀看一名玩家的手牌。                       | _「打掃阿姨知道所有秘密...」_              |
|    **1**    | **實習生**      |     5      | 猜測一名玩家的手牌，猜中則對方淘汰。           | _「實習生很愛八卦，卻所知甚少...」_        |

---

## Deployment Notes

For a Vercel frontend with a Render backend, configure these environment variables:

- Vercel frontend:
  - `VITE_API_BASE_URL=https://<render-service-host>/api`
  - `VITE_SOCKET_URL=https://<render-service-host>`
- Render backend:
  - `CORS_ORIGIN=https://<vercel-app-host>`
  - `DATABASE_URL=<postgres-connection-string>`

Local development does not require `VITE_API_BASE_URL` or `VITE_SOCKET_URL`. When they are not set, the frontend falls back to `/api` for HTTP requests and `/` for Socket.IO, so the existing Vite dev proxy continues to route requests to `http://localhost:3000`.
