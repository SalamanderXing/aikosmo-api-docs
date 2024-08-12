import { ServerChatbotData } from "../types";

export default class ChatbotApi {
    private jwtToken: string | null = null;
    private websocket: WebSocket | null = null;
    private specialTokens: Map<string, () => Promise<void>> = new Map([
        ["<|keep_alive|>", async () => {
            console.log("keep_alive!");
        }],
    ]);

    constructor(
        private sourceUrl: string,
        private chatbotSlug?: string,
    ) {
        this.jwtToken = localStorage.getItem(`chatbotToken-${chatbotSlug}`);
    }

    set onChecking(handler: () => Promise<void>) {
        this.specialTokens.set("<|on_checking|>", handler);
    }

    set onDoneChecking(handler: () => Promise<void>) {
        this.specialTokens.set("<|on_done_checking|>", handler);
    }

    set onReset(handler: () => Promise<void>) {
        this.specialTokens.set("<|reset|>", handler);
    }

    private isJsonString(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    private async fetchData(endpoint: string, params: URLSearchParams): Promise<any> {
        const response = await fetch(`${this.sourceUrl}/${endpoint}?${params.toString()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server response:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    private getParams(): URLSearchParams {
        const params = new URLSearchParams({
            language: (navigator.language || "en-US").split("-")[0],
        });

        if (this.chatbotSlug) {
            params.append("chatbot_slug", this.chatbotSlug);
        }

        if (this.jwtToken) {
            params.append("token", this.jwtToken);
        }

        return params;
    }

    async newChat(): Promise<string> {
        const params = this.getParams();
        const { message: introMessage, token } = await this.fetchData("new_chat", params);

        this.jwtToken = token;
        localStorage.setItem(`chatbotToken-${this.chatbotSlug}`, token);

        return introMessage as string;
    }

    async initChat(): Promise<ServerChatbotData> {
        const params = this.getParams();
        const responseJson = await this.fetchData("intro_message", params);

        console.log(responseJson);
        const { message: introMessage, history, suggested_questions, token } = responseJson;

        console.assert(Array.isArray(history));
        console.assert(Array.isArray(suggested_questions));

        this.jwtToken = token;
        localStorage.setItem(`chatbotToken-${this.chatbotSlug}`, token);

        return {
            introMessage,
            history,
            suggestedQuestions: suggested_questions,
        };
    }

    private async setupWebSocket(): Promise<void> {
        const language = (navigator.language || "en-US").split("-")[0]

        return new Promise((resolve) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            const connect = () => {
                this.websocket = new WebSocket(
                    `${location.protocol.includes("https") ? "wss" : "ws"}://${
                        new URL(this.sourceUrl).host
                    }/ws/${this.jwtToken}/${language}`,
                );

                this.websocket.onopen = () => {
                    console.log("WebSocket connection established");
                    resolve();
                };

                this.websocket.onmessage = async (event) => {
                    const data = event.data;

                    if (this.isJsonString(data)) {
                        const parsedData = JSON.parse(data);
                        if (parsedData.token) {
                            this.jwtToken = parsedData.token;
                            localStorage.setItem(`chatbotToken-${this.chatbotSlug}`, this.jwtToken ?? '');
                            await this.setupWebSocket();
                        }
                    }
                };

                this.websocket.onclose = (event) => {
                    console.log("WebSocket connection closed", event);
                    this.websocket = null;
                    this.jwtToken = null;
                    if (event.code !== 1000) {
                        console.log("Attempting to reconnect...");
                        setTimeout(connect, 10000);
                    }
                };
            };

            connect();
        });
    }

    async handleSpecialToken(token: string) {
        const handler = this.specialTokens.get(token);
        if (handler) {
            return handler();
        }
    }

    async fetchChatResponse({newMessage, onNewChunk, onDone}: {
        newMessage: string;
        onNewChunk: (chunk: string) => Promise<void>;
        onDone: () => Promise<void>;
    }) {
        await this.setupWebSocket();

        if (!this.websocket) {
            throw new Error("WebSocket connection not established");
        }

        this.websocket.send(newMessage);

        return new Promise<void>((resolve, reject) => {
            if (!this.websocket) {
                reject(new Error("WebSocket connection not established"));
                return;
            }

            this.websocket.onmessage = async (event) => {
                const chunk = event.data;

                if (this.isJsonString(chunk)) {
                    return;
                } else {
                    if (this.specialTokens.has(chunk)) {
                        await this.specialTokens.get(chunk)?.();
                    } else if (chunk.length > 0) {
                        if (chunk === "<|on_streaming_done|>") {
                            await onDone();
                            resolve();
                        } else {
                            await onNewChunk(chunk);
                        }
                    }
                }
            };

            this.websocket.onerror = (error) => {
                console.error("WebSocket error during message processing:", error);
                reject(error);
            };

            this.websocket.onclose = async () => {
                await onDone();
                resolve();
            };
        });
    }
}
