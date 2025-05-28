const API_URL = 'https://geostat-360-api.vercel.app/api/vehicle_status';

const vehicleSelect = document.getElementById('vehicleSelect');
const vehicleInput = document.getElementById('vehicleInput');
const btnAdd = document.getElementById('btnAdd');
const btnRemove = document.getElementById('btnRemove');
const statusMessage = document.getElementById('statusMessage');

function showStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = 'status ' + type;
}

async function loadVehicles() {
  showStatus('Carregando veículos...', 'loading');
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.success && data.vehicleStatuses) {
      vehicleSelect.innerHTML = '';
      const vehicles = Object.keys(data.vehicleStatuses);
      vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle;
        option.textContent = vehicle;
        vehicleSelect.appendChild(option);
      });
      if (vehicles.length > 0) vehicleSelect.value = vehicles[0];
      showStatus('Veículos carregados com sucesso!', 'success');
    } else {
      showStatus('❌ Erro: dados inválidos do servidor', 'error');
    }
  } catch (error) {
    showStatus('❌ Erro ao carregar veículos: ' + error.message, 'error');
  }
}

async function addVehicle() {
  const novoVeiculo = vehicleInput.value.trim();
  if (!novoVeiculo) {
    showStatus('❌ Informe o código do veículo para adicionar.', 'error');
    return;
  }

  // Vou usar status fixo "Disponível no Quartel" só pra exemplo
  const status = "Disponível no Quartel";

  showStatus('Adicionando veículo...', 'loading');
  btnAdd.disabled = true;
  btnRemove.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle: novoVeiculo, status }),
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

async function removeVehicle() {
  const veiculoSelecionado = vehicleSelect.value;
  if (!veiculoSelecionado) {
    showStatus('❌ Selecione um veículo para remover.', 'error');
    return;
  }
  if (!confirm(`Tem certeza que deseja remover o veículo "${veiculoSelecionado}"?`)) return;

  showStatus('Removendo veículo...', 'loading');
  btnAdd.disabled = true;
  btnRemove.disabled = true;

  try {
    // Envia o veículo no query string (GET e DELETE assim funcionam melhor)
    const res = await fetch(`${API_URL}?vehicle=${encodeURIComponent(veiculoSelecionado)}`, {
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

loadVehicles();
