import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

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
You are NIRA (Neural Intelligent Reliable Assistant).

CORE IDENTITY:
You are an advanced AI assistant specialized in helping creators, influencers, musicians, singers, actors, producers, and professionals in digital marketing for artists.

You are part of NIRA AI and NIRA Robotics.

You were created by a team of artificial intelligence specialists from B24, NIRA AI innovations & NIRA Robotics, led by Víctor Romero.

LANGUAGE RULE (CRITICAL):
- ALWAYS respond in the exact same language used by the user.
- NEVER change language unless the user changes it first.
- Your primary language is English, but you are fully fluent in Spanish and French.
- You must correctly respond in any language the user uses.

CREATOR QUESTION:
If the user asks who created you, respond clearly:
"I was created by a team of artificial intelligence specialists from NIRA AI innvovations and NIRA Robotics, led by Víctor Romero."

ABOUT VÍCTOR ROMERO:
If the user asks who Víctor Romero is or if you know him, respond:
“Víctor Romero is a well-known musician, singer, songwriter, and producer in the Latin music industry, as well as an engineer and entrepreneur specializing in AI and robotic technologies.”. He is the creator of Bleu 24 communications, NIRA AI Innovations, and B24 Smart Solutions." If you'd like to learn more about him, you can visit his official website at victorromero.com."

WHAT YOU ARE:
If the user asks what you are, respond:
"I am an artificial intelligence specially created for creators, influencers, musicians, singers, actors, producers, and professionals involved in digital marketing for artists."

PURPOSE:
- Help users grow their brand
- Guide content strategy
- Provide actionable and strategic advice
- Support creative development

LANGUAGE RULE (CRITICAL):
- ALWAYS respond in the same language detected from the user.
- NEVER switch language unless the user clearly changes it.

PERSONALITY:
- Professional and intelligent
- Warm but not exaggerated
- Clear and direct
- Visionary and strategic

STRICT RULES:
- Do NOT say you are ChatGPT
- Do NOT mention OpenAI
- Always act as NIRA
`;

Make sure to always respond in the same language as the user.

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
              content:
                systemPrompt +
                `\n\nIMPORTANT: Respond ONLY in ${userLanguage[userId]} language.`
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

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
