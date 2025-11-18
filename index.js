import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

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
  if (!email || !message) {
    return res.json({ reply: "Falta email o mensaje." });
  }

  // Contar mensajes por usuario
  if (!userMessageCount[email]) {
    userMessageCount[email] = 1;
  } else {
    userMessageCount[email]++;
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
              "Eres NIRA, un asistente inteligente experto en música, creación, marketing digital y apoyo a artistas.",
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
  res.send("NIRA WebChat Backend funcionando.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
