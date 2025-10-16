import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/login", (req, res) => {
  const { rol, password } = req.body;

  if (rol === "admin" && password === process.env.ADMIN_PASS)
    return res.json({ rol: "admin" });

  if (rol === "empleado" && password === process.env.EMP_PASS)
    return res.json({ rol: "empleado" });

  return res.status(401).json({ error: "Contraseña incorrecta" });
});

export default router;
