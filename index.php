<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mölkkyprotokoll</title>
    <link id="themeFileLink" rel="stylesheet" href="" disabled>
    <style id="uploadedThemeStyle"></style>
    <link rel="stylesheet" href="assets/styles.css">
    <script src="https://ld.j4rl.se/ld-theme-toggle.js" defer></script>
    <script src="assets/app.js" defer></script>
  </head>
  <body>
    <header class="topbar">
      <div>
        <p class="eyebrow">Mölkkyprotokoll</p>
        <h1>Spela till exakt 50</h1>
      </div>
      <div class="topbar-actions">
        <ld-theme-toggle class="app-theme-toggle"></ld-theme-toggle>
        <button class="icon-button" id="openSettingsButton" type="button" title="Temafil" aria-label="Temafil" hidden>CSS</button>
        <button class="icon-button" id="openAuthButton" type="button" title="Logga in" aria-label="Logga in">ID</button>
      </div>
    </header>

    <main class="layout">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">Poängräknare</p>
          <h2>Mölkky för flera spelare, med missar, straff och statistik.</h2>
          <p>Spela direkt utan konto. Logga in när du vill spara färdiga matcher och se spel med samma spelare igen.</p>
          <div class="start-actions">
            <button class="primary-button" id="newGameButton" type="button">Nytt spel</button>
          </div>
        </div>
        <div class="hero-image" aria-label="Startuppställning">
          <img src="assets/molkky-start.png" alt="Mölkky-pjäser i startuppställning">
        </div>
      </section>

      <section class="panel setup-panel" id="setupPanel" hidden>
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Nytt spel</p>
            <h2>Spelare</h2>
          </div>
          <button class="text-button" id="cancelSetupButton" type="button">Tillbaka</button>
        </div>
        <div class="field-grid">
          <label>
            Spelare
            <textarea id="playersInput" rows="5" placeholder="Skriv en spelare per rad"></textarea>
          </label>
          <div class="rules-box">
            <h3>Regler som används</h3>
            <ul>
              <li>En pinne ger pinnens nummer.</li>
              <li>Flera pinnar ger antal fällda pinnar.</li>
              <li>Över 50 poäng sätter spelaren till 25.</li>
              <li>Tre missar i rad eliminerar spelaren.</li>
            </ul>
          </div>
        </div>
        <button class="primary-button" id="startGameButton" type="button">Starta spel</button>
      </section>

      <section class="panel stats-panel" id="statsPanel" hidden>
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Konto</p>
            <h2>Statistik</h2>
          </div>
          <button class="text-button" id="logoutButton" type="button">Logga ut</button>
        </div>
        <p class="signed-in" id="signedInLabel">Spela utan konto</p>
        <div class="stat-row" id="statSummary"></div>
        <div class="history-grid">
          <section>
            <h3>Senaste spel</h3>
            <div class="recent-games" id="recentGames"></div>
          </section>
          <section>
            <h3>Samma spelare</h3>
            <div class="player-groups" id="playerGroups"></div>
          </section>
        </div>
      </section>

      <section class="game-shell" id="gamePanel" hidden>
        <div class="game-header">
          <div>
            <p class="eyebrow" id="gameStatusLabel">Pågående spel</p>
            <h2 id="gameTitle">Tur</h2>
          </div>
          <div class="game-actions">
            <button class="secondary-button" id="gameHomeButton" type="button">Start</button>
            <button class="secondary-button" id="gameNewButton" type="button">Nytt spel</button>
            <button class="secondary-button danger-button" id="endGameButton" type="button">Avsluta</button>
          </div>
          <div class="score-total">
            <span>Ledare</span>
            <strong id="leaderLabel">0</strong>
          </div>
        </div>

        <div class="player-tabs" id="playerTabs"></div>

        <div class="play-area">
          <section class="panel throw-panel">
            <div class="panel-heading compact">
              <div>
                <p class="eyebrow">Kast</p>
                <h3>Fällda pinnar</h3>
              </div>
              <span class="turn-count" id="turnCountLabel">Kast 1</span>
            </div>

            <div class="pin-board" id="pinBoard" aria-label="Välj fällda pinnar"></div>

            <div class="throw-summary" id="throwSummary">
              Välj pinnar eller registrera miss.
            </div>

            <div class="button-row">
              <button class="secondary-button" id="clearThrowButton" type="button">Rensa</button>
              <button class="secondary-button danger-button" id="missButton" type="button">Miss</button>
              <button class="primary-button" id="scoreThrowButton" type="button">Registrera</button>
            </div>
          </section>

          <section class="scoreboard">
            <div class="panel-heading compact">
              <div>
                <p class="eyebrow">Protokoll</p>
                <h3>Poängställning</h3>
              </div>
            </div>
            <div class="score-list" id="scoreList"></div>
            <div class="turn-log" id="turnLog"></div>
          </section>
        </div>
      </section>
    </main>

    <dialog class="auth-dialog" id="authDialog">
      <form method="dialog" class="dialog-close-form">
        <button class="icon-button" type="submit" title="Stäng" aria-label="Stäng">X</button>
      </form>
      <div class="auth-view" id="loginView">
        <section>
          <p class="eyebrow">Logga in</p>
          <h2>Befintlig användare</h2>
          <label>
            Användarnamn
            <input id="loginUsername" type="text" autocomplete="username">
          </label>
          <label>
            Lösenord
            <input id="loginPassword" type="password" autocomplete="current-password">
          </label>
          <button class="primary-button" id="loginButton" type="button">Logga in</button>
          <p class="auth-switch">Inget konto? <button class="text-button" id="showRegisterButton" type="button">Skapa användare</button></p>
        </section>
      </div>
      <div class="auth-view" id="registerView" hidden>
        <section>
          <p class="eyebrow">Skapa konto</p>
          <h2>Ny användare</h2>
          <label>
            Användarnamn
            <input id="registerUsername" type="text" autocomplete="username">
          </label>
          <label>
            Lösenord
            <input id="registerPassword" type="password" autocomplete="new-password">
          </label>
          <button class="primary-button" id="registerButton" type="button">Skapa konto</button>
          <p class="auth-switch">Har du redan konto? <button class="text-button" id="showLoginButton" type="button">Logga in</button></p>
        </section>
      </div>
      <p class="form-message" id="authMessage"></p>
    </dialog>

    <dialog class="settings-dialog" id="settingsDialog">
      <form method="dialog" class="dialog-close-form">
        <button class="icon-button" type="submit" title="Stäng" aria-label="Stäng">X</button>
      </form>
      <section>
        <p class="eyebrow">Tema</p>
        <h2>Temafil från theme.j4rl.se</h2>
        <p class="helper">Endast inloggade användare kan välja temafil. Appen använder även <code>data-theme</code> från ld.j4rl.se.</p>
        <label>
          Källa
          <select id="themeSourceSelect">
            <option value="upload">Ladda upp CSS-fil</option>
            <option value="url">Direkt URL</option>
            <option value="cdn">CDN</option>
          </select>
        </label>
        <label class="theme-source-field" id="themeUploadField">
          Ladda upp CSS
          <input id="themeUploadInput" type="file" accept=".css,text/css">
        </label>
        <label class="theme-source-field" id="themeUrlField" hidden>
          Direkt URL till CSS-fil
          <input id="themeFileInput" type="url" placeholder="https://example.se/mitt-tema.css">
        </label>
        <div class="theme-source-field" id="themeCdnField" hidden>
          <label>
            CDN
            <select id="themeCdnSelect">
              <option value="https://cdn.jsdelivr.net/npm/">jsDelivr npm</option>
              <option value="https://cdn.jsdelivr.net/gh/">jsDelivr GitHub</option>
              <option value="https://unpkg.com/">unpkg</option>
            </select>
          </label>
          <label>
            Paket eller sökväg
            <input id="themeCdnPathInput" type="text" placeholder="paket@version/theme.css">
          </label>
        </div>
        <div class="button-row">
          <button class="primary-button" id="saveThemeFileButton" type="button">Använd</button>
          <button class="secondary-button" id="clearThemeFileButton" type="button">Rensa</button>
        </div>
      </section>
    </dialog>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  </body>
</html>
