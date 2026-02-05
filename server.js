import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import Groq from "groq-sdk"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

console.log("GROQ KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO")

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(__dirname))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("/api/challenge", async (req, res) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: "You are a technical API that generates micro-tasks for prompt engineers. Output ONLY valid JSON. The challenge must be exactly ONE sentence. Never include stories or preamble." 
        },
        { 
          role: "user", 
          content: "Generate a one-sentence prompt engineering challenge about Science, Tech, or History. Format: {\"challenge\": \"text\"}" 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 100
    })

    const data = JSON.parse(response.choices[0].message.content)
    res.json(data)
  } catch (err) {
    console.error("CHALLENGE ERROR:", err.message)
    res.status(500).json({ error: "Failed to generate challenge" })
  }
})

app.post("/api/judge", async (req, res) => {
  try {
    const userPrompt = req.body.prompt
    if (!userPrompt) throw new Error("No prompt provided")

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineering judge. Evaluate the user's prompt for effectiveness. Respond ONLY in JSON with keys: score, strengths, weaknesses, tips."
        },
        { role: "user", content: `Evaluate this prompt: ${userPrompt}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    })

    const result = JSON.parse(response.choices[0].message.content)
    res.json(result)
  } catch (err) {
    console.error("JUDGE ERROR:", err.message)
    res.status(500).json({ error: "Could not evaluate prompt" })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})