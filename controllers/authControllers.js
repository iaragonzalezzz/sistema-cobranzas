// backend/controllers/authController.js

export const login = async (req, res) => {
  const { rol, password } = req.body;

  // Claves predeterminadas
  const credenciales = {
    admin: "admin123",
    empleado: "emple123",
  };

  // Validar credenciales
  if (credenciales[rol] && credenciales[rol] === password) {
    res.json({ rol });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta" });
  }
};
