## 1. 動畫結果契約

- [x] 1.1 實作「Intern animation result preserves the submitted guess」與「Intern 動畫結果攜帶原始猜測職位」：在 `server/src/services/cardEffectAnimationService.js` 的未受保護 intern 結果加入原始 `guessedCardName`，並新增 `server/tests/cardEffectAnimationService.test.js` 驗證猜對與猜錯都保留提交值及正確 outcome；以 `cd server; npm test -- --runInBand cardEffectAnimationService.test.js` 驗證。
- [x] 1.2 在 `src/composables/useGameSocketActions.js` 正規化 intern 結果時要求並保留非空 `guessedCardName`，確保缺少欄位的結果不進入正式 `/game` 動畫佇列；在 `tests/card-play-interaction.test.mjs` 加入契約斷言，並以 `node tests/card-play-interaction.test.mjs` 驗證。

## 2. 正式遊戲玩家文字資料流

- [x] 2.1 實作「Guess prompt identifies the target and guessed position」與「GameStage 解析目標暱稱」：在 `src/components/game/ui/GameStage.vue` 以字串化 `targetPlayerId` 比對 `players`、傳遞命中的 `name`，缺失時傳遞 `玩家`；在 `tests/card-play-interaction.test.mjs` 驗證已知暱稱與備援路徑均存在，並以該 Node 測試驗證。
- [x] 2.2 落實「既有職位名稱直接顯示」：`InternAnimation` 直接呈現正式 `/game` 動畫結果中的 `guessedCardName`，不新增翻譯映射或修改 `src/views/CardPlayTestView.vue`；在 `tests/card-play-interaction.test.mjs` 斷言文字由該欄位組成，並以該 Node 測試與 `npm run build` 驗證。

## 3. 正式遊戲動畫呈現與時序

- [x] 3.1 實作「Guess prompt precedes and persists through the result」與「單一 GSAP 時間軸管理兩層文字」：在 `src/components/game/animations/InternAnimation.vue` 分離提示與 outcome 元素，時間軸依序顯示提示、固定 hold 1 秒、顯示猜對或猜錯結果，再於既有結果退場點同時隱藏兩者且之後才 emit `complete`；在 `tests/card-play-interaction.test.mjs` 斷言文字格式、1 秒 hold、共同退場與 reduced-motion 不略過 hold，並執行該測試。
- [x] 3.2 實作「Guess prompt emphasizes dynamic values」與「動態值使用縮小黃色樣式」：完成正式 `/game` 兩層文字的手機、平板與桌面排版，將整行提示縮為原字級的 60%，玩家暱稱與職位設為 `#facc15`，保留「猜／是」原色並避免水平溢出；以 `tests/card-play-interaction.test.mjs` 驗證 span 與樣式、以 `npm run build` 驗證模板與 CSS，並在正式 `/game` 人工確認提示可讀、兩行不互相遮擋且一起消失。

## 4. 整合驗證

- [x] 4.1 實作「Sequential intern target and position selection」與「實習生目標與職位分階段選擇」：在 `src/composables/useGameStageCardPlay.js` 衍生同時需要 target 與 guess 的選擇階段，並在 `src/components/game/ui/GameStage.vue` 讓 Intern 未選目標時只啟用玩家頭像、選定後才停止目標模式並掛載 `CardPlayConfirmPanel`；在 `tests/card-play-interaction.test.mjs` 驗證彈窗門檻與 target-only 卡牌不受影響，並執行該 Node 測試與 `npm run build`。

## 5. 整合驗證

- [x] 5.1 依 Implementation Contract 執行 `npm run build`、`node tests/card-play-interaction.test.mjs` 與 `cd server; npm test`，並在正式 `/game` 確認 Intern 先選玩家再顯示職位彈窗、出牌動畫後才開始提示、兩種 outcome 均符合順序且 effect complete 未提前；確認 `src/views/CardPlayTestView.vue` 未被修改，且 target-only 卡牌、其他卡牌與回合流程測試無回歸。
