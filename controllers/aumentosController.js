import { supabase } from "../supabaseClient.js";

/**
 * Suma meses a una fecha en formato ISO (YYYY-MM-DD) manteniendo el día 1
 */
function addMonthsUTC(isoDateYYYYMMDD, monthsToAdd) {
  const [y, m] = isoDateYYYYMMDD.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, 1));
  let y2 = base.getUTCFullYear();
  let m2 = base.getUTCMonth() + monthsToAdd;
  y2 += Math.floor(m2 / 12);
  m2 = ((m2 % 12) + 12) % 12;
  return new Date(Date.UTC(y2, m2, 1));
}

/**
 * Aplica aumentos trimestrales a todos los clientes activos
 * Recibe { mes, porcentaje } en el body.
 */
export const aplicarAumentosMes = async (req, res) => {
  try {
    const { mes, porcentaje } = req.body;
    const p = Number(porcentaje);

    // Validaciones
    if (!mes || isNaN(p) || p <= 0) {
      return res.status(400).json({ error: "Se requiere mes y porcentaje válidos." });
    }

    // Traer todos los clientes
    const { data: clientes, error: errC } = await supabase.from("clientes").select("*");
    if (errC) throw errC;

    let nuevosAumentos = [];

    for (const c of clientes) {
      // Calcular cuándo le toca el primer aumento
      let proximo = addMonthsUTC(c.fecha_inicio, 3);
      const mesObjetivo = parseInt(mes, 10) - 1; // JS usa 0-11 para meses
      const añoActual = new Date().getFullYear();

      // Buscamos el trimestre del año actual que coincide con el mes elegido
      for (let i = 0; i < 60; i++) {
        if (proximo.getUTCMonth() === mesObjetivo && proximo.getUTCFullYear() === añoActual) {
          nuevosAumentos.push({
            cliente_id: c.id,
            fecha: proximo.toISOString().slice(0, 10),
            porcentaje: p / 100,
            monto_anterior: c.monto_cuota,
            nuevo_monto: Math.round(c.monto_cuota * (1 + p / 100) * 100) / 100,
          });
          break;
        }
        proximo = addMonthsUTC(proximo.toISOString().slice(0, 10), 3);
      }
    }

    if (!nuevosAumentos.length) {
      return res.json({ aplicados: 0 });
    }

    // Insertar aumentos en Supabase
    const { error: errInsert } = await supabase.from("aumentos").insert(nuevosAumentos);
    if (errInsert) throw errInsert;

    return res.json({ aplicados: nuevosAumentos.length });
  } catch (e) {
    console.error("Error aplicando aumentos:", e.message);
    res.status(500).json({ error: e.message });
  }
};
