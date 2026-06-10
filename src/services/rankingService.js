import avatar1 from "@/assets/Player_1.png";
import avatar2 from "@/assets/Player_2.png";
import avatar3 from "@/assets/Player_3.png";
import avatar4 from "@/assets/Player_4.png";
const rankingList = [
  {
    id: 1,
    name: "薪水小偷",
    level: 12,
    stars: 3,
    avatar: avatar1,
  },
  {
    id: 2,
    name: "摸魚大師",
    level: 12,
    stars: 2,
    avatar: avatar2,
  },
  {
    id: 3,
    name: "小菜雞",
    level: 12,
    stars: 1,
    avatar: avatar3,
  },
  {
    id: 4,
    name: "豬魔666",
    level: 12,
    stars: 0,
    avatar: avatar4,
  },
];

async function getRankingList() {
  return rankingList;
}

export { getRankingList };
