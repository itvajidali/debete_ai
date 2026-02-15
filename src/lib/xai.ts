import OpenAI from "openai";

const apiKey = process.env.GROK_API_KEY;

if (!apiKey) {
    console.warn("GROK_API_KEY is not set in environment variables.");
}

export const xai = new OpenAI({
    apiKey: apiKey || "",
    baseURL: "https://api.x.ai/v1",
});
