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
const CHAVE_ESTADO = "vilaDaBarra_estado";

let scoreA = 0;
let scoreB = 0;
let contador = 1;
let jogadorSelecionado = null;
let saqueAtual = "A";

// ===== CRIAR JOGADOR (número de camisa fixo, criado uma vez só) =====
function criarPlayerComNumero(nome, numero, jogando) {
  const el = document.createElement("div");
  el.className = "player";
  el.dataset.nome = nome.trim().toLowerCase();
  el.dataset.nomeOriginal = nome.trim();

  const numeroEl = document.createElement("span");
  numeroEl.className = "numero";
  numeroEl.textContent = numero;
  el.appendChild(numeroEl);
  el.appendChild(document.createTextNode(nome.trim()));

  if (jogando) el.classList.add("jogando");

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selecionarJogador(el);
  });

  return el;
}

function criarPlayer(nome) {
  return criarPlayerComNumero(nome, contador++, false);
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
  salvarEstado();
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
  salvarEstado();
}

// ===== LIXEIRA (remove de vez, qualquer jogador, qualquer área) =====
lixeira.addEventListener("click", () => {
  if (jogadorSelecionado) {
    jogadorSelecionado.remove();
    jogadorSelecionado = null;
    atualizarFila();
    atualizarContadores();
    salvarEstado();
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
  salvarEstado();
}

function removerPonto(time) {
  if (time === "A") { if (scoreA > 0) scoreA--; }
  else { if (scoreB > 0) scoreB--; }
  atualizarPlacar();
  salvarEstado();
}

// ===== INDICADOR DE SAQUE =====
function definirSaque(time) {
  saqueAtual = time;
  document.getElementById("placarA").classList.toggle("sacando", time === "A");
  document.getElementById("placarB").classList.toggle("sacando", time === "B");
  salvarEstado();
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
      salvarEstado();
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
  salvarEstado();
}

function atualizarCronometro() {
  document.getElementById("tempoPartida").textContent = tempoFormatado();
}

function tempoFormatado() {
  const m = String(Math.floor(segundosPartida / 60)).padStart(2, "0");
  const s = String(segundosPartida % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== ESTADO DA PARTIDA ATUAL (jogadores, placar, cronômetro, saque) =====
function coletarJogadoresDeArea(areaId) {
  const area = areas[areaId];
  return [...area.querySelectorAll(".player")].map(p => ({
    nome: p.dataset.nomeOriginal,
    numero: p.querySelector(".numero").textContent,
    jogando: p.classList.contains("jogando")
  }));
}

function salvarEstado() {
  const estado = {
    contador,
    scoreA,
    scoreB,
    segundosPartida,
    saqueAtual,
    areas: {
      fila: coletarJogadoresDeArea("fila"),
      timeA: coletarJogadoresDeArea("timeA"),
      timeB: coletarJogadoresDeArea("timeB"),
      marcacao: coletarJogadoresDeArea("marcacao"),
      eliminados: coletarJogadoresDeArea("eliminados")
    }
  };
  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  } catch (err) {
    console.log("Erro ao salvar estado:", err);
  }
}

function restaurarEstado() {
  let estado = null;
  try {
    estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO));
  } catch {
    estado = null;
  }

  if (!estado) {
    definirSaque("A");
    return;
  }

  contador = estado.contador || 1;
  scoreA = estado.scoreA || 0;
  scoreB = estado.scoreB || 0;
  segundosPartida = estado.segundosPartida || 0;

  Object.entries(estado.areas || {}).forEach(([areaId, lista]) => {
    const area = areas[areaId];
    if (!area) return;
    lista.forEach(j => {
      area.appendChild(criarPlayerComNumero(j.nome, j.numero, j.jogando));
    });
  });

  atualizarPlacar();
  atualizarCronometro();
  atualizarFila();
  atualizarContadores();
  definirSaque(estado.saqueAtual || "A");
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

// ===== EXPORTAR RANKING (imagem simples, pronta pra compartilhar no WhatsApp) =====
async function exportarHistorico() {
  const ranking = calcularRanking();

  if (ranking.length === 0) {
    alert("Ainda não há vitórias registradas para exportar.");
    return;
  }

  const blob = await gerarImagemRanking(ranking);
  const arquivo = new File([blob], "ranking-vila-da-barra.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({
        files: [arquivo],
        title: "Ranking Vila da Barra",
        text: "🏆 Ranking de vitórias da Vila da Barra"
      });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // usuário cancelou o compartilhamento
    }
  }

  // sem suporte a compartilhamento direto: baixa a imagem pra enviar manualmente
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ranking-vila-da-barra.png";
  link.click();
  URL.revokeObjectURL(url);
}

function gerarImagemRanking(ranking) {
  return new Promise(resolve => {
    const top3 = ranking.slice(0, 3);
    const resto = ranking.slice(3);

    const largura = 1080;
    const alturaTopo = 360;
    const alturaLinhaResto = 80;
    const alturaRodape = 80;
    const altura = alturaTopo + (resto.length ? 70 + resto.length * alturaLinhaResto : 0) + alturaRodape;

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");

    // fundo
    ctx.fillStyle = "#0b3d52";
    ctx.fillRect(0, 0, largura, altura);

    // título
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Arial";
    ctx.fillText("🏆 Vila da Barra", largura / 2, 80);
    ctx.font = "32px Arial";
    ctx.fillStyle = "#bcd6e0";
    ctx.fillText("Ranking de Vitórias", largura / 2, 130);

    // pódio (top 3)
    const medalhas = ["🥇", "🥈", "🥉"];
    const coresPodio = ["#ffd700", "#c0c0c0", "#cd7f32"];
    const larguraBloco = largura / top3.length;
    const topoY = 190;

    top3.forEach((j, i) => {
      const cx = larguraBloco * i + larguraBloco / 2;

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = coresPodio[i];
      ctx.fillRect(cx - larguraBloco / 2 + 15, topoY, larguraBloco - 30, 170);
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.font = "64px Arial";
      ctx.fillText(medalhas[i], cx, topoY + 70);

      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(j.nome, cx, topoY + 115);

      ctx.font = "24px Arial";
      ctx.fillStyle = coresPodio[i];
      ctx.fillText(`${j.vitorias} ${j.vitorias === 1 ? "vitória" : "vitórias"}`, cx, topoY + 150);
    });

    // demais colocações
    let y = alturaTopo + 40;
    if (resto.length > 0) {
      ctx.textAlign = "left";
      ctx.font = "28px Arial";
      ctx.fillStyle = "#bcd6e0";
      ctx.fillText("Demais colocações", 60, y);
      y += 50;

      resto.forEach((j, i) => {
        const posicao = i + 4;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial";
        ctx.fillText(`${posicao}º`, 60, y);

        ctx.font = "28px Arial";
        ctx.fillText(j.nome, 150, y);

        ctx.textAlign = "right";
        ctx.fillStyle = "#bcd6e0";
        ctx.fillText(`${j.vitorias} ${j.vitorias === 1 ? "vitória" : "vitórias"}`, largura - 60, y);
        ctx.textAlign = "left";

        y += alturaLinhaResto;
      });
    }

    // rodapé
    ctx.textAlign = "center";
    ctx.font = "20px Arial";
    ctx.fillStyle = "#7da7bb";
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    ctx.fillText(`Gerado em ${dataAtual}`, largura / 2, altura - 30);

    canvas.toBlob(blob => resolve(blob), "image/png");
  });
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
  salvarEstado();
}

// estado inicial: restaura jogadores/placar/cronômetro salvos, ou começa do zero
restaurarEstado();

// ===== REGISTRO DO SERVICE WORKER (deixa o app instalável e offline) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.log('Erro ao registrar service worker:', err));
  });
}
