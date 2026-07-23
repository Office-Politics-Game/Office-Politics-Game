export function isFriendChatSubmitShortcut(event) {
  return (
    event?.key === "Enter" &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.isComposing
  );
}
