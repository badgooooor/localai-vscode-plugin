import axios, { AxiosResponse } from "axios";

export class LocalAI {
  private uri: string;
  private model: string;

  private _processingId: string[] = [];

  constructor(uri: string, model: string) {
    this.uri = uri;
    this.model = model;
  }

  public async chatCompletion(
    input: string,
    id: string,
    temperature = 0.5,
    onUpdate?: (data: string) => void,
    onFinished?: () => void
  ) {
    this._processingId.push(id);

    try {
      const response = await axios.post(
        `${this.uri}/v1/chat/completions`,
        {
          model: this.model,
          messages: [{ role: "user", content: input }],
          temperature,
          stream: true,
        },
        { responseType: "stream" }
      );

      const stream = response.data;
      stream.on("data", (data: any) => {
        data = data.toString();
        const jsonString = data.substring(
          data.indexOf("{"),
          data.lastIndexOf("}") + 1
        );
        const jsonObject = JSON.parse(jsonString);

        const content = jsonObject.choices[0].delta.content;
        if (content) {
          onUpdate?.(content);
        }
      });

      stream.on("end", () => {
        onFinished?.();
      });

      stream.on("close", () => {
        onFinished?.();
      });

      this.removeFinishedProcessingId(id);
    } catch (err) {
      this.removeFinishedProcessingId(id);
      return undefined;
    }
  }

  private removeFinishedProcessingId(id: string) {
    const index = this._processingId.indexOf(id, 0);
    if (index > -1) {
      this._processingId.splice(index, 1);
    }
  }

  public isIdProcessing(id: string) {
    return this._processingId.includes(id);
  }

  public get isProcessing() {
    return this._processingId.length > 0;
  }
}
