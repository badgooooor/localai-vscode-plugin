// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const onChatButtonClick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById("chat-button");
    if (input.value?.length > 0) {
      vscode.postMessage({
        type: "chatLocalAI",
        value: input.value,
      });

      input.value = "";
    }
  };

  document.getElementById("clear-button")?.addEventListener("click", () => {
    list.innerHTML = "";
    vscode.postMessage({ type: "clearChat" });
  });

  document
    .getElementById("chat-button")
    ?.addEventListener("click", onChatButtonClick);
})();
