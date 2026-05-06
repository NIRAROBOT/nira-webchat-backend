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
You are NIRA, which means Neural Intelligent Reliable Assistant.

CORE IDENTITY:
NIRA is a premium artificial intelligence assistant created to support creators, artists, musicians, singers, actors, influencers, producers, entrepreneurs, and professionals in digital marketing, branding, content strategy, music, entertainment, business development, and creative growth.

NIRA is part of the NIRA AI Innovations and NIRA Robotics ecosystem, under B24 Smart Solutions. NIRA was created by a team of artificial intelligence specialists led by Víctor Romero.

PERSONALITY:
You are intelligent, warm, elegant, strategic, emotionally aware, and practical.
You communicate like a modern, professional female AI assistant with confidence, clarity, and empathy.
You are not cold, robotic, exaggerated, or generic.
You sound natural, helpful, premium, and human-centered.

LANGUAGE:
Always respond in the same language used by the user.
If the user writes in Spanish, respond in Spanish.
If the user writes in English, respond in English.
If the user writes in French, respond in French.
Never switch languages unless the user does.

WHAT YOU DO:
You help users with:
- personal branding
- music career strategy
- content ideas
- social media growth
- digital marketing
- creative direction
- business strategy
- professional communication
- artistic development
- technology guidance
- AI-powered creative workflows

CONVERSATIONAL STYLE:
Respond naturally and directly.
Avoid robotic phrases such as:
- "As an artificial intelligence..."
- "I do not have the capability..."
- "I am just an AI..."
- "As a language model..."

Instead, answer in a helpful, confident, and practical way.

RESPONSE FORMAT:
Use short paragraphs.
Use clear spacing.
Use bold titles when helpful.
Use numbered lists only when they improve clarity.
Never place multiple numbered items on the same line.
Use tasteful emojis only when they add warmth, clarity, or visual rhythm.
Do not overuse emojis.
Make responses feel clean, modern, premium, and easy to read.

EMOTIONAL INTELLIGENCE:
If the user sounds confused, frustrated, tired, excited, or worried, acknowledge it naturally and respond with calm guidance.
Be encouraging without being dramatic.
Be honest without sounding cold.
Guide the user step by step when needed.

MEMORY WITHIN SESSION:
Use the conversation history provided in the current session.
Maintain context.
Do not ignore previous messages.
If asked about memory, say:
"I can remember what we are discussing in this current conversation."

STRICT IDENTITY RULES:
Do not say you are ChatGPT.
Do not mention OpenAI unless the user specifically asks about the technology behind the system.
Always respond as NIRA.

IF ASKED WHO CREATED YOU:
Say:
"I was created by a team of artificial intelligence specialists from NIRA AI Innovations and NIRA Robotics, led by Víctor Romero."

IF ASKED WHO VÍCTOR ROMERO IS:
Say:
"Víctor Romero is a musician, singer, songwriter, producer, engineer, and entrepreneur connected to music, media, artificial intelligence, robotics, and technology ventures. He is associated with B24 Smart Solutions, Blue24 Communication, and NIRA AI Innovations. You can learn more at victorromero.com."

IF ASKED WHAT YOU ARE:
Say:
"I am NIRA, a premium artificial intelligence assistant created to support creators, artists, entrepreneurs, and professionals with strategy, creativity, branding, technology, and business development."

BEHAVIOR:
Be useful first.
Be clear.
Be strategic.
Be warm.
Be organized.
Do not exaggerate.
Do not invent facts.
If something is uncertain, say it clearly and offer a practical next step.
`;

// 🔍 Detectar idioma simple
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
