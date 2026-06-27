const areas = {
  fila: document.getElementById("fila"),
  timeA: document.getElementById("timeA"),
  timeB: document.getElementById("timeB"),
  marcacao: document.getElementById("marcacao"),
  eliminados: document.getElementById("eliminados")
};

const lixeira = document.getElementById("lixeira");

const LIMITES = {
  timeA: 4,
  timeB: 4,
  marcacao: 4
};

const CHAVE_HISTORICO = "vilaDaBarra_historico";

let scoreA = 0;
let scoreB = 0;
let contador = 1;
let jogadorSelecionado = null;

// ===== CRIAR JOGADOR (número de camisa fixo, criado uma vez só) =====
function criarPlayer(nome) {
  const el = document.createElement("div");
  el.className = "player";
  el.dataset.nome = nome.trim().toLowerCase();
  el.dataset.nomeOriginal = nome.trim();

  const numero = document.createElement("span");
  numero.className = "numero";
  numero.textContent = contador++;
  el.appendChild(numero);
  el.appendChild(document.createTextNode(nome.trim()));

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selecionarJogador(el);
  });

  return el;
}

function nomeJaExiste(nome) {
  const normalizado = nome.trim().toLowerCase();
  return [...document.querySelectorAll(".player")]
    .some(p => p.dataset.nome === normalizado);
}

function addPlayer() {
  const input = document.getElementById("nomeInput");
  const nome = input.value.trim();
  if (!nome) return;

  if (nomeJaExiste(nome)) {
    alert("Esse atleta já está cadastrado! Use outro nome.");
    return;
  }

  areas.fila.appendChild(criarPlayer(nome));
  input.value = "";
  atualizarFila();
}

// ===== SELEÇÃO (clique pra selecionar, clique na área pra mover) =====
function selecionarJogador(el) {
  if (jogadorSelecionado === el) {
    el.classList.remove("selecionado");
    jogadorSelecionado = null;
    return;
  }

  if (jogadorSelecionado) {
    jogadorSelecionado.classList.remove("selecionado");
  }

  jogadorSelecionado = el;
  el.classList.add("selecionado");
}

Object.values(areas).forEach(area => {
  area.addEventListener("click", () => moverJogador(area));
});

function moverJogador(areaDestino) {
  if (!jogadorSelecionado) return;

  const limite = LIMITES[areaDestino.id];
  if (limite) {
    const ocupados = areaDestino.querySelectorAll(".player").length;
    if (ocupados >= limite) {
      alert(`Essa área já está no limite de ${limite} atletas!`);
      return;
    }
  }

  jogadorSelecionado.classList.remove("selecionado", "jogando");

  if (areaDestino.id === "timeA" || areaDestino.id === "timeB") {
    jogadorSelecionado.classList.add("jogando");
  }

  areaDestino.appendChild(jogadorSelecionado);
  jogadorSelecionado = null;

  atualizarFila();
  atualizarContadores();
}

// ===== LIXEIRA (remove de vez, qualquer jogador, qualquer área) =====
lixeira.addEventListener("click", () => {
  if (jogadorSelecionado) {
    jogadorSelecionado.remove();
    jogadorSelecionado = null;
    atualizarFila();
    atualizarContadores();
  }
});

// ===== DESTAQUE DO PRÓXIMO DA FILA (só visual) =====
function atualizarFila() {
  const jogadores = areas.fila.querySelectorAll(".player");
  jogadores.forEach((p, i) => p.classList.toggle("proximo", i === 0));
}

// ===== CONTADORES DE OCUPAÇÃO =====
function atualizarContadores() {
  document.getElementById("contTimeA").textContent =
    areas.timeA.querySelectorAll(".player").length + "/4";
  document.getElementById("contTimeB").textContent =
    areas.timeB.querySelectorAll(".player").length + "/4";
  document.getElementById("contMarcacao").textContent =
    areas.marcacao.querySelectorAll(".player").length + "/4";
}

// ===== PLACAR =====
function atualizarPlacar() {
  document.getElementById("scoreA").innerText = scoreA;
  document.getElementById("scoreB").innerText = scoreB;
}

function addPonto(time) {
  if (time === "A") scoreA++;
  else scoreB++;
  atualizarPlacar();
}

function removerPonto(time) {
  if (time === "A") { if (scoreA > 0) scoreA--; }
  else { if (scoreB > 0) scoreB--; }
  atualizarPlacar();
}

// ===== INDICADOR DE SAQUE =====
function definirSaque(time) {
  document.getElementById("placarA").classList.toggle("sacando", time === "A");
  document.getElementById("placarB").classList.toggle("sacando", time === "B");
}

// ===== CRONÔMETRO =====
let segundosPartida = 0;
let intervaloCronometro = null;

function iniciarPausarCronometro() {
  const btn = document.getElementById("btnCronometro");
  if (intervaloCronometro) {
    clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    btn.textContent = "▶";
  } else {
    intervaloCronometro = setInterval(() => {
      segundosPartida++;
      atualizarCronometro();
    }, 1000);
    btn.textContent = "⏸";
  }
}

function resetarCronometro() {
  clearInterval(intervaloCronometro);
  intervaloCronometro = null;
  segundosPartida = 0;
  atualizarCronometro();
  document.getElementById("btnCronometro").textContent = "▶";
}

function atualizarCronometro() {
  document.getElementById("tempoPartida").textContent = tempoFormatado();
}

function tempoFormatado() {
  const m = String(Math.floor(segundosPartida / 60)).padStart(2, "0");
  const s = String(segundosPartida % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== HISTÓRICO E RANKING (salvos no próprio celular, 100% offline) =====
function lerHistoricoLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
  } catch {
    return [];
  }
}

function salvarHistoricoLocal(lista) {
  localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista));
}

function salvarPartida(dados) {
  const historico = lerHistoricoLocal();
  historico.push({
    id: Date.now(),
    ...dados,
    data: new Date().toISOString()
  });
  salvarHistoricoLocal(historico);
}

function calcularRanking() {
  const historico = lerHistoricoLocal();
  const ranking = {};

  historico.forEach(partida => {
    (partida.vencedoresNomes || []).forEach(nome => {
      const chave = nome.trim().toLowerCase();
      if (!ranking[chave]) ranking[chave] = { nome: nome.trim(), vitorias: 0 };
      ranking[chave].vitorias++;
    });
  });

  return Object.values(ranking).sort((a, b) => b.vitorias - a.vitorias);
}

function formatarData(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
  });
}

function renderHistorico() {
  const lista = document.getElementById("listaHistorico");
  const historico = lerHistoricoLocal();

  if (historico.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma partida finalizada ainda.</p>';
    return;
  }

  lista.innerHTML = historico
    .slice()
    .reverse()
    .map(p => `
      <div class="item-historico">
        <div class="placar-final">${p.placarA} x ${p.placarB} — Vitória Time ${p.vencedor}</div>
        <div class="meta">⏱ ${p.duracao} · 📅 ${formatarData(p.data)}</div>
        <div class="meta">🏆 ${(p.vencedoresNomes || []).join(", ") || "—"}</div>
      </div>
    `)
    .join("");
}

function renderRanking() {
  const lista = document.getElementById("listaRanking");
  const ranking = calcularRanking();

  if (ranking.length === 0) {
    lista.innerHTML = '<p class="vazio">Ninguém venceu uma partida ainda.</p>';
    return;
  }

  lista.innerHTML = ranking
    .map((j, i) => `
      <div class="item-ranking">
        <span class="posicao">${i + 1}º</span>
        <span class="nome">${j.nome}</span>
        <span class="vitorias">${j.vitorias} ${j.vitorias === 1 ? "vitória" : "vitórias"}</span>
      </div>
    `)
    .join("");
}

// ===== PÁGINA ISOLADA =====
function alternarPagina() {
  const overlay = document.getElementById("paginaHistorico");
  const aberto = document.getElementById("togglePagina").checked;
  overlay.classList.toggle("aberta", aberto);

  if (aberto) {
    renderHistorico();
    renderRanking();
  }
}

function fecharPagina() {
  document.getElementById("togglePagina").checked = false;
  document.getElementById("paginaHistorico").classList.remove("aberta");
}

function mostrarAba(aba) {
  const ehHistorico = aba === "historico";
  document.getElementById("abaHistorico").classList.toggle("oculta", !ehHistorico);
  document.getElementById("abaRanking").classList.toggle("oculta", ehHistorico);
  document.getElementById("abaHistoricoBtn").classList.toggle("ativa", ehHistorico);
  document.getElementById("abaRankingBtn").classList.toggle("ativa", !ehHistorico);
}

// ===== FINALIZAR PARTIDA =====
function finalizarPartida() {
  let perdedor, entrada, vencedorLabel;

  if (scoreA > scoreB) {
    perdedor = areas.timeB;
    entrada = areas.timeB;
    vencedorLabel = "A";
  } else if (scoreB > scoreA) {
    perdedor = areas.timeA;
    entrada = areas.timeA;
    vencedorLabel = "B";
  } else {
    alert("Empate! Ajuste o placar antes de finalizar.");
    return;
  }

  const vencedorArea = vencedorLabel === "A" ? areas.timeA : areas.timeB;
  const vencedoresNomes = [...vencedorArea.querySelectorAll(".player")]
    .map(p => p.dataset.nomeOriginal);

  salvarPartida({
    placarA: scoreA,
    placarB: scoreB,
    vencedor: vencedorLabel,
    vencedoresNomes,
    duracao: tempoFormatado()
  });

  [...perdedor.querySelectorAll(".player")].forEach(p => {
    p.classList.remove("jogando");
    areas.eliminados.appendChild(p);
  });

  [...areas.marcacao.querySelectorAll(".player")].forEach(p => {
    p.classList.add("jogando");
    entrada.appendChild(p);
  });

  scoreA = 0;
  scoreB = 0;
  atualizarPlacar();
  atualizarFila();
  atualizarContadores();
  resetarCronometro();
}

// estado inicial: Time A começa sacando
definirSaque("A");

// ===== REGISTRO DO SERVICE WORKER (deixa o app instalável e offline) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.log('Erro ao registrar service worker:', err));
  });
}
