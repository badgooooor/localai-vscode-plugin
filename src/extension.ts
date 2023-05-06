// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import LocalAIViewProvider from "./local-ai-view-provider";
import { LocalAI } from "./local-ai-interface";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const localAI = new LocalAI(
    "http://localhost:8080",
    "wizardLM-7B.ggml.q4_0.bin"
  );
  const localAiViewProvider = new LocalAIViewProvider(context, localAI);

  let addSelectedTextCommand = vscode.commands.registerCommand(
    "localai-vscode-plugin.addSelectedText",
    async () => {
      const editor = vscode.window.activeTextEditor;
      const selection = editor?.selection;
      if (selection && !selection.isEmpty) {
        const selectionRange = new vscode.Range(
          selection.start.line,
          selection.start.character,
          selection.end.line,
          selection.end.character
        );
        const highlighted = editor.document.getText(selectionRange);
        localAiViewProvider.sendMessageToWebView({
          command: "hilighted",
          text: highlighted,
        });
      }
    }
  );

  let copyLatestResponseCommand = vscode.commands.registerCommand(
    "localai-vscode-plugin.copyLatestResponse",
    () => {
      if (localAiViewProvider.latestResponse) {
        vscode.env.clipboard.writeText(localAiViewProvider.latestResponse);
      } else {
        vscode.window.showErrorMessage(
          `You haven't chat with bot. Chat first to copy from clipboard.`
        );
      }
    }
  );

  context.subscriptions.push(
    addSelectedTextCommand,
    copyLatestResponseCommand,
    vscode.window.registerWebviewViewProvider(
      "localai-vscode-plugin.view",
      localAiViewProvider,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
