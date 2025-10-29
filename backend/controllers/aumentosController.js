import { supabase } from "../supabaseClient.js";

/**
 * Suma meses a una fecha y devuelve {year, month}
 */
function addMonths(date, monthsToAdd) {
  const d = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 }; // month 1-12
}

/**
 * Aplicar incremento global a todos los clientes (acumulativo)
 * req.body: { mes: "YYYY-MM", porcentaje: number }
 */
export const aplicarAumentosMes = async (req, res) => {
  try {
    const { mes, porcentaje } = req.body;
    if (!mes || !porcentaje) return res.status(400).json({ error: "Faltan datos" });

    const [year, month] = mes.split("-").map(Number); // año y mes a número
    const fechaAumento = `${year}-${String(month).padStart(2, "0")}-01`; // formato YYYY-MM-DD

    const { data: clientes, error: errC } = await supabase.from("clientes").select("*");
    if (errC) throw errC;

    let aplicados = 0;

    for (let c of clientes) {
      const fechaInicio = new Date(c.fecha_inicio + "T00:00:00");

      for (let i = 0; i < c.cuotas; i++) {
        const { year: cuotaYear, month: cuotaMes } = addMonths(fechaInicio, i);

        // Verificar si coincide con el mes del aumento
        if (cuotaYear === year && cuotaMes === month) {
          // 1) Verificar si ya existe aumento para este cliente y mes (evitar duplicados)
          const { data: existentes, error: errExist } = await supabase
            .from("aumentos")
            .select("*")
            .eq("cliente_id", c.id)
            .eq("fecha", fechaAumento);

          if (errExist) {
            console.error("Error consultando aumentos existentes:", errExist);
            break;
          }
          if (existentes?.length) {
            // ya aplicado, salimos para este cliente
            break;
          }

          // 2) Buscar el último aumento PREVIO a esta fecha (<= fechaAumento)
          const { data: ultimoAumArr, error: errLast } = await supabase
            .from("aumentos")
            .select("*")
            .eq("cliente_id", c.id)
            .lte("fecha", fechaAumento)
            .order("fecha", { ascending: false })
            .limit(1);

          if (errLast) {
            console.error("Error obteniendo último aumento:", errLast);
            break;
          }

          // monto base = último nuevo_monto si existe, sino monto_cuota original
          const montoBase = (ultimoAumArr && ultimoAumArr.length) ? parseFloat(ultimoAumArr[0].nuevo_monto) : parseFloat(c.monto_cuota);

          // 3) Calcular nuevo monto sobre el monto vigente (acumulativo)
          const nuevoMonto = montoBase * (1 + parseFloat(porcentaje) / 100);

          // 4) Insertar aumento (guardamos monto_anterior como montoBase)
          const { error: errInsert } = await supabase.from("aumentos").insert([{
            cliente_id: c.id,
            fecha: fechaAumento,
            porcentaje: parseFloat(porcentaje),
            monto_anterior: montoBase,
            nuevo_monto: nuevoMonto
          }]);

          if (errInsert) {
            console.error("Error insertando aumento:", errInsert);
          } else {
            aplicados++;
            console.log(`✅ Incremento aplicado a ${c.nombre}, cuota ${i + 1}, base: ${montoBase}, nuevo: ${nuevoMonto}`);
          }

          break; // solo aplicar una vez por cliente
        }
      }
    }

    console.log("Total clientes aplicados:", aplicados);
    res.json({ aplicados });

  } catch (err) {
    console.error("Error aplicando incremento:", err);
    res.status(500).json({ error: "Error al aplicar incremento" });
  }
};
