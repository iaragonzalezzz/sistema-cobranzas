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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.join(__dirname, "../../frontend"); // sube 2 niveles hasta la raíz

// =====================
// Servir archivos estáticos
// =====================
app.use(express.static(frontendPath));

// =====================
// Rutas API
// =====================
app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/aumentos", aumentosRoutes);
app.use("/pagos", pagosRoutes);

// =====================
// SPA Catch-all
// =====================
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const esVercel = process.env.VERCEL;
export default app;

if (!esVercel) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
}
