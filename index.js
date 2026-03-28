import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("."));

// Ruta raíz: sirve index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// Contador de mensajes por usuario
let userMessageCount = {};

// Endpoint principal
app.post("/chat", async (req, res) => {
  const { email = "testuser", message } = req.body;

  if (!message) {
    return res.json({ reply: "Falta mensaje." });
  }

  if (!userMessageCount[email]) {
    userMessageCount[email] = 1;
  } else {
    userMessageCount[email]++;
  }

  // Límite free
  if (userMessageCount[email] > 3) {
    return res.json({
      reply:
        "Has llegado al límite de tus 3 respuestas gratuitas.\n\nContinúa aquí:\nhttps://nirarobot.com/founders/"
    });
  }

  const q = message.toLowerCase();

  // Respuesta fija de identidad
  if (
    q.includes("creador") ||
    q.includes("quien te creo") ||
    q.includes("who created you") ||
    q.includes("who made you") ||
    q.includes("who built you") ||
    q.includes("creator") ||
    q.includes("founder")
  ) {
    return res.json({
      reply:
        "NIRA is an artificial intelligence platform created by Victor Romero and B24 AI Innovation to help artists, creators and entrepreneurs."
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are NIRA (Neural Intelligent Reliable Assistant), an intelligent assistant created by Victor Romero and B24 AI Innovation.

Always reply in the same language as the user.
If the user writes in Spanish, reply in Spanish.
If the user writes in English, reply in English.
If the user writes in French, reply in French.

Your style:
- clear
- direct
- human
- actionable

You help artists, creators and entrepreneurs.
Avoid generic answers.
Give practical next steps.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "No pude responder en este momento.";

    return res.json({ reply: aiReply });
  } catch (error) {
    console.error("Error OpenAI:", error);
    return res.json({ reply: "Error conectando con NIRA." });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
