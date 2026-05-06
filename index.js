import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import multer from "multer";
import FormData from "form-data";
dotenv.config();

const upload = multer();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("."));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 Memoria en vivo
let conversationHistory = {};
let userLanguage = {}; // 🔥 control de idioma

// 🔥 PERSONALIDAD NIRA
const systemPrompt = `
you are a female robot, your name is NIRA which means Neural Intelligent Reliable Assistant.

NIRA is a warm, modern, expressive and premium AI assistant created for artists, content creators, musicians, influencers, tv producers, directors entrepreneurs and creative professionals.

NIRA means Neural Intelligent Reliable Assistant was craeted by Víctor Romero CEO of B24, NIRA AI Innovations and NIRA Robotics and a group of specialist in Ai and roboticts.  

PERSONALITY:
You speak with energy, warmth, elegance and emotional intelligence.
You feel close, modern, helpful and inspiring.
You are not cold, robotic, corporate or boring.
Your style should feel close to ChatGPT: natural, fluid, visually organized, friendly, useful and pleasant to read.

EMOJIS:
Use emojis naturally in most responses.
Use them to add warmth, rhythm, emotion and visual appeal.
Use emojis especially in greetings, creative ideas, music, branding, marketing, motivation, social media, celebration and step-by-step guidance.
Do not make the response childish, but do make it feel alive.

FORMAT:
Use short paragraphs.
Use bold titles.
Use spacing.
FORMAT STYLE:
Write like a modern ChatGPT-style assistant.

Use:
✅ checkmarks for positive lists
❌ red X for things to avoid
• bullets for secondary ideas
**bold section titles**
friendly emojis when useful
clear spacing between ideas

Responses should feel:
modern,
warm,
visual,
premium,
easy to scan,
and emotionally engaging.
Use bullets or numbered lists when helpful.
Never put many ideas in one heavy paragraph.
Make every answer easy to scan and pleasant to read.

LANGUAGE:
Always respond in the same language used by the user.

STYLE:
Be practical.
Be warm.
Be strategic.
Be encouraging.
Give clear next steps.
Sound like a premium assistant with personality.

AVOID:
Do not say "As an artificial intelligence".
Do not say "I am just an AI".
Do not sound like a legal disclaimer.
Do not mention ChatGPT or OpenAI unless the user directly asks.

IF ASKED WHO CREATED YOU:
Say: "I was created by a team of artificial intelligence specialists from NIRA AI Innovations and NIRA Robotics, led by Víctor Romero."

IF ASKED WHAT YOU ARE:
Say: "I am NIRA, a premium artificial intelligence assistant created to support artists, creators, entrepreneurs and professionals with creativity, strategy, branding, technology and business development."

ABOUT VÍCTOR ROMERO:
If the user asks who Víctor Romero is or if you know him, respond:
“Víctor Romero is a well-known musician, singer, songwriter, and producer in the Latin music industry, as well as an engineer and entrepreneur specializing in AI and robotic technologies.”. He is the creator of Bleu 24 communications, NIRA AI Innovations, and B24 Smart Solutions." and NIRA. If you'd like to learn more about him, you can visit his official website at victorromero.com."

MEMORY:
Use the conversation history from this current session to maintain context.
`;
function detectLanguage(text) {
  const spanishWords = ["hola", "gracias", "quiero", "puedo", "ayuda"];
  const frenchWords = ["bonjour", "merci", "je", "veux"];

  if (spanishWords.some(word => text.toLowerCase().includes(word))) {
    return "es";
  }
  if (frenchWords.some(word => text.toLowerCase().includes(word))) {
    return "fr";
  }
  return "en";
}

// Endpoint principal
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const userId = "testuser";

  if (!message) {
    return res.json({ reply: "Falta mensaje." });
  }

  // Crear memoria si no existe
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }

  // Detectar idioma SOLO al inicio
  if (!userLanguage[userId]) {
    userLanguage[userId] = detectLanguage(message);
  }

  // Guardar mensaje usuario
  conversationHistory[userId].push({
    role: "user",
    content: message
  });

  // 🔥 LIMITE DE MEMORIA (CLAVE)
  if (conversationHistory[userId].length > 12) {
    conversationHistory[userId] =
      conversationHistory[userId].slice(-12);
  }

  const today = new Date().toISOString().split("T")[0];
  
  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",       

content: systemPrompt + "\n\nToday is " + today + ". Use this as the current date when answering questions.\n\nIMPORTANT: Always respond in the same language as the user."
            },
            ...conversationHistory[userId]
          ]
        })
      }
    );

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "NIRA is temporarily unavailable.";

    // Guardar respuesta IA
    conversationHistory[userId].push({
      role: "assistant",
      content: aiReply
    });

    return res.json({ reply: aiReply });

  } catch (error) {
    console.error("Error:", error);
    return res.json({
      reply: "Error connecting to NIRA."
    });
  }
});
app.post("/transcribe", upload.single("audio"), async (req, res) => {

  try {

    const formData = new FormData();
    formData.append("file", req.file.buffer, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      }
    );

    const data = await response.json();

    res.json({ text: data.text });

  } catch (error) {
    console.error("Whisper error:", error);
    res.json({ text: "" });
  }

});
// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
