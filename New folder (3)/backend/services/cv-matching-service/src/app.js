import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/healthRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use(healthRoutes);
app.use(matchRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
