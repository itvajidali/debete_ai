import OpenAI from "openai";

export const ollama = new OpenAI({
    apiKey: "ollama",
    baseURL: "http://127.0.0.1:11434/v1", // Using IPv4 explicitly to avoid localhost/IPv6 issues
});
