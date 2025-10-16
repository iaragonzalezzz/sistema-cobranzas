import express from "express";
import {
  registrarCliente,
  getClientePorDocumento,
  getPlanillaPorDocumento,
} from "../controllers/clientesController.js";

const router = express.Router();

router.post("/", registrarCliente);
router.get("/:documento", getClientePorDocumento);
router.get("/:documento/planilla", getPlanillaPorDocumento);

export default router;
