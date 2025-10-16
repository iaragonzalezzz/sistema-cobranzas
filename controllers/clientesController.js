import { supabase } from "../supabaseClient.js";

export const registrarCliente = async (req, res) => {
  try {
    const cliente = req.body;

    const { error } = await supabase.from("clientes").insert([cliente]);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

function addMonthsUTC(isoDate, monthsToAdd) {
  const [y, m] = isoDate.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, 1));
  base.setUTCMonth(base.getUTCMonth() + monthsToAdd);
  return base;
}

function sameMonth(d1, d2) {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth()
  );
}

function fmtMMYYYY(date) {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${mm}/${date.getUTCFullYear()}`;
}

export const getClientePorDocumento = async (req, res) => {
  const { documento } = req.params;

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("documento", documento)
    .single();

  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const { data: aumentos } = await supabase
    .from("aumentos")
    .select("*")
    .eq("cliente_id", cliente.id)
    .order("fecha");

  const { data: pagos } = await supabase
    .from("pagos")
    .select("numero_cuota, estado, fecha_pago, monto_pago")
    .eq("cliente_id", cliente.id);

  const pagosMap = new Map((pagos || []).map(p => [p.numero_cuota, p]));

  const cuotas = [];
  for (let i = 1; i <= cliente.cuotas; i++) {
    const fechaCuota = addMonthsUTC(cliente.fecha_inicio, i);
    let monto = cliente.monto_cuota;
    let incremento = false;

    (aumentos || []).forEach(a => {
      const fechaAum = new Date(`${a.fecha}T00:00:00Z`);
      if (fechaAum <= fechaCuota) {
        monto = a.nuevo_monto;
        if (sameMonth(fechaAum, fechaCuota)) incremento = true;
      }
    });

    const pago = pagosMap.get(i);
    cuotas.push({
      numero: i,
      fecha: fmtMMYYYY(fechaCuota),
      monto,
      estado: pago?.estado || "no_pagado",
      fecha_pago: pago?.fecha_pago || null,
      incremento,
    });
  }

  res.json({ ...cliente, cuotas_detalle: cuotas });
};

export const getPlanillaPorDocumento = async (req, res) => {
  const { documento } = req.params;

  const { data: cliente, error: errC } = await supabase
    .from("clientes")
    .select("*")
    .eq("documento", documento)
    .single();

  if (errC || !cliente)
    return res.status(404).json({ error: "Cliente no encontrado" });

  const { data: aumentos } = await supabase
    .from("aumentos")
    .select("*")
    .eq("cliente_id", cliente.id)
    .order("fecha");

  const { data: pagos } = await supabase
    .from("pagos")
    .select("numero_cuota, estado, fecha_pago, monto_pago")
    .eq("cliente_id", cliente.id);

  const pagosMap = new Map((pagos || []).map((p) => [p.numero_cuota, p]));

  const cuotas = [];
  const fechaInicio = new Date(cliente.fecha_inicio);

  for (let i = 1; i <= cliente.cuotas; i++) {
    const fechaCuota = new Date(
      fechaInicio.getFullYear(),
      fechaInicio.getMonth() + i,
      1
    );

    let monto = cliente.monto_cuota;
    (aumentos || []).forEach((a) => {
      if (new Date(a.fecha) <= fechaCuota) monto = a.nuevo_monto;
    });

    const pago = pagosMap.get(i);

    cuotas.push({
      numero: i,
      fecha_estimada: `${String(fechaCuota.getMonth() + 1).padStart(
        2,
        "0"
      )}/${fechaCuota.getFullYear()}`,
      monto,
      estado: pago?.estado || "no_pagado",
      fecha_pago: pago?.fecha_pago || null,
    });
  }

  res.json(cuotas);
};