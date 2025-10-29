import { supabase } from "./supabaseClient.js";
import { aplicarAumentosMes } from "./controllers/aumentosController.js"; // tu archivo corregido

async function crearClientesDePrueba() {
  const clientes = [
    { nombre: "Omar", documento: "123", fecha_inicio: "2025-01-01", cuotas: 12, monto_cuota: 1000, moneda: "pesos" },
    { nombre: "Facundo", documento: "456", fecha_inicio: "2025-01-01", cuotas: 12, monto_cuota: 2000, moneda: "pesos" }
  ];

  for (let c of clientes) {
    // Verificar si ya existe
    const { data: existente } = await supabase.from("clientes").select("*").eq("documento", c.documento);
    if (existente?.length) {
      console.log(`Cliente ${c.nombre} ya existe, lo saltamos`);
      continue;
    }

    const { error } = await supabase.from("clientes").insert([c]);
    if (error) console.error("Error insertando cliente:", error.message);
    else console.log(`Cliente ${c.nombre} creado`);
  }
}

async function testAplicarIncremento() {
  // Crear clientes de prueba
  await crearClientesDePrueba();

  // Aplicar aumento 6% en abril 2025
  const req = { body: { mes: "2025-04", porcentaje: 6 } };
  const res = {
    json: (data) => console.log("Resultado aplicarIncremento:", data),
    status: (code) => ({ json: (data) => console.log(code, data) })
  };

  await aplicarAumentosMes(req, res);

  // Verificar tabla aumentos
  const { data: aumentos } = await supabase
    .from("aumentos")
    .select("*")
    .order("cliente_id");

  console.log("Tabla aumentos:");
  aumentos.forEach(a => {
    console.log(`${a.cliente_id} - ${a.fecha} - anterior: ${a.monto_anterior}, nuevo: ${a.nuevo_monto}`);
  });
}

// Ejecutar test
testAplicarIncremento();
