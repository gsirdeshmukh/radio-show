(() => {
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
    dom.status = document.getElementById("spotify-status");
    dom.masterVolume = document.getElementById("master-volume");
    dom.searchForm = document.getElementById("search-form");
    dom.searchInput = document.getElementById("search-input");
    dom.results = document.getElementById("results");
    dom.segments = document.getElementById("segments");
    dom.showLength = document.getElementById("show-length");
    dom.recordBtn = document.getElementById("record-btn");
    dom.stopRecordBtn = document.getElementById("stop-record-btn");
    dom.recordLabel = document.getElementById("record-label");
    dom.recordTimer = document.getElementById("record-timer");
    dom.recordPreview = document.getElementById("record-preview");
    dom.addRecordingBtn = document.getElementById("add-recording-btn");
    dom.playShowBtn = document.getElementById("play-show-btn");
    dom.stopShowBtn = document.getElementById("stop-show-btn");
    dom.fadeDuration = document.getElementById("fade-duration");
  }

  function bindEvents() {
    dom.authBtn.addEventListener("click", startPkceAuth);
    dom.connectBtn.addEventListener("click", connectSpotify);
    dom.disconnectBtn.addEventListener("click", disconnectSpotify);
    dom.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      runSearch();
    });
    dom.recordBtn.addEventListener("click", startRecording);
    dom.stopRecordBtn.addEventListener("click", stopRecording);
    dom.addRecordingBtn.addEventListener("click", addRecordingToShow);
    dom.playShowBtn.addEventListener("click", playShow);
    dom.stopShowBtn.addEventListener("click", stopShow);
    dom.masterVolume.addEventListener("input", (e) => {
      state.masterVolume = Number(e.target.value) / 100;
      if (state.player) {
        state.player.setVolume(state.masterVolume).catch(() => {});
      }
    });
    dom.fadeDuration.addEventListener("input", (e) => {
      state.fadeMs = Number(e.target.value);
    });
  }

  function setStatus(text, connected) {
    dom.status.textContent = text;
    dom.status.style.color = connected ? "#4cf1c5" : "#f75c87";
  }

  // Initialize defaults and parse callback params
  document.addEventListener("DOMContentLoaded", () => {
    assignDom();
    bindEvents();
    setStatus("spotify: disconnected", false);
    // Default redirect to current origin + path; must match Spotify app setting exactly.
    state.redirectUri = window.location.origin + window.location.pathname;
    dom.redirectInput.value = state.redirectUri;
    const storedClientId = sessionStorage.getItem("rs_client_id");
    if (storedClientId) {
      dom.clientIdInput.value = storedClientId;
      state.clientId = storedClientId;
    }
    handlePkceCallback();
  }, { once: true });

  async function connectSpotify() {
    state.token = (dom.tokenInput.value || "").trim();
    if (!state.token) {
      alert("Paste a Spotify OAuth token first.");
      return;
    }
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

  async function startPkceAuth() {
    state.clientId = (dom.clientIdInput.value || "").trim();
    state.redirectUri = (dom.redirectInput.value || "").trim();
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
    const scopes = encodeURIComponent("streaming user-modify-playback-state user-read-playback-state");
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
      state.token = data.access_token;
      dom.tokenInput.value = state.token;
      setStatus("spotify: token acquired", false);
      // Clean up URL for nicer UX
      window.history.replaceState({}, document.title, window.location.pathname);
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
    dom.results.innerHTML = `<li><div class="meta"><div class="title">Searching…</div></div></li>`;
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
      renderResults();
    } catch (err) {
      console.error(err);
      dom.results.innerHTML = `<li><div class="meta"><div class="title">Error</div><div class="subtitle">${err.message}</div></div></li>`;
    }
  }

  function renderResults() {
    dom.results.innerHTML = "";
    if (!state.searchResults.length) {
      dom.results.innerHTML = `<li><div class="meta"><div class="title">No results yet.</div><div class="subtitle">Search for a song.</div></div></li>`;
      return;
    }
    state.searchResults.forEach((track) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="meta">
          <div class="title">${track.name}</div>
          <div class="subtitle">${track.artists.map((a) => a.name).join(", ")}</div>
        </div>
      `;
      const actions = document.createElement("div");
      actions.className = "actions";
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.className = "primary";
      addBtn.addEventListener("click", () => addTrackToShow(track));
      actions.appendChild(addBtn);
      li.appendChild(actions);
      dom.results.appendChild(li);
    });
  }

  function addTrackToShow(track) {
    const segment = {
      id: uid(),
      type: "spotify",
      title: track.name,
      subtitle: track.artists.map((a) => a.name).join(", "),
      duration: track.duration_ms,
      uri: track.uri,
      fadeIn: true,
      fadeOut: true,
      volume: state.masterVolume,
    };
    state.segments.push(segment);
    renderSegments();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
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
      state.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
  }

  function handleRecordingStop() {
    clearInterval(state.recordTimerId);
    dom.recordTimer.textContent = "00:00";
    dom.recordBtn.disabled = false;
    dom.stopRecordBtn.disabled = true;
    const blob = new Blob(state.recordingChunks, { type: "audio/webm" });
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
    audio.addEventListener("loadedmetadata", finalize);
    if (audio.readyState >= 1) {
      finalize();
    }
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
      duration: state.currentRecording.duration,
      blob: state.currentRecording.blob,
      url: state.currentRecording.url,
      fadeIn: true,
      fadeOut: true,
      volume: state.masterVolume,
    };
    state.segments.push(segment);
    state.currentRecording = null;
    dom.recordPreview.innerHTML = "<p>No recording yet.</p>";
    dom.addRecordingBtn.disabled = true;
    renderSegments();
  }

  function renderSegments() {
    dom.segments.innerHTML = "";
    if (!state.segments.length) {
      dom.segments.innerHTML = `<li><div class="meta"><div class="title">Empty show</div><div class="subtitle">Add tracks and voice bites to start.</div></div></li>`;
      dom.showLength.textContent = "0:00";
      return;
    }
    state.segments.forEach((segment, index) => {
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = segment.title;
      const subtitle = document.createElement("div");
      subtitle.className = "subtitle";
      const duration = segment.duration ? formatMs(segment.duration) : "?:??";
      subtitle.textContent = `${segment.type === "spotify" ? "Spotify" : "Voice"} · ${segment.subtitle || ""} · ${duration}`;
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
      });
      controls.appendChild(fadeInToggle);
      controls.appendChild(fadeOutToggle);
      controls.appendChild(volume);

      const moves = document.createElement("div");
      moves.className = "actions";
      const up = document.createElement("button");
      up.textContent = "▲";
      up.title = "Move up";
      up.addEventListener("click", () => moveSegment(index, -1));
      const down = document.createElement("button");
      down.textContent = "▼";
      down.title = "Move down";
      down.addEventListener("click", () => moveSegment(index, 1));
      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.className = "ghost";
      remove.addEventListener("click", () => removeSegment(index));
      moves.appendChild(up);
      moves.appendChild(down);
      moves.appendChild(remove);

      li.appendChild(meta);
      li.appendChild(controls);
      li.appendChild(moves);
      dom.segments.appendChild(li);
    });
    const total = state.segments.reduce((sum, s) => sum + (s.duration || 0), 0);
    dom.showLength.textContent = formatMs(total);
  }

  function checkbox(label, value, onChange) {
    const btn = document.createElement("button");
    btn.className = value ? "primary" : "ghost";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      const next = !btn.classList.contains("primary");
      btn.className = next ? "primary" : "ghost";
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

  async function playShow() {
    if (!state.segments.length) {
      alert("Build a show first.");
      return;
    }
    if (state.isPlaying) {
      return;
    }
    state.isPlaying = true;
    dom.playShowBtn.disabled = true;
    dom.stopShowBtn.disabled = false;
    const ctx = getAudioContext();
    await ctx.resume();
    for (const segment of state.segments) {
      if (!state.isPlaying) break;
      await playSegment(segment);
    }
    state.isPlaying = false;
    dom.playShowBtn.disabled = false;
    dom.stopShowBtn.disabled = false;
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
    dom.playShowBtn.disabled = false;
    dom.stopShowBtn.disabled = false;
  }

  async function playSegment(segment) {
    if (segment.type === "voice") {
      await playVoiceSegment(segment);
    } else {
      await playSpotifySegment(segment);
    }
  }

  async function playVoiceSegment(segment) {
    const ctx = getAudioContext();
    await ctx.resume();
    const audio = new Audio(segment.url);
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    const vol = segment.volume ?? state.masterVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    source.connect(gain).connect(ctx.destination);
    state.activeAudio = audio;

    if (segment.fadeIn) {
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + state.fadeMs / 1000);
    }

    if (segment.fadeOut) {
      audio.addEventListener("loadedmetadata", () => {
        const start = Math.max(0, audio.duration - state.fadeMs / 1000);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + state.fadeMs / 1000);
      });
    }

    return new Promise((resolve) => {
      audio.addEventListener("ended", () => {
        state.activeAudio = null;
        resolve();
      });
      audio.play();
    });
  }

  async function playSpotifySegment(segment) {
    if (!state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      stopShow();
      return;
    }
    const vol = segment.volume ?? state.masterVolume;
    await state.player.setVolume(segment.fadeIn ? 0.01 : vol);
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri] }),
      });
    } catch (err) {
      console.error(err);
      alert("Playback request failed.");
    }

    if (segment.fadeIn) {
      rampVolume((v) => state.player.setVolume(v), 0.01, vol, state.fadeMs);
    } else {
      state.player.setVolume(vol);
    }

    if (segment.fadeOut && segment.duration) {
      setTimeout(() => {
        rampVolume((v) => state.player.setVolume(v), vol, 0.01, state.fadeMs);
      }, Math.max(0, segment.duration - state.fadeMs));
    }

    return new Promise((resolve) => {
      const fallback = setTimeout(() => {
        state.player.removeListener("player_state_changed", handler);
        resolve();
      }, (segment.duration || 30000) + 1500);

      const handler = (s) => {
        if (!s || !s.track_window || !s.track_window.current_track) return;
        const uri = s.track_window.current_track.uri;
        if (uri === segment.uri && s.paused && s.position === 0) {
          clearTimeout(fallback);
          state.player.removeListener("player_state_changed", handler);
          resolve();
        }
      };
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

  function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function uid() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
  }
})(); 
