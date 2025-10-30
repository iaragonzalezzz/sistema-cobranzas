let rol = null;

// ==============================
// Mostrar/ocultar vistas
// ==============================
function mostrar(id) {
  document.querySelectorAll("section").forEach((s) => s.classList.add("d-none"));
  document.getElementById(id).classList.remove("d-none");
}

// ==============================
// Navegación según rol
// ==============================
function irLogin(_rol) {
  rol = _rol;
  document.getElementById("login-titulo").innerText = `Iniciar Sesión como ${rol}`;
  mostrar("view-login");
}

function volverMenu() {
  if (rol === "admin") mostrar("view-menu-admin");
  else if (rol === "empleado") mostrar("view-menu-empleado");
  else mostrar("view-bienvenida");
}

function logout() {
  rol = null;
  document.getElementById("rolActual").innerText = "";
  mostrar("view-bienvenida");
}

// ==============================
// LOGIN
// ==============================
document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pass = new FormData(e.target).get("password");

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rol, password: pass }),
  });

  if (!res.ok) {
    alert("❌ Contraseña incorrecta");
    return;
  }

  const data = await res.json();
  document.getElementById("rolActual").innerText = `Rol: ${data.rol}`;
  if (rol === "admin") mostrar("view-menu-admin");
  else mostrar("view-menu-empleado");
});

// ==============================
// Mostrar/ocultar Etapa según Barrio
// ==============================
const barrioSelect = document.querySelector("select[name='barrio']");
const etapaContainer = document.getElementById("etapa-container");

barrioSelect.addEventListener("change", () => {
  if (barrioSelect.value === "Los Eucaliptos") {
    etapaContainer.style.display = "block";
  } else {
    etapaContainer.style.display = "none";
    document.getElementById("etapa-select").value = "";
  }
});

// ==============================
// REGISTRO DE CLIENTE
// ==============================
document.getElementById("form-cliente").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const cliente = Object.fromEntries(formData.entries());

  // Validar etapa si es Eucaliptos
  if (cliente.barrio === "Los Eucaliptos" && !cliente.etapa) {
    alert("Seleccioná la etapa para Los Eucaliptos");
    return;
  }

  // Validar que haya al menos un titular
  if (!cliente.titular1) {
    alert("Debe ingresar al menos un titular");
    return;
  }

  // Convertir fecha_inicio_mes a fecha_inicio
  if (cliente.fecha_inicio_mes) {
    cliente.fecha_inicio = cliente.fecha_inicio_mes + "-01";
    delete cliente.fecha_inicio_mes;
  }

  const res = await fetch("/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });

  if (res.ok) {
    alert("✅ Cliente agregado con éxito");
    e.target.reset();
    etapaContainer.style.display = "none"; // ocultar etapa al reset
    volverMenu();
  } else {
    const error = await res.json();
    alert("❌ Error: " + error.error);
  }
});

// ==============================
// BUSCAR CLIENTE Y MOSTRAR TABLA
// ==============================
async function buscarCliente() {
  const doc = document.getElementById("doc-busqueda").value;
  const res = await fetch(`/clientes/${doc}`);
  const cliente = await res.json();

  const info = document.getElementById("info-cliente");
  info.textContent = "";
  const tbody = document.getElementById("tabla-cuotas");
  tbody.innerHTML = "";

  if (!cliente || cliente.error) {
    info.textContent = "Cliente no encontrado.";
    return;
  }

  info.textContent = `
ID: ${cliente.id}
Nombre: ${cliente.nombre} ${cliente.apellido}
Documento: ${cliente.documento}
Lote: ${cliente.numero_lote}
Manzana: ${cliente.manzana}
Barrio: ${cliente.barrio}
Etapa: ${cliente.etapa || "-"}
Fecha Firma: ${cliente.fecha_firma}
Fecha Inicio: ${cliente.fecha_inicio}
Cuotas: ${cliente.cuotas}
Monto Cuota: ${cliente.monto_cuota} ${cliente.moneda}
Titulares: ${cliente.titular1}${cliente.titular2 ? ", " + cliente.titular2 : ""}
`;

  cliente.cuotas_detalle.forEach((c) => {
    const tr = document.createElement("tr");
    if (c.incremento) tr.classList.add("cuota-inc");

    tr.innerHTML = `
      <td>${c.numero}</td>
      <td>${c.fecha}</td>
      <td>${c.monto}</td>
      <td class="estado">${c.estado === "pagado" ? "✔️" : "❌"}</td>
      <td>${c.fecha_pago || "-"}</td>
      <td>${c.saldo_a_cuenta ?? 0}</td>
      <td>
        <input 
          type="number" 
          value="${c.pago_manual ?? ""}" 
          class="form-control form-control-sm pago-manual"
          data-cliente="${cliente.id}"
          data-cuota="${c.numero}">
      </td>
      <td>
        <input 
          type="text" 
          value="${c.observaciones ?? ""}" 
          class="form-control form-control-sm observacion"
          data-cliente="${cliente.id}"
          data-cuota="${c.numero}">
      </td>
    `;

    tr.addEventListener("dblclick", async () => {
      await togglePago(cliente.id, c.numero);
      await buscarCliente();
    });

    tr.querySelectorAll(".pago-manual, .observacion").forEach((input) => {
      input.addEventListener("change", async (e) => {
        const clienteId = e.target.dataset.cliente;
        const cuotaNum = e.target.dataset.cuota;

        const body = {
          pago_manual: tr.querySelector(".pago-manual").value,
          observaciones: tr.querySelector(".observacion").value,
        };

        const res = await fetch(`/pagos/update/${clienteId}/${cuotaNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) alert("❌ Error: " + data.error);
        else tr.children[5].innerText = data.saldo.toFixed(2);
      });
    });

    tbody.appendChild(tr);
  });
}

// ==============================
// TOGGLE PAGO
// ==============================
async function togglePago(clienteId, cuotaNum) {
  const res = await fetch(`/pagos/${clienteId}/${cuotaNum}`, { method: "PUT" });
  if (!res.ok) alert("❌ Error al actualizar el pago");
}

// ==============================
// INCREMENTO GLOBAL
// ==============================

async function aplicarIncrementoGlobal() {
  const mesInput = document.getElementById("mes-incremento").value; // "YYYY-MM"
  const porcInput = document.getElementById("porc-incremento").value;

  if (!mesInput || !porcInput) {
    alert("Seleccioná mes y porcentaje.");
    return;
  }

  const porcentaje = parseFloat(porcInput);
  if (isNaN(porcentaje)) {
    alert("Porcentaje inválido");
    return;
  }

  const res = await fetch("/aumentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mes: mesInput, porcentaje }),
  });

  const data = await res.json();

  document.getElementById("inc-resultado").innerText = res.ok
    ? `✅ Se aplicó aumento a ${data.aplicados} cliente(s).`
    : `❌ Error: ${data.error}`;
}


// ==============================
// INFORMES DE PAGOS (MES / DÍA)
// ==============================
async function cargarPagaron() {
  const mes = document.getElementById("mes-informe").value;
  const dia = document.getElementById("dia-informe").value;
  let url = "/pagos?estado=pagado";
  if (mes) url += `&mes=${mes}`;
  if (dia) url += `&dia=${dia}`;

  const res = await fetch(url);
  const lista = await res.json();
  renderInforme(lista, "pagado");
}

async function cargarNoPagaron() {
  const mes = document.getElementById("mes-informe").value;
  const dia = document.getElementById("dia-informe").value;
  let url = "/pagos?estado=no_pagado";
  if (mes) url += `&mes=${mes}`;
  if (dia) url += `&dia=${dia}`;

  const res = await fetch(url);
  const lista = await res.json();
  renderInforme(lista, "no_pagado");
}

function renderInforme(resp, estado) {
  const lista = resp.data || [];
  const total = resp.total || 0;

  const ul = document.getElementById("lista-informe");
  const divTotal = document.getElementById("total-informe");
  ul.innerHTML = "";
  divTotal.innerHTML = "";

  if (!lista || lista.length === 0) {
    ul.innerHTML = "<li class='list-group-item'>Sin resultados</li>";
    return;
  }

  lista.forEach((p) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${p.clientes.nombre} ${p.clientes.apellido} | DNI: ${p.clientes.documento} | Lote: ${p.clientes.numero_lote} | Manzana: ${p.clientes.manzana} | Cuota ${p.numero_cuota} | Monto: ${p.pago_manual || p.monto_pago || "-"} | Fecha: ${p.fecha_pago || "-"}`;
    ul.appendChild(li);
  });

  if (estado === "pagado") {
    divTotal.innerText = `TOTAL RECAUDADO: $${total.toFixed(2)}`;
  }
}

// ==============================
// EXPORTAR CSV
// ==============================
function exportarCSV() {
  const filas = [];
  document.querySelectorAll("#lista-informe li").forEach((li) => filas.push(li.textContent));
  if (filas.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  const mes = document.getElementById("mes-informe").value || "todos";
  const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `informe_${mes}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
