import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/healthRoutes.js";
import explanationRoutes from "./routes/explanationRoutes.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use(healthRoutes);
app.use(explanationRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
