import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

let userMessageCount = {}; // Contador mensajes por usuario (email)

app.post("/chat", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.json({ reply: "Falta email o mensaje." });
  }

  // Contar mensajes
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
        "Para continuar chateando con NIRA y obtener acceso completo, conviértete en fundador.\n\n" +
        "https://nirarobot.com/founders/\n",
    });
  }

  // ---- AQUI SE LLAMA A OPENAI ----
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Eres NIRA, la asistente inteligente especializada en artistas y creadores.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await openaiResponse.json();

    // Respuesta real
    return res.json({
      reply: data.choices?.[0]?.message?.content || "NIRA no pudo responder.",
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res.json({
      reply: "Hubo un error procesando la solicitud a OpenAI.",
    });
  }
});

// Puerto Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
