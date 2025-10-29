import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "../routes/auth.js";
import clientesRoutes from "../routes/clientes.js";
import aumentosRoutes from "../routes/aumentos.js";
import pagosRoutes from "../routes/pagos.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Configurar frontend estático
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Rutas API
app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/aumentos", aumentosRoutes);
app.use("/pagos", pagosRoutes);


app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
