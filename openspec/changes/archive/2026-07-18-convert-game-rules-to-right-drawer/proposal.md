## Summary

將現有右下角放大型遊戲規則視窗改為貼齊遊戲畫布右側的覆蓋式抽屜，讓規則閱讀保有明確位置且不改動牌桌配置。

## Motivation

目前元件從角落同時放大寬高，標準橫向畫布會覆蓋近乎整個遊戲區，且動畫可能影響鄰近 UI。右側獨立抽屜能保留遊戲背景脈絡，並讓開關方向與控制位置一致。

## Proposed Solution

- 收合控制貼齊遊戲畫布右側、高度位於畫布三分之一處，並顯示向左箭頭。
- 展開內容以固定寬度、全畫布高度覆蓋於右側，採水平滑入與滑出。
- 抽屜動畫限制在自身獨立渲染範圍，不帶動或改變其他遊戲 UI。
- 規則內容改為適合窄欄的垂直排列，內容區獨立捲動。
- 保留既有分頁、鍵盤焦點管理與 Esc 關閉，並增加透明欄外點擊關閉區。
- 依 960×540 與 1280×720 兩種橫向畫布提供固定尺寸，不新增其他斷點。

## Non-Goals

- 不推擠、縮放、動畫化或重排 GameStage 牌桌內容。
- 不修改遊戲規則文字、卡牌資料、圖片資產或後端行為。
- 不新增直向版面、深色遮罩或第三組響應式斷點。

## Capabilities

### New Capabilities

- `game-rules-right-drawer`: 定義遊戲規則右側抽屜的定位、獨立動畫、版面、關閉互動與鍵盤可及性。

### Modified Capabilities

(none)

## Impact

- Affected specs: game-rules-right-drawer
- Affected code:
  - Modified: src/components/game/ui/GameRulesModal.vue
  - New: openspec/changes/convert-game-rules-to-right-drawer/specs/game-rules-right-drawer/spec.md
  - Removed: none
