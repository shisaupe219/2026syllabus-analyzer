import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit for large SVGs
  app.use(express.json({ limit: '10mb' }));

  // API route for rendering charts
  app.post("/api/render-chart", async (req, res) => {
    try {
      const { svg, svgData, width, height } = req.body;
      const content = svg || svgData;

      if (!content) {
        return res.status(400).json({ error: "SVG content is required" });
      }

      // Use sharp to convert SVG to PNG
      // We rely on the SVG's own width/height/viewBox for dimensions to prevent cropping
      const pngBuffer = await sharp(Buffer.from(content))
        .png()
        .toBuffer();

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=chart.png");
      res.send(pngBuffer);
    } catch (error) {
      console.error("Error rendering chart:", error);
      res.status(500).json({ error: "Failed to render chart" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
