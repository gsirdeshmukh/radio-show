(() => {
  const DEFAULT_CLIENT_ID = "0e01ffabf4404a23b1798c0e1c9b4762";
  const DEFAULT_REDIRECT = "https://gsirdeshmukh.github.io/radio-show/";
  const DEFAULT_SUPABASE_URL = "https://jduyihzjqpcczekhorrq.supabase.co";
  const DEFAULT_SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ";
  const REQUIRED_SCOPES = [
    "streaming",
    "user-modify-playback-state",
    "user-read-playback-state",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-private",
    "user-read-email",
  ];
  const SCOPES = REQUIRED_SCOPES.join(" ");
  const SUPABASE_URL_KEY = "rs_supabase_url";
  const SUPABASE_ANON_KEY = "rs_supabase_anon";

  const state = {
    token: "",
    clientId: "",
    redirectUri: "",
    authState: "",
    player: null,
    deviceId: null,
    connected: false,
    searchResults: [],
    segments: [],
    mediaRecorder: null,
    recordingChunks: [],
    recordingStart: null,
    recordTimerId: null,
    currentRecording: null,
    masterVolume: 0.8,
    fadeMs: 1200,
    isPlaying: false,
    activeAudio: null,
    audioContext: null,
    previewTimer: null,
    previewAudio: null,
    previewSegmentId: null,
    tickerTimer: null,
    tickerIndex: 0,
    focusSegmentId: null,
    overlayRecorder: null,
    overlayChunks: [],
    overlaySegment: null,
    overlayOriginalVolume: null,
    overlayMonitor: null,
    overlayRecording: false,
    supabase: null,
    supabaseUrl: "",
    supabaseKey: "",
    spotifyProfile: null,
  };

  const sdkReady = new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });

  const dom = {};

  function assignDom() {
    dom.tokenInput = document.getElementById("token-input");
    dom.clientIdInput = document.getElementById("client-id-input");
    dom.redirectInput = document.getElementById("redirect-input");
    dom.authBtn = document.getElementById("auth-btn");
    dom.connectBtn = document.getElementById("connect-btn");
    dom.disconnectBtn = document.getElementById("disconnect-btn");
    dom.forgetTokenBtn = document.getElementById("forget-token-btn");
    dom.connectClose = document.getElementById("connect-close");
    dom.status = document.getElementById("spotify-status");
    dom.masterVolume = document.getElementById("master-volume");
    dom.searchForm = document.getElementById("search-form");
    dom.searchInput = document.getElementById("search-input");
    dom.libraryBtn = document.getElementById("library-btn");
    dom.playlistsBtn = document.getElementById("playlists-btn");
    dom.clearResultsBtn = document.getElementById("clear-results-btn");
    dom.results = document.getElementById("results");
    dom.segments = document.getElementById("segments");
    dom.showLength = document.getElementById("show-length");
    dom.recordBtn = document.getElementById("record-btn");
    dom.stopRecordBtn = document.getElementById("stop-record-btn");
    dom.recordLabel = document.getElementById("record-label");
    dom.recordTimer = document.getElementById("record-timer");
    dom.recordPreview = document.getElementById("record-preview");
    dom.addRecordingBtn = document.getElementById("add-recording-btn");
    dom.uploadBtn = document.getElementById("upload-btn");
    dom.uploadInput = document.getElementById("upload-input");
    dom.orderList = document.getElementById("order-list");
    dom.playShowBtn = document.getElementById("play-show-btn");
    dom.stopShowBtn = document.getElementById("stop-show-btn");
    dom.fadeDuration = document.getElementById("fade-duration");
    dom.connectToggle = document.getElementById("connect-toggle");
    dom.connectPanel = document.getElementById("connect-panel");
    dom.themeSwitch = document.getElementById("theme-switch");
    dom.saveShowBtn = document.getElementById("save-show-btn");
    dom.publishShowBtn = document.getElementById("publish-show-btn");
    dom.loadShowBtn = document.getElementById("load-show-btn");
    dom.saveTracksBtn = document.getElementById("save-tracks-btn");
    dom.loadInput = document.getElementById("load-input");
    dom.sessionTitle = document.getElementById("session-title");
    dom.sessionHost = document.getElementById("session-host");
    dom.sessionGenre = document.getElementById("session-genre");
    dom.sessionDate = document.getElementById("session-date");
    dom.ticker = document.getElementById("ticker");
    dom.listenFile = document.getElementById("listen-file");
    dom.listenLoad = document.getElementById("listen-load");
    dom.listenPlay = document.getElementById("listen-play");
    dom.listenStop = document.getElementById("listen-stop");
    dom.listenCover = document.getElementById("listen-cover");
    dom.listenTitle = document.getElementById("listen-title");
    dom.listenSubtitle = document.getElementById("listen-subtitle");
    dom.listenNote = document.getElementById("listen-note");
    dom.listenProgress = document.getElementById("listen-progress");
    dom.listenTotal = document.getElementById("listen-total");
    dom.multiSeed = document.getElementById("multi-seed");
    dom.supabaseUrlInput = document.getElementById("supabase-url");
    dom.supabaseKeyInput = document.getElementById("supabase-key");
    dom.profileAvatar = document.getElementById("profile-avatar");
    dom.profileName = document.getElementById("profile-name");
  }

  function showInlineRecommendations(seedSegment, recs) {
    const dropdowns = document.querySelectorAll(".dropdown-menu");
    dropdowns.forEach((d) => d.remove());
    const segmentEls = Array.from(dom.segments.children);
    const idx = state.segments.findIndex((s) => s.id === seedSegment.id);
    const host = segmentEls[idx]?.querySelector(".seg-actions");
    if (!host) {
      state.searchResults = recs;
      renderResults();
      return;
    }
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    const list = document.createElement("ul");
    recs.forEach((track) => {
      const li = document.createElement("li");
      const title = document.createElement("div");
      title.className = "subtitle";
      title.textContent = track.name;
      const btn = document.createElement("button");
      btn.textContent = "Add";
      btn.className = "primary";
      btn.addEventListener("click", () => addTrackToShow(track));
      li.appendChild(title);
      li.appendChild(btn);
      list.appendChild(li);
    });
    menu.appendChild(list);
    host.classList.add("dropdown");
    host.appendChild(menu);
    const close = () => {
      menu.remove();
      host.classList.remove("dropdown");
      document.removeEventListener("click", onDoc);
    };
    const onDoc = (e) => {
      if (!menu.contains(e.target)) close();
    };
    setTimeout(() => document.addEventListener("click", onDoc), 0);
  }

  function bindEvents() {
    dom.authBtn.addEventListener("click", startPkceAuth);
    dom.connectBtn.addEventListener("click", connectSpotify);
    dom.disconnectBtn.addEventListener("click", disconnectSpotify);
    dom.forgetTokenBtn.addEventListener("click", forgetToken);
    dom.connectToggle.addEventListener("click", toggleConnectPanel);
    dom.connectClose.addEventListener("click", toggleConnectPanel);
    dom.themeSwitch.addEventListener("click", handleThemeSwitch);
    dom.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      runSearch();
    });
    dom.libraryBtn.addEventListener("click", loadLibraryTracks);
    dom.playlistsBtn.addEventListener("click", loadPlaylists);
    dom.clearResultsBtn.addEventListener("click", () => {
      state.searchResults = [];
      renderResults();
    });
    dom.recordBtn.addEventListener("click", startRecording);
    dom.stopRecordBtn.addEventListener("click", stopRecording);
    dom.addRecordingBtn.addEventListener("click", addRecordingToShow);
    dom.uploadBtn.addEventListener("click", () => dom.uploadInput.click());
    dom.uploadInput.addEventListener("change", handleUpload);
    dom.playShowBtn.addEventListener("click", () => playShow());
    dom.stopShowBtn.addEventListener("click", stopShow);
    dom.saveShowBtn.addEventListener("click", () => exportShow({ tracksOnly: false }));
    dom.publishShowBtn && dom.publishShowBtn.addEventListener("click", publishToSupabase);
    dom.saveTracksBtn.addEventListener("click", () => exportShow({ tracksOnly: true }));
    dom.loadShowBtn.addEventListener("click", () => dom.loadInput.click());
    dom.loadInput.addEventListener("change", handleImport);
    dom.listenLoad.addEventListener("click", () => dom.listenFile.click());
    dom.listenFile.addEventListener("change", handleInlineImport);
    dom.listenPlay.addEventListener("click", () => {
      state.currentIndex = 0;
      playShow();
    });
    dom.listenStop.addEventListener("click", stopShow);
    dom.sessionDate.valueAsDate = new Date();
    if (!dom.sessionDate.value) {
      dom.sessionDate.value = new Date().toISOString().slice(0, 10);
    }
    [dom.sessionTitle, dom.sessionHost, dom.sessionGenre, dom.sessionDate].forEach((el) => {
      el.addEventListener("input", persistLocal);
    });
    dom.masterVolume.addEventListener("input", (e) => {
      state.masterVolume = Number(e.target.value) / 100;
      if (state.player) {
        state.player.setVolume(state.masterVolume).catch(() => {});
      }
    });
    dom.fadeDuration.addEventListener("input", (e) => {
      state.fadeMs = Number(e.target.value);
    });
    if (dom.supabaseUrlInput) {
      dom.supabaseUrlInput.addEventListener("change", initSupabaseClient);
    }
    if (dom.supabaseKeyInput) {
      dom.supabaseKeyInput.addEventListener("change", initSupabaseClient);
    }
    document.addEventListener("keydown", handleHotkeys);
    dom.status &&
      (dom.status.title =
        "Uses scopes: streaming, user-modify-playback-state, user-read-playback-state, user-library-read, playlist-read-private, playlist-read-collaborative, user-read-private, user-read-email");
  }

  function showError(msg) {
    if (!dom.error) {
      dom.error = document.createElement("div");
      dom.error.className = "error-banner";
      document.body.appendChild(dom.error);
    }
    dom.error.textContent = msg;
    dom.error.style.display = "block";
  }

  function hideError() {
    if (dom.error) dom.error.style.display = "none";
  }

  function setStatus(text, connected) {
    dom.status.textContent = text;
    dom.status.style.color = connected ? "#4cf1c5" : "#f75c87";
    if (connected) hideError();
  }

  function setTicker(segment) {
    const info = segment
      ? [segment.title || "", segment.subtitle || "", segment.album?.name || ""].filter(Boolean)
      : ["now playing: —"];
    if (info.length > 1) {
      const frames = info.map((t) => `<span>${t}</span>`).join("");
      dom.ticker.innerHTML = frames;
    } else {
      dom.ticker.innerHTML = `<span>${info[0]}</span>`;
    }
  }

  function toggleConnectPanel() {
    const collapsed = dom.connectPanel.classList.toggle("collapsed");
    dom.connectToggle.textContent = collapsed ? "Auth Panel" : "Hide Auth";
  }

  function handleThemeSwitch(e) {
    const btn = e.target.closest(".theme-dot");
    if (!btn) return;
    const theme = btn.dataset.theme;
    applyTheme(theme);
    sessionStorage.setItem("rs_theme", theme);
  }

  function applySavedTheme() {
    const theme = sessionStorage.getItem("rs_theme") || "default";
    applyTheme(theme);
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
      default: { accent: "#4cf1c5", accent2: "#f75c87", panel: "#141a27", panelStrong: "#1b2233", bg: "#0e1119" },
      ember: { accent: "#ff6b3d", accent2: "#fbb13c", panel: "#1c1410", panelStrong: "#281a14", bg: "#0d0907" },
      sunset: { accent: "#ff8fb1", accent2: "#ff6b6b", panel: "#1d1520", panelStrong: "#251a29", bg: "#100a11" },
      violet: { accent: "#b388ff", accent2: "#6c63ff", panel: "#141328", panelStrong: "#1c1b35", bg: "#0b0a18" },
    };
    const t = themes[theme] || themes.default;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-2", t.accent2);
    root.style.setProperty("--panel", t.panel);
    root.style.setProperty("--panel-strong", t.panelStrong);
    root.style.setProperty("--bg", t.bg);
  }

  function hydrateSupabaseConfig() {
    const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
    const storedKey = localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON;
    if (dom.supabaseUrlInput && !dom.supabaseUrlInput.value && storedUrl) {
      dom.supabaseUrlInput.value = storedUrl;
    }
    if (dom.supabaseKeyInput && !dom.supabaseKeyInput.value && storedKey) {
      dom.supabaseKeyInput.value = storedKey;
    }
    if (!localStorage.getItem(SUPABASE_URL_KEY) && storedUrl) {
      localStorage.setItem(SUPABASE_URL_KEY, storedUrl);
    }
    if (!localStorage.getItem(SUPABASE_ANON_KEY) && storedKey) {
      localStorage.setItem(SUPABASE_ANON_KEY, storedKey);
    }
    initSupabaseClient();
  }

  function initSupabaseClient() {
    if (typeof window === "undefined" || !window.supabase) {
      state.supabase = null;
      return null;
    }
    const url =
      (dom.supabaseUrlInput?.value || "").trim() || localStorage.getItem(SUPABASE_URL_KEY) || "";
    const anon =
      (dom.supabaseKeyInput?.value || "").trim() || localStorage.getItem(SUPABASE_ANON_KEY) || "";
    if (!url || !anon) {
      state.supabase = null;
      state.supabaseUrl = "";
      state.supabaseKey = "";
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_ANON_KEY);
      return null;
    }
    if (state.supabase && state.supabaseUrl === url && state.supabaseKey === anon) {
      return state.supabase;
    }
    try {
      state.supabase = window.supabase.createClient(url, anon);
      state.supabaseUrl = url;
      state.supabaseKey = anon;
      localStorage.setItem(SUPABASE_URL_KEY, url);
      localStorage.setItem(SUPABASE_ANON_KEY, anon);
      return state.supabase;
    } catch (err) {
      console.warn("Supabase init failed", err);
      state.supabase = null;
      return null;
    }
  }

  // Initialize defaults and parse callback params
  document.addEventListener("DOMContentLoaded", () => {
    assignDom();
    bindEvents();
    renderProfileChip(null);
    setStatus("spotify: disconnected", false);
    // Always use the GitHub Pages redirect for PKCE.
    state.redirectUri = DEFAULT_REDIRECT;
    dom.redirectInput.value = state.redirectUri;
    const storedClientId = sessionStorage.getItem("rs_client_id");
    dom.clientIdInput.value = storedClientId || DEFAULT_CLIENT_ID;
    state.clientId = dom.clientIdInput.value;
    hydrateSupabaseConfig();
    applySavedTheme();
    handlePkceCallback();
    restoreLocal();
    hydrateSessionFields();
    const storedToken = sessionStorage.getItem("rs_token");
    if (storedToken) {
      dom.tokenInput.value = storedToken;
      state.token = storedToken;
      fetchSpotifyProfile().catch(() => {});
    }
    updateListenMeta();
  }, { once: true });

  async function connectSpotify() {
    state.token = (dom.tokenInput.value || "").trim();
    if (!state.token) {
      alert("Paste a Spotify OAuth token first.");
      return;
    }
    sessionStorage.setItem("rs_token", state.token);
    fetchSpotifyProfile().catch(() => {});
    await sdkReady;
    if (state.player) {
      state.player.disconnect();
    }
    const player = new Spotify.Player({
      name: "Radio Show Deck",
      getOAuthToken: (cb) => cb(state.token),
      volume: state.masterVolume,
    });

    player.addListener("ready", ({ device_id }) => {
      state.deviceId = device_id;
      state.connected = true;
      setStatus(`spotify: connected (${device_id.slice(0, 6)}…)`, true);
      transferPlaybackToDevice();
    });

    player.addListener("not_ready", ({ device_id }) => {
      setStatus(`spotify: device ${device_id} went offline`, false);
    });

    player.addListener("initialization_error", ({ message }) => {
      console.error(message);
      alert("Spotify SDK init error: " + message);
      setStatus("spotify: disconnected", false);
    });

    player.addListener("authentication_error", ({ message }) => {
      console.error(message);
      alert("Token invalid or expired: " + message);
      setStatus("spotify: auth error", false);
    });

    player.addListener("player_state_changed", (s) => {
      if (!s) return;
      if (s.paused && state.isPlaying && s.position === 0) {
        // Let the queue advance; nothing else to do.
      }
    });

    const ok = await player.connect();
    if (!ok) {
      alert("Unable to connect Spotify player.");
      return;
    }
    if (player.activateElement) {
      player.activateElement().catch(() => {});
    }
    state.player = player;
  }

  function disconnectSpotify() {
    if (state.player) {
      state.player.disconnect();
    }
    state.connected = false;
    state.deviceId = null;
    setStatus("spotify: disconnected", false);
  }

  async function transferPlaybackToDevice() {
    if (!state.token || !state.deviceId) return;
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_ids: [state.deviceId], play: false }),
      });
    } catch (err) {
      console.warn("Could not transfer playback", err);
    }
  }

  function forgetToken() {
    dom.tokenInput.value = "";
    sessionStorage.removeItem("rs_token");
    state.token = "";
    setStatus("spotify: token cleared", false);
    state.spotifyProfile = null;
    renderProfileChip(null);
  }

  function renderProfileChip(profile) {
    if (!dom.profileAvatar || !dom.profileName) return;
    const name = profile?.display_name || profile?.id || "Not linked";
    dom.profileName.textContent = name;
    const img = profile?.images?.[0]?.url;
    dom.profileAvatar.style.backgroundImage = img
      ? `url(${img})`
      : "linear-gradient(120deg, var(--accent), var(--accent-2))";
  }

  async function fetchSpotifyProfile() {
    if (!state.token) return null;
    try {
      const res = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const profile = await res.json();
      state.spotifyProfile = profile;
      renderProfileChip(profile);
      if (dom.sessionHost && !dom.sessionHost.value) {
        dom.sessionHost.value = profile.display_name || profile.id || "";
      }
      syncProfileToSupabase(profile).catch(() => {});
      return profile;
    } catch (err) {
      console.warn("spotify profile fetch failed", err);
      return null;
    }
  }

  async function syncProfileToSupabase(profile) {
    if (!profile) return;
    const client = initSupabaseClient();
    if (!client) return;
    try {
      await client.functions.invoke("sync_spotify_profile", {
        body: {
          spotify_id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          avatar_url: profile.images?.[0]?.url,
          country: profile.country,
          product: profile.product,
        },
      });
    } catch (err) {
      console.warn("supabase profile sync failed", err);
    }
  }

  async function startPkceAuth() {
    state.clientId = (dom.clientIdInput.value || "").trim() || DEFAULT_CLIENT_ID;
    state.redirectUri = DEFAULT_REDIRECT;
    dom.redirectInput.value = state.redirectUri;
    if (!state.clientId || !state.redirectUri) {
      alert("Client ID and Redirect URI are required for PKCE.");
      return;
    }
    sessionStorage.setItem("rs_client_id", state.clientId);
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const authState = uid();
    sessionStorage.setItem("rs_pkce_verifier", verifier);
    sessionStorage.setItem("rs_pkce_state", authState);
    sessionStorage.setItem("rs_pkce_redirect", state.redirectUri);
    sessionStorage.setItem("rs_pkce_client", state.clientId);
    const scopes = encodeURIComponent(SCOPES);
    const redirect = encodeURIComponent(state.redirectUri);
    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${state.clientId}&scope=${scopes}&redirect_uri=${redirect}&code_challenge_method=S256&code_challenge=${challenge}&state=${authState}&show_dialog=true`;
    window.location.href = url;
  }

  async function handlePkceCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    if (!code) return;
    const storedState = sessionStorage.getItem("rs_pkce_state");
    const verifier = sessionStorage.getItem("rs_pkce_verifier");
    const redirectUri = sessionStorage.getItem("rs_pkce_redirect") || state.redirectUri;
    const clientId = sessionStorage.getItem("rs_pkce_client") || state.clientId;
    if (!verifier || !storedState || storedState !== returnedState) {
      alert("State check failed; please try signing in again.");
      return;
    }
    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
      });
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Token exchange failed");
      }
      const data = await res.json();
      const scopeStr = data.scope || "";
      const granted = scopeStr.split(/\s+/).filter(Boolean);
      const missing = REQUIRED_SCOPES.filter((s) => !granted.includes(s));
      if (missing.length) {
        showError(`Missing scopes: ${missing.join(", ")}. Click Forget Token and re-auth.`);
        return;
      }
      state.token = data.access_token;
      dom.tokenInput.value = state.token;
      sessionStorage.setItem("rs_token", state.token);
      setStatus("spotify: token acquired", false);
      fetchSpotifyProfile().catch(() => {});
      // Clean up URL for nicer UX
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-connect the player after PKCE succeeds.
      connectSpotify().catch(() => {});
    } catch (err) {
      console.error(err);
      alert("Could not finish PKCE auth. Check console for details.");
    } finally {
      sessionStorage.removeItem("rs_pkce_verifier");
      sessionStorage.removeItem("rs_pkce_state");
    }
  }

  function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    let str = "";
    bytes.forEach((b) => (str += String.fromCharCode(b)));
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function runSearch() {
    const q = (dom.searchInput.value || "").trim();
    if (!q) return;
    if (!state.token) {
      alert("Connect with a token first.");
      return;
    }
    renderStatusResult("Searching…");
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8`,
        {
          headers: { Authorization: `Bearer ${state.token}` },
        }
      );
      if (!res.ok) {
        throw new Error(`Search failed (${res.status})`);
      }
      const data = await res.json();
      state.searchResults = data?.tracks?.items || [];
      renderResults({ label: `Results for “${q}”` });
    } catch (err) {
      console.error(err);
      renderStatusResult(`Error: ${err.message}`);
    }
  }

  function renderResults(options = {}) {
    const label = options.label || "";
    dom.results.innerHTML = "";
    if (label) {
      const badge = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = label;
      meta.appendChild(title);
      badge.appendChild(meta);
      dom.results.appendChild(badge);
    }
    if (!state.searchResults.length) {
      renderStatusResult("No results yet. Search for a song.");
      return;
    }
    state.searchResults.forEach((track) => {
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = track.name;
      const subtitle = document.createElement("div");
      subtitle.className = "subtitle";
      subtitle.textContent = track.playlist
        ? "Playlist"
        : track.artists.map((a) => a.name).join(", ");
      meta.appendChild(title);
      meta.appendChild(subtitle);
      const actions = document.createElement("div");
      actions.className = "actions";
      const addBtn = document.createElement("button");
      addBtn.textContent = track.playlist ? "Playlist" : "Add";
      addBtn.className = "primary";
      if (!track.playlist) {
        addBtn.addEventListener("click", () => addTrackToShow(track));
      } else {
        addBtn.disabled = true;
      }
      const similarBtn = document.createElement("button");
      similarBtn.textContent = "Similar";
      similarBtn.addEventListener("click", () => {
        if (track.playlist) {
          fetchPlaylistRecommendations(track);
        } else {
          fetchRecommendations(track);
        }
      });
      actions.appendChild(addBtn);
      actions.appendChild(similarBtn);
      li.appendChild(meta);
      li.appendChild(actions);
      dom.results.appendChild(li);
    });
  }

  function renderStatusResult(text) {
    dom.results.innerHTML = "";
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = text;
    meta.appendChild(title);
    li.appendChild(meta);
    dom.results.appendChild(li);
  }

  function addTrackToShow(track) {
    const segment = {
      id: uid(),
      type: "spotify",
      title: track.name,
      subtitle: track.artists.map((a) => a.name).join(", "),
      duration: track.duration_ms,
      startMs: 0,
      endMs: track.duration_ms,
      bpm: null,
      key: null,
      energy: null,
      album: track.album,
      note: "",
      uri: track.uri,
      fadeIn: false,
      fadeOut: false,
      volume: state.masterVolume,
      cueMs: 0,
      overlays: [],
    };
    state.segments.push(segment);
    fetchAudioFeatures(segment);
    renderSegments();
  }

  async function fetchAudioFeatures(segment) {
    if (!state.token || segment.type !== "spotify") return;
    const trackId = getTrackIdFromUri(segment.uri);
    if (!trackId) return;
    try {
      const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackId}`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const feat = data?.audio_features?.[0];
      if (!feat) return;
      segment.bpm = feat.tempo;
      segment.key = formatKey(feat.key, feat.mode);
      segment.energy = feat.energy ? feat.energy.toFixed(2) : null;
      renderSegments();
    } catch (err) {
      console.warn("audio features fetch failed", err);
    }
  }

  async function fetchRecommendations(track) {
    if (!state.token) {
      alert("Connect with a token first.");
      return;
    }
    const seeds = [];
    if (dom.multiSeed?.checked) {
      // use up to 5 seeds from current segments (spotify tracks only)
      state.segments
        .filter((s) => s.type === "spotify")
        .slice(0, 5)
        .forEach((s) => {
          const id = s.id || getTrackIdFromUri(s.uri);
          if (id && seeds.length < 5) seeds.push(id);
        });
    }
    const trackId = track.id || getTrackIdFromUri(track.uri);
    if (trackId && seeds.length < 5) seeds.push(trackId);
    if (!seeds.length) return;
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=${seeds.join(",")}`,
        {
          headers: { Authorization: `Bearer ${state.token}` },
        }
      );
      if (!res.ok) throw new Error("Recommendations failed");
      const data = await res.json();
      const recs = data.tracks || [];
      if (!recs.length) return;
      showInlineRecommendations(track, recs);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPlaylistRecommendations(playlist) {
    if (!state.token) {
      alert("Connect with a token first.");
      return;
    }
    if (!playlist.id) {
      renderStatusResult("Playlist is missing an ID.");
      return;
    }
    renderStatusResult("Pulling seeds from playlist…");
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=5`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) throw new Error(`Playlist fetch failed (${res.status})`);
      const data = await res.json();
      const seeds = (data.items || [])
        .map((i) => i.track)
        .filter(Boolean)
        .slice(0, 3)
        .map((t) => t.id)
        .filter(Boolean);
      if (!seeds.length) {
        renderStatusResult("Playlist has no playable tracks.");
        return;
      }
      const recRes = await fetch(
        `https://api.spotify.com/v1/recommendations?limit=8&seed_tracks=${seeds.join(",")}`,
        { headers: { Authorization: `Bearer ${state.token}` } }
      );
      if (!recRes.ok) throw new Error("Recommendations failed");
      const recData = await recRes.json();
      state.searchResults = recData.tracks || [];
      renderResults({ label: `Similar to ${playlist.name}` });
    } catch (err) {
      console.error(err);
      renderStatusResult(`Could not fetch playlist recommendations: ${err.message}`);
    }
  }

  async function loadLibraryTracks() {
    if (!state.token) {
      alert("Connect with a token first.");
      return;
    }
    renderStatusResult("Loading saved tracks…");
    try {
      const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=20", {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) throw new Error(`Saved tracks failed (${res.status})`);
      const data = await res.json();
      state.searchResults = (data.items || []).map((i) => i.track).filter(Boolean);
      renderResults({ label: "Saved tracks" });
    } catch (err) {
      console.error(err);
      renderStatusResult(`Could not load saved tracks: ${err.message}`);
    }
  }

  async function loadPlaylists() {
    if (!state.token) {
      alert("Connect with a token first.");
      return;
    }
    renderStatusResult("Loading your playlists…");
    try {
      const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=12", {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) throw new Error(`Playlists failed (${res.status})`);
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) {
        renderStatusResult("No playlists found.");
        return;
      }
      state.searchResults = items.map((pl) => ({
        id: pl.id,
        name: pl.name,
        uri: pl.uri,
        artists: [{ name: `${pl.tracks.total} tracks` }],
        album: { images: pl.images || [] },
        playlist: true,
      }));
      renderResults({ label: "Playlists (click Similar to get recs)" });
    } catch (err) {
      console.error(err);
      renderStatusResult(`Could not load playlists: ${err.message}`);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      if (!mimeType) {
        alert("MediaRecorder not supported with a known audio mimeType in this browser.");
        return;
      }
      state.mediaRecorder = new MediaRecorder(stream, { mimeType });
      state.recordingChunks = [];
      state.recordingStart = Date.now();
      dom.recordBtn.disabled = true;
      dom.stopRecordBtn.disabled = false;
      dom.addRecordingBtn.disabled = true;
      dom.recordPreview.innerHTML = "<p>Recording…</p>";
      state.recordTimerId = setInterval(updateTimer, 300);
      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.recordingChunks.push(e.data);
      };
      state.mediaRecorder.onstop = handleRecordingStop;
      state.mediaRecorder.start();
    } catch (err) {
      alert("Mic permission needed for recording.");
      console.error(err);
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
      state.mediaRecorder.stop();
    }
  }

  function handleRecordingStop() {
    clearInterval(state.recordTimerId);
    dom.recordTimer.textContent = "00:00";
    dom.recordBtn.disabled = false;
    dom.stopRecordBtn.disabled = true;
    const tracks = (state.mediaRecorder && state.mediaRecorder.stream && state.mediaRecorder.stream.getTracks()) || [];
    tracks.forEach((t) => t.stop());
    if (!state.recordingChunks.length) {
      dom.recordPreview.innerHTML = "<p>No audio captured. Try again.</p>";
      dom.addRecordingBtn.disabled = true;
      state.currentRecording = null;
      return;
    }
    const blob = new Blob(state.recordingChunks, { type: state.mediaRecorder?.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const finalize = async () => {
      let duration = Math.round((audio.duration || 0) * 1000);
      if (!duration) {
        // Fallback: decode the blob to get duration for browsers that delay metadata.
        try {
          const arrayBuf = await blob.arrayBuffer();
          const audioCtx = getAudioContext();
          const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
          duration = Math.round(decoded.duration * 1000);
        } catch (err) {
          console.warn("Could not decode recording duration", err);
        }
      }
      if (!duration) {
        duration = 1000; // minimum so it can be added to the show
      }
      state.currentRecording = { blob, url, duration };
      dom.recordPreview.innerHTML = "";
      const label = dom.recordLabel.value.trim() || "Voice bumper";
      const title = document.createElement("div");
      title.textContent = `${label} — ${formatMs(duration)}`;
      title.className = "title";
      dom.recordPreview.appendChild(title);
      audio.controls = true;
      audio.style.width = "100%";
      dom.recordPreview.appendChild(audio);
      dom.addRecordingBtn.disabled = false;
    };
    audio.addEventListener("error", () => {
      dom.recordPreview.innerHTML = "<p>Could not load recording. Try again.</p>";
      dom.addRecordingBtn.disabled = true;
    });
    audio.load();
    audio.addEventListener("loadedmetadata", finalize);
    if (audio.readyState >= 1) {
      finalize();
    }
    // reset buffer
    state.recordingChunks = [];
  }

  function updateTimer() {
    const elapsed = Date.now() - (state.recordingStart || Date.now());
    dom.recordTimer.textContent = formatMs(elapsed);
  }

  function addRecordingToShow() {
    if (!state.currentRecording) return;
    const label = dom.recordLabel.value.trim() || "Voice bumper";
    const segment = {
      id: uid(),
      type: "voice",
      title: label,
      subtitle: "microphone take",
      duration: state.currentRecording.duration || 1000,
      startMs: 0,
      endMs: state.currentRecording.duration || 1000,
      bpm: null,
      key: null,
      energy: null,
      note: "",
      blob: state.currentRecording.blob,
      url: state.currentRecording.url,
      fadeIn: false,
      fadeOut: false,
      volume: state.masterVolume,
      cueMs: 0,
    };
    state.segments.push(segment);
    state.currentRecording = null;
    dom.recordPreview.innerHTML = "<p>No recording yet.</p>";
    dom.addRecordingBtn.disabled = true;
    renderSegments();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const duration = await measureAudioDuration(url, file);
      const segment = {
        id: uid(),
        type: "upload",
        title: file.name,
      subtitle: "uploaded audio",
      duration,
      startMs: 0,
      endMs: duration,
      bpm: null,
        key: null,
        energy: null,
        note: "",
        blob: file,
        url,
      fadeIn: false,
      fadeOut: false,
      volume: state.masterVolume,
      cueMs: 0,
    };
      state.segments.push(segment);
      renderSegments();
    } catch (err) {
      console.error(err);
      alert("Could not read audio file.");
    } finally {
      dom.uploadInput.value = "";
    }
  }

  function renderSegments() {
    dom.segments.innerHTML = "";
    if (!state.segments.length) {
      dom.segments.innerHTML = `<li><div class="meta"><div class="title">Empty show</div><div class="subtitle">Add tracks and voice bites to start.</div></div></li>`;
      dom.showLength.textContent = "0:00";
      renderOrderList();
      return;
    }
    state.segments.forEach((segment, index) => {
      if (segment.endMs == null) {
        segment.endMs = segment.duration ?? 1000;
      }
      if (segment.cueMs == null) {
        segment.cueMs = segment.startMs ?? 0;
      }
      const li = document.createElement("li");
      li.dataset.segmentId = segment.id;
      li.addEventListener("click", () => {
        state.focusSegmentId = segment.id;
        document.querySelectorAll(".segments li").forEach((el) => el.classList.remove("focused"));
        li.classList.add("focused");
      });
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = segment.title;
      const subtitle = document.createElement("div");
      subtitle.className = "subtitle";
      const duration = formatMs(getSegmentLength(segment));
      const metaBits = [];
      if (segment.type === "spotify") {
        metaBits.push("Spotify");
        if (segment.bpm) metaBits.push(`${Math.round(segment.bpm)} BPM`);
        if (segment.key) metaBits.push(segment.key);
        if (segment.energy) metaBits.push(`Energy ${segment.energy}`);
      } else if (segment.type === "upload") {
        metaBits.push("Upload");
        metaBits.push(segment.subtitle || "");
      } else {
        metaBits.push("Voice");
        metaBits.push(segment.subtitle || "");
      }
      metaBits.push(duration);
      subtitle.textContent = metaBits.filter(Boolean).join(" · ");
      meta.appendChild(title);
      meta.appendChild(subtitle);

      const controls = document.createElement("div");
      controls.className = "actions";

      const fadeInToggle = checkbox("Fade in", segment.fadeIn, (v) => (segment.fadeIn = v));
      const fadeOutToggle = checkbox("Fade out", segment.fadeOut, (v) => (segment.fadeOut = v));
      const volume = document.createElement("input");
      volume.type = "range";
      volume.min = 0;
      volume.max = 100;
      volume.value = Math.round((segment.volume ?? 0.8) * 100);
      volume.title = "Segment volume";
      volume.addEventListener("input", (e) => {
        segment.volume = Number(e.target.value) / 100;
        renderShowLength();
      });
      const trim = document.createElement("div");
      trim.className = "trim";
      const startLabel = document.createElement("label");
      startLabel.textContent = "Start (s)";
      const startInput = document.createElement("input");
      startInput.type = "number";
      startInput.min = 0;
      startInput.step = 0.5;
      startInput.value = ((segment.startMs ?? 0) / 1000).toString();
      const endLabel = document.createElement("label");
      endLabel.textContent = "End (s)";
      const endInput = document.createElement("input");
      endInput.type = "number";
      endInput.min = 0.5;
      endInput.step = 0.5;
      endInput.value = ((segment.endMs ?? segment.duration) / 1000).toString();

      const startRange = document.createElement("input");
      startRange.type = "range";
      startRange.min = 0;
      startRange.max = segment.duration / 1000;
      startRange.step = 0.5;
      startRange.value = (segment.startMs / 1000).toString();

      const endRange = document.createElement("input");
      endRange.type = "range";
      endRange.min = 0.5;
      endRange.max = segment.duration / 1000;
      endRange.step = 0.5;
      endRange.value = ((segment.endMs ?? segment.duration) / 1000).toString();

      const clampTrim = () => {
        if (segment.endMs <= segment.startMs + 500) {
          segment.endMs = segment.startMs + 500;
        }
        if (segment.endMs > segment.duration) segment.endMs = segment.duration;
        if (segment.startMs < 0) segment.startMs = 0;
      };

      const syncInputs = () => {
        startInput.value = (segment.startMs / 1000).toString();
        endInput.value = ((segment.endMs ?? segment.duration) / 1000).toString();
        startRange.value = (segment.startMs / 1000).toString();
        endRange.value = ((segment.endMs ?? segment.duration) / 1000).toString();
        updateFill();
      };

      startInput.addEventListener("input", (e) => {
        segment.startMs = Math.max(0, Number(e.target.value) * 1000);
        clampTrim();
        syncInputs();
        renderShowLength();
      });

      endInput.addEventListener("input", (e) => {
        segment.endMs = Number(e.target.value) * 1000;
        clampTrim();
        syncInputs();
        renderShowLength();
      });

      startRange.addEventListener("input", (e) => {
        segment.startMs = Number(e.target.value) * 1000;
        clampTrim();
        syncInputs();
        renderShowLength();
      });

      endRange.addEventListener("input", (e) => {
        segment.endMs = Number(e.target.value) * 1000;
        clampTrim();
        syncInputs();
        renderShowLength();
      });

      const nudgeStart = document.createElement("div");
      nudgeStart.className = "nudge-row";
      const startMinus = document.createElement("button");
      startMinus.className = "ghost small";
      startMinus.textContent = "−0.5s";
      startMinus.addEventListener("click", () => {
        segment.startMs = Math.max(0, segment.startMs - 500);
        clampTrim();
        syncInputs();
        renderShowLength();
      });
      const startPlus = document.createElement("button");
      startPlus.className = "ghost small";
      startPlus.textContent = "+0.5s";
      startPlus.addEventListener("click", () => {
        segment.startMs = segment.startMs + 500;
        clampTrim();
        syncInputs();
        renderShowLength();
      });
      nudgeStart.appendChild(startMinus);
      nudgeStart.appendChild(startPlus);

      const nudgeEnd = document.createElement("div");
      nudgeEnd.className = "nudge-row";
      const endMinus = document.createElement("button");
      endMinus.className = "ghost small";
      endMinus.textContent = "−0.5s";
      endMinus.addEventListener("click", () => {
        segment.endMs = Math.max(segment.startMs + 500, segment.endMs - 500);
        clampTrim();
        syncInputs();
        renderShowLength();
      });
      const endPlus = document.createElement("button");
      endPlus.className = "ghost small";
      endPlus.textContent = "+0.5s";
      endPlus.addEventListener("click", () => {
        segment.endMs = segment.endMs + 500;
        clampTrim();
        syncInputs();
        renderShowLength();
      });
      nudgeEnd.appendChild(endMinus);
      nudgeEnd.appendChild(endPlus);

      const trimRange = document.createElement("div");
      trimRange.className = "trim-range";
      trimRange.appendChild(startRange);
      trimRange.appendChild(endRange);

      const selection = document.createElement("div");
      selection.className = "selection-bar";
      const fill = document.createElement("div");
      fill.className = "selection-fill";
      const handleStart = document.createElement("div");
      handleStart.className = "handle start";
      const handleEnd = document.createElement("div");
      handleEnd.className = "handle end";
      const cue = document.createElement("div");
      cue.className = "cue";
      selection.appendChild(fill);
      selection.appendChild(handleStart);
      selection.appendChild(handleEnd);
      selection.appendChild(cue);
      const updateFill = () => {
        const total = segment.duration || 1;
        const startPct = (segment.startMs / total) * 100;
        const endPct = (segment.endMs / total) * 100;
        const cuePct = (segment.cueMs / total) * 100;
        fill.style.left = `${Math.min(100, Math.max(0, startPct))}%`;
        fill.style.width = `${Math.min(100, Math.max(0, endPct - startPct))}%`;
        handleStart.style.left = `${Math.min(100, Math.max(0, startPct))}%`;
        handleEnd.style.left = `${Math.min(100, Math.max(0, endPct))}%`;
        cue.style.left = `${Math.min(100, Math.max(0, cuePct))}%`;
      };
      updateFill();

      let drag = null;
      const onPointerMove = (e) => {
        if (!drag) return;
        const rect = selection.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const ms = pct * (segment.duration || 1);
        if (drag.type === "start") {
          segment.startMs = Math.min(ms, segment.endMs - 500);
        } else if (drag.type === "end") {
          segment.endMs = Math.max(ms, segment.startMs + 500);
        }
        clampTrim();
        syncInputs();
      };
      const onPointerUp = () => {
        drag = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      const beginDrag = (type) => {
        drag = { type };
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      };
      handleStart.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        beginDrag("start");
      });
      handleEnd.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        beginDrag("end");
      });
      selection.addEventListener("click", (e) => {
        const rect = selection.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const ms = pct * (segment.duration || 1);
        if (e.shiftKey) {
          segment.startMs = Math.min(ms, segment.endMs - 500);
        } else if (e.altKey || e.metaKey) {
          segment.endMs = Math.max(ms, segment.startMs + 500);
        } else {
          segment.cueMs = ms;
          previewSegment(segment, ms);
        }
        clampTrim();
        syncInputs();
      });

      startLabel.appendChild(startInput);
      startLabel.appendChild(nudgeStart);
      endLabel.appendChild(endInput);
      endLabel.appendChild(nudgeEnd);
      trim.appendChild(startLabel);
      trim.appendChild(endLabel);
      trim.appendChild(trimRange);
      trim.appendChild(selection);
      const noteField = document.createElement("textarea");
      noteField.placeholder = "Note about this segment";
      noteField.value = segment.note || "";
      noteField.addEventListener("input", (e) => {
        segment.note = e.target.value;
        persistLocal();
      });
      trim.appendChild(noteField);

      if (segment.type === "voice") {
        const wf = document.createElement("canvas");
        wf.className = "waveform";
        trim.appendChild(wf);
        renderVoiceWaveform(segment, wf);
      }

      controls.appendChild(fadeInToggle);
      controls.appendChild(fadeOutToggle);
      controls.appendChild(trim);
      controls.appendChild(volume);

      const moves = document.createElement("div");
      moves.className = "seg-actions";
      const audition = document.createElement("button");
      audition.textContent = "Cue Play";
      audition.title = "Audition from cue";
      audition.addEventListener("click", () => previewSegment(segment, segment.cueMs ?? segment.startMs ?? 0));
      const auditionStop = document.createElement("button");
      auditionStop.textContent = "■";
      auditionStop.title = "Stop audition";
      auditionStop.addEventListener("click", stopPreview);
      const playFrom = document.createElement("button");
      playFrom.textContent = "Play From Here";
      playFrom.title = "Start show from this segment";
      playFrom.addEventListener("click", () => playShowFrom(index));
      const up = document.createElement("button");
      up.textContent = "▲";
      up.title = "Move up";
      up.addEventListener("click", () => moveSegment(index, -1));
      const down = document.createElement("button");
      down.textContent = "▼";
      down.title = "Move down";
      down.addEventListener("click", () => moveSegment(index, 1));
      const talk = document.createElement("button");
      talk.textContent = state.overlaySegment && state.overlaySegment.id === segment.id ? "Stop Talk" : "Talk-over";
      talk.title = "Record voice over this track (Cmd+Space)";
      talk.addEventListener("click", () => toggleTalkOver(segment));
      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.className = "ghost";
      remove.addEventListener("click", () => removeSegment(index));
      moves.appendChild(audition);
      moves.appendChild(auditionStop);
      moves.appendChild(playFrom);
      moves.appendChild(up);
      moves.appendChild(down);
      moves.appendChild(talk);
      moves.appendChild(remove);

      li.appendChild(meta);
      li.appendChild(controls);
      li.appendChild(moves);
      dom.segments.appendChild(li);
    });
    renderShowLength();
    persistLocal();
    renderOrderList();
    updateListenMeta();
  }

  function renderShowLength() {
    const total = state.segments.reduce((sum, s) => sum + getSegmentLength(s), 0);
    dom.showLength.textContent = formatMs(total);
    dom.listenTitle && updateListenMeta();
  }

  function renderOrderList() {
    if (!dom.orderList) return;
    dom.orderList.innerHTML = "";
    if (!state.segments.length) {
      const li = document.createElement("li");
      li.textContent = "No tracks yet.";
      dom.orderList.appendChild(li);
      return;
    }
    state.segments.forEach((s, idx) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.index = String(idx);
      li.textContent = s.title || "Untitled";
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
        li.classList.add("dragging");
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        const to = idx;
        if (Number.isNaN(from) || from === to) return;
        const list = [...state.segments];
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        state.segments = list;
        renderSegments();
      });
      dom.orderList.appendChild(li);
    });
  }

  function checkbox(label, value, onChange) {
    const btn = document.createElement("button");
    btn.className = value ? "primary" : "ghost";
    btn.textContent = value ? `${label} (on)` : `${label} (off)`;
    btn.addEventListener("click", () => {
      const next = !btn.classList.contains("primary");
      btn.className = next ? "primary" : "ghost";
      btn.textContent = next ? `${label} (on)` : `${label} (off)`;
      onChange(next);
    });
    return btn;
  }

  function moveSegment(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= state.segments.length) return;
    const list = [...state.segments];
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);
    state.segments = list;
    renderSegments();
  }

  function removeSegment(index) {
    state.segments.splice(index, 1);
    renderSegments();
  }

  async function playShow(startIndex = 0) {
    if (!state.segments.length) {
      alert("Build a show first.");
      return;
    }
    if (!state.token) {
      showError("No token. Use PKCE auth, then Connect Player.");
      return;
    }
    hideError();
    if (state.isPlaying) {
      return;
    }
    stopPreview();
    stopShow();
    await transferPlaybackToDevice();
    state.isPlaying = true;
    dom.playShowBtn.textContent = "Playing…";
    dom.playShowBtn.disabled = true;
    dom.stopShowBtn.disabled = false;
    const ctx = getAudioContext();
    await ctx.resume();
    const start = Math.max(0, startIndex || 0);
    for (let i = start; i < state.segments.length; i++) {
      const segment = state.segments[i];
      if (!state.isPlaying) break;
      state.playingIndex = i;
      setTicker(segment);
      await playSegment(segment);
    }
    state.isPlaying = false;
    dom.playShowBtn.textContent = "Play Show";
    dom.playShowBtn.disabled = false;
    dom.stopShowBtn.disabled = false;
    setTicker(null);
  }

  function playShowFrom(index) {
    stopShow();
    playShow(index);
  }

  function stopShow() {
    state.isPlaying = false;
    if (state.activeAudio) {
      state.activeAudio.pause();
      state.activeAudio = null;
    }
    if (state.player) {
      state.player.pause().catch(() => {});
    }
    if (state.overlayRecorder) {
      stopTalkOver();
    }
    dom.playShowBtn.textContent = "Play Show";
    dom.playShowBtn.disabled = false;
    dom.stopShowBtn.disabled = false;
    setTicker(null);
    resetListenProgress();
  }

  function updateListenNow(segment) {
    if (!dom.listenTitle) return;
    dom.listenTitle.textContent = segment?.title || "—";
    dom.listenSubtitle.textContent = `${segment?.type === "spotify" ? "Spotify" : "Voice"} · ${segment?.subtitle || ""}`;
    dom.listenNote.textContent = segment?.note || "";
    if (segment?.album?.images?.[0]) {
      dom.listenCover.style.backgroundImage = `url(${segment.album.images[0].url})`;
    } else {
      dom.listenCover.style.backgroundImage = "linear-gradient(120deg, var(--accent), var(--accent-2))";
    }
  }

  function resetListenProgress() {
    if (!dom.listenProgress) return;
    dom.listenProgress.style.width = "0%";
    dom.listenTotal.style.width = "0%";
  }

  function startListenProgress(lengthMs) {
    if (!dom.listenProgress) return;
    const totalShow = state.segments.reduce((sum, s) => sum + getSegmentLength(s), 0) || 1;
    const before = state.segments
      .slice(0, state.playingIndex || 0)
      .reduce((sum, s) => sum + getSegmentLength(s), 0);
    const start = performance.now();
    const step = () => {
      if (!state.isPlaying) return;
      const elapsed = performance.now() - start;
      const segPct = Math.min(100, (elapsed / lengthMs) * 100);
      const totalPct = Math.min(100, ((before + elapsed) / totalShow) * 100);
      dom.listenProgress.style.width = `${segPct}%`;
      dom.listenTotal.style.width = `${totalPct}%`;
      if (elapsed < lengthMs) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function stopPreview() {
    if (state.previewTimer) {
      clearTimeout(state.previewTimer);
      state.previewTimer = null;
    }
    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio = null;
    }
    if (state.player) {
      state.player.pause().catch(() => {});
    }
    state.previewSegmentId = null;
  }

  function getFocusedSegment() {
    if (!state.focusSegmentId) return null;
    const index = state.segments.findIndex((s) => s.id === state.focusSegmentId);
    if (index === -1) return null;
    return { segment: state.segments[index], index };
  }

  async function previewSegment(segment, startOverrideMs) {
    stopShow();
    stopPreview();
    state.previewSegmentId = segment.id;
    const length = getSegmentLength(segment);
    if (segment.type === "voice") {
      const audio = new Audio(segment.url);
      audio.currentTime = (startOverrideMs ?? segment.startMs ?? 0) / 1000;
      audio.volume = segment.volume ?? state.masterVolume;
      state.previewAudio = audio;
      audio.play();
      state.previewTimer = setTimeout(() => {
        audio.pause();
        state.previewAudio = null;
      }, length + 50);
      return;
    }
    if (!state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      return;
    }
    const startMs = startOverrideMs ?? segment.startMs ?? 0;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri], position_ms: Math.max(0, Math.floor(startMs)) }),
      });
      await state.player.setVolume(segment.volume ?? state.masterVolume);
      state.previewTimer = setTimeout(() => {
        state.player.pause().catch(() => {});
      }, length + 50);
    } catch (err) {
      console.error(err);
      alert("Could not audition this segment.");
    }
  }

  async function playSegment(segment, offsetMs = 0) {
    const totalLength = getSegmentLength(segment);
    const playLength = Math.max(0, totalLength - offsetMs);
    startListenProgress(playLength);
    if (segment.type === "voice" || segment.type === "upload") {
      await playVoiceSegment(segment, offsetMs, playLength);
    } else {
      await playSpotifySegment(segment, offsetMs, playLength);
    }
    updateListenNow(segment);
    resetListenProgress();
  }

  async function playVoiceSegment(segment, offsetMs = 0, playMsOverride) {
    const ctx = getAudioContext();
    await ctx.resume();
    const audio = new Audio(segment.url);
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    const vol = segment.volume ?? state.masterVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    source.connect(gain).connect(ctx.destination);
    state.activeAudio = audio;

    const startMs = (segment.startMs ?? 0) + offsetMs;
    const playMs = playMsOverride ?? getSegmentLength(segment) - offsetMs;
    const playSeconds = Math.max(0, playMs) / 1000;

    if (segment.fadeIn) {
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + state.fadeMs / 1000);
    }

    if (segment.fadeOut) {
      audio.addEventListener("play", () => {
        const fadeStart = Math.max(0, playSeconds - state.fadeMs / 1000);
        gain.gain.setValueAtTime(vol, ctx.currentTime + fadeStart);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fadeStart + state.fadeMs / 1000);
      });
    }

    return new Promise((resolve) => {
      let stopTimer;
      const cleanup = () => {
        if (stopTimer) clearTimeout(stopTimer);
        state.activeAudio = null;
        resolve();
      };
      audio.addEventListener(
        "play",
        () => {
          audio.currentTime = Math.min(audio.duration || 0, startMs / 1000);
          stopTimer = setTimeout(() => {
            audio.pause();
            audio.dispatchEvent(new Event("ended"));
          }, Math.max(0, playMs) + 50);
        },
        { once: true }
      );
      audio.addEventListener("ended", cleanup, { once: true });
      audio.play().catch(() => cleanup());
    });
  }

  async function playSpotifySegment(segment, offsetMs = 0, playMsOverride) {
    if (!state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      stopShow();
      return;
    }
    const vol = segment.volume ?? state.masterVolume;
    await state.player.setVolume(segment.fadeIn ? 0.01 : vol);
    const startMs = (segment.startMs ?? 0) + offsetMs;
    const playMs = playMsOverride ?? getSegmentLength(segment) - offsetMs;
    const overlays = Array.isArray(segment.overlays) ? segment.overlays : [];
    const timers = [];
    let duckCount = 0;
    let stopTimer;
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri], position_ms: Math.max(0, Math.floor(startMs)) }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          showError("Playback scopes missing. Click Forget Token and re-auth with PKCE.");
          forgetToken();
          stopShow();
          return;
        }
        throw new Error(`Playback request failed (${res.status})`);
      } else {
        hideError();
      }
    } catch (err) {
      console.error(err);
      showError("Playback request failed. Re-auth and reconnect.");
      stopShow();
    }

    if (segment.fadeIn) {
      rampVolume((v) => state.player.setVolume(v), 0.01, vol, state.fadeMs);
    } else {
      state.player.setVolume(vol);
    }

    if (segment.fadeOut && playMs) {
      setTimeout(() => {
        rampVolume((v) => state.player.setVolume(v), vol, 0.01, state.fadeMs);
      }, Math.max(0, playMs - state.fadeMs));
    }

    const duck = () => {
      duckCount += 1;
      state.player.setVolume(Math.max(0, vol * 0.3)).catch(() => {});
    };
    const unduckLater = (ms) => {
      const t = setTimeout(() => {
        duckCount = Math.max(0, duckCount - 1);
        if (duckCount === 0) state.player.setVolume(vol).catch(() => {});
      }, ms);
      timers.push(t);
    };
    overlays.forEach((ov) => {
      const url = ov.url || (ov.blob ? URL.createObjectURL(ov.blob) : null);
      if (!url) return;
      const audio = new Audio(url);
      audio.volume = ov.volume ?? 1;
      const start = Math.max(0, ov.offsetMs || 0);
      const timer = setTimeout(() => {
        duck();
        audio.play().catch(() => {});
        const ovMs = ov.duration || (audio.duration ? audio.duration * 1000 : 1000);
        unduckLater(Math.max(200, ovMs));
      }, start);
      timers.push(timer);
    });

    return new Promise((resolve) => {
      let settled = false;
      let fallback;
      const handler = (s) => {
        if (!s || !s.track_window || !s.track_window.current_track) return;
        const uri = s.track_window.current_track.uri;
        if (uri === segment.uri && s.paused) {
          cleanup();
        }
      };
      const cleanup = () => {
        if (settled) return;
        settled = true;
        state.player.removeListener("player_state_changed", handler);
        timers.forEach((t) => clearTimeout(t));
        if (stopTimer) clearTimeout(stopTimer);
        if (fallback) clearTimeout(fallback);
        resolve();
      };
      fallback = setTimeout(cleanup, Math.max(0, playMs + 1500));
      stopTimer = setTimeout(() => {
        state.player.pause().catch(() => {});
        cleanup();
      }, Math.max(0, playMs));
      state.player.addListener("player_state_changed", handler);
    });
  }

  function rampVolume(apply, start, end, duration) {
    const steps = 14;
    const delta = (end - start) / steps;
    let i = 0;
    apply(start);
    const id = setInterval(() => {
      i += 1;
      const next = start + delta * i;
      apply(Math.max(0, Math.min(1, next)));
      if (i >= steps) {
        clearInterval(id);
      }
    }, Math.max(20, duration / steps));
  }

  function getAudioContext() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return state.audioContext;
  }

  async function toggleTalkOver(segment) {
    if (state.overlayRecorder && state.overlaySegment && state.overlaySegment.id === segment.id) {
      await stopTalkOver();
      return;
    }
    if (state.overlayRecorder) {
      await stopTalkOver();
    }
    await startTalkOver(segment);
  }

  async function startTalkOver(segment) {
    if (segment.type !== "spotify") {
      alert("Talk-over works on Spotify tracks.");
      return;
    }
    if (!state.token || !state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      return;
    }
    const mimeType = pickMimeType();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      alert("Mic recording not supported.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      state.overlayRecorder = recorder;
      state.overlayChunks = [];
      state.overlaySegment = segment;
      state.overlayRecording = true;
      const targetVol = (segment.volume ?? state.masterVolume) * 0.3;
      state.overlayOriginalVolume = segment.volume ?? state.masterVolume;
      // live monitoring
      const monitorGain = getAudioContext().createGain();
      monitorGain.gain.value = 0; // prevent echo; set >0 for monitoring if desired
      const monitorSource = getAudioContext().createMediaStreamSource(stream);
      monitorSource.connect(monitorGain).connect(getAudioContext().destination);
      state.overlayMonitor = { monitorGain, monitorSource };
      await state.player.setVolume(targetVol).catch(() => {});
      const playerState = await state.player.getCurrentState().catch(() => null);
      const currentPos = playerState && playerState.position != null ? playerState.position : segment.startMs ?? 0;
      const segmentStart = segment.startMs ?? 0;
      const overlayOffset = Math.max(0, currentPos - segmentStart);
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri], position_ms: Math.max(0, Math.floor(currentPos)) }),
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.overlayChunks.push(e.data);
      };
      recorder.onstop = async () => {
        const tracks = (recorder.stream && recorder.stream.getTracks()) || [];
        tracks.forEach((t) => t.stop());
        if (!state.overlayChunks.length) {
          await restoreOverlayVolume();
          state.overlayRecorder = null;
          state.overlaySegment = null;
          state.overlayMonitor = null;
          state.overlayRecording = false;
          showError("No mic audio captured—check permission/input.");
          return;
        }
        const blob = new Blob(state.overlayChunks, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        const duration = await measureAudioDuration(url, blob);
          const overlay = {
            id: uid(),
            title: `Host over ${segment.title || "track"}`,
            url,
            blob,
            duration,
          offsetMs: overlayOffset,
            volume: 1,
            duck: 0.3,
          };
        segment.overlays = segment.overlays || [];
        segment.overlays.push(overlay);
        await restoreOverlayVolume();
        state.overlayRecorder = null;
        state.overlaySegment = null;
        state.overlayMonitor = null;
        state.overlayRecording = false;
        renderSegments();
      };
      recorder.start(250);
    } catch (err) {
      console.error(err);
      alert("Could not start talk-over.");
    }
  }

  async function stopTalkOver() {
    if (!state.overlayRecorder) return;
    try {
      state.overlayRecorder.stop();
    } catch {
      // ignore
    }
    state.overlayRecording = false;
  }

  async function restoreOverlayVolume() {
    if (state.player && state.overlayOriginalVolume != null) {
      await state.player.setVolume(state.overlayOriginalVolume).catch(() => {});
    }
    state.overlayOriginalVolume = null;
    if (state.overlayMonitor) {
      try {
        state.overlayMonitor.monitorSource.disconnect();
        state.overlayMonitor.monitorGain.disconnect();
      } catch {
        // ignore
      }
      state.overlayMonitor = null;
    }
  }

  function pickMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    return candidates.find((c) => window.MediaRecorder && MediaRecorder.isTypeSupported(c));
  }

  async function renderVoiceWaveform(segment, canvas) {
    try {
      if (segment.waveformPoints) {
        drawWaveform(canvas, segment.waveformPoints);
        return;
      }
      const arrayBuf = await segment.blob.arrayBuffer();
      const audioCtx = getAudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
      const channel = decoded.getChannelData(0);
      const sampleCount = Math.min(400, Math.floor(channel.length / 50));
      const points = new Array(sampleCount).fill(0).map((_, i) => {
        const start = Math.floor((i / sampleCount) * channel.length);
        const end = Math.floor(((i + 1) / sampleCount) * channel.length);
        let min = 1;
        let max = -1;
        for (let j = start; j < end; j++) {
          const v = channel[j];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        return { min, max };
      });
      segment.waveformPoints = points;
      drawWaveform(canvas, points);
    } catch (err) {
      console.warn("waveform render failed", err);
    }
  }

  function drawWaveform(canvas, points) {
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = canvas.clientWidth || 300);
    const height = (canvas.height = canvas.clientHeight || 60);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    const mid = height / 2;
    ctx.beginPath();
    const step = width / points.length;
    points.forEach((p, i) => {
      const x = i * step;
      const y1 = mid + p.min * mid;
      const y2 = mid + p.max * mid;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    });
    ctx.stroke();
  }

  async function measureAudioDuration(url, file) {
    const audio = new Audio(url);
    const mimeType = file?.type;
    return new Promise((resolve, reject) => {
      const finalize = (duration) => resolve(Math.round((duration || 1) * 1000));
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration) {
          finalize(audio.duration);
        }
      });
      audio.addEventListener("error", async () => {
        try {
          const arrayBuf = await file.arrayBuffer();
          const decoded = await getAudioContext().decodeAudioData(arrayBuf.slice(0));
          finalize(decoded.duration);
        } catch (err) {
          reject(err);
        }
      });
      audio.load();
      // Safari sometimes never fires error; fallback decode
      setTimeout(async () => {
        if (!audio.duration && file) {
          try {
            const arrayBuf = await file.arrayBuffer();
            const decoded = await getAudioContext().decodeAudioData(arrayBuf.slice(0));
            finalize(decoded.duration);
          } catch (err) {
            reject(err);
          }
        }
      }, 500);
    });
  }

  function getSegmentLength(segment) {
    const start = segment.startMs ?? 0;
    const end = segment.endMs ?? segment.duration ?? 0;
    const chosen = Math.max(0, end - start);
    return Math.max(500, chosen); // ensure a minimum length for scheduling
  }

  function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function getTrackIdFromUri(uri) {
    if (!uri) return null;
    const parts = uri.split(":");
    return parts[2] || null;
  }

  function formatKey(key, mode) {
    if (typeof key !== "number" || key < 0) return null;
    const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const base = keys[key % 12];
    return mode === 1 ? `${base} major` : `${base} minor`;
  }

  function handleHotkeys(e) {
    const tag = (e.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.altKey && e.code === "Space") {
      const focus = getFocusedSegment();
      if (focus) {
        e.preventDefault();
        toggleTalkOver(focus.segment);
      }
    }
  }

  async function exportShow({ tracksOnly }) {
    try {
      const payload = await buildSessionPayload({ tracksOnly });
      downloadPayload(payload, tracksOnly);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed; see console for details.");
    }
  }

  async function buildSessionPayload({ tracksOnly }) {
    const payload = {
      version: 2,
      tracksOnly,
      meta: {
        title: dom.sessionTitle.value,
        host: dom.sessionHost.value,
        genre: dom.sessionGenre.value,
        date: dom.sessionDate.value,
      },
      segments: state.segments
        .map((s) => {
          if (tracksOnly && s.type !== "spotify") return null;
          const overlays = Array.isArray(s.overlays)
            ? Promise.all(
                s.overlays.map(async (ov) => {
                  const url = await inlineAudioUrl(ov);
                  return { ...ov, blob: undefined, url };
                })
              )
            : Promise.resolve([]);
          if (s.type === "voice" || s.type === "upload") {
            const base64Url = inlineAudioUrl(s);
            return Promise.all([base64Url, overlays]).then(([url, ovs]) => ({
              ...s,
              blob: undefined,
              url,
              overlays: ovs,
            }));
          }
          return overlays.then((ovs) => ({ ...s, overlays: ovs }));
        })
        .filter(Boolean),
    };
    payload.segments = await Promise.all(payload.segments);
    return payload;
  }

  function downloadPayload(payload, tracksOnly) {
    const dataStr = JSON.stringify(payload);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tracksOnly ? "radio-show-tracks.json" : "radio-show-full.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function publishToSupabase() {
    const client = initSupabaseClient();
    if (!client) {
      alert("Set Supabase URL + anon key first.");
      return;
    }
    try {
      const payload = await buildSessionPayload({ tracksOnly: false });
      const { data, error } = await client.functions.invoke("create_session", { body: { payload } });
      if (error) throw error;
      const slug = data?.slug || data?.id || "";
      alert(slug ? `Published to Supabase (${slug}).` : "Published to Supabase.");
    } catch (err) {
      console.error("Supabase publish failed", err);
      alert("Supabase publish failed; check console for details.");
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.segments)) {
        alert("Invalid show file.");
        return;
      }
      state.segments = (await hydrateSegments(payload.segments)).filter(Boolean);
      if (payload.meta) {
        dom.sessionTitle.value = payload.meta.title || "";
        dom.sessionHost.value = payload.meta.host || "";
        dom.sessionGenre.value = payload.meta.genre || "";
        if (payload.meta.date) dom.sessionDate.value = payload.meta.date;
      }
      renderSegments();
      alert("Show loaded.");
    } catch (err) {
      console.error(err);
      alert("Could not load show file.");
    } finally {
      dom.loadInput.value = "";
    }
  }

  async function handleInlineImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImport(e);
    dom.listenFile.value = "";
  }

  async function persistLocal() {
    try {
      localStorage.setItem(
        "rs_session_meta",
        JSON.stringify({
          title: dom.sessionTitle.value,
          host: dom.sessionHost.value,
          genre: dom.sessionGenre.value,
          date: dom.sessionDate.value,
        })
      );
      const data = await Promise.all(
        state.segments.map(async (s) => {
          const overlays = Array.isArray(s.overlays)
            ? await Promise.all(
                s.overlays.map(async (ov) => {
                  const url = await inlineAudioUrl(ov);
                  return { ...ov, url, blob: undefined };
                })
              )
            : [];
          if (s.type === "voice" || s.type === "upload") {
            const url = await inlineAudioUrl(s);
            return { ...s, url, blob: undefined, overlays };
          }
          return { ...s, overlays };
        })
      );
      localStorage.setItem("rs_show_segments", JSON.stringify(data));
    } catch (err) {
      console.warn("persist local failed", err);
    }
  }

  async function restoreLocal() {
    try {
      const raw = localStorage.getItem("rs_show_segments");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      state.segments = await hydrateSegments(data);
      renderSegments();
    } catch (err) {
      console.warn("restore local failed", err);
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function inlineAudioUrl(item) {
    if (!item) return "";
    if (item.blob) {
      try {
        return await blobToDataUrl(item.blob);
      } catch (err) {
        console.warn("inlineAudioUrl: could not read blob", err);
      }
    }
    if (item.url && item.url.startsWith("blob:")) {
      try {
        const res = await fetch(item.url);
        if (res.ok) {
          const blob = await res.blob();
          return await blobToDataUrl(blob);
        }
      } catch (err) {
        console.warn("inlineAudioUrl: blob url not readable", err);
      }
    }
    return item.url || "";
  }

  async function hydrateSegments(rawSegments) {
    return Promise.all(
      rawSegments.map(async (s) => {
        const segment = { ...s };
        if (Array.isArray(segment.overlays)) {
          segment.overlays = await Promise.all(
            segment.overlays.map(async (ov) => {
              const overlay = { ...ov };
              if (!overlay.blob && overlay.url && isSafeLocalUrl(overlay.url)) {
                try {
                  const res = await fetch(overlay.url);
                  if (res.ok) overlay.blob = await res.blob();
                } catch {
                  // ignore fetch errors; leave url
                }
              }
              if (overlay.blob && !overlay.url) {
                overlay.url = URL.createObjectURL(overlay.blob);
              }
              return overlay;
            })
          );
        } else {
          segment.overlays = [];
        }
        if ((segment.type === "voice" || segment.type === "upload") && segment.url && !segment.blob) {
          if (isSafeLocalUrl(segment.url)) {
            try {
              const res = await fetch(segment.url);
              if (res.ok) segment.blob = await res.blob();
            } catch {
              // keep url fallback
            }
          }
        }
        if ((segment.type === "voice" || segment.type === "upload") && segment.blob && !segment.url) {
          segment.url = URL.createObjectURL(segment.blob);
        }
        return segment;
      })
    );
  }

  function isSafeLocalUrl(url) {
    if (!url) return false;
    if (url.startsWith("data:")) return true;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function hydrateSessionFields() {
    try {
      const metaRaw = localStorage.getItem("rs_session_meta");
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        dom.sessionTitle.value = meta.title || "";
        dom.sessionHost.value = meta.host || "";
        dom.sessionGenre.value = meta.genre || "";
        if (meta.date) dom.sessionDate.value = meta.date;
      }
    } catch {
      // ignore
    }
  }

  function updateListenMeta() {
    if (!dom.listenTitle) return;
    if (state.isPlaying) return;
    dom.listenTitle.textContent = dom.sessionTitle.value || "—";
    const bits = [];
    if (dom.sessionHost.value) bits.push(dom.sessionHost.value);
    if (dom.sessionGenre.value) bits.push(dom.sessionGenre.value);
    if (dom.sessionDate.value) bits.push(dom.sessionDate.value);
    dom.listenSubtitle.textContent = bits.join(" · ") || "No session meta";
    dom.listenNote.textContent = "";
  }

  function uid() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
  }
})(); 
