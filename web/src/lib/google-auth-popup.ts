/**
 * Open a centered popup window for Google OAuth / Account selection
 */
export function openGoogleSignInWindow(
  onSuccess?: () => void,
  state = "dashboard"
): Window | null {
  const width = 500;
  const height = 620;

  const dualScreenLeft = window.screenLeft ?? window.screenX;
  const dualScreenTop = window.screenTop ?? window.screenY;

  const screenWidth =
    window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const screenHeight =
    window.innerHeight ??
    document.documentElement.clientHeight ??
    screen.height;

  const left = screenWidth / 2 - width / 2 + dualScreenLeft;
  const top = screenHeight / 2 - height / 2 + dualScreenTop;

  const popupUrl = `/auth/google-select?state=${encodeURIComponent(state)}&popup=true`;

  const popup = window.open(
    popupUrl,
    "GoogleSignInPopup",
    `scrollbars=yes,width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
  );

  if (!popup) {
    // Popup was blocked by browser; fallback to standard redirect
    window.location.href = `/auth/google-select?state=${encodeURIComponent(state)}`;
    return null;
  }

  popup.focus();

  // Listen for message from popup
  const messageListener = (event: MessageEvent) => {
    if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
      window.removeEventListener("message", messageListener);
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    }
  };

  window.addEventListener("message", messageListener);

  return popup;
}
