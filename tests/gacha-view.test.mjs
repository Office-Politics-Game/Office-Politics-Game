import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('router registers the gacha route', async () => {
  const source = await readSource('src/router/index.js')

  assert.match(source, /import GachaView from ["']@\/views\/GachaView\.vue["']/)
  assert.match(source, /path:\s*["']\/gacha["']/)
  assert.match(source, /name:\s*["']Gacha["']/)
  assert.match(source, /component:\s*GachaView/)
})

test('lobby recruit button opens gacha without changing recruit identity', async () => {
  const source = await readSource('src/components/menu/LobbyMenu.vue')

  assert.match(
    source,
    /menu-btn left-\[212px\] bottom-\[47px\] h-\[90px\] w-\[95px\] lg:left-\[353px\] lg:bottom-\[79px\] lg:h-\[150px\] lg:w-\[158px\]/,
  )
  assert.match(source, /:disabled=["']isAnyPageTransitioning["']/)
  assert.match(source, /@click=["']openGachaPage["']/)
  assert.match(source, /icon-recruit\.png/)
  assert.match(source, /alt=["']??["']/)
  assert.match(source, />??<\/span>/)
  assert.match(source, /function openGachaPage\(\)/)
  assert.match(source, /if \(isAnyPageTransitioning\.value\)/)
  assert.match(source, /router\.push\(["']\/gacha["']\)/)
})

test('gacha view delegates UI and animation to gacha components', async () => {
  const componentUrl = new URL('../src/views/GachaView.vue', import.meta.url)

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /bg-gacha\.webp/)
  assert.match(source, /gacha-printer\.webp/)
  assert.match(source, /card-bg-back\.webp/)
  assert.match(source, /import GachaUi from ["']@\/components\/gacha\/GachaUi\.vue["']/)
  assert.match(source, /import GachaAnimation from ["']@\/components\/gacha\/GachaAnimation\.vue["']/)
  assert.match(source, /<GachaUi/)
  assert.match(source, /<GachaAnimation/)
  assert.match(source, /@reset-draw=["']resetDraw["']/)
  assert.match(source, /gachaUi\.value\?\.getPrinterRect\(\)/)
  assert.match(source, /cardAssetsByKey\.ceo/)
  assert.doesNotMatch(source, /gacha-reset/)
  assert.doesNotMatch(source, /drawGameCard|playGameCard|drawCard\(/)
  assert.doesNotMatch(source, /rounded-/)
})

test('gacha UI component owns background, printer, and chevron affordance', async () => {
  const source = await readSource('src/components/gacha/GachaUi.vue')

  assert.match(source, /import \{ ChevronDown \} from ["']lucide-vue-next["']/)
  assert.match(source, /class="gacha-view/)
  assert.match(source, /backgroundImage: `url\(\$\{backgroundUrl\}\)`/)
  assert.match(source, /printer-button absolute bottom-0 left-0[\s\S]*h-\[60svh\][\s\S]*w-screen[\s\S]*justify-center[\s\S]*overflow-visible/)
  assert.doesNotMatch(source, /\.printer-button \{[\s\S]*height: 60svh;/)
  assert.match(source, /\.printer-image \{[\s\S]*height: 100%;[\s\S]*min-width: 100vw;[\s\S]*transform: scale\(2\);[\s\S]*width: auto;/)
  assert.match(source, /<span class=["']sr-only["']>印表機<\/span>/)
  assert.doesNotMatch(source, /按住印表機往下拉/)
  assert.match(source, /<ChevronDown[\s\S]*v-for=["']index in 3["']/)
  assert.match(source, /gacha-reset/)
  assert.match(source, /@click=["']\$emit\('reset-draw'\)["']/)
  assert.match(source, /function getPrinterRect\(\)/)
  assert.match(source, /defineExpose\(\{[\s\S]*getPrinterRect/)
  assert.doesNotMatch(source, /rounded-/)
})

test('gacha animation component owns card preview, flight, and reveal', async () => {
  const source = await readSource('src/components/gacha/GachaAnimation.vue')

  assert.match(source, /import GameCard from ["']@\/components\/game\/ui\/GameCard\.vue["']/)
  assert.match(source, /<GameCard/)
  assert.match(source, /cardBackUrl/)
  assert.match(source, /v-if=["']isPulling && !isCardVisible["']/)
  assert.match(source, /--card-pull-opacity/)
  assert.match(source, /--card-offscreen-y/)
  assert.match(source, /@keyframes gacha-card-flight/)
  assert.match(source, /@animationend=["']\$emit\('flight-end'\)["']/)
  assert.match(source, /@click=["']\$emit\('reveal'\)["']/)
  assert.match(source, /:aria-disabled=["']!isReadyToReveal["']/)
  assert.doesNotMatch(source, /:disabled=["']!isReadyToReveal["']/)
  assert.match(source, /@keydown\.enter\.prevent=["']\$emit\('reveal'\)["']/)
  assert.match(source, /@keydown\.space\.prevent=["']\$emit\('reveal'\)["']/)
  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(source, /gsap/)
  assert.doesNotMatch(source, /rotate:/)
  assert.doesNotMatch(source, /rounded-/)
})

test('gacha view keeps pointer state and card flight calculations', async () => {
  const source = await readSource('src/views/GachaView.vue')

  assert.match(source, /const PULL_THRESHOLD = 70/)
  assert.match(source, /const DESKTOP_CARD_WIDTH_MULTIPLIER = 2/)
  assert.match(source, /const DESKTOP_CARD_MIN_WIDTH = 1024/)
  assert.match(source, /drawState = ref\(["']idle["']\)/)
  assert.match(source, /onPrinterPointerDown/)
  assert.match(source, /onPrinterPointerMove/)
  assert.match(source, /onPrinterPointerUp/)
  assert.match(source, /onPrinterPointerCancel/)
  assert.match(source, /setPointerCapture/)
  assert.match(source, /releasePointerCapture/)
  assert.match(source, /window\.innerWidth >= DESKTOP_CARD_MIN_WIDTH[\s\S]*baseWidth \* DESKTOP_CARD_WIDTH_MULTIPLIER/)
  assert.match(source, /const centeredX = window\.innerWidth \/ 2 - cardSize\.width \/ 2/)
  assert.match(source, /const visibleStartY = Math\.min\(/)
  assert.match(source, /offscreen: \{[\s\S]*window\.innerHeight \+ cardSize\.height \+ 24/)
  assert.match(source, /CARD_FLIGHT_DURATION_MS = 1680/)
  assert.match(source, /cardPullPreviewStyle/)
  assert.match(source, /createCardFlightStyle\(getCardFlightRects\(\), pullDistance\.value\)/)
  assert.match(source, /"--card-start-y": `\$\{geometry\.start\.y \+ pullOffset\}px`/)
  assert.match(source, /requestAnimationFrame/)
  assert.match(source, /drawState\.value = ["']flying["']/)
  assert.match(source, /revealCard/)
})
