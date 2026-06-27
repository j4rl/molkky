const api = async (action, payload = null) => {
  const options = payload
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    : {};
  const response = await fetch(`api.php?action=${encodeURIComponent(action)}`, options);
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "Något gick fel.");
  }
  return data;
};

const pinRows = [[7, 9, 8], [5, 11, 12, 6], [3, 10, 4], [1, 2]];
const storageKeys = {
  themeSettings: "molkky-theme-settings",
};

const elements = {
  heroPanel: document.querySelector(".hero-panel"),
  setupPanel: document.querySelector("#setupPanel"),
  statsPanel: document.querySelector("#statsPanel"),
  gamePanel: document.querySelector("#gamePanel"),
  newGameButton: document.querySelector("#newGameButton"),
  cancelSetupButton: document.querySelector("#cancelSetupButton"),
  startGameButton: document.querySelector("#startGameButton"),
  playersInput: document.querySelector("#playersInput"),
  openAuthButton: document.querySelector("#openAuthButton"),
  authDialog: document.querySelector("#authDialog"),
  loginView: document.querySelector("#loginView"),
  registerView: document.querySelector("#registerView"),
  authMessage: document.querySelector("#authMessage"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  registerUsername: document.querySelector("#registerUsername"),
  registerPassword: document.querySelector("#registerPassword"),
  loginButton: document.querySelector("#loginButton"),
  registerButton: document.querySelector("#registerButton"),
  showRegisterButton: document.querySelector("#showRegisterButton"),
  showLoginButton: document.querySelector("#showLoginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  signedInLabel: document.querySelector("#signedInLabel"),
  statSummary: document.querySelector("#statSummary"),
  recentGames: document.querySelector("#recentGames"),
  playerGroups: document.querySelector("#playerGroups"),
  gameHomeButton: document.querySelector("#gameHomeButton"),
  gameNewButton: document.querySelector("#gameNewButton"),
  endGameButton: document.querySelector("#endGameButton"),
  gameStatusLabel: document.querySelector("#gameStatusLabel"),
  gameTitle: document.querySelector("#gameTitle"),
  leaderLabel: document.querySelector("#leaderLabel"),
  playerTabs: document.querySelector("#playerTabs"),
  pinBoard: document.querySelector("#pinBoard"),
  throwSummary: document.querySelector("#throwSummary"),
  turnCountLabel: document.querySelector("#turnCountLabel"),
  clearThrowButton: document.querySelector("#clearThrowButton"),
  missButton: document.querySelector("#missButton"),
  scoreThrowButton: document.querySelector("#scoreThrowButton"),
  scoreList: document.querySelector("#scoreList"),
  turnLog: document.querySelector("#turnLog"),
  themeToggle: document.querySelector(".app-theme-toggle"),
  openSettingsButton: document.querySelector("#openSettingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  themeFileLink: document.querySelector("#themeFileLink"),
  uploadedThemeStyle: document.querySelector("#uploadedThemeStyle"),
  themeSourceSelect: document.querySelector("#themeSourceSelect"),
  themeUploadField: document.querySelector("#themeUploadField"),
  themeUrlField: document.querySelector("#themeUrlField"),
  themeCdnField: document.querySelector("#themeCdnField"),
  themeUploadInput: document.querySelector("#themeUploadInput"),
  themeFileInput: document.querySelector("#themeFileInput"),
  themeCdnSelect: document.querySelector("#themeCdnSelect"),
  themeCdnPathInput: document.querySelector("#themeCdnPathInput"),
  saveThemeFileButton: document.querySelector("#saveThemeFileButton"),
  clearThemeFileButton: document.querySelector("#clearThemeFileButton"),
  toast: document.querySelector("#toast"),
};

const state = {
  user: null,
  game: null,
  selectedPins: new Set(),
  themeObjectUrl: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.setTimeout(() => elements.toast.classList.remove("visible"), 2800);
}

function playerNamesFromInput() {
  const names = elements.playersInput.value
    .split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length ? names : [state.user?.username || "Spelare 1"];
}

function makePlayer(name, index) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name,
    score: 0,
    misses: 0,
    eliminated: false,
    winner: false,
  };
}

function activePlayer() {
  return state.game?.players[state.game.activePlayerIndex] || null;
}

function activePlayers() {
  return state.game.players.filter((player) => !player.eliminated && !player.winner);
}

function standings() {
  if (!state.game) {
    return [];
  }
  return [...state.game.players].sort((first, second) => {
    if (Number(second.winner) !== Number(first.winner)) {
      return Number(second.winner) - Number(first.winner);
    }
    if (Number(first.eliminated) !== Number(second.eliminated)) {
      return Number(first.eliminated) - Number(second.eliminated);
    }
    return second.score - first.score;
  });
}

function selectedPins() {
  return [...state.selectedPins].sort((a, b) => a - b);
}

function throwScore(pins = selectedPins()) {
  if (pins.length === 0) {
    return 0;
  }
  return pins.length === 1 ? pins[0] : pins.length;
}

function showHomeView() {
  state.game = null;
  state.selectedPins.clear();
  elements.heroPanel.hidden = false;
  elements.setupPanel.hidden = true;
  elements.gamePanel.hidden = true;
  elements.statsPanel.hidden = !state.user;
  renderUser();
}

function showSetupView() {
  elements.heroPanel.hidden = true;
  elements.setupPanel.hidden = false;
  elements.gamePanel.hidden = true;
  elements.statsPanel.hidden = true;
  if (!elements.playersInput.value.trim()) {
    elements.playersInput.value = state.user?.username || "";
  }
  elements.playersInput.focus();
}

function showGameView() {
  elements.heroPanel.hidden = true;
  elements.setupPanel.hidden = true;
  elements.statsPanel.hidden = true;
  elements.gamePanel.hidden = false;
}

function confirmLeaveGame() {
  return !state.game || state.game.finished || window.confirm("Pågående spel sparas inte. Vill du fortsätta?");
}

function startGame() {
  const players = playerNamesFromInput().map(makePlayer);
  state.game = {
    rulesetName: "Mölkky 50",
    players,
    turns: [],
    activePlayerIndex: 0,
    turnNumber: 1,
    startedAt: new Date().toISOString(),
    finished: false,
    saved: false,
  };
  state.selectedPins.clear();
  showGameView();
  renderGame();
}

function moveToNextPlayer() {
  const game = state.game;
  const count = game.players.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const nextIndex = (game.activePlayerIndex + offset) % count;
    const player = game.players[nextIndex];
    if (!player.eliminated && !player.winner) {
      game.activePlayerIndex = nextIndex;
      return;
    }
  }
}

function awardLastPlayerByElimination() {
  if (state.game.players.some((player) => player.winner)) {
    return false;
  }

  const remainingPlayers = activePlayers();
  if (state.game.players.length < 2 || remainingPlayers.length !== 1) {
    return false;
  }

  const winner = remainingPlayers[0];
  winner.winner = true;
  state.game.turns.unshift({
    turn: state.game.turnNumber,
    playerId: winner.id,
    playerName: winner.name,
    pins: [],
    points: 0,
    previousScore: winner.score,
    score: winner.score,
    misses: winner.misses,
    note: "Vinner eftersom alla andra spelare är eliminerade.",
    at: new Date().toISOString(),
  });
  state.game.turnNumber += 1;
  return true;
}

function recordThrow(miss = false) {
  const game = state.game;
  const player = activePlayer();
  if (!game || !player || game.finished || player.eliminated || player.winner) {
    return;
  }

  const pins = miss ? [] : selectedPins();
  if (!miss && pins.length === 0) {
    toast("Välj minst en pinne eller tryck Miss.");
    return;
  }

  const points = throwScore(pins);
  const previousScore = player.score;
  let note = "";

  if (points === 0) {
    player.misses += 1;
    note = player.misses >= 3 ? "Eliminerad efter tre missar." : `Miss ${player.misses}/3.`;
    if (player.misses >= 3) {
      player.eliminated = true;
    }
  } else {
    player.misses = 0;
    const nextScore = player.score + points;
    if (nextScore > 50) {
      player.score = 25;
      note = `Över 50, tillbaka till 25.`;
    } else {
      player.score = nextScore;
      if (player.score === 50) {
        player.winner = true;
        note = "Vinner på exakt 50.";
      }
    }
  }

  game.turns.unshift({
    turn: game.turnNumber,
    playerId: player.id,
    playerName: player.name,
    pins,
    points,
    previousScore,
    score: player.score,
    misses: player.misses,
    note,
    at: new Date().toISOString(),
  });

  game.turnNumber += 1;
  state.selectedPins.clear();

  const eliminationWinner = awardLastPlayerByElimination();
  if (player.winner || eliminationWinner || activePlayers().length === 0) {
    finishGame();
    return;
  }

  moveToNextPlayer();
  renderGame();
}

async function finishGame() {
  state.game.finished = true;
  const winner = state.game.players.find((player) => player.winner);
  if (!winner) {
    state.game.turns.unshift({
      turn: state.game.turnNumber,
      playerName: "Spelet",
      pins: [],
      points: 0,
      previousScore: 0,
      score: 0,
      misses: 0,
      note: "Alla aktiva spelare är eliminerade.",
      at: new Date().toISOString(),
    });
  }

  renderGame();

  if (!state.user) {
    toast("Spelet är klart. Logga in nästa gång om du vill spara statistik.");
    return;
  }

  try {
    const savedWinner = winner || standings()[0] || { name: "Ingen vinnare", score: 0 };
    await api("save_game", {
      rulesetName: state.game.rulesetName,
      startedAt: state.game.startedAt,
      finishedAt: new Date().toISOString(),
      winner: {
        name: winner ? savedWinner.name : "Ingen vinnare",
        score: winner ? savedWinner.score : 0,
      },
      players: state.game.players.map((player) => ({ ...player })),
      turns: state.game.turns,
    });
    state.game.saved = true;
    toast("Spelet sparades i statistiken.");
    await refreshStats();
  } catch (error) {
    toast(error.message);
  }
}

function togglePin(pin) {
  if (state.game?.finished) {
    return;
  }
  if (state.selectedPins.has(pin)) {
    state.selectedPins.delete(pin);
  } else {
    state.selectedPins.add(pin);
  }
  renderThrowPanel();
}

function renderPinBoard() {
  elements.pinBoard.innerHTML = "";
  pinRows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "pin-row";
    row.forEach((pin) => {
      const button = document.createElement("button");
      button.className = `pin ${state.selectedPins.has(pin) ? "selected" : ""}`;
      button.type = "button";
      button.textContent = pin;
      button.title = `Pinne ${pin}`;
      button.setAttribute("aria-pressed", String(state.selectedPins.has(pin)));
      button.disabled = Boolean(state.game?.finished);
      button.addEventListener("click", () => togglePin(pin));
      rowElement.append(button);
    });
    elements.pinBoard.append(rowElement);
  });
}

function renderThrowPanel() {
  renderPinBoard();
  const pins = selectedPins();
  const score = throwScore(pins);
  const player = activePlayer();
  elements.turnCountLabel.textContent = `Kast ${state.game.turnNumber}`;
  elements.missButton.disabled = state.game.finished;
  elements.clearThrowButton.disabled = state.game.finished || pins.length === 0;
  elements.scoreThrowButton.disabled = state.game.finished || pins.length === 0;

  if (state.game.finished) {
    elements.throwSummary.textContent = "Matchen är klar.";
    return;
  }

  if (pins.length === 0) {
    elements.throwSummary.textContent = `${player.name}: välj fällda pinnar eller registrera miss.`;
    return;
  }

  const scoreText = pins.length === 1 ? `pinne ${pins[0]} ger ${score} poäng` : `${pins.length} pinnar ger ${score} poäng`;
  const nextScore = player.score + score;
  const penalty = nextScore > 50 ? " Det blir över 50, så spelaren hamnar på 25." : "";
  elements.throwSummary.textContent = `${player.name}: ${scoreText}.${penalty}`;
}

function renderPlayerTabs() {
  const leader = standings()[0];
  elements.leaderLabel.textContent = leader ? `${leader.name} ${leader.score}` : "0";
  elements.playerTabs.innerHTML = "";

  state.game.players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = `player-tab ${index === state.game.activePlayerIndex ? "active" : ""} ${player.eliminated ? "eliminated" : ""} ${player.winner ? "winner" : ""}`;
    item.innerHTML = `
      <strong>${escapeHtml(player.name)}</strong>
      <span>${player.score} p · miss ${player.misses}/3${player.eliminated ? " · ute" : ""}${player.winner ? " · vinnare" : ""}</span>
    `;
    elements.playerTabs.append(item);
  });
}

function renderScoreList() {
  elements.scoreList.innerHTML = standings()
    .map((player, index) => {
      const status = player.winner ? "Vinnare" : player.eliminated ? "Eliminerad" : "Aktiv";
      return `
        <div class="score-row ${player.winner ? "winner" : ""} ${player.eliminated ? "eliminated" : ""}">
          <div class="rank">${index + 1}</div>
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <span>${status} · ${player.misses} miss${player.misses === 1 ? "" : "ar"} i rad</span>
          </div>
          <strong>${player.score}</strong>
        </div>
      `;
    })
    .join("");
}

function renderTurnLog() {
  const turns = state.game.turns.slice(0, 18);
  elements.turnLog.innerHTML = turns.length
    ? turns
        .map((turn) => {
          const pins = turn.pins.length ? turn.pins.join(", ") : "miss";
          return `
            <div class="log-row">
              <span>#${turn.turn}</span>
              <div>
                <strong>${escapeHtml(turn.playerName)}</strong>
                <small>${escapeHtml(pins)} · ${turn.previousScore} → ${turn.score}${turn.note ? ` · ${escapeHtml(turn.note)}` : ""}</small>
              </div>
              <strong>${turn.points}</strong>
            </div>
          `;
        })
        .join("")
    : '<p class="helper">Inga kast registrerade ännu.</p>';
}

function renderGame() {
  if (!state.game) {
    return;
  }
  const player = activePlayer();
  const winner = state.game.players.find((candidate) => candidate.winner);
  elements.gameStatusLabel.textContent = state.game.finished ? "Matchen är klar" : "Pågående spel";
  elements.gameTitle.textContent = state.game.finished
    ? winner
      ? `${winner.name} vann`
      : "Ingen vinnare"
    : `Tur: ${player.name}`;
  renderPlayerTabs();
  renderThrowPanel();
  renderScoreList();
  renderTurnLog();
}

function renderUser() {
  elements.signedInLabel.textContent = state.user ? `Inloggad som ${state.user.username}` : "Spela utan konto";
  elements.openAuthButton.title = state.user ? "Konto" : "Logga in";
  elements.themeToggle.hidden = !state.user;
  elements.openSettingsButton.hidden = !state.user;
  if (!state.user) {
    clearActiveTheme();
    if (elements.settingsDialog.open) {
      elements.settingsDialog.close();
    }
  }
}

function renderStats(summary, recent, groups) {
  if (!summary) {
    elements.statSummary.innerHTML = "";
    elements.recentGames.innerHTML = "";
    elements.playerGroups.innerHTML = "";
    return;
  }

  const values = [
    ["Spel", summary.games || 0],
    ["Vinster", summary.wins || 0],
    ["Bästa vinst", summary.best || 0],
    ["Snitt vinst", summary.average || 0],
  ];
  elements.statSummary.innerHTML = values
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  elements.recentGames.innerHTML = recent.length
    ? recent
        .map((game) => {
          const date = new Date(`${game.finishedAt.replace(" ", "T")}`).toLocaleString("sv-SE", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const names = game.players.map((player) => player.name).join(", ");
          return `
            <div class="recent-game">
              <div>
                <strong>${escapeHtml(game.winner.name)} ${game.winner.score} p</strong>
                <span>${escapeHtml(game.rulesetName)} · ${escapeHtml(names)}</span>
              </div>
              <time>${date}</time>
            </div>
          `;
        })
        .join("")
    : '<p class="helper">Inga sparade spel ännu.</p>';

  elements.playerGroups.innerHTML = groups.length
    ? groups
        .map((group) => {
          const players = group.players.map((name) => escapeHtml(name)).join(", ");
          return `<div class="player-group"><strong>${players}</strong><span>${group.games} spel</span></div>`;
        })
        .join("")
    : '<p class="helper">När samma uppsättning spelare har sparats flera gånger visas den här.</p>';
}

async function refreshStats() {
  if (!state.user) {
    renderStats(null, [], []);
    return;
  }
  const data = await api("stats");
  renderStats(data.summary, data.recent, data.groups);
}

async function refreshSession() {
  const data = await api("me");
  state.user = data.user;
  renderUser();
  elements.statsPanel.hidden = !state.user || Boolean(state.game);
  if (state.user) {
    applyStoredTheme();
    await refreshStats();
  }
}

function showAuthView(view) {
  elements.authMessage.textContent = "";
  const register = view === "register";
  elements.loginView.hidden = register;
  elements.registerView.hidden = !register;
  window.setTimeout(() => (register ? elements.registerUsername : elements.loginUsername).focus(), 0);
}

function openAuthDialog() {
  showAuthView("login");
  elements.authDialog.showModal();
}

async function handleAuth(action, usernameInput, passwordInput) {
  elements.authMessage.textContent = "";
  try {
    const data = await api(action, {
      username: usernameInput.value,
      password: passwordInput.value,
    });
    state.user = data.user;
    elements.authDialog.close();
    renderUser();
    applyStoredTheme();
    await refreshStats();
    elements.statsPanel.hidden = Boolean(state.game) || !state.user || !elements.setupPanel.hidden;
    toast(action === "login" ? "Du är inloggad." : "Kontot är skapat.");
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
}

function readStoredTheme() {
  const legacyUrl = window.localStorage.getItem("molkky-theme-file");
  if (legacyUrl) {
    window.localStorage.removeItem("molkky-theme-file");
    const migrated = { source: "url", url: legacyUrl };
    window.localStorage.setItem(storageKeys.themeSettings, JSON.stringify(migrated));
    return migrated;
  }

  try {
    const raw = window.localStorage.getItem(storageKeys.themeSettings);
    const settings = raw ? JSON.parse(raw) : null;
    return settings && typeof settings === "object" ? settings : null;
  } catch (_error) {
    return null;
  }
}

function writeStoredTheme(settings) {
  window.localStorage.setItem(storageKeys.themeSettings, JSON.stringify(settings));
}

function revokeThemeObjectUrl() {
  if (state.themeObjectUrl) {
    URL.revokeObjectURL(state.themeObjectUrl);
    state.themeObjectUrl = null;
  }
}

function clearActiveTheme() {
  revokeThemeObjectUrl();
  elements.themeFileLink.href = "";
  elements.themeFileLink.disabled = true;
  elements.uploadedThemeStyle.textContent = "";
}

function cdnThemeUrl(settings) {
  const base = String(settings.cdnBase || "").trim();
  const path = String(settings.cdnPath || "").trim().replace(/^\/+/, "");
  return base && path ? `${base}${path}` : "";
}

function syncThemeDialog(settings = readStoredTheme()) {
  const source = settings?.source || "upload";
  elements.themeSourceSelect.value = source;
  elements.themeFileInput.value = settings?.url || "";
  elements.themeCdnSelect.value = settings?.cdnBase || "https://cdn.jsdelivr.net/npm/";
  elements.themeCdnPathInput.value = settings?.cdnPath || "";
  updateThemeSourceFields();
}

function updateThemeSourceFields() {
  const source = elements.themeSourceSelect.value;
  elements.themeUploadField.hidden = source !== "upload";
  elements.themeUrlField.hidden = source !== "url";
  elements.themeCdnField.hidden = source !== "cdn";
}

function applyThemeSettings(settings) {
  clearActiveTheme();
  syncThemeDialog(settings);

  if (!state.user || !settings) {
    return;
  }

  if (settings.source === "upload" && settings.css) {
    elements.uploadedThemeStyle.textContent = settings.css;
    return;
  }

  const url = settings.source === "cdn" ? cdnThemeUrl(settings) : String(settings.url || "").trim();
  if (url) {
    elements.themeFileLink.href = url;
    elements.themeFileLink.disabled = false;
  }
}

function applyStoredTheme() {
  applyThemeSettings(readStoredTheme());
}

function readCssFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Kunde inte läsa CSS-filen.")));
    reader.readAsText(file);
  });
}

async function saveThemeChoice() {
  if (!state.user) {
    clearActiveTheme();
    toast("Logga in för att välja tema.");
    return;
  }

  const source = elements.themeSourceSelect.value;
  const previous = readStoredTheme();
  let settings;

  if (source === "upload") {
    const file = elements.themeUploadInput.files[0];
    const css = file ? await readCssFile(file) : previous?.source === "upload" ? previous.css : "";
    if (!css.trim()) {
      toast("Välj en CSS-fil först.");
      return;
    }
    settings = {
      source,
      fileName: file?.name || previous?.fileName || "uppladdat-tema.css",
      css,
    };
  } else if (source === "cdn") {
    settings = {
      source,
      cdnBase: elements.themeCdnSelect.value,
      cdnPath: elements.themeCdnPathInput.value.trim(),
    };
    if (!cdnThemeUrl(settings)) {
      toast("Fyll i CDN-sökvägen.");
      return;
    }
  } else {
    settings = {
      source,
      url: elements.themeFileInput.value.trim(),
    };
    if (!settings.url) {
      toast("Fyll i en URL till CSS-filen.");
      return;
    }
  }

  writeStoredTheme(settings);
  applyThemeSettings(settings);
  toast("Temat används.");
}

function clearThemeChoice() {
  window.localStorage.removeItem(storageKeys.themeSettings);
  window.localStorage.removeItem("molkky-theme-file");
  elements.themeUploadInput.value = "";
  syncThemeDialog(null);
  clearActiveTheme();
  toast("Temat rensades.");
}

function bindEvents() {
  elements.newGameButton.addEventListener("click", showSetupView);
  elements.cancelSetupButton.addEventListener("click", showHomeView);
  elements.startGameButton.addEventListener("click", startGame);
  elements.gameHomeButton.addEventListener("click", () => {
    if (confirmLeaveGame()) {
      showHomeView();
    }
  });
  elements.gameNewButton.addEventListener("click", () => {
    if (confirmLeaveGame()) {
      state.game = null;
      state.selectedPins.clear();
      showSetupView();
    }
  });
  elements.endGameButton.addEventListener("click", () => {
    if (confirmLeaveGame()) {
      showHomeView();
    }
  });
  elements.clearThrowButton.addEventListener("click", () => {
    state.selectedPins.clear();
    renderThrowPanel();
  });
  elements.missButton.addEventListener("click", () => recordThrow(true));
  elements.scoreThrowButton.addEventListener("click", () => recordThrow(false));
  elements.openAuthButton.addEventListener("click", openAuthDialog);
  elements.showRegisterButton.addEventListener("click", () => showAuthView("register"));
  elements.showLoginButton.addEventListener("click", () => showAuthView("login"));
  elements.loginButton.addEventListener("click", () => handleAuth("login", elements.loginUsername, elements.loginPassword));
  elements.registerButton.addEventListener("click", () => handleAuth("register", elements.registerUsername, elements.registerPassword));
  elements.logoutButton.addEventListener("click", async () => {
    await api("logout");
    state.user = null;
    renderUser();
    renderStats(null, [], []);
    elements.statsPanel.hidden = true;
    toast("Du är utloggad.");
  });
  elements.openSettingsButton.addEventListener("click", () => {
    if (!state.user) {
      toast("Logga in för att välja tema.");
      openAuthDialog();
      return;
    }
    syncThemeDialog();
    elements.settingsDialog.showModal();
  });
  elements.themeSourceSelect.addEventListener("change", updateThemeSourceFields);
  elements.saveThemeFileButton.addEventListener("click", () => {
    saveThemeChoice().catch((error) => toast(error.message));
  });
  elements.clearThemeFileButton.addEventListener("click", clearThemeChoice);
}

syncThemeDialog();
bindEvents();
refreshSession().catch((error) => toast(error.message));
