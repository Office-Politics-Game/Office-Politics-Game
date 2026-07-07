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
  "宇宙級",
  "差點贏",
  "被封印",
  "愛香菜",
  "看很強",
  "沒睡醒",
  "最後的",
  "溫柔的",
  "快樂的",
  "不可食",
  "不正常",
  "神話級",
  "普通的",
  "覺醒中",
  "有點累",
  "會飛的",
  "永遲到",
  "偷偷摸",
  "滿級的",
  "沒夢想",
  "超派的",
  "低調的",
  "爆肝的",
  "迷路的",
  "失控的",
  "躺平的",
  "認真的",
  "社恐的",
  "淡定的",
  "閃亮的",
  "孤單的",
  "熱血的",
  "佛系的",
  "厭世的",
  "省電的",
  "加班中",
  "開會中",
  "放空的",
  "嘴硬的",
  "很會演",
  "快下班",
  "被點名",
  "又遲到",
  "假裝忙",
  "已讀中",
  "想退休",
  "沒咖啡",
  "被催稿",
  "超會拖",
  "很有戲",
];

const guestNameSuffixes = [
  "老王",
  "阿哲",
  "小明",
  "暴龍",
  "反派",
  "企鵝",
  "工程師",
  "布丁",
  "救世主",
  "麻糬",
  "勇者",
  "水餃",
  "忍者",
  "香蕉",
  "菜鳥",
  "社畜",
  "主管",
  "咖啡",
  "便當",
  "鍵盤",
  "簡報",
  "報表",
  "會議",
  "座位",
  "滑鼠",
  "印表機",
  "打卡鐘",
  "資料夾",
  "小組長",
  "實習生",
  "茶水間",
  "便利貼",
  "白板筆",
  "年終獎",
  "考績表",
  "加班單",
  "公文包",
  "電梯口",
  "午餐盒",
  "待辦清單",
  "專案王",
  "流程圖",
  "小螺絲",
  "神隊友",
  "背鍋俠",
  "開關燈",
  "飲水機",
  "辦公椅",
  "垃圾桶",
  "薪水袋",
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
