import avatar1 from "@/assets/images/player-1.png";
import avatar2 from "@/assets/images/player-2.png";
import avatar3 from "@/assets/images/player-3.png";
import avatar4 from "@/assets/images/player-4.png";

const guestAvatars = [
  {
    id: 1,
    name: "職場新星",
    image: avatar1,
  },
  {
    id: 2,
    name: "會議高手",
    image: avatar2,
  },
  {
    id: 3,
    name: "加班戰士",
    image: avatar3,
  },
  {
    id: 4,
    name: "摸魚專家",
    image: avatar4,
  },
];

const guestNamePrefixes = [
  "準時的",
  "月底前",
  "剛上線",
  "免打擾",
  "快轉中",
  "待核准",
  "差一點",
  "未存檔",
  "今日限",
  "跨部門",
  "已回覆",
  "拒接中",
  "靜音中",
  "排隊中",
  "臨時的",
  "要離席",
  "被退件",
  "求支援",
  "載入中",
  "週五的",
  "不改稿",
  "輸入中",
  "連線中",
  "稍後辦",
  "沒權限",
  "約不到",
  "缺附件",
  "待確認",
  "人不在",
  "同步中",
  "已過期",
  "不背鍋",
  "已登出",
  "緩衝中",
  "月底瘋",
  "週一茫",
  "午休中",
  "遠端的",
  "急件的",
  "等回覆",
  "未轉正",
  "沒入群",
  "路過的",
  "離線中",
  "要請假",
  "漏打卡",
  "看標題",
  "復原中",
  "不加班",
  "先吃飯",
];

const guestNameSuffixes = [
  "草稿箱",
  "掃描器",
  "碎紙機",
  "訂書機",
  "迴紋針",
  "識別證",
  "門禁卡",
  "傳真機",
  "投影幕",
  "延長線",
  "充電器",
  "行事曆",
  "通知欄",
  "收件匣",
  "寄件備份",
  "簽核單",
  "零用金",
  "發票夾",
  "差旅費",
  "值日生",
  "總機小姐",
  "代理人",
  "接班人",
  "窗口君",
  "稽核員",
  "顧問哥",
  "秘書長",
  "工讀生",
  "外包仔",
  "派遣員",
  "樓管員",
  "警衛伯",
  "清潔隊長",
  "網管大神",
  "財務大人",
  "法務代表",
  "人資夥伴",
  "採購專員",
  "客服機",
  "會計算盤",
  "影印紙",
  "墨水匣",
  "名片盒",
  "零食櫃",
  "咖啡濾紙",
  "午休枕",
  "盆栽君",
  "遙控器",
  "網路線",
  "密碼貼紙",
];

function getRandomItem(items) {
  const randomIndex = Math.floor(Math.random() * items.length);

  return items[randomIndex];
}

function createGuestNickname() {
  return `${getRandomItem(guestNamePrefixes)}${getRandomItem(guestNameSuffixes)}`;
}

export {
  createGuestNickname,
  guestAvatars,
  guestNamePrefixes,
  guestNameSuffixes,
};
