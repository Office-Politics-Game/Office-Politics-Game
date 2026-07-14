const INTERN_CARD_INFO = Object.freeze({
  english: "Intern",
  chinese: "實習生",
  action: "猜對方職位",
});

const CLEANER_CARD_INFO = Object.freeze({
  english: "Cleaner",
  chinese: "打掃阿姨",
  action: "偷看對方手牌",
});

const MANAGER_CARD_INFO = Object.freeze({
  english: "Manager",
  chinese: "部門主管",
  action: "與對方比大小",
});

const SENIOR_CARD_INFO = Object.freeze({
  english: "Senior",
  chinese: "職場老鳥",
  action: "保護自己一回合",
});

const PM_CARD_INFO = Object.freeze({
  english: "PM",
  chinese: "專案經理",
  action: "指定玩家棄牌重抽",
});

const HR_CARD_INFO = Object.freeze({
  english: "HR",
  chinese: "人資主管",
  action: "與對方交換手牌",
});

const ADVISOR_CARD_INFO = Object.freeze({
  english: "Advisor",
  chinese: "資深顧問",
  action: "必須優先打出此牌",
});

const CEO_CARD_INFO = Object.freeze({
  english: "CEO",
  chinese: "執行長",
  action: "被迫棄牌時淘汰",
});

const CARD_INFO_BY_RANK = Object.freeze({
  1: INTERN_CARD_INFO,
  2: CLEANER_CARD_INFO,
  3: MANAGER_CARD_INFO,
  4: SENIOR_CARD_INFO,
  5: PM_CARD_INFO,
  6: HR_CARD_INFO,
  7: ADVISOR_CARD_INFO,
  8: CEO_CARD_INFO,
});

const CARD_INFO_BY_NAME = Object.freeze({
  intern: INTERN_CARD_INFO,
  cleaner: CLEANER_CARD_INFO,
  manager: MANAGER_CARD_INFO,
  senior: SENIOR_CARD_INFO,
  veteran: SENIOR_CARD_INFO,
  pm: PM_CARD_INFO,
  hr: HR_CARD_INFO,
  advisor: ADVISOR_CARD_INFO,
  adviser: ADVISOR_CARD_INFO,
  ceo: CEO_CARD_INFO,
});

function getCardInfo(card = {}) {
  const rank = Number(card.rank ?? card.cardRank ?? card.value);
  const name = String(card.name ?? "").trim().toLowerCase();

  return CARD_INFO_BY_RANK[rank] ?? CARD_INFO_BY_NAME[name] ?? null;
}

export {
  ADVISOR_CARD_INFO,
  CARD_INFO_BY_NAME,
  CARD_INFO_BY_RANK,
  CEO_CARD_INFO,
  CLEANER_CARD_INFO,
  HR_CARD_INFO,
  INTERN_CARD_INFO,
  MANAGER_CARD_INFO,
  PM_CARD_INFO,
  SENIOR_CARD_INFO,
  getCardInfo,
};
