import { supabase } from "../supabaseClient.js";

// =============================
//  Alternar pago
// =============================
export const togglePago = async (req, res) => {
  const { clienteId, cuotaNum } = req.params;

  // buscar pago existente
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("numero_cuota", cuotaNum)
    .single();

  if (pagoExistente) {
    const nuevoEstado = pagoExistente.estado === "pagado" ? "no_pagado" : "pagado";
    const { error } = await supabase
      .from("pagos")
      .update({
        estado: nuevoEstado,
        fecha_pago: nuevoEstado === "pagado" ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("id", pagoExistente.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, estado: nuevoEstado });
  } else {
    // insertar si no existía
    const { error } = await supabase.from("pagos").insert([
      {
        cliente_id: clienteId,
        numero_cuota: cuotaNum,
        estado: "pagado",
        fecha_pago: new Date().toISOString().slice(0, 10),
        fecha_estimada: new Date().toISOString().slice(0, 10),
        monto_pago: 0,
      },
    ]);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, estado: "pagado" });
  }
};

// =============================
//  Actualizar pago manual y observaciones
// =============================
export const updatePagoManual = async (req, res) => {
  const { clienteId, cuotaNum } = req.params;
  const { pago_manual, observaciones } = req.body;

  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("numero_cuota", cuotaNum)
    .maybeSingle();

  if (!pagoExistente) {
    const { error } = await supabase.from("pagos").insert([
      {
        cliente_id: clienteId,
        numero_cuota: cuotaNum,
        pago_manual: pago_manual || null,
        observaciones: observaciones || "",
        saldo_a_cuenta: 0,
      },
    ]);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  const saldo = (pago_manual || 0) - (pagoExistente.monto_pago || 0);

  const { error } = await supabase
    .from("pagos")
    .update({
      pago_manual,
      observaciones,
      saldo_a_cuenta: saldo,
    })
    .eq("id", pagoExistente.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, saldo });
};

// =============================
//  Obtener pagos por estado (para informes)
//  Soporta filtros por mes o fecha exacta
// =============================
export const getPagosPorEstado = async (req, res) => {
  const { estado, mes, fecha } = req.query;

  let query = supabase
    .from("pagos")
    .select("*, clientes(nombre, apellido, documento, numero_lote, manzana)");

  if (estado) query = query.eq("estado", estado);
  if (mes) query = query.like("fecha_pago", `${mes}%`);
  if (fecha) query = query.eq("fecha_pago", fecha);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  const total = data
    .filter((p) => estado === "pagado" && p.monto_pago)
    .reduce((acc, p) => acc + parseFloat(p.monto_pago || 0), 0);

  res.json({ data, total });
};
