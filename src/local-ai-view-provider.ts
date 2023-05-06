import * as vscode from "vscode";
import * as MarkdownIt from "markdown-it";
import { randomUUID } from "crypto";
import { LocalAI } from "./local-ai-interface";

export default class LocalAIViewProvider implements vscode.WebviewViewProvider {
  private webView?: vscode.WebviewView;
  private message?: any;
  private md: MarkdownIt;
  private localAI: LocalAI;

  constructor(private context: vscode.ExtensionContext, localAI: LocalAI) {
    this.md = new MarkdownIt();
    this.localAI = localAI;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.webView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.type === "chatLocalAI") {
        const htmlResult = this.md.render(data.value);
        const uuid = randomUUID();
        this.sendMessageToWebView({
          command: "chat.parsed",
          value: htmlResult,
          logId: uuid,
          role: "user",
        });

        this.sendLocalAIRequest(data.value, uuid);
      }
    });

    if (this.message !== null) {
      this.sendMessageToWebView(this.message);
      this.message = null;
    }
  }

  public sendMessageToWebView(message: any) {
    if (this.webView) {
      this.webView?.webview.postMessage(message);
    } else {
      this.message = message;
    }
  }

  public async sendLocalAIRequest(prompt: string, uuid: string) {
    try {
      const response = await this.localAI.chatCompletion(prompt, uuid);

      const promptResponse = response?.data.choices[0].message.content || "";
      const htmlResponse = this.md.render(promptResponse);

      this.sendMessageToWebView({
        command: "chat.parsed",
        value: htmlResponse,
        logId: uuid,
        role: "bot",
      });
    } catch (error: any) {
      console.error("err", error);
      await vscode.window.showErrorMessage(
        "Error sending request to LocalAI instance",
        error
      );
      return;
    }
  }

  private getHtml(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.css")
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
				<script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <b>Chat Log</b>
        <div id="chat-log" class="h-52 overflow-auto mb-2">
        
        </div>
				<textarea
					type="text"
					rows="4"
					class="border p-2 w-full"
					id="question-input"
					placeholder="Ask a question..."
				></textarea>
        <div class="p-4 w-full flex space-x-6">
          <button style="background: var(--vscode-button-background)" id="chat-button" class="p-2 w-full ml-5">Ask</button>
          <button style="background: var(--vscode-button-background)" id="clear-button" class="p-2 w-full ml-3">Clear</button>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
}
