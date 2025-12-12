(() => {
  const SUPABASE_URL_KEY = "rs_supabase_url";
  const SUPABASE_ANON_KEY = "rs_supabase_anon";
  const DEFAULT_SUPABASE_URL = "https://jduyihzjqpcczekhorrq.supabase.co";
  const DEFAULT_SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ";
  const LIKED_SESSIONS_KEY = "rs_liked_sessions";

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
    topSessions: [],
    segmentStartTs: 0,
    segmentLengthMs: 0,
    segmentStopTimer: null,
    segmentStopHandler: null,
    currentSegment: null,
	    progressRaf: null,
	    supabase: null,
	    supabaseUrl: "",
	    supabaseKey: "",
	    supabaseAuthSub: null,
	    supabaseSession: null,
	    statsChannel: null,
	    currentSessionId: null,
	    likedSessions: new Set(),
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
    hydrateLikedSessions();
    loadTopSessions();
  });

  function assignDom() {
    dom.tokenInput = document.getElementById("token-input");
    dom.connectBtn = document.getElementById("connect-btn");
    dom.fileInput = document.getElementById("file-input");
    dom.prevBtn = document.getElementById("prev-btn");
    dom.nextBtn = document.getElementById("next-btn");
    dom.status = document.getElementById("spotify-status");
    dom.nowTitle = document.getElementById("now-title");
    dom.nowSubtitle = document.getElementById("now-subtitle");
    dom.nowNote = document.getElementById("now-note");
    dom.cover = document.getElementById("cover");
    dom.playBtn = document.getElementById("play-btn");
    dom.stopBtn = document.getElementById("stop-btn");
    dom.segments = document.getElementById("segments");
    dom.sessionTitle = document.getElementById("session-title");
    dom.sessionMeta = document.getElementById("session-meta");
    dom.refreshTopBtn = document.getElementById("refresh-top-btn");
    dom.sessionSearch = document.getElementById("session-search");
    dom.topSessions = document.getElementById("top-sessions");
    dom.barCover = document.getElementById("bar-cover");
    dom.barTitle = document.getElementById("bar-title");
    dom.barSubtitle = document.getElementById("bar-subtitle");
    dom.barPlay = document.getElementById("bar-play");
    dom.barStop = document.getElementById("bar-stop");
    dom.barProgress = document.getElementById("bar-progress");
    dom.barProgressFill = document.getElementById("bar-progress-fill");
  }

		  function getSupabaseClient() {
	    if (typeof window === "undefined" || !window.supabase) return null;
	    const rawUrl = localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
	    const rawAnon = localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON;
	    const url = String(rawUrl).trim().replace(/\s+/g, "");
	    const anon = String(rawAnon).trim().replace(/\s+/g, "");
	    if (!localStorage.getItem(SUPABASE_URL_KEY) && url) localStorage.setItem(SUPABASE_URL_KEY, url);
	    if (!localStorage.getItem(SUPABASE_ANON_KEY) && anon) localStorage.setItem(SUPABASE_ANON_KEY, anon);
	    if (localStorage.getItem(SUPABASE_URL_KEY) !== url) localStorage.setItem(SUPABASE_URL_KEY, url);
	    if (localStorage.getItem(SUPABASE_ANON_KEY) !== anon) localStorage.setItem(SUPABASE_ANON_KEY, anon);
	    if (!url || !anon) return null;
    if (state.supabase && state.supabaseUrl === url && state.supabaseKey === anon) {
      return state.supabase;
    }
	    try {
	      state.supabase = window.supabase.createClient(url, anon);
	      state.supabaseUrl = url;
	      state.supabaseKey = anon;
	      ensureSupabaseAuth();
	      ensureSessionStatsSubscription();
	      return state.supabase;
	    } catch (err) {
	      console.warn("Supabase init failed", err);
	      state.supabase = null;
	      return null;
	    }
		  }

		  function ensureSupabaseAuth() {
		    const client = state.supabase;
		    if (!client || state.supabaseAuthSub) return;
		    try {
		      const { data } = client.auth.onAuthStateChange((_event, session) => {
		        state.supabaseSession = session || null;
		      });
		      state.supabaseAuthSub = data?.subscription || null;
		      client.auth
		        .getSession()
		        .then(({ data }) => {
		          state.supabaseSession = data?.session || null;
		        })
		        .catch(() => {});
		    } catch (err) {
		      console.warn("Supabase auth init failed", err);
		    }
		  }

		  function ensureSessionStatsSubscription() {
		    const client = state.supabase;
		    if (!client || state.statsChannel) return;
		    try {
		      state.statsChannel = client
		        .channel("rs-session-stats")
		        .on(
		          "postgres_changes",
		          { event: "*", schema: "public", table: "session_stats" },
		          (payload) => {
		            const next = payload?.new || null;
		            if (!next?.session_id) return;
		            applySessionStats(next.session_id, next);
		          }
		        )
		        .subscribe();
		    } catch (err) {
		      console.warn("Supabase realtime subscribe failed", err);
		      state.statsChannel = null;
		    }
		  }

		  function applySessionStats(sessionId, stats) {
		    if (!sessionId || !stats) return;
		    const rows = state.topSessions || [];
		    const idx = rows.findIndex((s) => s?.id === sessionId);
		    if (idx === -1) return;
		    const row = rows[idx];
		    row.plays = stats.plays ?? row.plays ?? 0;
		    row.downloads = stats.downloads ?? row.downloads ?? 0;
		    row.likes = stats.likes ?? row.likes ?? 0;
		    patchTopSessionSubtitle(sessionId);
		  }

		  function formatTopSessionStats(row) {
		    const plays = row?.plays ?? 0;
		    const downloads = row?.downloads ?? 0;
		    const likes = row?.likes ?? 0;
		    return `${plays} plays · ${downloads} downloads · ${likes} likes`;
		  }

		  function formatTopSessionSubtitle(row) {
		    const bits = [row?.host || "Unknown"];
		    if (row?.genre) bits.push(row.genre);
		    if (Array.isArray(row?.tags) && row.tags.length) bits.push(row.tags.slice(0, 2).join(", "));
		    bits.push(formatTopSessionStats(row));
		    return bits.filter(Boolean).join(" · ");
		  }

		  function patchTopSessionSubtitle(sessionId) {
		    if (!dom.topSessions || !sessionId) return;
		    const target = dom.topSessions.querySelector(`.subtitle[data-session-id="${sessionId}"]`);
		    if (!target) return;
		    const row = (state.topSessions || []).find((s) => s?.id === sessionId);
		    if (!row) return;
		    target.textContent = formatTopSessionSubtitle(row);
		  }

		  function hydrateLikedSessions() {
		    try {
		      const raw = localStorage.getItem(LIKED_SESSIONS_KEY);
		      if (!raw) return;
		      const ids = JSON.parse(raw);
		      if (!Array.isArray(ids)) return;
		      state.likedSessions = new Set(ids.filter((x) => typeof x === "string" && x));
		    } catch {
		      state.likedSessions = new Set();
		    }
		  }

		  function persistLikedSessions() {
		    try {
		      localStorage.setItem(LIKED_SESSIONS_KEY, JSON.stringify(Array.from(state.likedSessions || [])));
		    } catch {
		      // ignore
		    }
		  }

			  function isSessionLiked(sessionId) {
			    return !!sessionId && state.likedSessions instanceof Set && state.likedSessions.has(sessionId);
			  }

			  async function describeFunctionsInvokeError(err) {
			    if (!err) return "Unknown error";
			    const base = err?.message || String(err);
			    const ctx = err?.context || null;
			    const status = typeof ctx?.status === "number" ? ctx.status : null;
			    let body = "";
			    try {
			      if (ctx && typeof ctx.clone === "function") {
			        body = await ctx.clone().text();
			      } else if (ctx && typeof ctx.text === "function") {
			        body = await ctx.text();
			      }
			    } catch {
			      body = "";
			    }
			    body = (body || "").trim();
			    if (body.length > 600) body = `${body.slice(0, 600)}…`;
			    const details = err?.details ? String(err.details) : "";
			    const bits = [];
			    if (status) bits.push(`HTTP ${status}`);
			    if (details) bits.push(details);
			    if (body && body !== base) bits.push(body);
			    return bits.length ? `${base} (${bits.join(" · ")})` : base;
			  }

			  async function likeSession(sessionId) {
			    if (!sessionId || isSessionLiked(sessionId)) return;
			    const client = getSupabaseClient();
			    if (!client) {
		      alert("Supabase not configured");
			      return;
			    }
			    try {
			      const { error } = await client.functions.invoke("record_event", {
			        headers: getSupabaseAuthHeaders(),
			        body: { id: sessionId, type: "like" },
			      });
			      if (error) throw new Error(await describeFunctionsInvokeError(error));
			      state.likedSessions.add(sessionId);
			      persistLikedSessions();
			      const row = (state.topSessions || []).find((s) => s?.id === sessionId);
			      if (row) {
		        row.likes = (row.likes ?? 0) + 1;
		        patchTopSessionSubtitle(sessionId);
		      }
		      const btn = dom.topSessions?.querySelector(`button.like-btn[data-session-id="${sessionId}"]`);
		      if (btn) {
		        btn.classList.add("liked");
		        btn.setAttribute("aria-pressed", "true");
		        btn.title = "Liked";
		        btn.disabled = true;
			      }
			    } catch (err) {
			      console.warn("Supabase like failed", err);
			      alert(`Could not like right now: ${err?.message || "unknown error"}`);
			    }
			  }

			  function getSupabaseAuthHeaders() {
			    const token = state.supabaseSession?.access_token || "";
			    return token ? { Authorization: `Bearer ${token}` } : {};
			  }

 		  async function recordSupabaseEvent(id, type) {
 		    const client = getSupabaseClient();
 		    if (!client || !id) return;
		    try {
		      const { error } = await client.functions.invoke("record_event", {
		        headers: getSupabaseAuthHeaders(),
		        body: { id, type },
		      });
		      if (error) console.warn("Supabase record_event failed", await describeFunctionsInvokeError(error));
		    } catch (err) {
		      console.warn("Supabase record_event failed", err);
		    }
		  }

	  function bindEvents() {
    dom.connectBtn.addEventListener("click", connectSpotify);
    dom.fileInput.addEventListener("change", handleFile);
    dom.playBtn.addEventListener("click", playShow);
    dom.stopBtn.addEventListener("click", stopShow);
    dom.prevBtn.addEventListener("click", playPrev);
    dom.nextBtn.addEventListener("click", playNext);
    dom.refreshTopBtn.addEventListener("click", loadTopSessions);
    dom.sessionSearch.addEventListener("input", () => loadTopSessions());
    dom.barPlay.addEventListener("click", playShow);
    dom.barStop.addEventListener("click", stopShow);
    dom.barProgress.addEventListener("click", handleSeek);
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
      transferPlaybackToDevice();
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

	  async function handleFile(e) {
	    const file = e.target.files?.[0];
	    if (!file) return;
	    const text = await file.text();
	    try {
	      state.currentSessionId = null;
	      const data = JSON.parse(text);
	      await ingestShowData(data);
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

  async function ingestShowData(data) {
    if (!data || !Array.isArray(data.segments)) throw new Error("Invalid file");
    const segments = (
      await Promise.all(
        data.segments.map(async (s) => {
          if ((s.type === "voice" || s.type === "upload") && s.url && !s.blob && isSafeSessionUrl(s.url)) {
            try {
              const res = await fetch(s.url);
              if (res.ok) s.blob = await res.blob();
            } catch {
              // leave url
            }
          }
          if (Array.isArray(s.overlays)) {
            s.overlays = await Promise.all(
              s.overlays.map(async (ov) => {
                if (ov.blob) return ov;
                if (ov.url && isSafeSessionUrl(ov.url)) {
                  try {
                    const res = await fetch(ov.url);
                    if (res.ok) ov.blob = await res.blob();
                  } catch {
                    // ignore
                  }
                }
                return ov;
              })
            );
          } else {
            s.overlays = [];
          }
          return s;
        })
      )
    ).filter(Boolean);
    state.segments = segments;
    state.showMeta = data.meta || {};
    state.currentIndex = 0;
    renderList();
    renderMeta();
  }

	  async function loadTopSessions() {
	    const client = getSupabaseClient();
	    const query = (dom.sessionSearch?.value || "").trim();
	    if (client) {
	      ensureSessionStatsSubscription();
	      try {
	        const { data, error } = await client.functions.invoke("list_sessions", {
	          body: { q: query || null },
	        });
        if (error) throw error;
        state.topSessions = Array.isArray(data?.sessions) ? data.sessions : [];
        renderTopSessions(dom.sessionSearch.value);
        return;
      } catch (err) {
        console.warn("Supabase sessions fetch failed", err);
      }
    }
    try {
      const res = await fetch("sessions/top-sessions.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.topSessions = Array.isArray(data.sessions) ? data.sessions : [];
      renderTopSessions(dom.sessionSearch.value);
    } catch (err) {
      state.topSessions = [];
      dom.topSessions.innerHTML = "";
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = `Top sessions unavailable (${err.message})`;
      meta.appendChild(title);
      li.appendChild(meta);
      dom.topSessions.appendChild(li);
    }
  }

  function renderTopSessions(filter = "") {
    dom.topSessions.innerHTML = "";
    const term = (filter || "").toLowerCase();
    const rows = state.topSessions.filter((s) => {
      if (!term) return true;
      return (s.title || "").toLowerCase().includes(term) || (s.host || "").toLowerCase().includes(term);
    });
    if (!rows.length) {
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = "No sessions found.";
      meta.appendChild(title);
      li.appendChild(meta);
      dom.topSessions.appendChild(li);
      return;
    }
	    rows.forEach((row) => {
	      const li = document.createElement("li");
	      if (row?.id) li.dataset.sessionId = row.id;
	      const meta = document.createElement("div");
	      meta.className = "meta";
	      const title = document.createElement("div");
	      title.className = "title";
	      title.textContent = row.title;
	      const sub = document.createElement("div");
	      sub.className = "subtitle";
	      if (row?.id) sub.dataset.sessionId = row.id;
	      sub.textContent = formatTopSessionSubtitle(row);
	      meta.appendChild(title);
	      meta.appendChild(sub);
	      const actions = document.createElement("div");
	      actions.className = "actions";
	      if (row?.id) {
	        const likeBtn = document.createElement("button");
	        likeBtn.className = `like-btn${isSessionLiked(row.id) ? " liked" : ""}`;
	        likeBtn.type = "button";
	        likeBtn.dataset.sessionId = row.id;
	        likeBtn.textContent = "♥";
	        likeBtn.setAttribute("aria-label", isSessionLiked(row.id) ? "Liked" : "Like session");
	        likeBtn.setAttribute("aria-pressed", isSessionLiked(row.id) ? "true" : "false");
	        likeBtn.title = isSessionLiked(row.id) ? "Liked" : "Like";
	        likeBtn.disabled = isSessionLiked(row.id);
	        likeBtn.addEventListener("click", () => likeSession(row.id));
	        actions.appendChild(likeBtn);
	      }
	      const loadBtn = document.createElement("button");
	      loadBtn.textContent = "Load";
	      loadBtn.addEventListener("click", () => loadSessionEntry(row));
	      actions.appendChild(loadBtn);
      li.appendChild(meta);
      li.appendChild(actions);
      dom.topSessions.appendChild(li);
    });
  }

		  async function loadSessionEntry(entry) {
		    try {
		      state.currentSessionId = entry?.id || null;
		      const client = getSupabaseClient();
		      const resolvedFromList = resolveSessionUrl(entry);
		      const hasFetchableUrl =
		        typeof resolvedFromList === "string" &&
		        (resolvedFromList.startsWith("http") || resolvedFromList.startsWith("data:"));
		      if (client && (entry?.id || entry?.slug) && !hasFetchableUrl) {
		        const { data, error } = await client.functions.invoke("get_session", {
		          body: { id: entry.id, slug: entry.slug },
		        });
		        if (error) throw error;
		        if (data?.id) state.currentSessionId = data.id;
		        const resolved = resolveSessionUrl(data);
		        if (resolved) {
		          await loadSessionFromUrl(resolved);
		          return;
	        }
	      }
	      if (!resolvedFromList) throw new Error("No session URL");
	      await loadSessionFromUrl(resolvedFromList);
	    } catch (err) {
	      alert(`Could not load session: ${err.message}`);
	    }
	  }

  function resolveSessionUrl(entry) {
    if (!entry) return null;
    return entry.json_url || entry.url || entry.storage_path || entry.path || null;
  }

  async function loadSessionFromUrl(url) {
    try {
      if (!isSafeSessionUrl(url)) {
        alert("Only same-site or Supabase-hosted session files are allowed.");
        return;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await ingestShowData(data);
    } catch (err) {
      alert(`Could not load session: ${err.message}`);
    }
  }

  function renderList() {
    dom.segments.innerHTML = "";
    state.segments.forEach((s, idx) => {
      const li = document.createElement("li");
      if (idx === state.currentIndex) li.classList.add("active");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = s.title;
      const sub = document.createElement("div");
      sub.className = "subtitle";
      const kind = s.type === "spotify" ? "Spotify" : s.type === "upload" ? "Upload" : "Voice";
      sub.textContent = `${kind} · ${formatMs(getSegmentLength(s))}`;
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
	    if (!state.token && state.segments.some((s) => s.type === "spotify")) {
	      alert("Connect Spotify first.");
	      return;
	    }
	    if (state.currentSessionId) {
	      recordSupabaseEvent(state.currentSessionId, "play").catch(() => {});
	    }
	    state.isPlaying = true;
	    for (let i = state.currentIndex; i < state.segments.length; i++) {
	      state.currentIndex = i;
      const seg = state.segments[i];
      await playSegment(seg);
      if (!state.isPlaying) break;
    }
    state.isPlaying = false;
    renderList();
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
    clearTimeout(state.segmentStopTimer);
    state.segmentStopTimer = null;
    state.segmentStopHandler = null;
    state.currentSegment = null;
    if (state.progressRaf) cancelAnimationFrame(state.progressRaf);
    if (dom.barProgressFill) dom.barProgressFill.style.width = "0%";
    renderList();
  }

  async function playSegment(segment) {
    updateNowPlaying(segment);
    const length = getSegmentLength(segment);
    startSegmentProgress(segment, length);
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
      const finish = () => {
        clearTimeout(state.segmentStopTimer);
        state.segmentStopHandler = null;
        state.activeAudio = null;
        resolve();
      };
      state.segmentStopHandler = () => {
        audio.pause();
        finish();
      };
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener(
        "play",
        () => {
          audio.currentTime = (segment.startMs ?? 0) / 1000;
          scheduleSegmentStop(length);
        },
        { once: true }
      );
      audio.play();
    });
  }

  async function playSpotify(segment, length) {
    if (!state.player || !state.deviceId) {
      alert("Connect Spotify first.");
      stopShow();
      return;
    }
    const overlays = Array.isArray(segment.overlays) ? segment.overlays : [];
    const startMs = segment.startMs ?? 0;
    await state.player.setVolume(segment.fadeIn ? 0.01 : segment.volume ?? 0.8);
    const timers = [];
    let duckCount = 0;
    const vol = segment.volume ?? 0.8;
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
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [segment.uri], position_ms: Math.max(0, Math.floor(startMs)) }),
      });
      return new Promise((resolve) => {
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

        state.segmentStopHandler = async () => {
          timers.forEach((t) => clearTimeout(t));
          await state.player.pause().catch(() => {});
          resolve();
        };
        const fallback = setTimeout(() => {
          timers.forEach((t) => clearTimeout(t));
          resolve();
        }, length + 1500);
        timers.push(fallback);
        scheduleSegmentStop(length);
      });
    } catch (err) {
      console.error(err);
      alert("Playback failed.");
    }
  }

  function startSegmentProgress(segment, length) {
    state.currentSegment = segment;
    state.segmentLengthMs = length;
    state.segmentStartTs = performance.now();
    if (state.progressRaf) cancelAnimationFrame(state.progressRaf);
    updateProgressLoop();
  }

  function updateProgressLoop() {
    if (!state.isPlaying || !state.currentSegment || !dom.barProgressFill) return;
    const elapsed = Math.max(0, performance.now() - state.segmentStartTs);
    const pct = Math.min(100, (elapsed / (state.segmentLengthMs || 1)) * 100);
    dom.barProgressFill.style.width = `${pct}%`;
    state.progressRaf = requestAnimationFrame(updateProgressLoop);
  }

  function scheduleSegmentStop(ms) {
    clearTimeout(state.segmentStopTimer);
    const duration = Math.max(0, ms);
    state.segmentStopTimer = setTimeout(() => {
      if (state.segmentStopHandler) {
        state.segmentStopHandler();
      }
    }, duration);
  }

  function playPrev() {
    if (!state.segments.length) return;
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    renderList();
    playShow();
  }

  function playNext() {
    if (!state.segments.length) return;
    state.currentIndex = Math.min(state.segments.length - 1, state.currentIndex + 1);
    renderList();
    playShow();
  }

  function handleSeek(e) {
    if (!state.currentSegment || !state.segmentLengthMs) return;
    const rect = dom.barProgress.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetMs = state.segmentLengthMs * pct;
    seekTo(targetMs);
  }

  function seekTo(targetMs) {
    const seg = state.currentSegment;
    if (!seg) return;
    const safeTarget = Math.max(0, Math.min(state.segmentLengthMs, targetMs));
    state.segmentStartTs = performance.now() - safeTarget;
    if (seg.type === "spotify" && state.player) {
      const absolute = (seg.startMs ?? 0) + safeTarget;
      state.player.seek(Math.max(0, Math.floor(absolute))).catch(() => {});
    } else if ((seg.type === "voice" || seg.type === "upload") && state.activeAudio) {
      const absolute = (seg.startMs ?? 0) + safeTarget;
      state.activeAudio.currentTime = absolute / 1000;
    }
    const remaining = Math.max(0, state.segmentLengthMs - safeTarget);
    if (state.segmentStopHandler) {
      scheduleSegmentStop(remaining);
    }
    if (dom.barProgressFill) {
      dom.barProgressFill.style.width = `${(safeTarget / state.segmentLengthMs) * 100}%`;
    }
  }

  function updateNowPlaying(seg) {
    dom.nowTitle.textContent = seg.title || "—";
    const kind = seg.type === "spotify" ? "Spotify" : seg.type === "upload" ? "Upload" : "Voice";
    dom.nowSubtitle.textContent = `${kind} · ${seg.subtitle || ""}`;
    dom.nowNote.textContent = seg.note || "";
    const art = seg.type === "spotify" && seg.album && seg.album.images && seg.album.images[0] ? seg.album.images[0].url : null;
    const bg = art ? `url(${art})` : "linear-gradient(120deg, var(--accent), var(--accent-2))";
    dom.cover.style.backgroundImage = bg;
    if (dom.barCover) dom.barCover.style.backgroundImage = bg;
    if (dom.barTitle) dom.barTitle.textContent = seg.title || "—";
    if (dom.barSubtitle) dom.barSubtitle.textContent = seg.subtitle || "";
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

  function isSafeSessionUrl(url) {
    if (!url) return false;
    if (url.startsWith("data:")) return true;
    try {
      const parsed = new URL(url, window.location.origin);
      const allowed = new Set([window.location.origin]);
      const supabaseUrl = localStorage.getItem(SUPABASE_URL_KEY);
      if (supabaseUrl) {
        try {
          allowed.add(new URL(supabaseUrl).origin);
        } catch {
          // ignore parse errors
        }
      }
      return allowed.has(parsed.origin);
    } catch {
      return false;
    }
  }
})();
