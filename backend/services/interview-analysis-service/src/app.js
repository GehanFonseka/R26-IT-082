import cors from "cors";
import express from "express";
import helmet from "helmet";
import analysisRoutes from "./routes/analysisRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use(healthRoutes);
app.use(analysisRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
