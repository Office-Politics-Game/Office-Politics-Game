import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import cleanerBackgroundUrl from '@/assets/images/card-bg-cleaner.webp'
import cleanerFrameUrl from '@/assets/images/card-frame-cleaner.webp'
import hrBackgroundUrl from '@/assets/images/card-bg-hr.webp'
import hrFrameUrl from '@/assets/images/card-frame-hr.webp'
import internBackgroundUrl from '@/assets/images/card-bg-intern.webp'
import internFrameUrl from '@/assets/images/card-frame-intern.webp'
import managerBackgroundUrl from '@/assets/images/card-bg-manager.webp'
import managerFrameUrl from '@/assets/images/card-frame-manager.webp'
import pmBackgroundUrl from '@/assets/images/card-bg-pm.webp'
import pmFrameUrl from '@/assets/images/card-frame-pm.webp'
import seniorBackgroundUrl from '@/assets/images/card-bg-senior.webp'
import seniorFrameUrl from '@/assets/images/card-frame-senior.webp'
import { CARD_INFO_BY_RANK } from '@/constants/cardInfo'

const cardAssetsByKey = {
  intern: {
    backgroundUrl: internBackgroundUrl,
    frameUrl: internFrameUrl,
    color: '#fb923c',
    type: 'Guess',
    name: 'Intern',
    displayName: CARD_INFO_BY_RANK[1].chinese,
    effectKey: 'guess',
    targetMode: 'opponent',
    requiresGuess: true,
  },
  cleaner: {
    backgroundUrl: cleanerBackgroundUrl,
    frameUrl: cleanerFrameUrl,
    color: '#22c55e',
    type: 'Peek',
    name: 'Cleaner',
    displayName: CARD_INFO_BY_RANK[2].chinese,
    effectKey: 'peek',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  manager: {
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
    color: '#fb7185',
    type: 'Duel',
    name: 'Manager',
    displayName: CARD_INFO_BY_RANK[3].chinese,
    effectKey: 'compare',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  senior: {
    backgroundUrl: seniorBackgroundUrl,
    frameUrl: seniorFrameUrl,
    color: '#60a5fa',
    type: 'Shield',
    name: 'Senior',
    displayName: CARD_INFO_BY_RANK[4].chinese,
    effectKey: 'protect',
    targetMode: 'none',
    requiresGuess: false,
  },
  pm: {
    backgroundUrl: pmBackgroundUrl,
    frameUrl: pmFrameUrl,
    color: '#f97316',
    type: 'Redraw',
    name: 'PM',
    displayName: CARD_INFO_BY_RANK[5].chinese,
    effectKey: 'redraw',
    targetMode: 'anyPlayer',
    requiresGuess: false,
  },
  hr: {
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
    color: '#a78bfa',
    type: 'Swap',
    name: 'HR',
    displayName: CARD_INFO_BY_RANK[6].chinese,
    effectKey: 'swap',
    targetMode: 'opponent',
    requiresGuess: false,
  },
  advisor: {
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
    color: '#38bdf8',
    type: 'Force',
    name: 'Advisor',
    displayName: CARD_INFO_BY_RANK[7].chinese,
    effectKey: 'force-discard',
    targetMode: 'none',
    requiresGuess: false,
  },
  ceo: {
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
    color: '#facc15',
    type: 'Boss',
    name: 'CEO',
    displayName: CARD_INFO_BY_RANK[8].chinese,
    effectKey: 'self-eliminate',
    targetMode: 'none',
    requiresGuess: false,
  },
}

const cardAssetKeyByRank = {
  1: 'intern',
  2: 'cleaner',
  3: 'manager',
  4: 'senior',
  5: 'pm',
  6: 'hr',
  7: 'advisor',
  8: 'ceo',
}

const cardAssetKeyByName = {
  intern: 'intern',
  cleaner: 'cleaner',
  manager: 'manager',
  senior: 'senior',
  veteran: 'senior',
  pm: 'pm',
  hr: 'hr',
  advisor: 'advisor',
  adviser: 'advisor',
  ceo: 'ceo',
}

const cardAssetKeyByEffect = {
  guess: 'intern',
  peek: 'cleaner',
  compare: 'manager',
  protect: 'senior',
  redraw: 'pm',
  swap: 'hr',
  'force-discard': 'advisor',
  'self-eliminate': 'ceo',
}

export {
  cardAssetKeyByEffect,
  cardAssetKeyByName,
  cardAssetKeyByRank,
  cardAssetsByKey,
}
