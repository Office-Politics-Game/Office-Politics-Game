import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const routerSource = readFileSync("src/router/index.js", "utf8");
const gachaSource = readFileSync("src/views/GachaView.vue", "utf8");
const gachaUiSource = readFileSync("src/components/gacha/GachaUi.vue", "utf8");

assert.match(
  routerSource,
  /path:\s*"\/gacha",\s*name:\s*"Gacha",\s*component:\s*GachaView,\s*}/,
  "gacha route must allow guest players so ticket currency can load",
);

assert.match(
  gachaSource,
  /authStore\.currentPlayer\?\.id\s*\?\?\s*playerStore\.currentPlayerId\s*\?\?\s*storedGuestPlayer\?\.id/,
  "gacha currency should resolve the same current player sources as the lobby and mall",
);

assert.match(
  gachaSource,
  /screenMode\.value\s*=\s*"animation"[\s\S]*?await nextTick\(\)/,
  "draw buttons should only enter the printer animation screen before the player pulls",
);

assert.match(
  gachaSource,
  /performDraw\(selectedDrawCount\.value,\s*pullDistance\.value\)/,
  "releasing a full printer pull should start the actual draw request",
);

assert.match(
  gachaSource,
  /const cardPullPreviewStyle = computed[\s\S]*createCardFlightStyle\(getCardFlightRects\(\), pullDistance\.value\)/,
  "printer pull should move the preview card with the drag distance",
);

assert.match(
  gachaSource,
  /function startDrawRequest\(count = selectedDrawCount\.value\)[\s\S]*drawGacha\(/,
  "gacha API should be started before the reveal waits for a result",
);

assert.match(
  gachaSource,
  /if \(pullDistance\.value >= PULL_THRESHOLD\) \{[\s\S]*startDrawRequest\(selectedDrawCount\.value\)/,
  "crossing the pull threshold should prefetch the draw result before release",
);

assert.match(
  gachaSource,
  /let hasCommittedPull = false;[\s\S]*hasCommittedPull = true;[\s\S]*if \(pullDistance\.value < PULL_THRESHOLD && !hasCommittedPull\)/,
  "once the API request starts, release should still complete the draw",
);

assert.match(
  gachaSource,
  /function mergeOwnedCardsFromDrawResults\(results\)[\s\S]*!result\.isDuplicate[\s\S]*ownedCards\.value = \[\.\.\.ownedCards\.value, \.\.\.newCards\]/,
  "draw responses should update owned cards locally without waiting for a full owned-card list",
);

assert.match(
  gachaSource,
  /activePointerId\.value = "draw-request";[\s\S]*playCurrentCardFlight\(pullOffset\);[\s\S]*consumeDrawRequest\(count\)/,
  "single released pulls should start the card flight before waiting for the API",
);

assert.match(
  gachaSource,
  /if \(count === 1\) \{[\s\S]*playCurrentCardFlight\(pullOffset\);[\s\S]*\} else \{[\s\S]*multiPrintIndex\.value = 0;[\s\S]*multiPrintStopY\.value = getVisibleCardStartY\([\s\S]*getCardFlightRects\(\),[\s\S]*Math\.min\(MAX_PULL, Math\.max\(PULL_THRESHOLD, pullOffset\)\)[\s\S]*playCurrentCardFlight\(0\);[\s\S]*\}/,
  "ten draws should start printer pop animation at the released pull position",
);

assert.match(
  gachaSource,
  /if \(count > 1\) \{[\s\S]*if \(drawState\.value === "waiting-result"\) \{[\s\S]*drawState\.value = "multi-results";[\s\S]*isCardVisible\.value = false;[\s\S]*\}[\s\S]*return;[\s\S]*\}/,
  "ten draws should show results once data arrives after the print animation",
);

assert.match(
  gachaSource,
  /const CARD_FLIGHT_DURATION_MS = 700;/,
  "single draws should visibly move from printer to reveal position",
);

assert.match(
  gachaSource,
  /const AUTO_REVEAL_DELAY_MS = 0;[\s\S]*function scheduleAutoReveal\(\)[\s\S]*window\.setTimeout\([\s\S]*autoRevealElapsed = true;[\s\S]*AUTO_REVEAL_DELAY_MS/,
  "cards should start the quick reveal countdown soon after landing",
);

assert.match(
  gachaSource,
  /drawState\.value = drawResults\.value\.length \? "ready-to-reveal" : "waiting-result";[\s\S]*scheduleAutoReveal\(\)/,
  "landed cards should schedule the auto reveal timer even while waiting for results",
);

assert.match(
  gachaSource,
  /if \(autoRevealElapsed\) \{[\s\S]*revealCard\(\);[\s\S]*\}/,
  "late draw results should reveal immediately when the countdown already elapsed",
);

assert.match(
  gachaSource,
  /return resultCard \? resolveGachaCardAsset\(resultCard\) : null;/,
  "card fronts should not render a fallback card before draw results arrive",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /is-waiting-result[\s\S]*\.gacha-card\.is-waiting-result,[\s\S]*var\(--card-end-x/,
  "cards should stay centered while waiting for draw results",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /transition: transform 320ms ease-out/,
  "card reveal should flip quickly after the draw movement",
);

assert.match(
  gachaSource,
  /"--card-reveal-percent": `\$\{Math\.max\(8, arrowProgress\.value \* 100\)\}%`/,
  "dragging the printer should reveal the card like paper being pulled out",
);

assert.match(
  gachaSource,
  /const PRINT_START_MIN_RATIO = 0\.48;[\s\S]*printerRect\.top \+ printerRect\.height \* 0\.14/,
  "single draw cards should start higher before being pulled downward",
);

assert.match(
  gachaSource,
  /const previewScale = 0\.36;[\s\S]*"--card-preview-scale": `\$\{previewScale\}`/,
  "printer pull preview should stay card-sized until release",
);

assert.match(
  gachaSource,
  /function createCardFlightStyle\(geometry, pullOffset = 0\)[\s\S]*const startY = getVisibleCardStartY\(geometry, pullOffset\)[\s\S]*"--card-start-y": `\$\{startY\}px`[\s\S]*function getVisibleCardStartY\(geometry, pullOffset = 0\)[\s\S]*geometry\.start\.y \+ pullOffset[\s\S]*window\.innerHeight - geometry\.cardSize\.height \* previewScale - visibleBottomPadding/,
  "pulled card preview should stay fully visible near the bottom of the screen",
);

assert.match(
  gachaSource,
  /:show-guide="isAnimationMode"/,
  "animation screen should show the white printer guide arrows",
);

assert.match(
  gachaSource,
  /function showNextDrawResult\(\)[\s\S]*playCurrentCardFlight\(\)/,
  "multi draws should repeat printer card flights before showing results",
);

assert.match(
  gachaSource,
  /"--card-flight-animation": isMultiPrint \? "gacha-card-pop" : "gacha-card-flight"/,
  "ten draws should pop cards at the printer instead of flying each one to center",
);

assert.match(
  gachaSource,
  /function getMultiPrintRects\(cardSize\)[\s\S]*printerRect\.top \+ printerRect\.height \* 0\.04[\s\S]*y: startY \+ 96/,
  "ten draw cards should start higher in the printer and move downward with a clearer pull",
);

assert.match(
  gachaSource,
  /createCardFlightStyle\(geometry, isMultiPrint \? 0 : pullOffset\)/,
  "ten draw animation should not reuse the user's drag offset",
);

assert.match(
  gachaSource,
  /const flightDuration = isMultiPrint \? 240 : CARD_FLIGHT_DURATION_MS;/,
  "ten draw printer pops should stay quick enough to avoid a stuck-feeling result transition",
);

assert.match(
  gachaSource,
  /cardFlightFallbackTimer = window\.setTimeout\([\s\S]*onCardFlightEnd\(\);[\s\S]*flightDuration \+ 80/,
  "card flight should continue even if animationend is missed",
);

assert.match(
  gachaSource,
  /cardFlightKey\.value \+= 1;[\s\S]*<GachaAnimation[\s\S]*:card-flight-key="cardFlightKey"/,
  "each printer pop should receive a new flight key so it visibly repeats",
);

assert.match(
  gachaSource,
  /const isQueuedPrintCardVisible = computed[\s\S]*selectedDrawCount\.value > 1[\s\S]*\["printing", "flying", "waiting-result"\]\.includes\(drawState\.value\)/,
  "ten draws should keep a queued card visible while printing and waiting",
);

assert.match(
  gachaSource,
  /const queuedPrintCardStyle = computed[\s\S]*const stopY = multiPrintStopY\.value \|\| multiPrint\.end\.y[\s\S]*"--card-start-y": `\$\{stopY\}px`/,
  "queued ten-draw cards should sit where the pull was released",
);

assert.match(
  gachaSource,
  /<GachaAnimation[\s\S]*:show-queued-card="isQueuedPrintCardVisible"[\s\S]*:queued-card-style="queuedPrintCardStyle"/,
  "gacha animation should receive the queued-card visibility and position",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /showQueuedCard[\s\S]*queuedCardStyle[\s\S]*gacha-card-queued[\s\S]*:key="cardFlightKey"/,
  "the queued card should stay separate from the keyed flying card",
);

assert.match(
  gachaSource,
  /drawState\.value = "multi-results"/,
  "multi draws should end on a result board instead of single-card reveal",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /is-waiting-result\.is-multi-print[\s\S]*@keyframes gacha-card-pop[\s\S]*100%[\s\S]*opacity: 1/,
  "ten draw printer pop animation should stop near the printer while waiting",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /\.gacha-card\.is-multi-print[\s\S]*transform-origin: 50% 0[\s\S]*\.gacha-card-queued[\s\S]*transform-origin: 50% 0/,
  "ten draw cards should align on top of the queued card",
);

assert.match(
  gachaSource,
  /v-if="isAnimationMode && isMultiResults"[\s\S]*w-\[min\(84vw,760px\)\][\s\S]*grid-cols-5[\s\S]*lg:w-\[min\(94vw,920px\)\][\s\S]*@click\.stop[\s\S]*v-for="\(card, index\) in drawResultViews"/,
  "mobile multi draw results should be smaller while desktop keeps the wider board",
);

assert.match(
  gachaSource,
  /multi-result-card[\s\S]*:src="cardBackUrl"[\s\S]*multi-result-card-front[\s\S]*multi-result-card-front multi-result-card-bonus[\s\S]*multi-result-flip 1400ms[\s\S]*@keyframes multi-result-deal[\s\S]*@keyframes multi-result-flip/,
  "multi draw results should deal card backs, flip cards, and flip duplicate bonus labels with the card face",
);

assert.match(
  gachaSource,
  /const hasNextDrawResult = computed\(\s*\(\) => currentDrawIndex\.value < drawResults\.value\.length - 1,\s*\);/,
  "multi draws should keep advancing after collection states",
);

assert.match(
  gachaSource,
  /@stage-click="isAnimationMode && handleAnimationScreenClick\(\)"/,
  "animation screen should use background clicks to reveal, advance, or return",
);

assert.match(
  gachaSource,
  /drawState\.value = currentDrawResult\.value\?\.isDuplicate[\s\S]*\? "compensating"[\s\S]*: "collecting"/,
  "revealed duplicate cards should turn into compensation while new cards collect into owned cards",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /is-collecting[\s\S]*gacha-card-collect/,
  "card collection should shrink to the owned-card button and duplicate cards should show coin compensation",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /\+{{ compensationCoins }} 金幣/,
  "duplicate cards should show coin compensation",
);

assert.match(
  readFileSync("src/components/gacha/GachaAnimation.vue", "utf8"),
  /gacha-card-compensate 1100ms/,
  "coin compensation should stay visible long enough to read",
);

assert.match(
  gachaUiSource,
  /"stage-click"[\s\S]*@click="\$emit\('stage-click'\)"/,
  "gacha stage should emit blank-area clicks explicitly",
);

assert.match(
  gachaSource,
  /<GachaUi[\s\S]*v-if="!isAnimationMode"[\s\S]*@click\.stop="startDraw\(1\)"/,
  "select screen should keep the printer scene and trigger draws only from the draw buttons",
);

assert.match(
  gachaSource,
  /v-if="isAnimationMode && !isDrawActive"[\s\S]*bottom-2[\s\S]*min-h-8 min-w-20[\s\S]*@click\.stop="resetDraw"[\s\S]*返回/,
  "animation screen should return to the draw-count select screen before drawing starts",
);

assert.match(
  gachaSource,
  /isOwnedCardsOpen[\s\S]*@click\.stop="toggleOwnedCardsPanel"[\s\S]*我的卡牌/,
  "select screen should expose a clickable owned-card entry",
);

assert.match(
  gachaSource,
  /v-else[\s\S]*grid max-h-\[66vh\] grid-cols-3 gap-2[\s\S]*sm:grid-cols-4 md:grid-cols-5[\s\S]*text-\[10px\]/,
  "owned-card modal should show smaller cards in a denser grid",
);

assert.match(
  gachaUiSource,
  /v-if="showGuide && !isDrawActive"/,
  "printer guide should be hidden on the animation-only screen",
);

assert.match(
  gachaUiSource,
  /bottom-\[clamp\(36px,7svh,76px\)\][\s\S]*lg:bottom-\[clamp\(52px,9vw,112px\)\]/,
  "mobile printer guide should sit higher while desktop keeps the original position",
);

console.log("gacha page flow ok");
