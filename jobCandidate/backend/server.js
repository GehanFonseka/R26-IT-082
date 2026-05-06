import express from "express";
import cors from "cors";
import { processCandidate } from "./matchController.js";

const app = express();
app.use(cors());
app.use(express.json());

// API route
app.post("/api/match", (req, res) => {
    const { resumeText, job } = req.body;

    try {
        const result = processCandidate(resumeText, job);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Processing failed" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});