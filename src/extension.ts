// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import LocalAIViewProvider from "./local-ai-view-provider";
import { LocalAI } from "./local-ai-interface";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const localAI = new LocalAI("http://localhost:8080", "ggml-gpt4all-j");
  const localAiViewProvider = new LocalAIViewProvider(context, localAI);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "localai-vscode-plugin.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from localai-vscode-plugin!"
      );
    }
  );

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
  context.subscriptions.push(
    disposable,
    addSelectedTextCommand,
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
