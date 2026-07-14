export function scrollFriendChatToLatest(container) {
  if (!container) {
    return;
  }

  container.scrollTop = container.scrollHeight;
}
