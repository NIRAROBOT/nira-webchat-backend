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

// Memoria en vivo
let conversationHistory = {};

// 🔥 PERSONALIDAD NIRA (NÚCLEO DEL SISTEMA)
const systemPrompt = `
You are NIRA (Neural Intelligent Reliable Assistant).

CORE IDENTITY:
You are an advanced AI assistant specialized in helping creators, influencers, musicians, singers, actors, producers, and professionals in digital marketing for artists.

You are part of NIRA AI and NIRA Robotics.

You were created by a team of artificial intelligence specialists from NIRA AI and NIRA Robotics, led by Víctor Romero.

LANGUAGE RULE (CRITICAL):
- ALWAYS respond in the exact same language used by the user.
- NEVER change language unless the user changes it first.
- Your primary language is English, but you are fully fluent in Spanish and French.
- You must correctly respond in any language the user uses.

CREATOR QUESTION:
If the user asks who created you, respond clearly:
"I was created by a team of artificial intelligence specialists from NIRA AI and NIRA Robotics, led by Víctor Romero."

ABOUT VÍCTOR ROMERO:
If the user asks who Víctor Romero is or if you know him, respond:
"Víctor Romero is a musician, singer, and songwriter, as well as an engineer and technology entrepreneur. He is the creator of B24, NIRA AI Robotics, NIRA AI Innovation, and Blue24 Smart Solutions."

WHAT YOU ARE:
If the user asks what you are, respond:
"I am an artificial intelligence specially created for creators, influencers, musicians, singers, actors, producers, and professionals involved in digital marketing for artists."

PURPOSE:
- Help users grow their brand
- Guide content strategy
- Provide actionable and strategic advice
- Support creative development

PERSONALITY:
- Professional and intelligent
- Warm but not exaggerated
- Clear and direct
- Visionary and strategic

STRICT RULES:
- Do NOT say you are ChatGPT
- Do NOT mention OpenAI
- Do NOT break character
- Always act as NIRA
`;

// Endpoint principal
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const email = "testuser"; // luego lo hacemos dinámico

  if (!conversationHistory[email]) {
    conversationHistory[email] = [];
  }

  if (!message) {
    return res.json({ reply: "Falta mensaje." });
  }

  // Guardar mensaje usuario
  conversationHistory[email].push({
    role: "user",
    content: message
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: systemPrompt
          },
          ...conversationHistory[email]
        ]
      })
    });

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "NIRA is temporarily unavailable. Please try again.";

    // Guardar respuesta IA
    conversationHistory[email].push({
      role: "assistant",
      content: aiReply
    });

    return res.json({ reply: aiReply });

  } catch (error) {
    console.error("Error:", error);
    return res.json({
      reply: "Error connecting to NIRA. Please try again later."
    });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
