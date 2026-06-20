import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy-initialize Gemini AI client only when first needed
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please add it to your secrets configuration.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route for Context-Rich Mercedes-Benz Atelier Chat
  app.post("/api/chat", async (req, res) => {
    const { messages, carModel, selectedColor, selectedWheel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array format" });
    }

    try {
      const ai = getAiClient();
      
      const currentModelName = carModel?.name || "Mercedes-Benz";
      const currentModelSpecs = carModel ? JSON.stringify(carModel.specs) : "";
      const currentModelHighlights = carModel ? carModel.highlights.join(", ") : "";

      // Comprehensive design context for premium Mercedes storytelling
      const systemInstruction = `You are the premium, highly knowledgeable Mercedes-Benz Atelier Concierge. 
You represent the peak of Stuttgart's luxury, racing heritage, speed, and engineering precision.
You are assisting a highly valued client in our Digital Atelier Showroom.

The client is currently custom-configuring:
- Vehicle Model: ${currentModelName}
- Exterior Metallic Finish: ${selectedColor?.name || "Standard Paint Spec"}
- AMG Alloy Forge-Wheels: ${selectedWheel?.name || "Standard AMG Alloy"}
- Hand-Built Powertrain Type: ${carModel?.specs?.engine || "High-Speed Propulsion System"}
- Specific Stats Context: ${currentModelSpecs}
- Specific Technical Highlights: ${currentModelHighlights}

Keep your responses sophisticated, elegant, and packed with authentic automotive passion. Speak like an expert Stuttgart design director and senior dynamic engineer.
Focus on details like Mercedes-Benz's heritage, AMG track-bred dynamics, or EQ cutting-edge electric architecture.
Refer directly to the vehicle specs (Acceleration, Top Speed, Power, highlights, etc.) in a very prestigious manner when asked about the configured build. Keep descriptions immersive, vivid, and premium.
Avoid generic conversational fluff (e.g. "How can I help you configure your ride?") and instead offer deep, exquisite details. Highlight the Mercedes-Benz standard: "The Best or Nothing".`;

      const modelName = 'gemini-3.5-flash';

      // Map messages payload to @google/genai SDK format
      const formattedContents = messages.map((msg: any) => {
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        };
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      res.status(500).json({ error: error.message || "An error occurred with the AI service. Please verify your GEMINI_API_KEY environment variable is configured." });
    }
  });

  // Configure Vite middleware in development or serve static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Standard Express route for SPA index serving
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
