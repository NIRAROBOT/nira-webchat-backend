import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let userMessageCount = {}; // Conteo de mensajes por usuario (email)

app.post("/chat", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.json({ reply: "Falta email o mensaje." });
  }

  if (!userMessageCount[email]) {
    userMessageCount[email] = 0;
  }

  // Si pasó el límite:
  if (userMessageCount[email] >= 3) {
    return res.json({
      reply:
        "Has llegado al límite de tus **3 respuestas gratuitas**.\n\n" +
        "Para continuar chateando conmigo y obtener acceso completo a NIRA, conviértete en fundador.\n\n" +
        "👉 https://nirarobot.com/founders\n"
    });
  }

  userMessageCount[email]++;

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres NIRA, asistente musical." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await apiResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Hubo un error con la respuesta.";

    return res.json({ reply });
  } catch (error) {
    return res.json({ reply: "Error interno del servidor." });
  }
});

app.get("/", (req, res) => {
  res.send("NIRA WebChat Backend funcionando.");
});

app.listen(3000, () => console.log("Servidor activo en puerto 3000"));
