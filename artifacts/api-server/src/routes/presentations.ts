import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { presentationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GeneratePresentationBody,
  GetPresentationParams,
  DeletePresentationParams,
  DownloadPresentationParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// Ensure pptx output directory exists
const PPTX_DIR = path.join(process.cwd(), "data", "pptx");
fs.mkdirSync(PPTX_DIR, { recursive: true });

// GET /presentations/stats — must be before /:id
router.get("/presentations/stats", async (req, res) => {
  try {
    const all = await db.select().from(presentationsTable);
    const total = all.length;
    const avgTime =
      total > 0
        ? all.reduce((sum, p) => sum + p.generationTimeSeconds, 0) / total
        : 0;
    const sorted = [...all].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json({
      total,
      avgGenerationSeconds: Math.round(avgTime * 10) / 10,
      mostRecentTopic: sorted[0]?.topic ?? null,
    });
  } catch (err) {
    req.log.error(err, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /presentations
router.get("/presentations", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(presentationsTable)
      .orderBy(desc(presentationsTable.createdAt));
    const presentations = rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      content: r.content,
      generationTimeSeconds: r.generationTimeSeconds,
      createdAt: r.createdAt.toISOString(),
      pptxPath: r.pptxPath,
    }));
    res.json(presentations);
  } catch (err) {
    req.log.error(err, "Failed to list presentations");
    res.status(500).json({ error: "Failed to list presentations" });
  }
});

// POST /presentations
router.post("/presentations", async (req, res) => {
  const parsed = GeneratePresentationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { topic } = parsed.data;
  const startTime = Date.now();

  const prompt = `You are an academic presentation expert for B.Tech engineering students. Generate a complete professional seminar presentation for the topic: "${topic}".

You MUST return ONLY valid JSON with absolutely no markdown, no code blocks, no commentary. Output ONLY the JSON object.

Generate completely topic-specific content. Do NOT use generic placeholder content.

Return this exact JSON structure:
{
  "title": "${topic}",
  "introduction": "Write a well-formed paragraph of 5-6 sentences introducing the topic. Explain what it is, its origin, and its significance in the field.",
  "explanationPart1": "Write a well-formed paragraph of 5-6 sentences explaining the core concept, how it works, and its fundamental principles.",
  "explanationPart2": "Write a well-formed paragraph of 5-6 sentences covering the technical details, real-world applications, and how it is implemented.",
  "advantages": [
    {"heading": "Short advantage title", "explanation": "One clear sentence explaining this advantage specific to ${topic}."},
    {"heading": "Short advantage title", "explanation": "One clear sentence explaining this advantage specific to ${topic}."},
    {"heading": "Short advantage title", "explanation": "One clear sentence explaining this advantage specific to ${topic}."},
    {"heading": "Short advantage title", "explanation": "One clear sentence explaining this advantage specific to ${topic}."},
    {"heading": "Short advantage title", "explanation": "One clear sentence explaining this advantage specific to ${topic}."}
  ],
  "disadvantages": [
    {"heading": "Short disadvantage title", "explanation": "One clear sentence explaining this disadvantage specific to ${topic}."},
    {"heading": "Short disadvantage title", "explanation": "One clear sentence explaining this disadvantage specific to ${topic}."},
    {"heading": "Short disadvantage title", "explanation": "One clear sentence explaining this disadvantage specific to ${topic}."},
    {"heading": "Short disadvantage title", "explanation": "One clear sentence explaining this disadvantage specific to ${topic}."},
    {"heading": "Short disadvantage title", "explanation": "One clear sentence explaining this disadvantage specific to ${topic}."}
  ],
  "limitations": [
    {"heading": "Short limitation title", "explanation": "One clear sentence explaining this limitation specific to ${topic}."},
    {"heading": "Short limitation title", "explanation": "One clear sentence explaining this limitation specific to ${topic}."},
    {"heading": "Short limitation title", "explanation": "One clear sentence explaining this limitation specific to ${topic}."},
    {"heading": "Short limitation title", "explanation": "One clear sentence explaining this limitation specific to ${topic}."},
    {"heading": "Short limitation title", "explanation": "One clear sentence explaining this limitation specific to ${topic}."}
  ],
  "conclusion": "Write a well-formed concluding paragraph of 5-6 sentences that summarizes the topic, reflects on its importance, and provides a forward-looking statement.",
  "mainConcept": ["placeholder"],
  "technicalExplanation": ["placeholder"]
}

Rules:
- ALL content must be SPECIFIC to "${topic}"
- introduction, explanationPart1, explanationPart2, conclusion: full flowing paragraphs (strings, not arrays)
- advantages, disadvantages, limitations: exactly 5 items each with a short heading and one-sentence explanation
- The heading should be 2-4 words only
- The explanation should be a single clear sentence
- Return ONLY the JSON object, no other text`;

  let content: Record<string, unknown>;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.choices[0]?.message?.content ?? "";

    // Extract JSON from response
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    content = JSON.parse(jsonStr);
  } catch (err) {
    req.log.error(err, "AI generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
    return;
  }

  const generationTimeSeconds = (Date.now() - startTime) / 1000;
  const id = uuidv4();

  // Generate PPTX file — white slides, clean academic format
  let pptxPath: string | null = null;
  try {
    const pptxgen = (await import("pptxgenjs")).default;
    const pptx = new pptxgen();

    // All white, clean black text
    const BLACK = "1A1A1A";
    const DARK_GRAY = "333333";
    const MID_GRAY = "555555";
    const ACCENT = "1A56DB"; // blue for slide heading labels
    const WHITE = "FFFFFF";

    // ── Slide 1: Title ────────────────────────────────────────────────────────
    const s1 = pptx.addSlide();
    s1.background = { color: WHITE };
    // thin blue top bar
    s1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    // thin blue bottom bar
    s1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.44, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    // Topic title centered on slide
    s1.addText((content.title as string) || topic, {
      x: 0.8, y: 2.5, w: 8.4, h: 2.5,
      fontSize: 36, color: BLACK, bold: true,
      fontFace: "Calibri", align: "center", valign: "middle",
      wrap: true,
    });

    // ── Slide 2: Introduction ─────────────────────────────────────────────────
    const s2 = pptx.addSlide();
    s2.background = { color: WHITE };
    s2.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s2.addText("Introduction", {
      x: 0.5, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, color: BLACK, bold: true, fontFace: "Calibri",
    });
    // thin underline
    s2.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.05, w: 9, h: 0.04,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s2.addText(content.introduction as string, {
      x: 0.5, y: 1.25, w: 9, h: 5.8,
      fontSize: 16, color: DARK_GRAY, fontFace: "Calibri",
      wrap: true, valign: "top", lineSpacingMultiple: 1.5,
    });

    // ── Slide 3: Explanation Part 1 ────────────────────────────────────────────
    const s3 = pptx.addSlide();
    s3.background = { color: WHITE };
    s3.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s3.addText("Explanation", {
      x: 0.5, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, color: BLACK, bold: true, fontFace: "Calibri",
    });
    s3.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.05, w: 9, h: 0.04,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s3.addText(content.explanationPart1 as string, {
      x: 0.5, y: 1.25, w: 9, h: 5.8,
      fontSize: 16, color: DARK_GRAY, fontFace: "Calibri",
      wrap: true, valign: "top", lineSpacingMultiple: 1.5,
    });

    // ── Slide 4: Explanation Part 2 ────────────────────────────────────────────
    const s4 = pptx.addSlide();
    s4.background = { color: WHITE };
    s4.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s4.addText("Explanation (Continued)", {
      x: 0.5, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, color: BLACK, bold: true, fontFace: "Calibri",
    });
    s4.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.05, w: 9, h: 0.04,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s4.addText(content.explanationPart2 as string, {
      x: 0.5, y: 1.25, w: 9, h: 5.8,
      fontSize: 16, color: DARK_GRAY, fontFace: "Calibri",
      wrap: true, valign: "top", lineSpacingMultiple: 1.5,
    });

    // Helper to build a "Heading: explanation" item slide (no table)
    const addItemSlide = (
      slide: ReturnType<typeof pptx.addSlide>,
      heading: string,
      items: Array<{ heading: string; explanation: string }>,
    ) => {
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 10, h: 0.06,
        fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
      });
      slide.addText(heading, {
        x: 0.5, y: 0.3, w: 9, h: 0.7,
        fontSize: 28, color: BLACK, bold: true, fontFace: "Calibri",
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 1.05, w: 9, h: 0.04,
        fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
      });

      // Each item: "Heading: explanation" — bold heading, regular explanation
      const textRuns = items.flatMap((item, i) => [
        {
          text: `${item.heading}: `,
          options: { bold: true, color: BLACK, fontSize: 15, fontFace: "Calibri" },
        },
        {
          text: item.explanation,
          options: { bold: false, color: MID_GRAY, fontSize: 15, fontFace: "Calibri" },
        },
        // Add a blank line between items (except after last)
        ...(i < items.length - 1
          ? [{ text: "\n\n", options: { fontSize: 6, fontFace: "Calibri" } }]
          : []),
      ]);

      slide.addText(textRuns, {
        x: 0.5, y: 1.25, w: 9, h: 6.0,
        valign: "top", wrap: true,
        paraSpaceAfter: 14,
      });
    };

    // ── Slide 5: Advantages ────────────────────────────────────────────────────
    const advantages = content.advantages as Array<{ heading: string; explanation: string }>;
    addItemSlide(pptx.addSlide(), "Advantages", advantages);

    // ── Slide 6: Disadvantages ─────────────────────────────────────────────────
    const disadvantages = content.disadvantages as Array<{ heading: string; explanation: string }>;
    addItemSlide(pptx.addSlide(), "Disadvantages", disadvantages);

    // ── Slide 7: Limitations ───────────────────────────────────────────────────
    const limitations = content.limitations as Array<{ heading: string; explanation: string }>;
    addItemSlide(pptx.addSlide(), "Limitations", limitations);

    // ── Slide 8: Conclusion ────────────────────────────────────────────────────
    const s8 = pptx.addSlide();
    s8.background = { color: WHITE };
    s8.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s8.addText("Conclusion", {
      x: 0.5, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, color: BLACK, bold: true, fontFace: "Calibri",
    });
    s8.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.05, w: 9, h: 0.04,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s8.addText(content.conclusion as string, {
      x: 0.5, y: 1.25, w: 9, h: 5.8,
      fontSize: 16, color: DARK_GRAY, fontFace: "Calibri",
      wrap: true, valign: "top", lineSpacingMultiple: 1.5,
    });

    // ── Slide 9: Thank You ─────────────────────────────────────────────────────
    const s9 = pptx.addSlide();
    s9.background = { color: WHITE };
    s9.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s9.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.44, w: 10, h: 0.06,
      fill: { color: ACCENT }, line: { color: ACCENT, pt: 0 },
    });
    s9.addText("Thank You", {
      x: 0.8, y: 2.8, w: 8.4, h: 1.5,
      fontSize: 44, color: BLACK, bold: true,
      fontFace: "Calibri", align: "center",
    });
    s9.addText("Questions & Discussion", {
      x: 0.8, y: 4.5, w: 8.4, h: 0.6,
      fontSize: 18, color: MID_GRAY,
      fontFace: "Calibri", align: "center",
    });

    const pptxFilePath = path.join(PPTX_DIR, `${id}.pptx`);
    await pptx.writeFile({ fileName: pptxFilePath });
    pptxPath = pptxFilePath;
  } catch (pptxErr) {
    req.log.error(pptxErr, "PPTX generation failed");
    // Continue without PPTX — still save the data
  }

  try {
    await db.insert(presentationsTable).values({
      id,
      topic,
      content,
      generationTimeSeconds,
      pptxPath,
    });
  } catch (dbErr) {
    req.log.error(dbErr, "DB insert failed");
    res.status(500).json({ error: "Failed to save presentation" });
    return;
  }

  res.status(201).json({
    id,
    topic,
    content,
    generationTimeSeconds,
    createdAt: new Date().toISOString(),
    pptxPath,
  });
});

// GET /presentations/:id
router.get("/presentations/:id", async (req, res) => {
  const parsed = GetPresentationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = parsed.data;

  try {
    const rows = await db
      .select()
      .from(presentationsTable)
      .where(eq(presentationsTable.id, id));
    if (rows.length === 0) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }
    const r = rows[0];
    res.json({
      id: r.id,
      topic: r.topic,
      content: r.content,
      generationTimeSeconds: r.generationTimeSeconds,
      createdAt: r.createdAt.toISOString(),
      pptxPath: r.pptxPath,
    });
  } catch (err) {
    req.log.error(err, "Failed to get presentation");
    res.status(500).json({ error: "Failed to get presentation" });
  }
});

// GET /presentations/:id/download
router.get("/presentations/:id/download", async (req, res) => {
  const parsed = DownloadPresentationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = parsed.data;

  try {
    const rows = await db
      .select()
      .from(presentationsTable)
      .where(eq(presentationsTable.id, id));
    if (rows.length === 0) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }
    const r = rows[0];
    if (!r.pptxPath || !fs.existsSync(r.pptxPath)) {
      res.status(404).json({ error: "PPTX file not found" });
      return;
    }

    const safeFilename = r.topic
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}.pptx"`,
    );
    const stream = fs.createReadStream(r.pptxPath);
    stream.pipe(res);
  } catch (err) {
    req.log.error(err, "Failed to download presentation");
    res.status(500).json({ error: "Failed to download presentation" });
  }
});

// DELETE /presentations/:id
router.delete("/presentations/:id", async (req, res) => {
  const parsed = DeletePresentationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = parsed.data;

  try {
    const rows = await db
      .select()
      .from(presentationsTable)
      .where(eq(presentationsTable.id, id));
    if (rows.length === 0) {
      res.status(404).json({ error: "Presentation not found" });
      return;
    }
    const r = rows[0];
    if (r.pptxPath && fs.existsSync(r.pptxPath)) {
      fs.unlinkSync(r.pptxPath);
    }
    await db.delete(presentationsTable).where(eq(presentationsTable.id, id));
    res.json({ error: "Presentation deleted successfully" });
  } catch (err) {
    req.log.error(err, "Failed to delete presentation");
    res.status(500).json({ error: "Failed to delete presentation" });
  }
});

export default router;
