import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/healthRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(requestContext);
app.use(healthRoutes);
app.use(cvRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
