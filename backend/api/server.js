import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import aumentosRoutes from "./routes/aumentos.js";
import pagosRoutes from "./routes/pagos.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir frontend desde la raíz del proyecto
const frontendPath = path.resolve("frontend");
app.use(express.static(frontendPath));

// Rutas API
app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/aumentos", aumentosRoutes);
app.use("/pagos", pagosRoutes);

// SPA catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const esVercel = process.env.VERCEL;
export default app;

if (!esVercel) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
  );
}
