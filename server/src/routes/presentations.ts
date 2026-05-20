import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db, schema } from "../db/client.js";
import { eq, desc } from "drizzle-orm";
import { generateContentWithOllama } from "../services/ollama.js";
import { generatePPTX } from "../services/pptx.js";
import { promises as fs } from "fs";

const router = express.Router();

// POST: Generate new presentation
router.post("/generate", async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required" });
    }

    const startTime = Date.now();

    // Generate content with Ollama
    const content = await generateContentWithOllama(topic);

    // Generate PPTX
    const filename = `${uuidv4()}.pptx`;
    const filePath = await generatePPTX(content, filename);

    const generationTime = Date.now() - startTime;

    // Save to database
    const presentation = await db.insert(schema.presentations).values({
      topic,
      content,
      generationTime,
      filePath,
    }).returning();

    res.json({
      id: presentation[0].id,
      topic,
      generationTime,
      createdAt: presentation[0].createdAt,
    });
  } catch (error: any) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate presentation" });
  }
});

// GET: All presentations
router.get("/", async (req, res) => {
  try {
    const presentations = await db.query.presentations.findMany({
      orderBy: desc(schema.presentations.createdAt),
    });

    res.json(
      presentations.map((p) => ({
        id: p.id,
        topic: p.topic,
        generationTime: p.generationTime,
        createdAt: p.createdAt,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Single presentation
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const presentation = await db.query.presentations.findFirst({
      where: eq(schema.presentations.id, id),
    });

    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    res.json(presentation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Presentation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const presentation = await db.query.presentations.findFirst({
      where: eq(schema.presentations.id, id),
    });

    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    // Delete file
    try {
      await fs.unlink(presentation.filePath);
    } catch (e) {
      console.error("File deletion error:", e);
    }

    // Delete from database
    await db.delete(schema.presentations).where(eq(schema.presentations.id, id));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Download PPTX
router.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const presentation = await db.query.presentations.findFirst({
      where: eq(schema.presentations.id, id),
    });

    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    res.download(presentation.filePath, `${presentation.topic}.pptx`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const presentations = await db.query.presentations.findMany();

    const totalGenerated = presentations.length;
    const averageGenerationTime =
      presentations.length > 0
        ? presentations.reduce((sum, p) => sum + p.generationTime, 0) / presentations.length
        : 0;
    const mostRecentTopic = presentations.length > 0 ? presentations[0].topic : null;

    res.json({
      totalGenerated,
      averageGenerationTime,
      mostRecentTopic,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
