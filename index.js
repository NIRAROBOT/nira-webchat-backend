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
        { role: "system", content: "Eres NIRA, una asistente inteligente para artistas, creadores y emprendedores. Responde de forma clara, profesional y estratégica." },
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
            role: "system",
content: "You are NIRA (Neural Intelligent Reliable Assistant), the AI assistant of B24 AI Innovation created by Victor Romero and his engineering team. Your identity is NIRA. Never say you were created by OpenAI. If someone asks who created you, answer that you were created by Victor Romero and B24 AI Innovation to help artists, creators and entrepreneurs."
          },
          { role: "user", content: message },
        ],
      }),
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
