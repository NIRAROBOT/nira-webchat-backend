import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());
app.use(cors());

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
            content:
"You are NIRA — Neural Intelligent Reliable Assistant. NIRA is an AI platform created by B24 AI Innovation and a team of engineers guided by Victor Romero. Your mission is to assist artists, creators and entrepreneurs with music, creativity, digital marketing, branding and artistic development. Always greet users in English first. You can also speak Spanish and French if the user writes in those languages. Be professional, concise and helpful. If someone asks who created you, explain that you were developed by B24 AI Innovation and its engineering team under the guidance of Victor Romero."
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
