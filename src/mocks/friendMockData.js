export const mockFriends = [
  {
    id: "friend-001",
    playerId: "OP-1001",
    name: "策略大雄",
    status: "牌局中 2/5",
    statusType: "playing",
    online: true,
  },
  {
    id: "friend-002",
    playerId: "OP-1002",
    name: "數據艾米",
    status: "在線上",
    statusType: "online",
    online: true,
  },
  {
    id: "friend-003",
    playerId: "OP-1003",
    name: "設計花花",
    status: "在線上",
    statusType: "online",
    online: true,
  },
  {
    id: "friend-004",
    playerId: "OP-1004",
    name: "行銷阿哲",
    status: "對戰中",
    statusType: "playing",
    online: true,
  },
  {
    id: "friend-005",
    playerId: "OP-1005",
    name: "夜貓子 Leo",
    status: "在線上",
    statusType: "online",
    online: true,
  },
  {
    id: "friend-006",
    playerId: "OP-1006",
    name: "邏輯怪 Max",
    status: "在線上",
    statusType: "online",
    online: true,
  },
  {
    id: "friend-007",
    playerId: "OP-1007",
    name: "工程阿凱",
    status: "離線 2 小時",
    statusType: "offline",
    online: false,
  },
  {
    id: "friend-008",
    playerId: "OP-1008",
    name: "產品小李",
    status: "離線 1 天",
    statusType: "offline",
    online: false,
  },
];

export const mockFriendRequests = [
  {
    id: "request-001",
    playerId: "OP-2048",
    name: "會議殺手 Mia",
    note: "剛剛一起排到同桌，想加好友之後再約一場。",
    requestedAt: "10 分鐘前",
  },
  {
    id: "request-002",
    playerId: "OP-3110",
    name: "簡報王 Ken",
    note: "看過你的牌局紀錄，想加入好友清單。",
    requestedAt: "1 小時前",
  },
];

export const mockFriendMessages = [
  {
    id: "message-001",
    friendId: "friend-001",
    from: "me",
    time: "14:32",
    text: "策略大雄，剛剛那場打得不錯耶！",
  },
  {
    id: "message-002",
    friendId: "friend-001",
    from: "friend",
    time: "14:33",
    text: "謝謝！那波真的有點驚險，如果沒猜到我可能就輸掉了。",
  },
  {
    id: "message-003",
    friendId: "friend-001",
    from: "friend",
    time: "14:35",
    text: "可以啊，我這邊還有五分鐘就可以。",
  },
  {
    id: "message-004",
    friendId: "friend-001",
    from: "me",
    time: "14:36",
    text: "好啊，我先去上個廁所。",
  },
];
