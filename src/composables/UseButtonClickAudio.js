import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const BUTTON_CONTROL_SELECTOR = 'button, [role="button"]';

function isDisabledControl(control) {
  return (
    control.matches(":disabled") ||
    control.getAttribute("aria-disabled") === "true"
  );
}

export function useButtonClickAudio() {
  const { playPreGameSound } = usePreGameAudio();

  function handleButtonClick(event) {
    const control = event.target?.closest?.(BUTTON_CONTROL_SELECTOR);

    if (
      !control ||
      !event.currentTarget?.contains(control) ||
      isDisabledControl(control)
    ) {
      return;
    }

    playPreGameSound("login-button-click");
  }

  return { handleButtonClick };
}
