import express from "express";
import cors from "cors";
import path from "path";
import { generatePDF } from "./generatePDF.js";

const app = express();
app.use(cors());

// ✅ Serve static files from the "public" folder
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/download-pdf", async (req, res) => {
    await generatePDF(res);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
