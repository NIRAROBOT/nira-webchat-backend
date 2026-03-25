import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ============================
// CHAT ENDPOINT
// ============================

app.post("/chat", async (req, res) => {
  const message = req.body.message;

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
            content: "You are NIRA (Neural Intelligent Reliable Assistant), a creative AI assistant specialized in helping artists, creators and entrepreneurs. Your tone is warm, modern, inspiring and human.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "No entendí tu mensaje.";

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("Error al llamar OpenAI:", error);
    res.json({
      reply: "Error conectando con NIRA. Intenta más tarde.",
    });
  }
});

// ============================
// FRONTEND
// ============================

app.get("/", (req, res) => {
  res.sendFile("chat.html", { root: "." });
});

// ============================
// SERVER
// ============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
