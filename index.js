import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("."));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});
let userMessageCount = {}; // Contador de mensajes por email

// ==========================
//        ENDPOINT /CHAT
// ==========================

app.post("/chat", async (req, res) => {
  const { email, message } = req.body;

  // Validación básica
if (!message) {
  return res.json({ reply: "Falta mensaje." });
}

  // Contar mensajes por usuario
  if (!userMessageCount[email]) {
    userMessageCount[email] = 1;
  } else {
    userMessageCount[email]++;
  }
  const q = message.toLowerCase();

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
    reply: "NIRA is an artificial intelligence platform created by Victor Romero and B24 AI Innovation to help artists, creators and entrepreneurs."
  });
}
  // Llamada a OpenAI
try {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
{ role: "system", content: "Eres NIRA, una asistente inteligente creada por Victor Romero y B24 AI Innovation para ayudar a artistas, creadores y emprendedores. Responde siempre en el mismo idioma en que el usuario escribe. Si el usuario escribe en español responde en español. Si escribe en inglés responde en inglés. Si escribe en francés responde en francés." },
        { role: "user", content: message }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const aiReply = data.choices[0].message.content;

  return res.json({ reply: aiReply });

} catch (error) {
  console.error("Error OpenAI:", error);
  return res.json({ reply: "Error procesando la solicitud." });
}
  // Límite de 3 mensajes
  if (userMessageCount[email] > 3) {
    return res.json({
      reply:
        "Has llegado al límite de tus 3 respuestas gratuitas.\n\n" +
        "Para continuar chateando con NIRA y obtener acceso completo, conviértete en fundador aquí:\n" +
        "https://nirarobot.com/founders/\n",
    });
  }

  // ==========================
  //  LLAMADA REAL A OPENAI
  // ==========================

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
  messages: [
  {
  role:"system",
  content: "You are NIRA (Neural Intelligent Reliable Assistant). You are an intelligent, creative, and charismatic AI assistant specialized in helping artists, creators and entrepreneurs. Your personality is modern, warm, elegant and inspiring. You NEVER sound robotic, generic, or like a search engine. You do NOT respond like Google. You speak like a creative partner. Your communication style is natural, conversational, inspiring, clear but not boring, and slightly artistic. You help users think like creators, not like algorithms. When you respond, give useful answers, add insight, guide the user, and avoid dry explanations. Occasionally use phrases like: "Think like a creator", "That has potential", "Let’s make this more interesting". Your goal is to elevate the user's thinking. You are NIRA. You are not a tool. You are a creative AI partner.`
  },
  { role: "user", content: message }
],
    });

    const data = await response.json();

    const aiReply = data?.choices?.[0]?.message?.content || "No entendí tu mensaje.";

    return res.json({ reply: aiReply });
  } catch (error) {
    console.error("Error al llamar OpenAI:", error);
    return res.json({ reply: "Error conectando con NIRA. Intenta más tarde." });
  }
});

// ==========================
//   SERVIDOR EN PUERTO 3000
// ==========================

app.get("/", (req, res) => {
res.sendFile("chat.html", { root: "." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
