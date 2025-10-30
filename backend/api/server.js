import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "../routes/auth.js";
import clientesRoutes from "../routes/clientes.js";
import aumentosRoutes from "../routes/aumentos.js";
import pagosRoutes from "../routes/pagos.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Detectar ruta base correctamente
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.join(__dirname, "../frontend");

// Servir archivos estáticos (JS, CSS, imágenes)
app.use(express.static(frontendPath));

// Rutas API
app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/aumentos", aumentosRoutes);
app.use("/pagos", pagosRoutes);

// Catch-all: cualquier otra ruta -> index.html
// Pero primero verificamos si el archivo existe
app.get("*", (req, res) => {
  const requestedPath = path.join(frontendPath, req.path);
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    res.sendFile(requestedPath);
  } else {
    res.sendFile(path.join(frontendPath, "index.html"));
  }
});

// Detectar si estamos en Vercel
const esVercel = process.env.VERCEL;

// Exportar app para Vercel
export default app;

// Solo iniciar servidor localmente
if (!esVercel) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
}
