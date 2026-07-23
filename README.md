# 《Office Politics：職場風雲》

![OFFICE POLITICS：職場風雲](src/assets/images/office-politics-banner.webp)

[![Version](https://img.shields.io/badge/Version-1.0.0-0046F4.svg)]()
[![Official Website](https://img.shields.io/badge/Official_Website-Play_Now-0046F4.svg)](https://www.office-politics.online/)

![Vue](https://img.shields.io/badge/Vue-42b883?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38bdf8?logo=tailwindcss&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-f7d336?logo=pinia&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white)

> **"In the game of office politics, you win or you get fired."**  
> 在辦公室的權力遊戲中，你不贏，就是捲鋪蓋走人。

《OFFICE Politics：職場風雲》是一款充滿爾虞我詐、快節奏的職場生存卡牌桌遊（改編自經典遊戲《情書》）。玩家將扮演身處風暴中心的各階層員工，在年終將至的考核修羅場中，利用派系調動、八卦爆料與績效評比，不擇手段地淘汰競爭對手，爭奪唯一的終極年終分紅！

🎮 **官方網站：** [https://www.office-politics.online/](https://www.office-politics.online/)

### 開發團隊 (Team)

| 成員   | GitHub                                             | Email                                                 |
| ------ | -------------------------------------------------- | ----------------------------------------------------- |
| 蘇郁傑 | [@Tissuu](https://github.com/Tissuu)               | [abcd031313@gmail.com](mailto:abcd031313@gmail.com)   |
| 郭嘉琪 | [@Maggie0513](https://github.com/Maggie0513)       | [h6741957@gmail.com](mailto:h6741957@gmail.com)       |
| 詹珈璇 | [@ChloeChan1](https://github.com/ChloeChan1)       | [angel332332@gmail.com](mailto:angel332332@gmail.com) |
| 蔡佩芹 | [@celery1123](https://github.com/celery1123)       | [p.tonki1123@gmail.com](mailto:p.tonki1123@gmail.com) |
| 林立崴 | [@mountainway54](https://github.com/mountainway54) | [linliweii54@gmail.com](mailto:linliweii54@gmail.com) |

---

### 遊戲核心 (Core Mechanics)

- **一元化手牌：** 你的手上**永遠只能留 1 張職位牌**，它代表你當前在公司的人脈籌碼
- **回合抉擇：** 輪到你時，**抽 1 張牌，打 1 張牌**，並強制執行該職位帶來的特殊效果
- **倖存條件：** 當辦公室被清算到**只剩 1 人存活**，或**牌庫抽完時手牌點數最大**的人，贏得該局並獲得一枚【年終支票 Token】，先獲得3張可以得到最終勝利

### 卡牌介紹 (The 16-Card Deck)

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

### 遊戲畫面

<p align="center">
  <img src="src/assets/images/game-table-screenshot.webp" alt="Office Politics 遊戲桌面" width="49%">
  <img src="src/assets/images/card-effect-screenshot.webp" alt="Office Politics 卡牌效果" width="49%">
</p>

---

### 本地安裝與運行 (Local Setup)

執行前請先安裝 [Node.js](https://nodejs.org/) `^20.19.0` 或 `>=22.12.0`，以及 Git。

1. 下載專案並進入專案目錄：

   ```powershell
   git clone https://github.com/Office-Politics-Game/Office-Politics-Game.git
   Set-Location "Office-Politics-Game"
   ```

2. 安裝前端與後端依賴：

   ```powershell
   npm ci
   Set-Location server
   npm ci
   Set-Location ..
   ```

3. 建立本地環境變數檔案：

   ```powershell
   Copy-Item .env.example .env
   Copy-Item server/.env.example server/.env
   ```

   如需使用資料庫、Supabase 或 Cloudinary 功能，請在對應的 `.env` 補上服務設定，且不要將密鑰提交至版本控制。

4. 開啟第一個終端機並啟動後端：

   ```powershell
   Set-Location server
   npm run dev
   ```

5. 開啟第二個終端機，在專案根目錄啟動前端：

   ```powershell
   npm run dev
   ```

6. 瀏覽器開啟 [http://localhost:5173](http://localhost:5173)。本地前端會將 `/api` 與 `/socket.io` 請求代理至 `http://localhost:3000`。
