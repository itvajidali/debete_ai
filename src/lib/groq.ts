import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.warn("GROQ_API_KEY is not set in environment variables.");
}

export const groq = new OpenAI({
    apiKey: apiKey || "",
    baseURL: "https://api.groq.com/openai/v1",
});
