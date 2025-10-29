import express from "express";
import {
  togglePago,
  getPagosPorEstado,
  updatePagoManual,
} from "../controllers/pagosController.js";

const router = express.Router();

// Alternar pago (✔️ / ❌)
router.put("/:clienteId/:cuotaNum", togglePago);

// ✅ Actualizar pago manual y observaciones
router.put("/update/:clienteId/:cuotaNum", updatePagoManual);

// Informe de pagos
router.get("/", getPagosPorEstado);

export default router;
