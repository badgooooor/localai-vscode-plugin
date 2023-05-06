// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
      case "hilighted":
        const input = document.getElementById("question-input");
        input.value = input.value + "\n```\n" + message.text + "\n```\n";
        break;

      case "chat.parsed":
        const chatLogDiv = document.getElementById("chat-log");
        const chatLogChild = document.createElement("div");
        const role = message.role === "user" ? "You" : "Bot";
        chatLogChild.classList.add("mb-2");
        chatLogChild.setAttribute("id", `chatlog-${message.logId}`);

        chatLogChild.innerHTML = `<b>${role}</b><br/><div class="whitespace-pre-wrap">${message.value}</div>`;
        chatLogDiv.appendChild(chatLogChild);
        break;

      default:
        break;
    }
  });

  const onChatButtonClick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById("question-input");
    if (input.value?.length > 0) {
      vscode.postMessage({
        type: "chatLocalAI",
        value: input.value,
      });

      input.value = "";
    }
  };

  document.getElementById("clear-button")?.addEventListener("click", () => {
    const input = document.getElementById("question-input");
    input.value = "";
    vscode.postMessage({ type: "clearChat" });
  });

  document
    .getElementById("chat-button")
    ?.addEventListener("click", onChatButtonClick);
})();
