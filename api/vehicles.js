const API_URL = 'https://geostat-360-api.vercel.app/api/vehicle_status';

const vehicleSelect = document.getElementById('vehicleSelect');
const vehicleInput = document.getElementById('vehicleInput');
const btnAdd = document.getElementById('btnAdd');
const btnRemove = document.getElementById('btnRemove');
const statusDiv = document.getElementById('status');

function showStatus(msg, type) {
  statusDiv.textContent = msg;
  statusDiv.className = type; // 'loading', 'success', 'error'
}

// Carrega veículos do servidor e preenche select
async function loadVehicles() {
  showStatus('Carregando veículos...', 'loading');
  btnAdd.disabled = true;
  btnRemove.disabled = true;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data.success && data.vehicleStatuses) {
      const vehicles = Object.keys(data.vehicleStatuses);
      vehicleSelect.innerHTML = '';

      vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle;
        option.textContent = `${vehicle} — ${data.vehicleStatuses[vehicle]}`;
        vehicleSelect.appendChild(option);
      });

      if (vehicles.length > 0) vehicleSelect.value = vehicles[0];
      showStatus('Veículos carregados com sucesso!', 'success');
    } else {
      showStatus('❌ Erro: dados inválidos do servidor', 'error');
    }
  } catch (error) {
    showStatus('❌ Erro ao carregar veículos: ' + error.message, 'error');
  } finally {
    btnAdd.disabled = false;
    btnRemove.disabled = false;
  }
}

// Adiciona novo veículo via POST
async function addVehicle() {
  const novoVeiculo = vehicleInput.value.trim();
  if (!novoVeiculo) {
    showStatus('❌ Informe o código do veículo para adicionar.', 'error');
    return;
  }
  const statusPadrao = "Disponível no Quartel";

  btnAdd.disabled = true;
  btnRemove.disabled = true;
  showStatus('Adicionando veículo...', 'loading');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle: novoVeiculo, status: statusPadrao }),
    });
    const data = await res.json();

    if (data.success) {
      showStatus(`✅ Veículo "${novoVeiculo}" adicionado!`, 'success');
      vehicleInput.value = '';
      await loadVehicles();
    } else {
      showStatus('❌ Erro ao adicionar: ' + (data.error || 'Desconhecido'), 'error');
    }
  } catch (error) {
    showStatus('❌ Erro ao adicionar veículo: ' + error.message, 'error');
  } finally {
    btnAdd.disabled = false;
    btnRemove.disabled = false;
  }
}

// Remove veículo selecionado via DELETE (query string)
async function removeVehicle() {
  const veiculoSelecionado = vehicleSelect.value;
  if (!veiculoSelecionado) {
    showStatus('❌ Selecione um veículo para remover.', 'error');
    return;
  }
  if (!confirm(`Tem certeza que deseja remover o veículo "${veiculoSelecionado}"?`)) return;

  btnAdd.disabled = true;
  btnRemove.disabled = true;
  showStatus('Removendo veículo...', 'loading');

  try {
    const url = `${API_URL}?vehicle=${encodeURIComponent(veiculoSelecionado)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.success) {
      showStatus(`✅ Veículo "${veiculoSelecionado}" removido!`, 'success');
      await loadVehicles();
    } else {
      showStatus('❌ Erro ao remover: ' + (data.error || 'Desconhecido'), 'error');
    }
  } catch (error) {
    showStatus('❌ Erro ao remover veículo: ' + error.message, 'error');
  } finally {
    btnAdd.disabled = false;
    btnRemove.disabled = false;
  }
}

btnAdd.addEventListener('click', addVehicle);
btnRemove.addEventListener('click', removeVehicle);

// Carregar veículos inicialmente
loadVehicles();
