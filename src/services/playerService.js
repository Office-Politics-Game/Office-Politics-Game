async function createGuestPlayer({ username, avatarId }) {
  const response = await fetch("/api/players/guest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, avatarId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "建立訪客資料失敗，請稍後再試");
  }

  return data.player;
}

export { createGuestPlayer };
