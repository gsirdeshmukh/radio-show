(() => {
  const state = {
    token: "",
    player: null,
    deviceId: null,
    connected: false,
    segments: [],
    isPlaying: false,
    activeAudio: null,
    audioContext: null,
    currentIndex: 0,
    showMeta: {},
  };

  const sdkReady = new Promise((resolve) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });

  const dom = {};

  document.addEventListener("DOMContentLoaded", () => {
    assignDom();
    bindEvents();
    const storedToken = sessionStorage.getItem("rs_token");
    if (storedToken) dom.tokenInput.value = storedToken;
  });

  function assignDom() {
    dom.tokenInput = document.getElementById("token-input");
    dom.connectBtn = document.getElementById("connect-btn");
    dom.fileInput = document.getElementById("file-input");
    dom.status = document.getElementById("spotify-status");
    dom.nowTitle = document.getElementById("now-title");
    dom.nowSubtitle = document.getElementById("now-subtitle");
    dom.nowNote = document.getElementById("now-note");
    dom.cover = document.getElementById("cover");
    dom.progressFill = document.getElementById("progress-fill");
    dom.totalFill = document.getElementById("total-fill");
    dom.playBtn = document.getElementById("play-btn");
    dom.stopBtn = document.getElementById("stop-btn");
    dom.segments = document.getElementById("segments");
    dom.sessionTitle = document.getElementById("session-title");
    dom.sessionMeta = document.getElementById("session-meta");
  }

  function bindEvents() {
    dom.connectBtn.addEventListener("click", connectSpotify);
    dom.fileInput.addEventListener("change", handleFile);
    dom.playBtn.addEventListener("click", playShow);
    dom.stopBtn.addEventListener("click", stopShow);
  }

  function setStatus(text, connected) {
    dom.status.textContent = text;
    dom.status.style.color = connected ? "#4cf1c5" : "#f75c87";
  }

  async function connectSpotify() {
    state.token = (dom.tokenInput.value || "").trim();
    if (!state.token) {
      alert("Paste a Spotify OAuth token first.");
      return;
    }
    await sdkReady;
    if (state.player) state.player.disconnect();
    const player = new Spotify.Player({
      name: "Radio Show Listener",
      getOAuthToken: (cb) => cb(state.token),
      volume: 0.8,
    });
    player.addListener("ready", ({ device_id }) => {
      state.deviceId = device_id;
      state.connected = true;
      setStatus(`spotify: connected (${device_id.slice(0, 6)}…)`, true);
    });
    player.addListener("authentication_error", ({ message }) => {
      alert("Auth error: " + message);
      setStatus("spotify: auth error", false);
    });
    const ok = await player.connect();
    if (!ok) {
      alert("Unable to connect Spotify player.");
      return;
    }
    state.player = player;
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data.segments) throw new Error("Invalid file");
      state.segments = await Promise.all(
        data.segments.map(async (s) => {
          if (s.type === "voice" && s.url && !s.blob) {
            try {
              const res = await fetch(s.url);
              s.blob = await res.blob();
            } catch {
              // leave url
            }
          }
          return s;
        })
      );
      state.showMeta = data.meta || {};
      state.currentIndex = 0;
      renderList();
      renderMeta();
    } catch (err) {
      alert("Could not parse file.");
    }
  }

  function renderMeta() {
    dom.sessionTitle.textContent = state.showMeta.title || "Untitled show";
    const bits = [];
    if (state.showMeta.host) bits.push(`Host: ${state.showMeta.host}`);
    if (state.showMeta.genre) bits.push(`Genre: ${state.showMeta.genre}`);
    if (state.showMeta.date) bits.push(state.showMeta.date);
    dom.sessionMeta.textContent = bits.join(" · ");
  }

  function renderList() {
    dom.segments.innerHTML = "";
    state.segments.forEach((s, idx) => {
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = s.title;
      const sub = document.createElement("div");
      sub.className = "subtitle";
      sub.textContent = `${s.type === "spotify" ? "Spotify" : "Voice"} · ${formatMs(getSegmentLength(s))}`;
      meta.appendChild(title);
      meta.appendChild(sub);
      if (s.note) {
        const n = document.createElement("div");
        n.className = "subtitle";
        n.textContent = s.note;
        meta.appendChild(n);
      }
      const actions = document.createElement("div");
      actions.className = "actions";
      const go = document.createElement("button");
      go.textContent = "Play";
      go.addEventListener("click", () => {
        state.currentIndex = idx;
        playShow();
      });
      actions.appendChild(go);
      li.appendChild(meta);
      li.appendChild(actions);
      dom.segments.appendChild(li);
    });
  }

  async function playShow() {
    if (!state.segments.length) {
      alert("Load a show JSON first.");
      return;
    }
    if (!state.token) {
      alert("Connect Spotify first.");
      return;
    }
    state.isPlaying = true;
    for (let i = state.currentIndex; i < state.segments.length; i++) {
      state.currentIndex = i;
      const seg = state.segments[i];
      await playSegment(seg);
      if (!state.isPlaying) break;
    }
    state.isPlaying = false;
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
  }

  async function playSegment(segment) {
    updateNowPlaying(segment);
    const length = getSegmentLength(segment);
    if (segment.type === "voice") {
      await playVoice(segment, length);
      return;
    }
    await playSpotify(segment, length);
  }

  async function playVoice(segment, length) {
    const audio = new Audio(segment.url);
    if (segment.blob) {
      audio.src = URL.createObjectURL(segment.blob);
    }
    state.activeAudio = audio;
    return new Promise((resolve) => {
      let timer;
      audio.addEventListener("play", () => {
        audio.currentTime = (segment.startMs ?? 0) / 1000;
        timer = setTimeout(() => {
          audio.pause();
          audio.dispatchEvent(new Event("ended"));
        }, length + 50);
      }, { once: true });
      audio.addEventListener("ended", () => {
        if (timer) clearTimeout(timer);
        resolve();
      });
      audio.play();
      tickProgress(length);
    });
  }

  async function playSpotify(segment, length) {
    if (!state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      stopShow();
      return;
    }
    const startMs = segment.startMs ?? 0;
    await state.player.setVolume(segment.fadeIn ? 0.01 : segment.volume ?? 0.8);
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri], position_ms: Math.max(0, Math.floor(startMs)) }),
      });
      tickProgress(length);
      await new Promise((resolve) => setTimeout(resolve, length + 100));
      await state.player.pause();
    } catch (err) {
      console.error(err);
      alert("Playback failed.");
    }
  }

  function tickProgress(length) {
    const total = state.segments.reduce((sum, s, idx) => sum + (idx < state.currentIndex ? getSegmentLength(s) : 0), 0) + length;
    const showTotal = state.segments.reduce((sum, s) => sum + getSegmentLength(s), 0);
    const startTs = performance.now();
    const loop = () => {
      const elapsed = performance.now() - startTs;
      const pctSeg = Math.min(100, (elapsed / length) * 100);
      const pctTotal = Math.min(100, ((total - length + elapsed) / showTotal) * 100);
      dom.progressFill.style.width = `${pctSeg}%`;
      dom.totalFill.style.width = `${pctTotal}%`;
      if (elapsed < length && state.isPlaying) {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  }

  function updateNowPlaying(seg) {
    dom.nowTitle.textContent = seg.title || "—";
    dom.nowSubtitle.textContent = `${seg.type === "spotify" ? "Spotify" : "Voice"} · ${seg.subtitle || ""}`;
    dom.nowNote.textContent = seg.note || "";
    if (seg.type === "spotify" && seg.album && seg.album.images && seg.album.images[0]) {
      dom.cover.style.backgroundImage = `url(${seg.album.images[0].url})`;
    } else {
      dom.cover.style.backgroundImage = "linear-gradient(120deg, var(--accent), var(--accent-2))";
    }
  }

  function getSegmentLength(segment) {
    const start = segment.startMs ?? 0;
    const end = segment.endMs ?? segment.duration ?? 0;
    const chosen = Math.max(0, end - start);
    return Math.max(500, chosen);
  }

  function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
})();
