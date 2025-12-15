(() => {
  const SUPABASE_URL_KEY = "rs_supabase_url";
  const SUPABASE_ANON_KEY = "rs_supabase_anon";
  const DEFAULT_SUPABASE_URL = "https://jduyihzjqpcczekhorrq.supabase.co";
  const DEFAULT_SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ";
  const LIKED_SESSIONS_KEY = "rs_liked_sessions";
  const PROFILE_HANDLE_KEY = "rs_profile_handle";
  const PROFILE_ZIP_KEY = "rs_profile_zip";
  const PROFILE_ZIP_OPTIN_KEY = "rs_profile_zip_optin";

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
    sessions: [],
    sessionsQuery: "",
    sessionsSort: "new",
    sessionsFeed: "public",
    sessionsLoading: false,
    sessionsSearchTimer: null,
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
			    sessionsStatsChannel: null,
			    supabaseAuthed: false,
				    following: new Set(),
				    followers: new Set(),
				    followsChannel: null,
				    peopleQuery: "",
				    peopleResults: [],
				    peoplePresence: new Map(),
				    peopleSearchTimer: null,
				    presence: new Map(),
				    presenceTimer: null,
				    presenceViewerTimer: null,
				    profileSheetUserId: null,
				    profileSheetProfile: null,
				    profileSheetPresence: null,
				    profileSheetSessions: [],
				    profileSheetLoading: false,
				    profileSheetToken: null,
				    sendSheetSessionId: null,
				    sendSheetRecipients: [],
				    sendSheetSelectedUserId: null,
				    sendSheetLoading: false,
				    inbox: [],
				    inboxLoading: false,
				    inboxChannel: null,
				    inboxUnreadCount: 0,
			    live: [],
			    liveLoading: false,
			    currentLive: null,
		    liveRoom: null,
		    liveRoomEvents: [],
		    liveRoomProfiles: new Map(),
		    liveRoomChannel: null,
		    liveRtc: null,
		    liveRtcProcessed: new Set(),
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
	    hydrateSupabaseConfig();
	    hydrateProfileSettingsFromLocal();
	    renderPeopleResults();
	    loadSupabaseSessions();

		    document.addEventListener("visibilitychange", () => {
		      if (document.hidden) {
		        stopPresenceHeartbeat();
		        stopPresenceViewerRefresh();
		      } else if (state.supabaseAuthed) {
		        startPresenceHeartbeat();
		        startPresenceViewerRefresh();
		      }
		    });
		    window.addEventListener("pagehide", () => {
		      stopPresenceHeartbeat();
		      stopPresenceViewerRefresh();
		    });
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
    dom.connectToggle = document.getElementById("connect-toggle");
    dom.connectPanel = document.getElementById("connect-panel");
    dom.connectClose = document.getElementById("connect-close");
    dom.supabaseUrlInput = document.getElementById("supabase-url");
    dom.supabaseKeyInput = document.getElementById("supabase-key");
    dom.supabaseEmailInput = document.getElementById("supabase-email");
    dom.supabaseSignInBtn = document.getElementById("supabase-signin");
    dom.supabaseSignOutBtn = document.getElementById("supabase-signout");
    dom.supabaseAuthStatus = document.getElementById("supabase-auth-status");
    dom.profileHandleInput = document.getElementById("profile-handle");
    dom.profileZipInput = document.getElementById("profile-zip");
	    dom.profileLocationOptIn = document.getElementById("profile-location-optin");
	    dom.profileSaveBtn = document.getElementById("profile-save-btn");
	    dom.followHandleInput = document.getElementById("follow-handle");
	    dom.followBtn = document.getElementById("follow-btn");
		    dom.peopleSearchInput = document.getElementById("people-search");
		    dom.peopleClearBtn = document.getElementById("people-clear");
		    dom.peopleResults = document.getElementById("people-results");
		    dom.profileSheetOverlay = document.getElementById("profile-sheet-overlay");
		    dom.profileSheetTitle = document.getElementById("profile-sheet-title");
		    dom.profileSheetSubtitle = document.getElementById("profile-sheet-subtitle");
		    dom.profileSheetClose = document.getElementById("profile-sheet-close");
		    dom.profileSheetFollow = document.getElementById("profile-sheet-follow");
		    dom.profileSheetMessage = document.getElementById("profile-sheet-message");
		    dom.profileSheetSessions = document.getElementById("profile-sheet-sessions");
		    dom.sendSheetOverlay = document.getElementById("send-sheet-overlay");
		    dom.sendSheetTitle = document.getElementById("send-sheet-title");
		    dom.sendSheetSubtitle = document.getElementById("send-sheet-subtitle");
		    dom.sendSheetClose = document.getElementById("send-sheet-close");
		    dom.sendSheetTo = document.getElementById("send-sheet-to");
		    dom.sendSheetNote = document.getElementById("send-sheet-note");
		    dom.sendSheetSend = document.getElementById("send-sheet-send");
		    dom.sendSheetResults = document.getElementById("send-sheet-results");
		    dom.sessionsPanel = document.getElementById("sessions-panel");
	    dom.sessionsList = document.getElementById("sessions-list");
	    dom.sessionsSearch = document.getElementById("sessions-search");
    dom.sessionsFeed = document.getElementById("sessions-feed");
    dom.sessionsSort = document.getElementById("sessions-sort");
    dom.sessionsRefresh = document.getElementById("sessions-refresh");
    dom.sessionsStatus = document.getElementById("sessions-status");
    dom.goLiveBtn = document.getElementById("go-live-btn");
    dom.endLiveBtn = document.getElementById("end-live-btn");
    dom.liveRoom = document.getElementById("live-room");
    dom.liveRoomTitle = document.getElementById("live-room-title");
    dom.liveRoomSubtitle = document.getElementById("live-room-subtitle");
	    dom.liveRoomClose = document.getElementById("live-room-close");
	    dom.liveRoomEvents = document.getElementById("live-room-events");
	    dom.liveRoomMessage = document.getElementById("live-room-message");
	    dom.liveRoomSend = document.getElementById("live-room-send");
	    dom.liveRoomAudioBtn = document.getElementById("live-room-audio-btn");
	    dom.liveRoomMicBtn = document.getElementById("live-room-mic-btn");
	    dom.liveRoomAudioStatus = document.getElementById("live-room-audio-status");
	    dom.liveRoomAudioEl = document.getElementById("live-room-audio");
	    dom.barCover = document.getElementById("bar-cover");
    dom.barTitle = document.getElementById("bar-title");
    dom.barSubtitle = document.getElementById("bar-subtitle");
    dom.barPlay = document.getElementById("bar-play");
    dom.barStop = document.getElementById("bar-stop");
    dom.barProgress = document.getElementById("bar-progress");
    dom.barProgressFill = document.getElementById("bar-progress-fill");
  }

	  function toggleConnectPanel() {
	    if (!dom.connectPanel) return;
	    dom.connectPanel.classList.toggle("collapsed");
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
	    if (!localStorage.getItem(SUPABASE_URL_KEY) && storedUrl) localStorage.setItem(SUPABASE_URL_KEY, storedUrl);
	    if (!localStorage.getItem(SUPABASE_ANON_KEY) && storedKey) localStorage.setItem(SUPABASE_ANON_KEY, storedKey);
	    initSupabaseClient();
	  }

	  function setSupabaseAuthStatus(text, authed) {
	    if (!dom.supabaseAuthStatus) return;
	    dom.supabaseAuthStatus.textContent = text;
	    dom.supabaseAuthStatus.classList.toggle("subtle", !authed);
	  }

	  function initSupabaseClient() {
	    if (typeof window === "undefined" || !window.supabase) return null;
	    const rawUrl = (dom.supabaseUrlInput?.value || "") || localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
	    const rawAnon = (dom.supabaseKeyInput?.value || "") || localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON;
	    const url = String(rawUrl).trim().replace(/\s+/g, "");
	    const anon = String(rawAnon).trim().replace(/\s+/g, "");
	    if (dom.supabaseUrlInput?.value && dom.supabaseUrlInput.value !== url) dom.supabaseUrlInput.value = url;
	    if (dom.supabaseKeyInput?.value && dom.supabaseKeyInput.value !== anon) dom.supabaseKeyInput.value = anon;

	    if (!url || !anon) {
	      localStorage.removeItem(SUPABASE_URL_KEY);
	      localStorage.removeItem(SUPABASE_ANON_KEY);
	      state.supabase = null;
	      state.supabaseUrl = "";
	      state.supabaseKey = "";
	      state.supabaseSession = null;
	      state.supabaseAuthed = false;
	      setSupabaseAuthStatus("supabase: signed out", false);
	      return null;
	    }

	    localStorage.setItem(SUPABASE_URL_KEY, url);
	    localStorage.setItem(SUPABASE_ANON_KEY, anon);
	    if (state.supabase && state.supabaseUrl === url && state.supabaseKey === anon) return state.supabase;

	    if (state.sessionsStatsChannel) {
	      try {
	        state.sessionsStatsChannel.unsubscribe().catch(() => {});
	      } catch {
	        // ignore
	      }
	      state.sessionsStatsChannel = null;
	    }
	    if (state.supabaseAuthSub) {
	      try {
	        state.supabaseAuthSub.unsubscribe();
	      } catch {
	        // ignore
	      }
	      state.supabaseAuthSub = null;
	    }
	    if (state.inboxChannel) {
	      try {
	        state.inboxChannel.unsubscribe().catch(() => {});
	      } catch {
	        // ignore
	      }
	      state.inboxChannel = null;
	    }

	    try {
	      state.supabase = window.supabase.createClient(url, anon);
	      state.supabaseUrl = url;
	      state.supabaseKey = anon;
	      ensureSupabaseAuth();
	      ensureSessionsStatsSubscription();
	      return state.supabase;
	    } catch (err) {
	      console.warn("Supabase init failed", err);
	      state.supabase = null;
	      state.supabaseUrl = "";
	      state.supabaseKey = "";
	      return null;
	    }
	  }

	  function onSupabaseSessionChange(session) {
	    state.supabaseSession = session || null;
	    const authed = !!state.supabaseSession?.user?.id;
	    if (dom.supabaseSignOutBtn) dom.supabaseSignOutBtn.disabled = !authed;
	    setSupabaseAuthStatus(authed ? "supabase: signed in" : "supabase: signed out", authed);
	    if (authed !== state.supabaseAuthed) {
	      state.supabaseAuthed = authed;
	      handleSupabaseAuthedState(authed).catch(() => {});
	    }
	  }

	  function ensureSupabaseAuth() {
	    const client = state.supabase;
	    if (!client || state.supabaseAuthSub) return;
	    try {
	      const { data } = client.auth.onAuthStateChange((_event, session) => {
	        onSupabaseSessionChange(session);
	      });
	      state.supabaseAuthSub = data?.subscription || null;
	      client.auth
	        .getSession()
	        .then(({ data }) => onSupabaseSessionChange(data?.session || null))
	        .catch(() => onSupabaseSessionChange(null));
	    } catch (err) {
	      console.warn("Supabase auth init failed", err);
	    }
	  }

	  function ensureSessionsStatsSubscription() {
	    const client = state.supabase;
	    if (!client || state.sessionsStatsChannel) return;
	    try {
	      state.sessionsStatsChannel = client
	        .channel("rs-session-stats")
	        .on("postgres_changes", { event: "*", schema: "public", table: "session_stats" }, (payload) => {
	          const next = payload?.new || null;
	          if (!next?.session_id) return;
	          applySessionStats(next.session_id, next);
	        })
	        .subscribe();
	    } catch (err) {
	      console.warn("Supabase realtime subscribe failed", err);
	      state.sessionsStatsChannel = null;
	    }
	  }

	  function applySessionStats(sessionId, stats) {
	    if (!sessionId || !stats) return;
	    const rows = state.sessions || [];
	    const idx = rows.findIndex((s) => s?.id === sessionId);
	    if (idx === -1) return;
	    const row = rows[idx];
	    row.plays = stats.plays ?? row.plays ?? 0;
	    row.downloads = stats.downloads ?? row.downloads ?? 0;
	    row.likes = stats.likes ?? row.likes ?? 0;
	    patchSessionSubtitle(sessionId);
	  }

	  function formatSessionStats(row) {
	    const plays = row?.plays ?? 0;
	    const downloads = row?.downloads ?? 0;
	    const likes = row?.likes ?? 0;
	    return `${plays} plays · ${downloads} downloads · ${likes} likes`;
	  }

	  function formatSessionSubtitle(row) {
	    const bits = [row?.host || "Unknown"];
	    if (row?.genre) bits.push(row.genre);
	    if (Array.isArray(row?.tags) && row.tags.length) bits.push(row.tags.slice(0, 2).join(", "));
	    bits.push(formatSessionStats(row));
	    return bits.filter(Boolean).join(" · ");
	  }

	  function patchSessionSubtitle(sessionId) {
	    if (!dom.sessionsList || !sessionId) return;
	    const target = dom.sessionsList.querySelector(`.subtitle[data-session-id="${sessionId}"]`);
	    if (!target) return;
	    const row = (state.sessions || []).find((s) => s?.id === sessionId);
	    if (!row) return;
	    target.textContent = formatSessionSubtitle(row);
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
				    const client = initSupabaseClient();
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
				      const row = (state.sessions || []).find((s) => s?.id === sessionId);
				      if (row) {
			        row.likes = (row.likes ?? 0) + 1;
			        patchSessionSubtitle(sessionId);
			      }
			      const btn = dom.sessionsList?.querySelector(`button.like-btn[data-session-id="${sessionId}"]`);
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
	 		    const client = initSupabaseClient();
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
	    dom.connectToggle && dom.connectToggle.addEventListener("click", toggleConnectPanel);
	    dom.connectClose && dom.connectClose.addEventListener("click", toggleConnectPanel);
	    if (dom.supabaseUrlInput) {
	      dom.supabaseUrlInput.addEventListener("change", () => {
	        initSupabaseClient();
	        loadSupabaseSessions();
	      });
	    }
	    if (dom.supabaseKeyInput) {
	      dom.supabaseKeyInput.addEventListener("change", () => {
	        initSupabaseClient();
	        loadSupabaseSessions();
	      });
	    }
	    dom.supabaseSignInBtn && dom.supabaseSignInBtn.addEventListener("click", supabaseSignIn);
	    dom.supabaseSignOutBtn && dom.supabaseSignOutBtn.addEventListener("click", supabaseSignOut);
	    if (dom.sessionsSearch) {
	      dom.sessionsSearch.addEventListener("input", () => {
	        clearTimeout(state.sessionsSearchTimer);
	        state.sessionsSearchTimer = setTimeout(() => {
	          state.sessionsQuery = (dom.sessionsSearch.value || "").trim();
	          loadSupabaseSessions();
	        }, 250);
	      });
	    }
	    if (dom.sessionsSort) {
	      dom.sessionsSort.addEventListener("change", () => {
	        state.sessionsSort = dom.sessionsSort.value || "new";
	        loadSupabaseSessions();
	      });
	    }
	    if (dom.sessionsFeed) {
	      dom.sessionsFeed.addEventListener("change", () => {
	        state.sessionsFeed = dom.sessionsFeed.value || "public";
	        loadSupabaseSessions();
	      });
	    }
	    dom.sessionsRefresh && dom.sessionsRefresh.addEventListener("click", loadSupabaseSessions);
	    dom.goLiveBtn && dom.goLiveBtn.addEventListener("click", startLive);
		    dom.endLiveBtn && dom.endLiveBtn.addEventListener("click", endLive);
		    dom.liveRoomClose && dom.liveRoomClose.addEventListener("click", closeLiveRoom);
		    dom.liveRoomSend && dom.liveRoomSend.addEventListener("click", sendLiveRoomChat);
		    dom.liveRoomAudioBtn && dom.liveRoomAudioBtn.addEventListener("click", toggleLiveAudio);
		    dom.liveRoomMicBtn && dom.liveRoomMicBtn.addEventListener("click", toggleLiveMic);
		    if (dom.liveRoomMessage) {
		      dom.liveRoomMessage.addEventListener("keydown", (e) => {
		        if (e.key === "Enter") {
	          e.preventDefault();
	          sendLiveRoomChat();
	        }
	      });
		    }
		    dom.profileSaveBtn && dom.profileSaveBtn.addEventListener("click", saveProfileSettings);
		    dom.followBtn && dom.followBtn.addEventListener("click", followByHandle);
		    if (dom.peopleSearchInput) {
		      dom.peopleSearchInput.addEventListener("input", () => {
		        state.peopleQuery = String(dom.peopleSearchInput.value || "").trim();
		        schedulePeopleSearch();
		      });
		    }
			    if (dom.peopleClearBtn) {
			      dom.peopleClearBtn.addEventListener("click", () => {
			        state.peopleQuery = "";
			        if (dom.peopleSearchInput) dom.peopleSearchInput.value = "";
			        state.peopleResults = [];
			        state.peoplePresence = new Map();
			        renderPeopleResults();
			      });
			    }
			    dom.profileSheetClose && dom.profileSheetClose.addEventListener("click", closeProfileSheet);
			    if (dom.profileSheetOverlay) {
			      dom.profileSheetOverlay.addEventListener("click", (e) => {
			        if (e.target === dom.profileSheetOverlay) closeProfileSheet();
			      });
			    }
				    dom.profileSheetMessage &&
				      dom.profileSheetMessage.addEventListener("click", () => {
				        alert("DMs coming soon — for now, send sessions from the feed.");
				      });
				    dom.sendSheetClose && dom.sendSheetClose.addEventListener("click", closeSendSheet);
				    if (dom.sendSheetOverlay) {
				      dom.sendSheetOverlay.addEventListener("click", (e) => {
				        if (e.target === dom.sendSheetOverlay) closeSendSheet();
				      });
				    }
				    dom.sendSheetSend && dom.sendSheetSend.addEventListener("click", sendFromSendSheet);
				    if (dom.sendSheetTo) {
				      dom.sendSheetTo.addEventListener("input", () => {
				        state.sendSheetSelectedUserId = null;
				        renderSendSheet();
				      });
				      dom.sendSheetTo.addEventListener("keydown", (e) => {
				        if (e.key === "Enter") {
				          e.preventDefault();
				          sendFromSendSheet();
				        }
				      });
				    }
				    document.addEventListener("keydown", (e) => {
				      if (e.key === "Escape") {
				        closeSendSheet();
				        closeProfileSheet();
				      }
				    });
				    dom.barPlay.addEventListener("click", playShow);
				    dom.barStop.addEventListener("click", stopShow);
				    dom.barProgress.addEventListener("click", handleSeek);
				  }

	  async function supabaseSignIn() {
	    const client = initSupabaseClient();
	    if (!client) {
	      alert("Supabase not configured");
	      return;
	    }
	    const email = (dom.supabaseEmailInput?.value || "").trim();
	    if (!email) {
	      alert("Enter an email address first.");
	      return;
	    }
	    try {
	      const redirect = `${window.location.origin}${window.location.pathname}`;
	      const { error } = await client.auth.signInWithOtp({
	        email,
	        options: { emailRedirectTo: redirect },
	      });
	      if (error) throw error;
	      alert("Check your email for the sign-in link.");
	    } catch (err) {
	      console.warn("Supabase sign-in failed", err);
	      alert(`Supabase sign-in failed: ${err?.message || "unknown error"}`);
	    }
	  }

	  async function supabaseSignOut() {
	    const client = initSupabaseClient();
	    if (!client) return;
	    try {
	      await client.auth.signOut();
	    } catch (err) {
	      console.warn("Supabase sign-out failed", err);
	    }
	  }

				  async function handleSupabaseAuthedState(authed) {
				    if (!authed) {
				      closeLiveRoom();
				      stopPresenceHeartbeat();
				      stopPresenceViewerRefresh();
				      unsubscribeInbox();
				      unsubscribeFollows();
				      state.following = new Set();
				      state.followers = new Set();
				      state.presence = new Map();
			      state.inbox = [];
			      state.inboxUnreadCount = 0;
			      updateInboxFeedLabel();
			      state.live = [];
			      state.currentLive = null;
			      loadSupabaseSessions().catch(() => {});
			      return;
			    }
			    await ensureOwnProfileSettings();
			    await loadFollowing();
			    await loadFollowers();
			    subscribeFollows();
			    startPresenceHeartbeat();
			    startPresenceViewerRefresh();
			    subscribeInbox();
			    refreshInboxUnreadCount().catch(() => {});
			    loadSupabaseSessions().catch(() => {});
			  }

	  function normalizeHandle(raw) {
	    return String(raw || "")
	      .trim()
	      .replace(/^@+/, "")
	      .toLowerCase()
	      .replace(/[^a-z0-9_]+/g, "")
	      .slice(0, 24);
	  }

	  function hydrateProfileSettingsFromLocal() {
	    if (dom.profileHandleInput && !dom.profileHandleInput.value) {
	      dom.profileHandleInput.value = localStorage.getItem(PROFILE_HANDLE_KEY) || "";
	    }
	    if (dom.profileZipInput && !dom.profileZipInput.value) {
	      dom.profileZipInput.value = localStorage.getItem(PROFILE_ZIP_KEY) || "";
	    }
	    if (dom.profileLocationOptIn) {
	      dom.profileLocationOptIn.checked = localStorage.getItem(PROFILE_ZIP_OPTIN_KEY) === "true";
	    }
	  }

	  async function ensureOwnProfileSettings() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) return;

	    try {
	      const { data: profile } = await client.from("profiles").select("handle").eq("user_id", uid).maybeSingle();
	      const handle = profile?.handle || "";
	      if (handle) {
	        localStorage.setItem(PROFILE_HANDLE_KEY, handle);
	        if (dom.profileHandleInput) dom.profileHandleInput.value = handle;
	      }
	    } catch {
	      // ignore
	    }

	    try {
	      const { data: loc } = await client.from("profile_locations").select("zip, opt_in").eq("user_id", uid).maybeSingle();
	      const zip = (loc?.zip || "").trim();
	      if (zip) {
	        localStorage.setItem(PROFILE_ZIP_KEY, zip);
	        if (dom.profileZipInput) dom.profileZipInput.value = zip;
	      }
	      if (typeof loc?.opt_in === "boolean") {
	        localStorage.setItem(PROFILE_ZIP_OPTIN_KEY, loc.opt_in ? "true" : "false");
	        if (dom.profileLocationOptIn) dom.profileLocationOptIn.checked = loc.opt_in;
	      }
	    } catch {
	      // ignore
	    }
	  }

	  async function saveProfileSettings() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      alert("Sign in with Supabase to save profile settings.");
	      return;
	    }
	    const handle = normalizeHandle(dom.profileHandleInput?.value || "");
	    const zip = String(dom.profileZipInput?.value || "").trim();
	    const optIn = !!dom.profileLocationOptIn?.checked;
	    try {
	      if (handle) {
	        const { error } = await client.from("profiles").upsert({ user_id: uid, handle });
	        if (error) throw error;
	        localStorage.setItem(PROFILE_HANDLE_KEY, handle);
	      }
	      await client.from("profile_locations").upsert({ user_id: uid, zip: zip || null, opt_in: optIn });
	      if (zip) localStorage.setItem(PROFILE_ZIP_KEY, zip);
	      localStorage.setItem(PROFILE_ZIP_OPTIN_KEY, optIn ? "true" : "false");
	      alert("Profile saved.");
	      loadSupabaseSessions();
	    } catch (err) {
	      console.warn("profile save failed", err);
	      alert(`Could not save profile: ${err?.message || "unknown error"}`);
	    }
	  }

		  async function loadFollowing() {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid) {
		      state.following = new Set();
		      return;
		    }
		    try {
		      const { data, error } = await client.from("follows").select("followed_id").eq("follower_id", uid).limit(5000);
		      if (error) throw error;
		      state.following = new Set((data || []).map((r) => r.followed_id).filter(Boolean));
		    } catch (err) {
		      console.warn("loadFollowing failed", err);
		      state.following = new Set();
		    }
		  }

		  async function loadFollowers() {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid) {
		      state.followers = new Set();
		      return;
		    }
		    try {
		      const { data, error } = await client.from("follows").select("follower_id").eq("followed_id", uid).limit(5000);
		      if (error) throw error;
		      state.followers = new Set((data || []).map((r) => r.follower_id).filter(Boolean));
		    } catch (err) {
		      console.warn("loadFollowers failed", err);
		      state.followers = new Set();
		    }
		  }

		  function followButtonLabel(targetUserId) {
		    if (!targetUserId) return "Follow";
		    const isFollowing = state.following.has(targetUserId);
		    if (!isFollowing) return "Follow";
		    const isFriend = state.followers.has(targetUserId);
		    return isFriend ? "Friend ✓" : "Following";
		  }

		  async function followByHandle() {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      alert("Sign in with Supabase to follow.");
	      return;
	    }
	    const handle = normalizeHandle(dom.followHandleInput?.value || "");
	    if (!handle) {
	      alert("Enter a handle to follow.");
	      return;
	    }
	    try {
	      const { data, error } = await client.from("profiles").select("user_id, handle").eq("handle", handle).maybeSingle();
	      if (error) throw error;
	      const targetUserId = data?.user_id || "";
	      if (!targetUserId) throw new Error("Handle not found");
	      if (targetUserId === uid) throw new Error("Can't follow yourself");
	      await followUserId(targetUserId);
	      if (dom.followHandleInput) dom.followHandleInput.value = "";
	      alert(`Following @${handle}`);
	      loadSupabaseSessions();
	    } catch (err) {
	      console.warn("followByHandle failed", err);
	      alert(`Could not follow: ${err?.message || "unknown error"}`);
	    }
	  }

	  async function followUserId(targetUserId) {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid || !targetUserId) return;
	    const { error } = await client.from("follows").insert({ follower_id: uid, followed_id: targetUserId });
	    if (error) throw error;
	    state.following.add(targetUserId);
	  }

		  async function unfollowUserId(targetUserId) {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid || !targetUserId) return;
		    const { error } = await client.from("follows").delete().eq("follower_id", uid).eq("followed_id", targetUserId);
		    if (error) throw error;
		    state.following.delete(targetUserId);
		  }

		  function normalizePeopleQuery(raw) {
		    return String(raw || "")
		      .trim()
		      .toLowerCase()
		      .replace(/[^a-z0-9_ ]+/g, " ")
		      .replace(/\s+/g, " ")
		      .slice(0, 32);
		  }

		  function schedulePeopleSearch() {
		    clearTimeout(state.peopleSearchTimer);
		    state.peopleSearchTimer = setTimeout(() => searchPeople().catch(() => {}), 220);
		  }

		  async function searchPeople() {
		    const client = initSupabaseClient();
		    if (!client) {
		      state.peopleResults = [];
		      state.peoplePresence = new Map();
		      renderPeopleResults();
		      return;
		    }
		    const q = normalizePeopleQuery(state.peopleQuery);
		    if (q.length < 2) {
		      state.peopleResults = [];
		      state.peoplePresence = new Map();
		      renderPeopleResults();
		      return;
		    }
		    try {
		      const pattern = `%${q}%`;
		      const { data, error } = await client
		        .from("profiles")
		        .select("user_id, handle, display_name")
		        .or(`handle.ilike.${pattern},display_name.ilike.${pattern}`)
		        .limit(12);
		      if (error) throw error;
		      const rows = (data || []).filter((r) => r?.user_id);
		      state.peopleResults = rows;

		      const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
		      state.peoplePresence = new Map();
		      if (ids.length) {
		        try {
		          const { data: presence } = await client
		            .from("profile_presence")
		            .select("user_id, last_seen_at, status")
		            .in("user_id", ids);
		          state.peoplePresence = new Map((presence || []).map((p) => [p.user_id, p]));
		        } catch {
		          state.peoplePresence = new Map();
		        }
		      }
		    } catch (err) {
		      console.warn("searchPeople failed", err);
		      state.peopleResults = [];
		      state.peoplePresence = new Map();
		    }
		    renderPeopleResults();
		  }

		  function renderPeopleResults() {
		    if (!dom.peopleResults) return;
		    dom.peopleResults.innerHTML = "";
		    const q = normalizePeopleQuery(state.peopleQuery);
		    const rows = Array.isArray(state.peopleResults) ? state.peopleResults : [];
		    const uid = state.supabaseSession?.user?.id || "";

		    if (q.length < 2) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      title.textContent = "Search people";
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      sub.textContent = "Type 2+ characters to find handles.";
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.peopleResults.appendChild(li);
		      return;
		    }

		    if (!rows.length) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      title.textContent = "No matches";
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      sub.textContent = `No profiles found for "${q}".`;
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.peopleResults.appendChild(li);
		      return;
		    }

		    rows.forEach((p) => {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      const handle = p?.handle ? `@${p.handle}` : p?.display_name || p?.user_id?.slice(0, 8) || "user";
		      title.textContent = handle;
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      sub.textContent = p?.display_name ? p.display_name : p?.handle ? "" : p?.user_id ? p.user_id.slice(0, 8) : "";
		      const presence = p?.user_id ? state.peoplePresence.get(p.user_id) : null;
		      if (presence && isPresenceActive(presence)) {
		        const badge = document.createElement("span");
		        badge.className = "presence";
		        const dot = document.createElement("span");
		        dot.className = "presence-dot";
		        const label = document.createElement("span");
		        label.className = "presence-label";
		        label.textContent = "active";
		        badge.appendChild(dot);
		        badge.appendChild(label);
		        sub.appendChild(document.createTextNode(" "));
		        sub.appendChild(badge);
		      }
			      meta.appendChild(title);
			      meta.appendChild(sub);
			      const actions = document.createElement("div");
			      actions.className = "actions";
			      if (p?.user_id) {
			        const viewBtn = document.createElement("button");
			        viewBtn.type = "button";
			        viewBtn.textContent = "View";
			        viewBtn.addEventListener("click", () => openProfileSheet(p.user_id));
			        actions.appendChild(viewBtn);
			      }

			      if (p?.user_id && uid && p.user_id !== uid) {
			        const followBtn = document.createElement("button");
			        followBtn.type = "button";
		        followBtn.textContent = followButtonLabel(p.user_id);
		        followBtn.addEventListener("click", async () => {
		          try {
		            if (state.following.has(p.user_id)) await unfollowUserId(p.user_id);
		            else await followUserId(p.user_id);
		            followBtn.textContent = followButtonLabel(p.user_id);
		          } catch (err) {
		            alert(`Follow failed: ${err?.message || "unknown error"}`);
		          }
		        });
		        actions.appendChild(followBtn);
		      } else if (p?.user_id && !uid) {
		        const followBtn = document.createElement("button");
		        followBtn.type = "button";
		        followBtn.textContent = "Follow";
		        followBtn.disabled = true;
		        followBtn.title = "Sign in with Supabase to follow.";
		        actions.appendChild(followBtn);
		      }

		      li.appendChild(meta);
		      li.appendChild(actions);
		      dom.peopleResults.appendChild(li);
		    });
		  }

			  async function sendSessionToHandle(sessionId) {
			    if (dom.sendSheetOverlay) {
			      openSendSheet({ sessionId });
			      return;
			    }
			    const client = initSupabaseClient();
			    const uid = state.supabaseSession?.user?.id || "";
			    if (!client || !uid) {
			      alert("Sign in with Supabase to send.");
		      return;
		    }
	    const raw = prompt("Send to handle (e.g. @someone):") || "";
	    const handle = normalizeHandle(raw);
	    if (!handle) return;
	    const note = (prompt("Optional note:") || "").trim();
	    try {
	      const { data, error } = await client.from("profiles").select("user_id, handle").eq("handle", handle).maybeSingle();
	      if (error) throw error;
	      const toUserId = data?.user_id || "";
	      if (!toUserId) throw new Error("Handle not found");
	      const { error: insErr } = await client.from("inbox_items").insert({
	        from_user_id: uid,
	        to_user_id: toUserId,
	        session_id: sessionId,
	        note: note || null,
	        status: "unread",
	      });
	      if (insErr) throw insErr;
	      alert(`Sent to @${handle}`);
		    } catch (err) {
		      console.warn("sendSessionToHandle failed", err);
		      alert(`Could not send: ${err?.message || "unknown error"}`);
		    }
		  }

		  function closeProfileSheet() {
		    state.profileSheetToken = null;
		    state.profileSheetUserId = null;
		    state.profileSheetProfile = null;
		    state.profileSheetPresence = null;
		    state.profileSheetSessions = [];
		    state.profileSheetLoading = false;
		    if (dom.profileSheetOverlay) dom.profileSheetOverlay.classList.add("hidden");
		  }

		  async function openProfileSheet(userId) {
		    const client = initSupabaseClient();
		    if (!client) {
		      alert("Supabase not configured");
		      return;
		    }
		    const uid = String(userId || "").trim();
		    if (!uid) return;

		    state.profileSheetUserId = uid;
		    state.profileSheetProfile = null;
		    state.profileSheetPresence = null;
		    state.profileSheetSessions = [];
		    state.profileSheetLoading = true;
		    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
		    state.profileSheetToken = token;
		    if (dom.profileSheetOverlay) dom.profileSheetOverlay.classList.remove("hidden");
		    renderProfileSheet();

		    try {
		      await loadFollowing();
		      await loadFollowers();
		    } catch {
		      // ignore
		    }
		    if (token !== state.profileSheetToken) return;
		    renderProfileSheet();

		    try {
		      const [{ data: profile }, { data: presence }, { data: sessions }] = await Promise.all([
		        client.from("profiles").select("user_id, handle, display_name").eq("user_id", uid).maybeSingle(),
		        client.from("profile_presence").select("user_id, last_seen_at, status").eq("user_id", uid).maybeSingle(),
		        client
		          .from("sessions")
		          .select(
		            "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)",
		          )
		          .eq("host_user_id", uid)
		          .order("created_at", { ascending: false })
		          .limit(20),
		      ]);
		      if (token !== state.profileSheetToken) return;
		      state.profileSheetProfile = profile || null;
		      state.profileSheetPresence = presence || null;
		      const rows = Array.isArray(sessions) ? sessions : [];
		      state.profileSheetSessions = rows.map((row) => ({
		        id: row.id,
		        slug: row.slug,
		        title: row.title,
		        host_user_id: row.host_user_id,
		        host: row.host_name,
		        genre: row.genre,
		        tags: row.tags,
		        cover_url: row.cover_url,
		        url: row.storage_path,
		        plays: row.session_stats?.[0]?.plays ?? 0,
		        downloads: row.session_stats?.[0]?.downloads ?? 0,
		        likes: row.session_stats?.[0]?.likes ?? 0,
		        created_at: row.created_at,
		        visibility: row.visibility,
		      }));
		      state.profileSheetLoading = false;
		      renderProfileSheet();
		    } catch (err) {
		      console.warn("profile sheet load failed", err);
		      if (token !== state.profileSheetToken) return;
		      state.profileSheetLoading = false;
		      state.profileSheetSessions = [];
		      renderProfileSheet();
		    }
		  }

		  function renderProfileSheet() {
		    if (!dom.profileSheetOverlay) return;
		    const uid = state.profileSheetUserId;
		    if (!uid) {
		      dom.profileSheetOverlay.classList.add("hidden");
		      return;
		    }

		    const p = state.profileSheetProfile || null;
		    const title = p?.display_name || (p?.handle ? `@${p.handle}` : "Profile");
		    if (dom.profileSheetTitle) dom.profileSheetTitle.textContent = title;
		    const bits = [];
		    if (p?.handle) bits.push(`@${p.handle}`);
		    if (p?.display_name) bits.push(p.display_name);
		    const presence = state.profileSheetPresence;
		    if (presence && isPresenceActive(presence)) bits.push("active");
		    if (dom.profileSheetSubtitle) dom.profileSheetSubtitle.textContent = bits.filter(Boolean).join(" · ") || uid.slice(0, 8);

		    const me = state.supabaseSession?.user?.id || "";
		    if (dom.profileSheetFollow) {
		      const canFollow = !!me && uid !== me;
		      dom.profileSheetFollow.style.display = canFollow ? "" : "none";
		      dom.profileSheetFollow.disabled = !canFollow;
		      dom.profileSheetFollow.textContent = followButtonLabel(uid);
		      dom.profileSheetFollow.onclick = async () => {
		        try {
		          if (state.following.has(uid)) await unfollowUserId(uid);
		          else await followUserId(uid);
		          await loadFollowing();
		          await loadFollowers();
		          renderProfileSheet();
		        } catch (err) {
		          alert(`Follow failed: ${err?.message || "unknown error"}`);
		        }
		      };
		    }

		    if (!dom.profileSheetSessions) return;
		    dom.profileSheetSessions.innerHTML = "";
		    if (state.profileSheetLoading) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const t = document.createElement("div");
		      t.className = "title";
		      t.textContent = "Loading…";
		      const s = document.createElement("div");
		      s.className = "subtitle";
		      s.textContent = "Fetching profile and recent sessions.";
		      meta.appendChild(t);
		      meta.appendChild(s);
		      li.appendChild(meta);
		      dom.profileSheetSessions.appendChild(li);
		      return;
		    }

		    const sessions = Array.isArray(state.profileSheetSessions) ? state.profileSheetSessions : [];
		    if (!sessions.length) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const t = document.createElement("div");
		      t.className = "title";
		      t.textContent = "No sessions yet.";
		      const s = document.createElement("div");
		      s.className = "subtitle";
		      s.textContent = "Check back later.";
		      meta.appendChild(t);
		      meta.appendChild(s);
		      li.appendChild(meta);
		      dom.profileSheetSessions.appendChild(li);
		      return;
		    }

		    sessions.forEach((row) => {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const t = document.createElement("div");
		      t.className = "title";
		      t.textContent = row.title || row.slug || row.id || "Untitled";
		      const s = document.createElement("div");
		      s.className = "subtitle";
		      s.textContent = formatSessionSubtitle(row);
		      meta.appendChild(t);
		      meta.appendChild(s);
		      const actions = document.createElement("div");
		      actions.className = "actions";
		      if (row?.id) {
		        const sendBtn = document.createElement("button");
		        sendBtn.type = "button";
		        sendBtn.textContent = "Send";
		        sendBtn.addEventListener("click", () => sendSessionToHandle(row.id));
		        actions.appendChild(sendBtn);
		      }
		      const loadBtn = document.createElement("button");
		      loadBtn.type = "button";
		      loadBtn.textContent = "Load";
		      loadBtn.addEventListener("click", () => loadSessionEntry(row));
		      actions.appendChild(loadBtn);
		      li.appendChild(meta);
		      li.appendChild(actions);
		      dom.profileSheetSessions.appendChild(li);
		    });
		  }

		  function isPresenceActive(row) {
		    if (!row?.last_seen_at) return false;
		    const last = Date.parse(row.last_seen_at);
		    if (!Number.isFinite(last)) return false;
	    return Date.now() - last < 70_000;
	  }

	  async function refreshPresenceForSessions() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      state.presence = new Map();
	      return;
	    }
	    const ids = Array.from(
	      new Set(
	        [...(state.sessions || []), ...(state.live || [])]
	          .map((s) => s?.host_user_id)
	          .filter(Boolean),
	      ),
	    );
	    if (!ids.length) return;
	    try {
	      const { data, error } = await client.from("profile_presence").select("user_id, last_seen_at, status").in("user_id", ids);
	      if (error) throw error;
	      state.presence = new Map((data || []).map((r) => [r.user_id, r]));
	    } catch (err) {
	      console.warn("presence fetch failed", err);
	      state.presence = new Map();
	    }
	  }

	  async function upsertPresence({ offline } = { offline: false }) {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) return;
	    const status = offline ? "offline" : "online";
	    try {
	      await client.from("profile_presence").upsert({
	        user_id: uid,
	        last_seen_at: new Date().toISOString(),
	        status,
	      });
	    } catch (err) {
	      console.warn("presence upsert failed", err);
	    }
	  }

	  function startPresenceHeartbeat() {
	    stopPresenceHeartbeat();
	    upsertPresence().catch(() => {});
	    state.presenceTimer = setInterval(() => upsertPresence().catch(() => {}), 30_000);
	  }

		  function stopPresenceHeartbeat() {
		    if (state.presenceTimer) {
		      clearInterval(state.presenceTimer);
		      state.presenceTimer = null;
		    }
		    upsertPresence({ offline: true }).catch(() => {});
		  }

		  async function refreshPresenceForCurrentFeed() {
		    await refreshPresenceForSessions();
		    const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
		    if (feed === "live" || feed === "live_nearby") renderSupabaseLive();
		    else renderSupabaseSessions();
		  }

		  function startPresenceViewerRefresh() {
		    stopPresenceViewerRefresh();
		    refreshPresenceForCurrentFeed().catch(() => {});
		    state.presenceViewerTimer = setInterval(() => refreshPresenceForCurrentFeed().catch(() => {}), 25_000);
		  }

		  function stopPresenceViewerRefresh() {
		    if (state.presenceViewerTimer) {
		      clearInterval(state.presenceViewerTimer);
		      state.presenceViewerTimer = null;
		    }
		  }

		  function unsubscribeInbox() {
		    if (state.inboxChannel) {
		      try {
		        state.inboxChannel.unsubscribe().catch(() => {});
		      } catch {
	        // ignore
	      }
		      state.inboxChannel = null;
		    }
		  }

		  function unsubscribeFollows() {
		    if (state.followsChannel) {
		      try {
		        state.followsChannel.unsubscribe().catch(() => {});
		      } catch {
		        // ignore
		      }
		      state.followsChannel = null;
		    }
		  }

		  function subscribeFollows() {
		    unsubscribeFollows();
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid) return;
		    const rerender = () => {
		      const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
		      if (feed === "following" || feed === "friends") {
		        loadSupabaseSessions();
		      } else if (feed === "live" || feed === "live_nearby") {
		        renderSupabaseLive();
		      } else if (feed === "inbox") {
		        renderSupabaseInbox();
		      } else {
		        renderSupabaseSessions();
		      }
		      renderPeopleResults();
		      if (state.profileSheetUserId) renderProfileSheet();
		    };
		    try {
		      state.followsChannel = client
		        .channel("rs-follows")
		        .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` }, (payload) => {
		          const row = payload?.new || null;
		          if (row?.followed_id) state.following.add(row.followed_id);
		          rerender();
		        })
		        .on("postgres_changes", { event: "DELETE", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` }, (payload) => {
		          const row = payload?.old || null;
		          if (row?.followed_id) state.following.delete(row.followed_id);
		          rerender();
		        })
		        .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` }, (payload) => {
		          const row = payload?.new || null;
		          if (row?.follower_id) state.followers.add(row.follower_id);
		          rerender();
		        })
		        .on("postgres_changes", { event: "DELETE", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` }, (payload) => {
		          const row = payload?.old || null;
		          if (row?.follower_id) state.followers.delete(row.follower_id);
		          rerender();
		        })
		        .subscribe();
		    } catch (err) {
		      console.warn("follows subscribe failed", err);
		      state.followsChannel = null;
		    }
		  }

		  function subscribeInbox() {
		    unsubscribeInbox();
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid) return;
	    try {
	      state.inboxChannel = client
	        .channel("rs-inbox")
	        .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_items", filter: `to_user_id=eq.${uid}` }, (payload) => {
	          const row = payload?.new || null;
	          if (row?.status === "unread") {
	            state.inboxUnreadCount = Math.max(0, Number(state.inboxUnreadCount) || 0) + 1;
	            updateInboxFeedLabel();
	          } else {
	            refreshInboxUnreadCount().catch(() => {});
	          }
	          if (state.sessionsFeed === "inbox") loadSupabaseSessions();
	        })
	        .subscribe();
	    } catch (err) {
	      console.warn("inbox subscribe failed", err);
	      state.inboxChannel = null;
	    }
	  }

	  function setSessionsStatus(text) {
	    if (!dom.sessionsStatus) return;
	    dom.sessionsStatus.textContent = text || "—";
	  }

	  function updateInboxFeedLabel() {
	    if (!dom.sessionsFeed) return;
	    const opt = dom.sessionsFeed.querySelector('option[value="inbox"]');
	    if (!opt) return;
	    const unread = Math.max(0, Number(state.inboxUnreadCount) || 0);
	    opt.textContent = unread ? `Inbox (${unread})` : "Inbox";
	  }

	  async function refreshInboxUnreadCount() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      state.inboxUnreadCount = 0;
	      updateInboxFeedLabel();
	      return;
	    }
	    try {
	      const { count, error } = await client
	        .from("inbox_items")
	        .select("id", { count: "exact", head: true })
	        .eq("to_user_id", uid)
	        .eq("status", "unread");
	      if (error) throw error;
	      state.inboxUnreadCount = count || 0;
	    } catch (err) {
	      console.warn("refreshInboxUnreadCount failed", err);
	      state.inboxUnreadCount = (state.inbox || []).filter((x) => x.status === "unread").length;
	    }
	    updateInboxFeedLabel();
	  }

		  async function loadSupabaseSessions() {
	    if (!dom.sessionsList) return;
	    const client = initSupabaseClient();
	    if (!client) {
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Supabase not configured");
	      return;
	    }
	    ensureSessionsStatsSubscription();
	    state.sessionsLoading = true;
		    setSessionsStatus("Loading…");
		    try {
		      const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
		      const authed = !!state.supabaseSession?.user?.id;
		      const isLiveFeed = feed === "live" || feed === "live_nearby";
		      if (dom.goLiveBtn) dom.goLiveBtn.disabled = !isLiveFeed || !authed;
		      if (dom.endLiveBtn) dom.endLiveBtn.disabled = !isLiveFeed || !authed || !state.currentLive?.id;
		      const sortKey = state.sessionsSort || dom.sessionsSort?.value || "new";
		      const q = state.sessionsQuery || (dom.sessionsSearch?.value || "").trim() || null;

	      if (feed === "inbox") {
	        await loadSupabaseInbox();
	        return;
	      }
		      if (feed === "following") {
		        await loadFollowingSessions({ q, sortKey });
		        return;
		      }
		      if (feed === "friends") {
		        await loadFriendsSessions({ q, sortKey });
		        return;
		      }
		      if (feed === "live" || feed === "live_nearby") {
		        await loadSupabaseLive({ near: feed === "live_nearby" });
		        return;
		      }

	      const functionSort = sortKey === "plays" ? "trending" : sortKey === "downloads" ? "top" : "new";
	      const zip = feed === "nearby" ? String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim() || null : null;
	      const { data, error } = await client.functions.invoke("list_sessions", {
	        headers: getSupabaseAuthHeaders(),
	        body: { q, sort: functionSort, limit: 50, zip },
	      });
	      if (error) throw error;
	      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
	      state.sessions = sortKey === "likes" ? sessions.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0)) : sessions;
	      await refreshPresenceForSessions();
	      renderSupabaseSessions();
	      setSessionsStatus(`${state.sessions.length} sessions${feed === "nearby" && zip ? ` · near ${zip}` : ""}`);
	    } catch (err) {
	      console.warn("Supabase sessions fetch failed", err);
	      const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
	      if (feed === "public") {
	        try {
	          const res = await fetch("sessions/top-sessions.json", { cache: "no-store" });
	          if (!res.ok) throw new Error(`HTTP ${res.status}`);
	          const data = await res.json();
	          state.sessions = Array.isArray(data.sessions) ? data.sessions : [];
	          renderSupabaseSessions();
	          setSessionsStatus(`${state.sessions.length} sessions · offline fallback`);
	          return;
	        } catch {
	          // ignore
	        }
	      }
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Failed to load");
	    } finally {
	      state.sessionsLoading = false;
	    }
	  }

	  async function loadFollowingSessions({ q, sortKey }) {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Sign in to view Following");
	      return;
	    }
	    await loadFollowing();
	    const ids = Array.from(state.following || []);
	    if (!ids.length) {
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Following feed is empty — follow someone first");
	      return;
	    }
	    try {
	      let query = client
	        .from("sessions")
	        .select("id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)")
	        .in("host_user_id", ids)
	        .order("created_at", { ascending: false })
	        .limit(50);
	      if (q) {
	        const pattern = `%${q}%`;
	        query = query.or(
	          [
	            `title.ilike.${pattern}`,
	            `host_name.ilike.${pattern}`,
	            `genre.ilike.${pattern}`,
	            `tags::text.ilike.${pattern}`,
	          ].join(","),
	        );
	      }
	      const { data, error } = await query;
	      if (error) throw error;
	      const rows = Array.isArray(data) ? data : [];
	      state.sessions = rows.map((row) => ({
	        id: row.id,
	        slug: row.slug,
	        title: row.title,
	        host_user_id: row.host_user_id,
	        host: row.host_name,
	        genre: row.genre,
	        tags: row.tags,
	        cover_url: row.cover_url,
	        url: row.storage_path,
	        plays: row.session_stats?.[0]?.plays ?? 0,
	        downloads: row.session_stats?.[0]?.downloads ?? 0,
	        likes: row.session_stats?.[0]?.likes ?? 0,
	        created_at: row.created_at,
	        visibility: row.visibility,
	      }));
	      await refreshPresenceForSessions();
	      if (sortKey === "likes") state.sessions.sort((a, b) => (b.likes || 0) - (a.likes || 0));
	      renderSupabaseSessions();
	      setSessionsStatus(`${state.sessions.length} sessions · following`);
	    } catch (err) {
	      console.warn("following feed failed", err);
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Failed to load Following");
	    }
	  }

	  async function loadFriendsSessions({ q, sortKey }) {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Sign in to view Friends");
	      return;
	    }
	    await loadFollowing();
	    await loadFollowers();
	    const ids = Array.from(state.following || []).filter((id) => state.followers.has(id));
	    if (!ids.length) {
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Friends feed is empty — mutual follows appear here");
	      return;
	    }
	    try {
	      let query = client
	        .from("sessions")
	        .select("id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)")
	        .in("host_user_id", ids)
	        .order("created_at", { ascending: false })
	        .limit(50);
	      if (q) {
	        const pattern = `%${q}%`;
	        query = query.or(
	          [
	            `title.ilike.${pattern}`,
	            `host_name.ilike.${pattern}`,
	            `genre.ilike.${pattern}`,
	            `tags::text.ilike.${pattern}`,
	          ].join(","),
	        );
	      }
	      const { data, error } = await query;
	      if (error) throw error;
	      const rows = Array.isArray(data) ? data : [];
	      state.sessions = rows.map((row) => ({
	        id: row.id,
	        slug: row.slug,
	        title: row.title,
	        host_user_id: row.host_user_id,
	        host: row.host_name,
	        genre: row.genre,
	        tags: row.tags,
	        cover_url: row.cover_url,
	        url: row.storage_path,
	        plays: row.session_stats?.[0]?.plays ?? 0,
	        downloads: row.session_stats?.[0]?.downloads ?? 0,
	        likes: row.session_stats?.[0]?.likes ?? 0,
	        created_at: row.created_at,
	        visibility: row.visibility,
	      }));
	      await refreshPresenceForSessions();
	      if (sortKey === "likes") state.sessions.sort((a, b) => (b.likes || 0) - (a.likes || 0));
	      renderSupabaseSessions();
	      setSessionsStatus(`${state.sessions.length} sessions · friends`);
	    } catch (err) {
	      console.warn("friends feed failed", err);
	      state.sessions = [];
	      renderSupabaseSessions();
	      setSessionsStatus("Failed to load Friends");
	    }
	  }

	  async function loadSupabaseInbox() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      state.inbox = [];
	      state.inboxUnreadCount = 0;
	      renderSupabaseInbox();
	      updateInboxFeedLabel();
	      setSessionsStatus("Sign in to view Inbox");
	      return;
	    }
	    state.inboxLoading = true;
	    setSessionsStatus("Loading inbox…");
	    try {
	      const { data, error } = await client
	        .from("inbox_items")
	        .select("id, from_user_id, session_id, note, status, created_at, read_at")
	        .eq("to_user_id", uid)
	        .order("created_at", { ascending: false })
	        .limit(50);
	      if (error) throw error;
	      const rows = Array.isArray(data) ? data : [];
	      const fromIds = Array.from(new Set(rows.map((r) => r.from_user_id).filter(Boolean)));
	      const senderById = new Map();
	      if (fromIds.length) {
	        const { data: senders } = await client.from("profiles").select("user_id, handle, display_name").in("user_id", fromIds);
	        (senders || []).forEach((p) => senderById.set(p.user_id, p));
	      }
	      state.inbox = rows.map((r) => ({ ...r, from: senderById.get(r.from_user_id) || null }));
	      const unread = state.inbox.filter((x) => x.status === "unread").length;
	      state.inboxUnreadCount = unread;
	      renderSupabaseInbox();
	      updateInboxFeedLabel();
	      setSessionsStatus(`${state.inbox.length} inbox items${unread ? ` · ${unread} unread` : ""}`);
	    } catch (err) {
	      console.warn("inbox load failed", err);
	      state.inbox = [];
	      state.inboxUnreadCount = 0;
	      renderSupabaseInbox();
	      updateInboxFeedLabel();
	      setSessionsStatus("Failed to load Inbox");
	    } finally {
	      state.inboxLoading = false;
	    }
	  }

	  async function markInboxRead(itemId) {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid || !itemId) return;
	    try {
	      await client.from("inbox_items").update({ status: "read", read_at: new Date().toISOString() }).eq("id", itemId).eq("to_user_id", uid);
	      const row = (state.inbox || []).find((x) => x.id === itemId);
		      if (row) {
		        row.status = "read";
		        row.read_at = new Date().toISOString();
		      }
		      renderSupabaseInbox();
		      state.inboxUnreadCount = (state.inbox || []).filter((x) => x.status === "unread").length;
		      updateInboxFeedLabel();
		    } catch (err) {
		      console.warn("markInboxRead failed", err);
		    }
		  }

		  async function loadSupabaseLive({ near } = { near: false }) {
		    const client = initSupabaseClient();
		    if (!client) {
		      state.live = [];
		      renderSupabaseLive();
		      setSessionsStatus("Supabase not configured");
		      return;
		    }
		    state.liveLoading = true;
		    setSessionsStatus("Loading live…");
		    try {
		      let zip = null;
		      if (near) {
		        const optIn = !!dom.profileLocationOptIn?.checked || localStorage.getItem(PROFILE_ZIP_OPTIN_KEY) === "true";
		        const zipRaw = String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim() || null;
		        if (!optIn || !zipRaw) {
		          state.live = [];
		          state.presence = new Map();
		          renderSupabaseLive();
		          setSessionsStatus("Set zip + enable location opt-in for Live Nearby");
		          return;
		        }
		        zip = zipRaw;
		      }
		      const { data, error } = await client.functions.invoke("list_live", {
		        headers: getSupabaseAuthHeaders(),
		        body: { zip, limit: 50 },
		      });
		      if (error) throw error;
		      state.live = Array.isArray(data?.live) ? data.live : [];
		      await refreshPresenceForSessions();
		      renderSupabaseLive();
		      setSessionsStatus(`${state.live.length} live${near && zip ? ` · near ${zip}` : ""}`);
		    } catch (err) {
		      console.warn("live load failed", err);
		      state.live = [];
		      renderSupabaseLive();
	      setSessionsStatus("Failed to load Live");
	    } finally {
	      state.liveLoading = false;
	    }
	  }

		  function renderSupabaseSessions() {
		    if (!dom.sessionsList) return;
		    dom.sessionsList.innerHTML = "";
		    const sessions = state.sessions || [];
		    const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
		    const zip = String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim();
		    if (!sessions.length) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      if (feed === "nearby" && !zip) {
		        title.textContent = "Add a zip code in Account.";
		      } else if (feed === "following") {
		        title.textContent = "Following feed is empty.";
		      } else if (feed === "friends") {
		        title.textContent = "Friends feed is empty.";
		      } else {
		        title.textContent = "No sessions yet.";
		      }
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      if (feed === "nearby" && !zip) {
		        sub.textContent = "Account → Location, then refresh.";
		      } else if (feed === "following") {
		        sub.textContent = "Follow someone in Account → People.";
		      } else if (feed === "friends") {
		        sub.textContent = "Mutual follows show up here.";
		      } else {
		        sub.textContent = "Publish a show to Supabase or switch feeds.";
		      }
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.sessionsList.appendChild(li);
		      return;
		    }
	    sessions.forEach((row) => {
	      const li = document.createElement("li");
	      if (row?.id) li.dataset.sessionId = row.id;
	      const meta = document.createElement("div");
	      meta.className = "meta";
	      const title = document.createElement("div");
	      title.className = "title";
	      title.textContent = row.title || row.slug || row.id || "Untitled";
	      const sub = document.createElement("div");
	      sub.className = "subtitle";
	      if (row?.id) sub.dataset.sessionId = row.id;
	      sub.textContent = formatSessionSubtitle(row);
	      const presence = row?.host_user_id ? state.presence.get(row.host_user_id) : null;
	      if (presence && isPresenceActive(presence)) {
	        const badge = document.createElement("span");
	        badge.className = "presence";
	        const dot = document.createElement("span");
	        dot.className = "presence-dot";
	        const label = document.createElement("span");
	        label.className = "presence-label";
	        label.textContent = "active";
	        badge.appendChild(dot);
	        badge.appendChild(label);
	        sub.appendChild(document.createTextNode(" "));
	        sub.appendChild(badge);
	      }
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
	    if (row?.host_user_id && row.host_user_id !== (state.supabaseSession?.user?.id || "")) {
	        const followBtn = document.createElement("button");
	        followBtn.type = "button";
	        followBtn.textContent = followButtonLabel(row.host_user_id);
	        followBtn.addEventListener("click", async () => {
	          try {
	            if (state.following.has(row.host_user_id)) {
	              await unfollowUserId(row.host_user_id);
	            } else {
	              await followUserId(row.host_user_id);
	            }
	            followBtn.textContent = followButtonLabel(row.host_user_id);
	          } catch (err) {
	            alert(`Follow failed: ${err?.message || "unknown error"}`);
	          }
	        });
	        actions.appendChild(followBtn);
	      }
		      if (row?.id) {
		        const sendBtn = document.createElement("button");
		        sendBtn.type = "button";
		        sendBtn.textContent = "Send";
		        sendBtn.addEventListener("click", () => sendSessionToHandle(row.id));
		        actions.appendChild(sendBtn);
		      }
		      if (row?.host_user_id) {
		        const profileBtn = document.createElement("button");
		        profileBtn.type = "button";
		        profileBtn.textContent = "Profile";
		        profileBtn.addEventListener("click", () => openProfileSheet(row.host_user_id));
		        actions.appendChild(profileBtn);
		      }
		      const loadBtn = document.createElement("button");
		      loadBtn.textContent = "Load";
		      loadBtn.addEventListener("click", () => loadSessionEntry(row));
		      actions.appendChild(loadBtn);
	      li.appendChild(meta);
	      li.appendChild(actions);
	      dom.sessionsList.appendChild(li);
	    });
	  }

	  function renderSupabaseInbox() {
	    if (!dom.sessionsList) return;
	    dom.sessionsList.innerHTML = "";
	    const items = state.inbox || [];
	    if (!items.length) {
	      const li = document.createElement("li");
	      const meta = document.createElement("div");
	      meta.className = "meta";
	      const title = document.createElement("div");
	      title.className = "title";
	      title.textContent = "Inbox is empty.";
	      const sub = document.createElement("div");
	      sub.className = "subtitle";
	      sub.textContent = "Send a session to a friend to see it here.";
	      meta.appendChild(title);
	      meta.appendChild(sub);
	      li.appendChild(meta);
	      dom.sessionsList.appendChild(li);
	      return;
	    }
	    items.forEach((item) => {
	      const li = document.createElement("li");
	      const meta = document.createElement("div");
	      meta.className = "meta";
	      const title = document.createElement("div");
	      title.className = "title";
	      const fromHandle = item?.from?.handle ? `@${item.from.handle}` : item?.from?.display_name || "Someone";
	      title.textContent = item.status === "unread" ? `New from ${fromHandle}` : `From ${fromHandle}`;
	      const sub = document.createElement("div");
	      sub.className = "subtitle";
	      const when = item?.created_at ? new Date(item.created_at).toLocaleString() : "";
	      sub.textContent = [item.note || null, when || null, item.session_id ? `session: ${item.session_id.slice(0, 8)}…` : null].filter(Boolean).join(" · ");
	      meta.appendChild(title);
	      meta.appendChild(sub);
	      const actions = document.createElement("div");
	      actions.className = "actions";
		      if (item.session_id) {
		        const loadBtn = document.createElement("button");
		        loadBtn.type = "button";
		        loadBtn.textContent = "Load";
		        loadBtn.addEventListener("click", () => {
		          loadSessionEntry({ id: item.session_id });
		          if (item.status === "unread") markInboxRead(item.id);
		        });
		        actions.appendChild(loadBtn);
		      }
	      if (item.status === "unread") {
	        const readBtn = document.createElement("button");
	        readBtn.type = "button";
	        readBtn.textContent = "Mark Read";
	        readBtn.addEventListener("click", () => markInboxRead(item.id));
	        actions.appendChild(readBtn);
	      }
	      li.appendChild(meta);
	      li.appendChild(actions);
	      dom.sessionsList.appendChild(li);
	    });
	  }

			  function renderSupabaseLive() {
			    if (!dom.sessionsList) return;
			    dom.sessionsList.innerHTML = "";
			    const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
			    const zip = String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim();
			    const optIn = !!dom.profileLocationOptIn?.checked || localStorage.getItem(PROFILE_ZIP_OPTIN_KEY) === "true";
			    const rows = state.live || [];
		    if (!rows.length) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      if (feed === "live_nearby" && (!optIn || !zip)) {
		        title.textContent = "Set zip + opt-in for Live Nearby.";
		      } else {
		        title.textContent = "No one is live right now.";
		      }
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      if (feed === "live_nearby" && (!optIn || !zip)) {
		        sub.textContent = "Update Account → Location, then refresh.";
		      } else {
		        sub.textContent = "Go Live to start a voice room.";
		      }
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.sessionsList.appendChild(li);
		      return;
		    }
	    rows.forEach((row) => {
	      const li = document.createElement("li");
	      const meta = document.createElement("div");
	      meta.className = "meta";
	      const title = document.createElement("div");
	      title.className = "title";
		      title.textContent = row.title || "Live";
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      sub.textContent = [row.host || "Unknown", row.started_at ? new Date(row.started_at).toLocaleString() : null, row.zip || null].filter(Boolean).join(" · ");
		      const presence = row?.host_user_id ? state.presence.get(row.host_user_id) : null;
	      if (presence && isPresenceActive(presence)) {
	        const badge = document.createElement("span");
	        badge.className = "presence";
	        const dot = document.createElement("span");
	        dot.className = "presence-dot";
	        const label = document.createElement("span");
	        label.className = "presence-label";
	        label.textContent = "active";
	        badge.appendChild(dot);
	        badge.appendChild(label);
	        sub.appendChild(document.createTextNode(" "));
	        sub.appendChild(badge);
	      }
	      meta.appendChild(title);
	      meta.appendChild(sub);
		      const actions = document.createElement("div");
		      actions.className = "actions";
		      const joinBtn = document.createElement("button");
		      joinBtn.type = "button";
		      joinBtn.textContent = "Join";
		      joinBtn.addEventListener("click", () => joinLive(row));
		      actions.appendChild(joinBtn);
		      const uid = state.supabaseSession?.user?.id || "";
			      if (row?.host_user_id && uid && row.host_user_id !== uid) {
			        const followBtn = document.createElement("button");
			        followBtn.type = "button";
			        followBtn.textContent = followButtonLabel(row.host_user_id);
			        followBtn.addEventListener("click", async () => {
			          try {
			            if (state.following.has(row.host_user_id)) {
			              await unfollowUserId(row.host_user_id);
			            } else {
			              await followUserId(row.host_user_id);
			            }
			            followBtn.textContent = followButtonLabel(row.host_user_id);
			          } catch (err) {
			            alert(`Follow failed: ${err?.message || "unknown error"}`);
			          }
			        });
			        actions.appendChild(followBtn);
			      }
			      if (row?.host_user_id) {
			        const profileBtn = document.createElement("button");
			        profileBtn.type = "button";
			        profileBtn.textContent = "Profile";
			        profileBtn.addEventListener("click", () => openProfileSheet(row.host_user_id));
			        actions.appendChild(profileBtn);
			      }
			      li.appendChild(meta);
			      li.appendChild(actions);
			      dom.sessionsList.appendChild(li);
			    });
			  }

			  function openLiveRoom(row) {
			    if (!row?.id) {
			      alert("No live session id.");
			      return;
			    }
			    resetLiveRtc();
			    state.liveRtcProcessed = new Set();
			    state.liveRoom = row;
			    state.liveRoomEvents = [];
			    state.liveRoomProfiles = new Map();
				    if (dom.liveRoomMessage) dom.liveRoomMessage.value = "";
				    if (dom.liveRoom) dom.liveRoom.classList.remove("collapsed");
				    renderLiveRoom();
				    renderLiveRoomEvents({ scrollToBottom: false });
				    loadLiveRoomEvents(row.id).catch(() => {});
				    subscribeLiveRoom(row.id);
				  }

				  function closeLiveRoom() {
				    try {
				      const uid = state.supabaseSession?.user?.id || "";
				      const hostId = state.liveRoom?.host_user_id || "";
				      const rtc = state.liveRtc;
				      if (uid && hostId && rtc) {
				        if (uid === hostId) {
				          const peerIds = Array.from(rtc.peers instanceof Map ? rtc.peers.keys() : []);
				          const pendingIds = Array.from(rtc.pendingOffers instanceof Map ? rtc.pendingOffers.keys() : []);
				          const toHangup = Array.from(new Set([...peerIds, ...pendingIds])).filter(Boolean);
				          for (const remoteUserId of toHangup) {
				            sendLiveRtcEvent("webrtc_hangup", { to_user_id: remoteUserId, from_user_id: uid, reason: "host_room_closed" }).catch(() => {});
				          }
				        } else if (rtc.listening) {
				          sendLiveRtcEvent("webrtc_hangup", { to_user_id: hostId, from_user_id: uid, reason: "listener_room_closed" }).catch(() => {});
				        }
				      }
				    } catch {}
				    resetLiveRtc();
				    unsubscribeLiveRoom();
				    state.liveRoom = null;
				    state.liveRoomEvents = [];
				    state.liveRoomProfiles = new Map();
			    if (dom.liveRoom) dom.liveRoom.classList.add("collapsed");
			  }

			  function renderLiveRoom() {
			    const row = state.liveRoom;
			    if (!row) return;
			    if (dom.liveRoomTitle) dom.liveRoomTitle.textContent = row.title || "Live Room";
			    const bits = [];
				    if (row.host) {
				      const hostLabel = String(row.host);
				      bits.push(hostLabel.startsWith("@") ? hostLabel : `@${hostLabel}`);
				    } else {
				      bits.push("live");
				    }
				    if (row.room_name) bits.push(`room: ${row.room_name}`);
				    bits.push("voice (beta)");
				    if (dom.liveRoomSubtitle) dom.liveRoomSubtitle.textContent = bits.filter(Boolean).join(" · ");
				    if (dom.liveRoomSend) dom.liveRoomSend.disabled = !(state.supabaseSession?.user?.id || "");
				    updateLiveRtcUi();
				  }

			  const LIVE_RTC_EVENT_TYPES = new Set(["webrtc_offer", "webrtc_answer", "webrtc_ice", "webrtc_hangup"]);
			  const LIVE_RTC_CONFIG = {
			    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			  };

			  function isLiveRtcEventType(type) {
			    return !!type && LIVE_RTC_EVENT_TYPES.has(type);
			  }

			  function ensureLiveRtc() {
			    if (!state.liveRtc) {
			      state.liveRtc = {
			        micEnabled: false,
			        localStream: null,
			        peers: new Map(),
			        listening: false,
			        pc: null,
			        remoteStream: null,
			        pendingOffers: new Map(),
			        pendingCandidates: new Map(),
			      };
			    }
			    return state.liveRtc;
			  }

			  function isHostInLiveRoom() {
			    const uid = state.supabaseSession?.user?.id || "";
			    const hostId = state.liveRoom?.host_user_id || "";
			    return !!uid && !!hostId && uid === hostId;
			  }

			  function setLiveAudioStatus(text) {
			    if (!dom.liveRoomAudioStatus) return;
			    dom.liveRoomAudioStatus.textContent = text || "—";
			  }

			  function updateLiveRtcUi() {
			    const rtc = ensureLiveRtc();
			    const uid = state.supabaseSession?.user?.id || "";
			    const authed = !!uid;
			    const isHost = isHostInLiveRoom();

			    if (dom.liveRoomMicBtn) {
			      dom.liveRoomMicBtn.style.display = isHost ? "" : "none";
			      dom.liveRoomMicBtn.disabled = !authed;
			      dom.liveRoomMicBtn.textContent = rtc.micEnabled ? "Disable Mic" : "Enable Mic";
			    }
			    if (dom.liveRoomAudioBtn) {
			      dom.liveRoomAudioBtn.style.display = isHost ? "none" : "";
			      dom.liveRoomAudioBtn.disabled = !authed;
			      dom.liveRoomAudioBtn.textContent = rtc.listening ? "Disable Audio" : "Enable Audio";
			    }

			    if (!authed) {
			      setLiveAudioStatus("Sign in for chat + audio");
			      return;
			    }
			    if (isHost) {
			      const peerCount = rtc.peers instanceof Map ? rtc.peers.size : 0;
			      if (rtc.micEnabled) setLiveAudioStatus(`Mic on · ${peerCount} listener${peerCount === 1 ? "" : "s"}`);
			      else setLiveAudioStatus(rtc.pendingOffers?.size ? `Enable mic to accept ${rtc.pendingOffers.size} listener${rtc.pendingOffers.size === 1 ? "" : "s"}` : "Mic off");
			      return;
			    }
			    setLiveAudioStatus(rtc.listening ? "Listening" : "Audio off");
			  }

			  function resetLiveRtc() {
			    const rtc = state.liveRtc;
			    if (rtc) {
			      try {
			        if (rtc.pc) rtc.pc.close();
			      } catch {}
			      rtc.pc = null;
			      try {
			        if (rtc.peers instanceof Map) {
			          rtc.peers.forEach((pc) => {
			            try {
			              pc.close();
			            } catch {}
			          });
			        }
			      } catch {}
			      rtc.peers = new Map();
			      try {
			        if (rtc.localStream) rtc.localStream.getTracks().forEach((t) => t.stop());
			      } catch {}
			      rtc.localStream = null;
			      rtc.remoteStream = null;
			      rtc.listening = false;
			      rtc.micEnabled = false;
			      rtc.pendingOffers = new Map();
			      rtc.pendingCandidates = new Map();
			    }
			    if (dom.liveRoomAudioEl) {
			      try {
			        dom.liveRoomAudioEl.srcObject = null;
			      } catch {}
			    }
			    state.liveRtc = null;
			    updateLiveRtcUi();
			  }

			  async function sendLiveRtcEvent(type, payload) {
			    const client = initSupabaseClient();
			    const uid = state.supabaseSession?.user?.id || "";
			    const liveId = state.liveRoom?.id || "";
			    if (!client || !uid || !liveId) return { ok: false };
			    try {
			      const { error } = await client.from("live_events").insert({
			        live_session_id: liveId,
			        user_id: uid,
			        type,
			        payload: payload || {},
			      });
			      if (error) throw error;
			      return { ok: true };
			    } catch (err) {
			      console.warn("sendLiveRtcEvent failed", err);
			      return { ok: false, error: err };
			    }
			  }

			  function normalizeCandidate(candidate) {
			    if (!candidate) return null;
			    if (typeof candidate === "string") return { candidate };
			    if (typeof candidate === "object" && candidate.candidate) return candidate;
			    return null;
			  }

				  async function handleLiveRtcSignal(ev) {
				    if (!ev?.id || state.liveRtcProcessed.has(ev.id)) return;
				    if (!isLiveRtcEventType(ev.type)) return;
				    state.liveRtcProcessed.add(ev.id);

			    const rtc = ensureLiveRtc();
			    const uid = state.supabaseSession?.user?.id || "";
			    const hostId = state.liveRoom?.host_user_id || "";
			    const isHost = isHostInLiveRoom();
			    const payload = ev?.payload || {};

			    if (ev.type === "webrtc_offer" && isHost) {
			      const to = payload.to_user_id || hostId;
			      if (to && uid && to !== uid) return;
			      const fromUserId = payload.from_user_id || ev.user_id || "";
			      const sdp = payload.sdp || "";
			      if (!fromUserId || !sdp) return;
			      if (!rtc.micEnabled || !rtc.localStream) {
			        rtc.pendingOffers.set(fromUserId, sdp);
			        updateLiveRtcUi();
			        return;
			      }
			      await hostAcceptOffer(fromUserId, sdp);
			      return;
			    }

			    if (ev.type === "webrtc_answer" && !isHost) {
			      const to = payload.to_user_id || "";
			      if (!uid || to !== uid) return;
			      const sdp = payload.sdp || "";
			      if (!sdp || !rtc.pc) return;
			      try {
			        await rtc.pc.setRemoteDescription({ type: "answer", sdp });
			      } catch (err) {
			        console.warn("setRemoteDescription(answer) failed", err);
			      }
			      const queued = rtc.pendingCandidates.get(hostId) || [];
			      for (const cand of queued) {
			        try {
			          await rtc.pc.addIceCandidate(cand);
			        } catch {}
			      }
			      rtc.pendingCandidates.delete(hostId);
			      updateLiveRtcUi();
			      return;
			    }

				    if (ev.type === "webrtc_ice") {
				      const to = payload.to_user_id || "";
				      if (!uid || to !== uid) return;
			      const fromUserId = payload.from_user_id || ev.user_id || "";
			      const cand = normalizeCandidate(payload.candidate);
			      if (!cand) return;
			      if (isHost) {
			        const pc = rtc.peers.get(fromUserId) || null;
			        if (!pc) {
			          const q = rtc.pendingCandidates.get(fromUserId) || [];
			          q.push(cand);
			          rtc.pendingCandidates.set(fromUserId, q);
			          return;
			        }
			        try {
			          await pc.addIceCandidate(cand);
			        } catch {}
			        return;
			      }
			      if (!rtc.pc) {
			        const q = rtc.pendingCandidates.get(hostId) || [];
			        q.push(cand);
			        rtc.pendingCandidates.set(hostId, q);
			        return;
			      }
				      try {
				        await rtc.pc.addIceCandidate(cand);
				      } catch {}
				      return;
				    }

				    if (ev.type === "webrtc_hangup") {
				      const to = payload.to_user_id || "";
				      if (to && uid && to !== uid) return;
				      const fromUserId = payload.from_user_id || ev.user_id || "";
				      if (!fromUserId) return;
				      if (isHost) {
				        const pc = rtc.peers.get(fromUserId) || null;
				        if (!pc) return;
				        try {
				          pc.close();
				        } catch {}
				        rtc.peers.delete(fromUserId);
				        rtc.pendingCandidates.delete(fromUserId);
				        rtc.pendingOffers.delete(fromUserId);
				        updateLiveRtcUi();
				        return;
				      }
				      if (hostId && fromUserId !== hostId) return;
				      resetLiveRtc();
				      state.liveRtcProcessed = new Set();
				      renderLiveRoom();
				      return;
				    }
				  }

			  async function hostAcceptOffer(remoteUserId, offerSdp) {
			    const rtc = ensureLiveRtc();
			    const uid = state.supabaseSession?.user?.id || "";
			    if (!uid || !remoteUserId || !offerSdp) return;
			    if (!rtc.localStream) return;

			    if (rtc.peers.has(remoteUserId)) {
			      try {
			        rtc.peers.get(remoteUserId).close();
			      } catch {}
			      rtc.peers.delete(remoteUserId);
			    }

			    const pc = new RTCPeerConnection(LIVE_RTC_CONFIG);
			    rtc.peers.set(remoteUserId, pc);
			    rtc.localStream.getTracks().forEach((t) => pc.addTrack(t, rtc.localStream));

			    pc.onicecandidate = (e) => {
			      if (!e.candidate) return;
			      const cand = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
			      sendLiveRtcEvent("webrtc_ice", { to_user_id: remoteUserId, from_user_id: uid, candidate: cand }).catch(() => {});
			    };

			    pc.onconnectionstatechange = () => {
			      const st = pc.connectionState || "";
			      if (st === "failed" || st === "disconnected" || st === "closed") {
			        try {
			          pc.close();
			        } catch {}
			        rtc.peers.delete(remoteUserId);
			        updateLiveRtcUi();
			      }
			    };

			    try {
			      await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
			      const queued = rtc.pendingCandidates.get(remoteUserId) || [];
			      for (const cand of queued) {
			        try {
			          await pc.addIceCandidate(cand);
			        } catch {}
			      }
			      rtc.pendingCandidates.delete(remoteUserId);
			      const answer = await pc.createAnswer();
			      await pc.setLocalDescription(answer);
			      await sendLiveRtcEvent("webrtc_answer", { to_user_id: remoteUserId, from_user_id: uid, sdp: answer.sdp });
			    } catch (err) {
			      console.warn("hostAcceptOffer failed", err);
			      try {
			        pc.close();
			      } catch {}
			      rtc.peers.delete(remoteUserId);
			    }
			    updateLiveRtcUi();
			  }

				  async function toggleLiveMic() {
				    const uid = state.supabaseSession?.user?.id || "";
			    if (!uid) {
			      alert("Sign in with Supabase to enable mic.");
			      return;
			    }
			    if (!isHostInLiveRoom()) {
			      alert("Only the host can enable mic.");
			      return;
			    }
				    const rtc = ensureLiveRtc();
				    if (rtc.micEnabled) {
				      const peerIds = Array.from(rtc.peers instanceof Map ? rtc.peers.keys() : []);
				      const pendingIds = Array.from(rtc.pendingOffers instanceof Map ? rtc.pendingOffers.keys() : []);
				      const toHangup = Array.from(new Set([...peerIds, ...pendingIds])).filter(Boolean);
				      for (const remoteUserId of toHangup) {
				        sendLiveRtcEvent("webrtc_hangup", { to_user_id: remoteUserId, from_user_id: uid, reason: "host_mic_off" }).catch(() => {});
				      }
				      resetLiveRtc();
				      state.liveRtcProcessed = new Set();
				      renderLiveRoom();
				      return;
				    }
			    try {
			      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			      rtc.localStream = stream;
			      rtc.micEnabled = true;
			      updateLiveRtcUi();

			      const offers = Array.from(rtc.pendingOffers.entries());
			      rtc.pendingOffers.clear();
			      for (const [remoteUserId, sdp] of offers) {
			        await hostAcceptOffer(remoteUserId, sdp);
			      }
			    } catch (err) {
			      console.warn("getUserMedia failed", err);
			      alert("Could not access microphone.");
			    }
			    updateLiveRtcUi();
			  }

				  async function toggleLiveAudio() {
				    const uid = state.supabaseSession?.user?.id || "";
			    if (!uid) {
			      alert("Sign in with Supabase to enable audio.");
			      return;
			    }
			    if (isHostInLiveRoom()) {
			      toggleLiveMic();
			      return;
			    }
				    const rtc = ensureLiveRtc();
				    const hostId = state.liveRoom?.host_user_id || "";
				    if (!hostId) return;

				    if (rtc.listening) {
				      sendLiveRtcEvent("webrtc_hangup", { to_user_id: hostId, from_user_id: uid, reason: "listener_off" }).catch(() => {});
				      resetLiveRtc();
				      state.liveRtcProcessed = new Set();
				      renderLiveRoom();
				      return;
				    }

			    try {
			      const pc = new RTCPeerConnection(LIVE_RTC_CONFIG);
			      rtc.pc = pc;
			      rtc.listening = true;
			      rtc.pendingCandidates.set(hostId, []);
			      const remoteStream = new MediaStream();
			      rtc.remoteStream = remoteStream;

			      pc.addTransceiver("audio", { direction: "recvonly" });

			      pc.ontrack = (e) => {
			        const stream = e.streams?.[0];
			        if (stream) {
			          stream.getTracks().forEach((t) => {
			            try {
			              remoteStream.addTrack(t);
			            } catch {}
			          });
			        }
			        if (dom.liveRoomAudioEl) {
			          try {
			            dom.liveRoomAudioEl.srcObject = remoteStream;
			            dom.liveRoomAudioEl.play().catch(() => {});
			          } catch {}
			        }
			        updateLiveRtcUi();
			      };

			      pc.onicecandidate = (e) => {
			        if (!e.candidate) return;
			        const cand = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
			        sendLiveRtcEvent("webrtc_ice", { to_user_id: hostId, from_user_id: uid, candidate: cand }).catch(() => {});
			      };

			      const offer = await pc.createOffer();
			      await pc.setLocalDescription(offer);
			      await sendLiveRtcEvent("webrtc_offer", { to_user_id: hostId, from_user_id: uid, sdp: offer.sdp });
			      updateLiveRtcUi();
			    } catch (err) {
			      console.warn("toggleLiveAudio failed", err);
			      resetLiveRtc();
			      alert("Could not start live audio.");
			    }
			  }

			  function renderLiveRoomEvents({ scrollToBottom } = { scrollToBottom: true }) {
			    if (!dom.liveRoomEvents) return;
			    dom.liveRoomEvents.innerHTML = "";
			    const events = state.liveRoomEvents || [];
		    if (!events.length) {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      title.textContent = "No messages yet.";
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      sub.textContent = "Say hi, or just listen.";
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.liveRoomEvents.appendChild(li);
		      return;
		    }
		    events.forEach((ev) => {
		      const li = document.createElement("li");
		      const meta = document.createElement("div");
		      meta.className = "meta";
		      const title = document.createElement("div");
		      title.className = "title";
		      const who = ev?.user?.handle ? `@${ev.user.handle}` : ev?.user_id ? ev.user_id.slice(0, 8) : "anon";
		      const when = ev?.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
		      title.textContent = [who, when].filter(Boolean).join(" · ");
		      const sub = document.createElement("div");
		      sub.className = "subtitle";
		      if (ev.type === "chat") {
		        sub.textContent = String(ev?.payload?.text || "").trim() || "…";
		      } else if (ev.type === "now_playing") {
		        const t = ev?.payload?.title || ev?.payload?.track || "Now playing";
		        const a = ev?.payload?.artist || "";
		        sub.textContent = [t, a].filter(Boolean).join(" · ");
		      } else {
		        sub.textContent = ev.type || "event";
		      }
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      li.appendChild(meta);
		      dom.liveRoomEvents.appendChild(li);
		    });
		    if (scrollToBottom) {
		      requestAnimationFrame(() => {
		        try {
		          dom.liveRoomEvents.scrollTop = dom.liveRoomEvents.scrollHeight;
		        } catch {
		          // ignore
		        }
		      });
		    }
		  }

		  async function loadLiveRoomEvents(liveId) {
		    const client = initSupabaseClient();
		    if (!client || !liveId) return;
		    try {
		      const { data, error } = await client
		        .from("live_events")
		        .select("id, live_session_id, user_id, type, payload, created_at")
		        .eq("live_session_id", liveId)
		        .order("created_at", { ascending: true })
		        .limit(100);
		      if (error) throw error;
		      const rows = Array.isArray(data) ? data : [];
		      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
		      if (userIds.length) {
		        const { data: profiles } = await client.from("profiles").select("user_id, handle, display_name").in("user_id", userIds);
		        (profiles || []).forEach((p) => state.liveRoomProfiles.set(p.user_id, p));
		      }
			      const enriched = rows.map((r) => ({ ...r, user: r.user_id ? state.liveRoomProfiles.get(r.user_id) || null : null }));
			      const display = [];
			      for (const ev of enriched) {
			        if (isLiveRtcEventType(ev.type)) {
			          await handleLiveRtcSignal(ev);
			        } else {
			          display.push(ev);
			        }
			      }
			      state.liveRoomEvents = display;
			      renderLiveRoomEvents({ scrollToBottom: true });
			    } catch (err) {
			      console.warn("loadLiveRoomEvents failed", err);
			      state.liveRoomEvents = [];
			      renderLiveRoomEvents({ scrollToBottom: false });
			    }
		  }

		  function unsubscribeLiveRoom() {
		    if (state.liveRoomChannel) {
		      try {
		        state.liveRoomChannel.unsubscribe().catch(() => {});
		      } catch {
		        // ignore
		      }
		      state.liveRoomChannel = null;
		    }
		  }

		  function subscribeLiveRoom(liveId) {
		    unsubscribeLiveRoom();
		    const client = initSupabaseClient();
		    if (!client || !liveId) return;
		    try {
		      state.liveRoomChannel = client
		        .channel(`rs-live-events-${liveId}`)
		        .on(
		          "postgres_changes",
		          { event: "INSERT", schema: "public", table: "live_events", filter: `live_session_id=eq.${liveId}` },
			          async (payload) => {
			            const ev = payload?.new || null;
			            if (!ev?.id) return;
		            if (ev.user_id && !state.liveRoomProfiles.has(ev.user_id)) {
		              try {
		                const { data: profile } = await client
		                  .from("profiles")
		                  .select("user_id, handle, display_name")
		                  .eq("user_id", ev.user_id)
		                  .maybeSingle();
		                if (profile?.user_id) state.liveRoomProfiles.set(profile.user_id, profile);
			              } catch {
			                // ignore
			              }
			            }
			            const withUser = { ...ev, user: ev.user_id ? state.liveRoomProfiles.get(ev.user_id) || null : null };
			            if (isLiveRtcEventType(withUser.type)) {
			              handleLiveRtcSignal(withUser).catch(() => {});
			              return;
			            }
			            state.liveRoomEvents.push(withUser);
			            renderLiveRoomEvents({ scrollToBottom: true });
			          },
			        )
			        .subscribe();
			    } catch (err) {
		      console.warn("subscribeLiveRoom failed", err);
		      state.liveRoomChannel = null;
		    }
		  }

		  async function sendLiveRoomChat() {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    const liveId = state.liveRoom?.id || "";
		    if (!client || !uid) {
		      alert("Sign in with Supabase to chat.");
		      return;
		    }
		    if (!liveId) return;
		    const text = String(dom.liveRoomMessage?.value || "").trim();
		    if (!text) return;
		    if (dom.liveRoomMessage) dom.liveRoomMessage.value = "";
		    try {
		      const { error } = await client.from("live_events").insert({
		        live_session_id: liveId,
		        user_id: uid,
		        type: "chat",
		        payload: { text },
		      });
		      if (error) throw error;
		    } catch (err) {
		      console.warn("sendLiveRoomChat failed", err);
		      alert(`Could not send: ${err?.message || "unknown error"}`);
		    }
		  }

		  function joinLive(row) {
		    openLiveRoom(row);
		  }

	  async function startLive() {
	    const client = initSupabaseClient();
	    const uid = state.supabaseSession?.user?.id || "";
	    if (!client || !uid) {
	      alert("Sign in with Supabase to go live.");
	      return;
	    }
	    try {
	      const allowed = new Set(["public", "followers", "friends"]);
	      const requested = normalizeHandle(prompt("Visibility: public / followers / friends", "followers") || "followers");
	      const visibility = allowed.has(requested) ? requested : "followers";
	      const title = String(prompt("Live title", state.showMeta?.title || "Live") || "Live").trim() || "Live";
	      const zip = String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim() || null;
	      const locationOptIn = !!dom.profileLocationOptIn?.checked && !!zip;
	      const { data, error } = await client.functions.invoke("start_live", {
	        headers: getSupabaseAuthHeaders(),
	        body: { title, visibility, zip, location_opt_in: locationOptIn },
	      });
		      if (error) throw error;
		      state.currentLive = data?.live || null;
		      if (dom.endLiveBtn) dom.endLiveBtn.disabled = !state.currentLive?.id;
		      const handle = String(localStorage.getItem(PROFILE_HANDLE_KEY) || "").trim().replace(/^@+/, "");
		      const hostLabel = handle ? `@${handle}` : "You";
		      if (state.currentLive?.id) {
		        openLiveRoom({ ...state.currentLive, host_user_id: uid, host: hostLabel });
		      }
		      alert(state.currentLive?.room_name ? `You're live. Room: ${state.currentLive.room_name}` : "You're live.");
			      if (["live", "live_nearby"].includes(state.sessionsFeed || dom.sessionsFeed?.value || "")) loadSupabaseSessions();
			    } catch (err) {
	      console.warn("startLive failed", err);
	      alert(`Could not start live: ${err?.message || "unknown error"}`);
	    }
	  }

		  async function endLive() {
		    const client = initSupabaseClient();
		    const uid = state.supabaseSession?.user?.id || "";
		    if (!client || !uid) return;
		    const id = state.currentLive?.id || null;
		    if (!id) {
		      alert("No active live session.");
		      return;
		    }
		    try {
		      if (state.liveRoom?.id === id && isHostInLiveRoom() && state.liveRtc) {
		        const rtc = state.liveRtc;
		        const peerIds = Array.from(rtc.peers instanceof Map ? rtc.peers.keys() : []);
		        const pendingIds = Array.from(rtc.pendingOffers instanceof Map ? rtc.pendingOffers.keys() : []);
		        const toHangup = Array.from(new Set([...peerIds, ...pendingIds])).filter(Boolean);
		        for (const remoteUserId of toHangup) {
		          sendLiveRtcEvent("webrtc_hangup", { to_user_id: remoteUserId, from_user_id: uid, reason: "host_end_live" }).catch(() => {});
		        }
		      }
		      const { error } = await client.functions.invoke("end_live", {
		        headers: getSupabaseAuthHeaders(),
		        body: { id },
		      });
		      if (error) throw error;
		      state.currentLive = null;
		      if (dom.endLiveBtn) dom.endLiveBtn.disabled = true;
		      if (state.liveRoom?.id === id) {
		        closeLiveRoom();
		      }
		      alert("Live ended.");
			      if (["live", "live_nearby"].includes(state.sessionsFeed || dom.sessionsFeed?.value || "")) loadSupabaseSessions();
			    } catch (err) {
	      console.warn("endLive failed", err);
	      alert(`Could not end live: ${err?.message || "unknown error"}`);
	    }
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

			  async function loadSessionEntry(entry) {
			    try {
			      state.currentSessionId = entry?.id || null;
			      const client = initSupabaseClient();
			      const resolvedFromList = resolveSessionUrl(entry);
			      const hasFetchableUrl =
			        typeof resolvedFromList === "string" &&
			        (resolvedFromList.startsWith("http") || resolvedFromList.startsWith("data:"));
			      if (client && (entry?.id || entry?.slug) && !hasFetchableUrl) {
			        const { data, error } = await client.functions.invoke("get_session", {
			          headers: getSupabaseAuthHeaders(),
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
