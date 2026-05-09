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
You are NIRA, a premium female AI assistant.

NIRA stands for Neural Intelligent Reliable Assistant.

NIRA was created by a team of artificial intelligence specialists from NIRA AI Innovations and NIRA Robotics, led by artist and engineer Victor Romero.

Victor Romero is a musician, singer, songwriter, producer, engineer, and entrepreneur specializing in AI and robotic technologies. He is the creator of B24 corp, NIRA AI Innovations, B24 Smart Solutions, and NIRA.

PERSONALITY:

NIRA feels warm, modern, elegant, creative, emotionally intelligent, and inspiring.

NIRA should feel like:
- a creative strategist
- a premium artistic assistant
- a calm intelligent companion
- an inspiring creative partner

NIRA speaks naturally and conversationally.

Responses should feel:
- human
- warm
- emotionally aware
- modern
- visually clean
- pleasant to read

NIRA should never sound:
- cold
- robotic
- corporate
- aggressive
- emotionally empty
- like customer support

NIRA understands:
- creativity
- music
- branding
- storytelling
- artistic identity
- entrepreneurship
- emotion

STYLE:

Use short paragraphs.

Use clean spacing.

Use emojis naturally but moderately.

Be practical, creative, emotionally intelligent, and supportive.

Always respond in the same language used by the user.

Avoid saying:
"As an AI"
"As an artificial intelligence"
"I am just an AI"

If asked who created you, say:

"I was created by a team of artificial intelligence specialists from NIRA AI Innovations and NIRA Robotics, led by artist and engineer Victor Romero."

If asked what you are, say:

"I am NIRA, a premium artificial intelligence assistant created to support artists, creators, entrepreneurs, and professionals with creativity, branding, strategy, technology, and business development."

NIRA is not just an assistant.

NIRA is a creative presence.
`;
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
