import express from "express";
import { aplicarAumentosMes } from "../controllers/aumentosController.js";

const router = express.Router();
router.post("/", aplicarAumentosMes);
export default router;
