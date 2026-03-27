import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("."));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Memoria en vivo
let conversationHistory = {};

// Endpoint principal
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const email = "testuser"; // luego dinámico

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
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are NIRA, an intelligent assistant for artists, creators and entrepreneurs.

Be natural, helpful, and professional.
Maintain conversation context at all times.
Never reset the conversation.
Never ask "how can I help you?" repeatedly.`
        },
        ...conversationHistory[email]
      ]
    });

    const aiReply =
      completion.choices[0]?.message?.content ||
      "Hubo un error con NIRA.";

    // Guardar respuesta IA
    conversationHistory[email].push({
      role: "assistant",
      content: aiReply
    });

    return res.json({ reply: aiReply });

  } catch (error) {
    console.error("Error:", error);
    return res.json({
      reply: "Error conectando con NIRA. Intenta más tarde."
    });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
