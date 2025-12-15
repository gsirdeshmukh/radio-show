(() => {
  const DEFAULT_CLIENT_ID = "0e01ffabf4404a23b1798c0e1c9b4762";
  const DEFAULT_REDIRECT = "https://gsirdeshmukh.github.io/radio-show/";
  const DEFAULT_SUPABASE_URL = "https://jduyihzjqpcczekhorrq.supabase.co";
  const DEFAULT_SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ";
  const APPLE_DEVELOPER_TOKEN = "APPLE_DEV_TOKEN_PLACEHOLDER"; // Replace with your Apple Music JWT
  const APPLE_TEST_TRACK = "900032829"; // Replace with a real catalog track ID
  const SOUND_CLOUD_CLIENT_ID_KEY = "rs_sc_client_id";
  const SOUND_CLOUD_TOKEN_KEY = "rs_sc_token";
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
	  const LIKED_SESSIONS_KEY = "rs_liked_sessions";
	  const PROFILE_HANDLE_KEY = "rs_profile_handle";
	  const PROFILE_ZIP_KEY = "rs_profile_zip";
	  const PROFILE_ZIP_OPTIN_KEY = "rs_profile_zip_optin";

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
		    supabaseAuthSub: null,
		    supabaseSession: null,
		    spotifyProfile: null,
		    sessions: [],
		    sessionsQuery: "",
		    sessionsSort: "new",
		    sessionsFeed: "public",
		    sessionsLoading: false,
		    sessionsSearchTimer: null,
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
		    likedSessions: new Set(),
	    currentSessionId: null,
	    appleMusic: {
      instance: null,
      authorized: false,
      userToken: null,
    },
    soundcloud: {
      clientId: "",
      results: [],
      audio: null,
      playingId: null,
      token: "",
      profile: null,
    },
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
    dom.appleAuthBtn = document.getElementById("apple-auth-btn");
    dom.applePlayBtn = document.getElementById("apple-play-btn");
    dom.appleAuthStatus = document.getElementById("apple-auth-status");
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
    dom.fontSwitch = document.getElementById("font-switch");
    dom.fontCustom = document.getElementById("font-custom");
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
    dom.supabaseEmailInput = document.getElementById("supabase-email");
    dom.supabaseSignInBtn = document.getElementById("supabase-signin");
    dom.supabaseSignOutBtn = document.getElementById("supabase-signout");
    dom.supabaseAuthStatus = document.getElementById("supabase-auth-status");
    dom.scClientIdInput = document.getElementById("soundcloud-client-id");
    dom.scSearchForm = document.getElementById("sc-search-form");
    dom.scSearchInput = document.getElementById("sc-search-input");
    dom.scResults = document.getElementById("sc-results");
    dom.scAuthBtn = document.getElementById("soundcloud-auth-btn");
    dom.scAuthStatus = document.getElementById("soundcloud-auth-status");
    dom.scLikesBtn = document.getElementById("soundcloud-likes-btn");
		    dom.profileAvatar = document.getElementById("profile-avatar");
		    dom.profileName = document.getElementById("profile-name");
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
			    dom.sessionVisibility = document.getElementById("session-visibility");
			    dom.sessionZip = document.getElementById("session-zip");
			    dom.sessionLocationOptIn = document.getElementById("session-location-optin");
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
    dom.themeSwitch && dom.themeSwitch.addEventListener("click", handleThemeSwitch);
    dom.fontSwitch && dom.fontSwitch.addEventListener("click", handleFontSwitch);
    if (dom.fontCustom) {
      dom.fontCustom.querySelectorAll('input[type="color"]').forEach((input) => {
        input.addEventListener("input", handleFontColorInput);
      });
    }
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
    dom.scSearchForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      runSoundcloudSearch();
    });
    dom.scAuthBtn?.addEventListener("click", startSoundcloudAuth);
    dom.scLikesBtn?.addEventListener("click", loadSoundcloudLikes);
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
    [dom.sessionTitle, dom.sessionHost, dom.sessionGenre, dom.sessionDate, dom.sessionZip].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", persistLocal);
    });
    if (dom.sessionVisibility) {
      dom.sessionVisibility.addEventListener("change", persistLocal);
    }
    if (dom.sessionLocationOptIn) {
      dom.sessionLocationOptIn.addEventListener("change", persistLocal);
    }
    dom.appleAuthBtn?.addEventListener("click", authorizeAppleMusic);
    dom.applePlayBtn?.addEventListener("click", playAppleTestTrack);
	    dom.masterVolume.addEventListener("input", (e) => {
	      state.masterVolume = Number(e.target.value) / 100;
	      if (state.player) {
	        state.player.setVolume(state.masterVolume).catch(() => {});
	      }
	    });
	    if (dom) {
	    dom.fadeDuration.addEventListener("input", (e) => {
	      state.fadeMs = Number(e.target.value);
	    });
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
		    if (dom.supabaseSignInBtn) {
		      dom.supabaseSignInBtn.addEventListener("click", supabaseSignIn);
		    }
		    if (dom.supabaseSignOutBtn) {
		      dom.supabaseSignOutBtn.addEventListener("click", supabaseSignOut);
		    }
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
						    }
				    document.addEventListener("keydown", handleHotkeys);
				    document.addEventListener("keydown", (e) => {
				      if (e.key === "Escape") {
				        closeSendSheet();
				        closeProfileSheet();
				      }
				    });
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

  function setAppleStatus(text, ready) {
    if (dom.appleAuthStatus) {
      dom.appleAuthStatus.textContent = text;
    }
    if (dom.applePlayBtn) {
      dom.applePlayBtn.disabled = !ready;
    }
  }

  function setStatus(text, connected) {
    dom.status.textContent = text;
    const styles = getComputedStyle(document.documentElement);
    const accent = (styles.getPropertyValue("--accent") || "").trim() || "#6af5c8";
    const alert = (styles.getPropertyValue("--accent-2") || "").trim() || "#ff6ea9";
    dom.status.style.color = connected ? accent : alert;
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

  function handleFontSwitch(e) {
    const btn = e.target.closest(".font-dot");
    if (!btn) return;
    const font = btn.dataset.font;
    const color = btn.dataset.color || btn.dataset.defaultColor;
    applyFont(font, color);
    sessionStorage.setItem("rs_font_choice", color || font);
  }

  function applySavedFont() {
    const storedColors = restoreFontSwatches();
    const fontColor = sessionStorage.getItem("rs_font_choice") || storedColors.aqua || "#6af5c8";
    applyFont("custom", fontColor);
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
      default: { accent: "#6af5c8", accent2: "#ff6ea9", panel: "#0f1a2b", panelStrong: "#0c1524", bg: "#0b1423", text: "#e7f3ff", muted: "#8aa1c0", grid: "rgba(255,255,255,0.08)" },
      ember: { accent: "#ff6b3d", accent2: "#fbb13c", panel: "#1c1410", panelStrong: "#281a14", bg: "#0d0907", text: "#ffe8d9", muted: "#ffb48f", grid: "rgba(255,255,255,0.08)" },
      sunset: { accent: "#ff8fb1", accent2: "#ff6b6b", panel: "#1d1520", panelStrong: "#251a29", bg: "#100a11", text: "#ffe8f0", muted: "#f4a4c6", grid: "rgba(255,255,255,0.08)" },
      violet: { accent: "#b388ff", accent2: "#6c63ff", panel: "#141328", panelStrong: "#1c1b35", bg: "#0b0a18", text: "#ebe6ff", muted: "#c1b8ff", grid: "rgba(255,255,255,0.08)" },
      frost: { accent: "#ffffff", accent2: "#d5e7ff", panel: "#f5f6f8", panelStrong: "#eef2f5", bg: "#ffffff", text: "#0c1524", muted: "#586b85", grid: "rgba(12,21,36,0.12)" },
    };
    const t = themes[theme] || themes.default;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-2", t.accent2);
    root.style.setProperty("--panel", t.panel);
    root.style.setProperty("--panel-strong", t.panelStrong);
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--text", t.text);
    root.style.setProperty("--muted", t.muted);
    root.style.setProperty("--grid", t.grid);
  }

  function applyFont(font, overrideColor) {
    const root = document.documentElement;
    const defaultFonts = { body: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif', heading: '"Press Start 2P", "Space Grotesk", sans-serif' };
    const palettes = {
      aqua: { text: "#6af5c8" },
      amber: { text: "#ffb347" },
      rose: { text: "#ff8fb1" },
      iris: { text: "#b388ff" },
    };
    const color = overrideColor || palettes[font]?.text || palettes.aqua.text;
    const muted = lightenColor(color, 0.35);
    root.style.setProperty("--text", color);
    root.style.setProperty("--muted", muted);
    root.style.setProperty("--font-body", defaultFonts.body);
    root.style.setProperty("--font-heading", defaultFonts.heading);
  }

  function handleFontColorInput(e) {
    const input = e.target;
    const slot = input.dataset.target;
    const color = input.value;
    const btn = dom.fontSwitch?.querySelector(`[data-font="${slot}"]`);
    if (btn) {
      btn.dataset.color = color;
      btn.style.background = buildDotGradient(color);
    }
    sessionStorage.setItem(`rs_font_color_${slot}`, color);
    applyFont("custom", color);
    sessionStorage.setItem("rs_font_choice", color);
  }

  function restoreFontSwatches() {
    const colors = {};
    const buttons = dom.fontSwitch ? Array.from(dom.fontSwitch.querySelectorAll(".font-dot")) : [];
    buttons.forEach((btn) => {
      const slot = btn.dataset.font;
      const stored = sessionStorage.getItem(`rs_font_color_${slot}`);
      if (stored) {
        colors[slot] = stored;
        btn.dataset.color = stored;
        btn.style.background = buildDotGradient(stored);
      } else if (btn.dataset.color) {
        colors[slot] = btn.dataset.color;
        btn.style.background = buildDotGradient(btn.dataset.color);
      }
    });
    const inputs = dom.fontCustom ? Array.from(dom.fontCustom.querySelectorAll('input[type="color"]')) : [];
    inputs.forEach((input) => {
      const slot = input.dataset.target;
      if (colors[slot]) {
        input.value = colors[slot];
      }
    });
    return colors;
  }

  function buildDotGradient(color) {
    const shade = shadeColor(color, -0.18);
    return `linear-gradient(135deg, ${color}, ${shade})`;
  }

  function lightenColor(hex, amount = 0.3) {
    const { r, g, b } = hexToRgb(hex);
    const to = (channel) => Math.round(channel + (255 - channel) * amount);
    return rgbToHex(to(r), to(g), to(b));
  }

  function shadeColor(hex, amount = -0.15) {
    const { r, g, b } = hexToRgb(hex);
    const to = (channel) => Math.max(0, Math.min(255, Math.round(channel * (1 + amount))));
    return rgbToHex(to(r), to(g), to(b));
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const m = clean.length === 3
      ? clean.split("").map((c) => parseInt(c + c, 16))
      : [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map((c) => parseInt(c, 16));
    return { r: m[0] || 0, g: m[1] || 0, b: m[2] || 0 };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function hydrateSoundcloudClientId() {
    if (!dom.scClientIdInput) return;
    const stored = localStorage.getItem(SOUND_CLOUD_CLIENT_ID_KEY) || "";
    if (!dom.scClientIdInput.value) {
      dom.scClientIdInput.value = stored;
    }
    state.soundcloud.clientId = (dom.scClientIdInput.value || stored || "").trim();
    dom.scClientIdInput.addEventListener("change", () => {
      state.soundcloud.clientId = (dom.scClientIdInput.value || "").trim();
      localStorage.setItem(SOUND_CLOUD_CLIENT_ID_KEY, state.soundcloud.clientId);
    });
  }

  function getSoundcloudClientId() {
    const val = (dom.scClientIdInput?.value || state.soundcloud.clientId || "").trim();
    state.soundcloud.clientId = val;
    if (val) localStorage.setItem(SOUND_CLOUD_CLIENT_ID_KEY, val);
    return val;
  }

  function clearSoundcloudToken(reason) {
    if (reason) console.warn(reason);
    state.soundcloud.token = "";
    state.soundcloud.profile = null;
    sessionStorage.removeItem(SOUND_CLOUD_TOKEN_KEY);
    setSoundcloudStatus("soundcloud: signed out", false);
  }

  function withClientId(url, clientId) {
    if (!clientId || url.includes("client_id=")) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}client_id=${encodeURIComponent(clientId)}`;
  }

  async function scAuthedFetch(url, token, clientId) {
    const target = withClientId(url, clientId);
    const headers = token ? { Authorization: `OAuth ${token}` } : {};
    const res = await fetch(target, { headers });
    if (!res.ok) {
      if (res.status === 401) {
        clearSoundcloudToken("SoundCloud token expired or invalid.");
      }
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "";
      }
      throw new Error(body || `SC request failed ${res.status}`);
    }
    return res.json();
  }

  async function startSoundcloudAuth() {
    const clientId = getSoundcloudClientId();
    if (!clientId) {
      alert("Add your SoundCloud client ID in Auth Panel.");
      return;
    }
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authState = uid();
    sessionStorage.setItem("rs_sc_state", authState);
    const url = `https://soundcloud.com/connect?client_id=${clientId}&response_type=token&scope=non-expiring&display=popup&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(authState)}`;
    window.location.href = url;
  }

  async function handleSoundcloudCallback() {
    const hash = window.location.hash || "";
    if (!hash.includes("access_token")) return;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const token = params.get("access_token");
    const returnedState = params.get("state");
    const storedState = sessionStorage.getItem("rs_sc_state");
    if (storedState && returnedState && storedState !== returnedState) {
      alert("SoundCloud auth state mismatch. Please try again.");
      return;
    }
    if (!token) return;
    state.soundcloud.token = token;
    sessionStorage.setItem(SOUND_CLOUD_TOKEN_KEY, token);
    sessionStorage.removeItem("rs_sc_state");
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, cleanUrl);
    setSoundcloudStatus("soundcloud: connected", true);
    fetchSoundcloudProfile().catch(() => {});
  }

  async function fetchSoundcloudProfile() {
    const token = state.soundcloud.token || sessionStorage.getItem(SOUND_CLOUD_TOKEN_KEY) || "";
    const clientId = getSoundcloudClientId();
    if (!token || !clientId) return null;
    state.soundcloud.token = token;
    try {
      const profile = await scAuthedFetch("https://api-v2.soundcloud.com/me", token, clientId);
      state.soundcloud.profile = profile || null;
      const name = profile?.username || profile?.full_name || "connected";
      setSoundcloudStatus(`soundcloud: ${name}`, true);
      return profile;
    } catch (err) {
      console.warn("soundcloud profile fetch failed", err);
      setSoundcloudStatus("soundcloud: connected", true);
      return null;
    }
  }

  function setSoundcloudStatus(text, authed) {
    if (dom.scAuthStatus) {
      dom.scAuthStatus.textContent = text;
    }
    if (dom.scLikesBtn) dom.scLikesBtn.disabled = !authed;
  }

  function hydrateSoundcloudToken() {
    const stored = sessionStorage.getItem(SOUND_CLOUD_TOKEN_KEY) || "";
    if (stored) {
      state.soundcloud.token = stored;
      setSoundcloudStatus("soundcloud: connected", true);
    } else {
      setSoundcloudStatus("soundcloud: signed out", false);
    }
  }

  async function runSoundcloudSearch() {
    const query = (dom.scSearchInput?.value || "").trim();
    const clientId = getSoundcloudClientId();
    if (!query) return;
    if (!clientId) {
      alert("Add your SoundCloud client ID in Auth Panel.");
      return;
    }
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=24`;
    const data = await scFetch(url);
    state.soundcloud.results = (data.collection || []).filter((item) => item.media?.transcodings?.length);
    renderSoundcloudResults();
  }

  async function loadSoundcloudLikes() {
    const clientId = getSoundcloudClientId();
    const token = state.soundcloud.token || sessionStorage.getItem(SOUND_CLOUD_TOKEN_KEY) || "";
    if (!clientId) {
      alert("Add your SoundCloud client ID in Auth Panel.");
      return;
    }
    if (!token) {
      alert("Authorize SoundCloud first.");
      return;
    }
    state.soundcloud.token = token;
    renderSoundcloudResults("Loading likes…");
    try {
      const data = await scAuthedFetch("https://api-v2.soundcloud.com/me/likes/tracks?limit=50", token, clientId);
      const tracks = (data.collection || [])
        .map((item) => item?.track || item)
        .filter((track) => track && track.media?.transcodings?.length);
      if (!tracks.length) {
        renderSoundcloudResults("No liked tracks (or none are streamable).");
        return;
      }
      state.soundcloud.results = tracks;
      renderSoundcloudResults();
    } catch (err) {
      console.warn("SoundCloud likes fetch failed", err);
      renderSoundcloudResults(err?.message || "Could not load SoundCloud likes.");
    } finally {
      fetchSoundcloudProfile().catch(() => {});
    }
  }

  function renderSoundcloudResults(errorText) {
    if (!dom.scResults) return;
    dom.scResults.innerHTML = "";
    if (errorText) {
      const li = document.createElement("li");
      li.textContent = errorText;
      dom.scResults.appendChild(li);
      return;
    }
    if (!state.soundcloud.results.length) {
      const li = document.createElement("li");
      li.textContent = "No SoundCloud results yet.";
      dom.scResults.appendChild(li);
      return;
    }
    state.soundcloud.results.forEach((track) => {
      const li = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = track.title || "Untitled";
      const subtitle = document.createElement("div");
      subtitle.className = "subtitle";
      subtitle.textContent = track.user?.username ? `by ${track.user.username}` : "—";
      meta.appendChild(title);
      meta.appendChild(subtitle);
      const actions = document.createElement("div");
      actions.className = "actions";
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.className = "primary";
      addBtn.addEventListener("click", () => addSoundcloudToShow(track, addBtn));
      actions.appendChild(addBtn);
      const play = document.createElement("button");
      const isPlaying = state.soundcloud.playingId === track.id;
      play.textContent = isPlaying ? "Pause" : "Play";
      play.className = isPlaying ? "primary" : "ghost";
      play.addEventListener("click", () => togglePlaySoundcloud(track));
      actions.appendChild(play);
      li.appendChild(meta);
      li.appendChild(actions);
      dom.scResults.appendChild(li);
    });
  }

  async function togglePlaySoundcloud(track) {
    const clientId = getSoundcloudClientId();
    if (!clientId) {
      alert("Add your SoundCloud client ID in Auth Panel.");
      return;
    }
    if (!state.soundcloud.audio) {
      state.soundcloud.audio = new Audio();
      state.soundcloud.audio.crossOrigin = "anonymous";
      state.soundcloud.audio.addEventListener("ended", () => {
        state.soundcloud.playingId = null;
        renderSoundcloudResults();
      });
    }
    const audio = state.soundcloud.audio;
    if (state.soundcloud.playingId === track.id && !audio.paused) {
      audio.pause();
      state.soundcloud.playingId = null;
      renderSoundcloudResults();
      return;
    }
    try {
      const streamUrl = await resolveSoundcloudStream(track, clientId);
      if (!streamUrl) {
        renderSoundcloudResults("No playable stream for this track.");
        return;
      }
      audio.src = streamUrl;
      await audio.play();
      state.soundcloud.playingId = track.id;
      renderSoundcloudResults();
    } catch (err) {
      console.error("SC play failed", err);
      renderSoundcloudResults("Playback failed (check client ID or CORS).");
    }
  }

  async function resolveSoundcloudStream(track, clientId) {
    if (track._resolvedStream) return track._resolvedStream;
    const transcoding = pickSoundcloudTranscoding(track.media?.transcodings || []);
    if (!transcoding?.url) return null;
    const url = `${transcoding.url}?client_id=${clientId}`;
    const data = await scFetch(url);
    track._resolvedStream = data.url;
    return track._resolvedStream;
  }

  async function scFetch(url) {
    const tryFetch = async (target) => {
      const res = await fetch(target);
      if (!res.ok) throw new Error(`SC request failed ${res.status}`);
      return res.json();
    };
    try {
      return await tryFetch(url);
    } catch (err) {
      // fallback through CORS proxy for browser blocks
      const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      return await tryFetch(proxied);
    }
  }

  function pickSoundcloudTranscoding(list) {
    if (!Array.isArray(list)) return null;
    const progressive = list.find((t) => t.format?.protocol === "progressive");
    if (progressive) return progressive;
    return list.find((t) => t.format?.protocol === "hls") || null;
  }

  async function addSoundcloudToShow(track, button) {
    const clientId = getSoundcloudClientId();
    if (!clientId) {
      alert("Add your SoundCloud client ID in Auth Panel.");
      return;
    }
    const btn = button || null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Adding…";
    }
    try {
      const streamUrl = await resolveSoundcloudStream(track, clientId);
      if (!streamUrl) throw new Error("No playable stream for this track.");
      const duration = Number(track.duration || track.full_duration || 0);
      const artRaw = track.artwork_url || track.user?.avatar_url || "";
      const artwork = artRaw ? artRaw.replace("-large", "-t500x500") : "";
      const transcoding = pickSoundcloudTranscoding(track.media?.transcodings || []);
      const segment = {
        id: uid(),
        type: "soundcloud",
        title: track.title || "Untitled",
        subtitle: track.user?.username ? `by ${track.user.username}` : "SoundCloud",
        duration: duration > 0 ? duration : 1000,
        startMs: 0,
        endMs: duration > 0 ? duration : 1000,
        bpm: null,
        key: null,
        energy: null,
        album: artwork ? { images: [{ url: artwork }] } : null,
        note: track.permalink_url || "",
        uri: track.permalink_url || `soundcloud:${track.id || ""}`,
        fadeIn: false,
        fadeOut: false,
        volume: state.masterVolume,
        cueMs: 0,
        overlays: [],
        streamUrl,
        url: streamUrl,
        clientId,
        soundcloudId: track.id,
        soundcloudPermalink: track.permalink_url || "",
        transcodingUrl: transcoding?.url || "",
      };
      state.segments.push(segment);
      renderSegments();
    } catch (err) {
      console.warn("Add SoundCloud failed", err);
      alert(err?.message ? `Could not add SoundCloud track: ${err.message}` : "Could not add SoundCloud track.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Add";
      }
    }
  }

  function initMusicKit() {
    if (!window.MusicKit || !APPLE_DEVELOPER_TOKEN) {
      setAppleStatus("apple music: unavailable", false);
      return;
    }
    try {
      MusicKit.configure({
        developerToken: APPLE_DEVELOPER_TOKEN,
        app: {
          name: "Radio Show",
          build: "1.0.0",
        },
      });
      state.appleMusic.instance = MusicKit.getInstance();
      setAppleStatus("apple music: ready to connect", false);
    } catch (err) {
      console.error("MusicKit init failed", err);
      setAppleStatus("apple music: init failed", false);
    }
  }

  async function authorizeAppleMusic() {
    if (!state.appleMusic.instance) {
      setAppleStatus("apple music: not ready", false);
      return;
    }
    try {
      const token = await state.appleMusic.instance.authorize();
      state.appleMusic.userToken = token;
      state.appleMusic.authorized = true;
      setAppleStatus("apple music: connected", true);
    } catch (err) {
      console.error("apple music auth failed", err);
      setAppleStatus("apple music: auth failed", false);
    }
  }

  async function playAppleTestTrack() {
    if (!state.appleMusic.instance || !state.appleMusic.authorized) {
      setAppleStatus("apple music: connect first", false);
      return;
    }
    try {
      await state.appleMusic.instance.setQueue({ song: APPLE_TEST_TRACK });
      await state.appleMusic.instance.player.play();
      setAppleStatus("apple music: playing test track", true);
    } catch (err) {
      console.error("apple music play failed", err);
      setAppleStatus("apple music: play failed", true);
    }
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
	    const rawUrl = (dom.supabaseUrlInput?.value || "") || localStorage.getItem(SUPABASE_URL_KEY) || "";
	    const rawAnon = (dom.supabaseKeyInput?.value || "") || localStorage.getItem(SUPABASE_ANON_KEY) || "";
	    const url = String(rawUrl).trim().replace(/\s+/g, "");
	    const anon = String(rawAnon).trim().replace(/\s+/g, "");
	    if (dom.supabaseUrlInput?.value && dom.supabaseUrlInput.value !== url) dom.supabaseUrlInput.value = url;
	    if (dom.supabaseKeyInput?.value && dom.supabaseKeyInput.value !== anon) dom.supabaseKeyInput.value = anon;
		    if (!url || !anon) {
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
	      state.supabaseSession = null;
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
	      state.supabaseSession = null;
	      state.supabase = window.supabase.createClient(url, anon);
		      state.supabaseUrl = url;
		      state.supabaseKey = anon;
		      localStorage.setItem(SUPABASE_URL_KEY, url);
		      localStorage.setItem(SUPABASE_ANON_KEY, anon);
	      ensureSupabaseAuth();
	      ensureSessionsStatsSubscription();
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
				        renderSupabaseAuthStatus();
				      });
			      state.supabaseAuthSub = data?.subscription || null;
			      client.auth
			        .getSession()
			        .then(({ data }) => {
			          state.supabaseSession = data?.session || null;
			          renderSupabaseAuthStatus();
			        })
			        .catch(() => {});
			    } catch (err) {
			      console.warn("Supabase auth init failed", err);
			    }
			  }

				  function renderSupabaseAuthStatus() {
				    const email = state.supabaseSession?.user?.email || "";
				    const authed = !!email;
				    if (dom.supabaseAuthStatus) {
				      dom.supabaseAuthStatus.textContent = authed ? `supabase: ${email}` : "supabase: signed out";
				    }
				    if (dom.supabaseSignInBtn) dom.supabaseSignInBtn.disabled = authed;
				    if (dom.supabaseSignOutBtn) dom.supabaseSignOutBtn.disabled = !authed;
				    const prev = !!state.supabaseAuthed;
				    state.supabaseAuthed = authed;
				    if (prev !== authed) {
				      handleSupabaseAuthedState(authed).catch(() => {});
				    }
				  }

			  function getSupabaseAuthHeaders() {
			    const token = state.supabaseSession?.access_token || "";
			    return token ? { Authorization: `Bearer ${token}` } : {};
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
					    loadSupabaseSessions();
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
			    if (dom.sessionZip && !dom.sessionZip.value) {
			      dom.sessionZip.value = localStorage.getItem(PROFILE_ZIP_KEY) || "";
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
			      const { data: loc } = await client
			        .from("profile_locations")
			        .select("zip, opt_in")
			        .eq("user_id", uid)
			        .maybeSingle();
			      const zip = (loc?.zip || "").trim();
			      if (zip) {
			        localStorage.setItem(PROFILE_ZIP_KEY, zip);
			        if (dom.profileZipInput) dom.profileZipInput.value = zip;
			        if (dom.sessionZip && !dom.sessionZip.value) dom.sessionZip.value = zip;
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
				    const raw = String(dom.followHandleInput?.value || "").trim();
				    const handle = normalizeHandle(raw);
			    if (!handle) {
			      alert("Enter a handle like @someone");
			      return;
			    }
			    const client = initSupabaseClient();
			    const uid = state.supabaseSession?.user?.id || "";
			    if (!client || !uid) {
			      alert("Sign in with Supabase to follow.");
			      return;
			    }
			    try {
			      const { data, error } = await client.from("profiles").select("user_id, handle").eq("handle", handle).maybeSingle();
			      if (error) throw error;
			      const targetId = data?.user_id || "";
			      if (!targetId) throw new Error("Handle not found");
			      await followUserId(targetId);
			      alert(`Following @${handle}`);
			      dom.followHandleInput.value = "";
			    } catch (err) {
			      console.warn("followByHandle failed", err);
			      alert(`Could not follow: ${err?.message || "unknown error"}`);
			    }
			  }

			  async function followUserId(targetUserId) {
			    const client = initSupabaseClient();
			    const uid = state.supabaseSession?.user?.id || "";
			    if (!client || !uid || !targetUserId || targetUserId === uid) return;
			    if (state.following.has(targetUserId)) return;
			    const { error } = await client.from("follows").insert({ follower_id: uid, followed_id: targetUserId });
			    if (error) throw error;
			    state.following.add(targetUserId);
			  }

				  async function unfollowUserId(targetUserId) {
				    const client = initSupabaseClient();
				    const uid = state.supabaseSession?.user?.id || "";
				    if (!client || !uid || !targetUserId || targetUserId === uid) return;
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
				      loadBtn.addEventListener("click", () => loadSupabaseSession(row));
				      actions.appendChild(loadBtn);
				      li.appendChild(meta);
				      li.appendChild(actions);
				      dom.profileSheetSessions.appendChild(li);
				    });
				  }

				  function closeSendSheet() {
				    state.sendSheetSessionId = null;
				    state.sendSheetSelectedUserId = null;
				    state.sendSheetRecipients = [];
				    state.sendSheetLoading = false;
				    if (dom.sendSheetTo) dom.sendSheetTo.value = "";
				    if (dom.sendSheetNote) dom.sendSheetNote.value = "";
				    if (dom.sendSheetOverlay) dom.sendSheetOverlay.classList.add("hidden");
				  }

				  async function openSendSheet({ sessionId, toUserId } = {}) {
				    const client = initSupabaseClient();
				    const uid = state.supabaseSession?.user?.id || "";
				    if (!client || !uid) {
				      alert("Sign in with Supabase to send.");
				      return;
				    }
				    const sid = String(sessionId || "").trim();
				    if (!sid) return;
				    state.sendSheetSessionId = sid;
				    state.sendSheetSelectedUserId = toUserId || null;
				    state.sendSheetRecipients = [];
				    state.sendSheetLoading = true;
				    if (dom.sendSheetTitle) dom.sendSheetTitle.textContent = "Send Session";
				    if (dom.sendSheetSubtitle) dom.sendSheetSubtitle.textContent = "Choose a recipient";
				    if (dom.sendSheetOverlay) dom.sendSheetOverlay.classList.remove("hidden");
				    if (dom.sendSheetTo && !dom.sendSheetTo.value) dom.sendSheetTo.focus();
				    renderSendSheet();

				    try {
				      await loadFollowing();
				      await loadFollowers();
				    } catch {
				      // ignore
				    }

				    try {
				      const ids = Array.from(state.following || []).slice(0, 40);
				      if (!ids.length) {
				        state.sendSheetRecipients = [];
				        state.sendSheetLoading = false;
				        renderSendSheet();
				        return;
				      }
				      const { data, error } = await client.from("profiles").select("user_id, handle, display_name").in("user_id", ids);
				      if (error) throw error;
				      state.sendSheetRecipients = (data || []).filter((p) => p?.user_id);
				      state.sendSheetLoading = false;
				      renderSendSheet();
				    } catch (err) {
				      console.warn("send sheet recipients load failed", err);
				      state.sendSheetRecipients = [];
				      state.sendSheetLoading = false;
				      renderSendSheet();
				    }
				  }

				  function normalizeHandleForSend(raw) {
				    return String(raw || "")
				      .trim()
				      .replace(/^@+/, "")
				      .toLowerCase()
				      .replace(/[^a-z0-9_]+/g, "")
				      .slice(0, 24);
				  }

				  function renderSendSheet() {
				    if (!dom.sendSheetOverlay || !dom.sendSheetResults) return;
				    const sid = state.sendSheetSessionId;
				    if (!sid) {
				      dom.sendSheetOverlay.classList.add("hidden");
				      return;
				    }
				    dom.sendSheetResults.innerHTML = "";
				    const q = normalizeHandleForSend(dom.sendSheetTo?.value || "");
				    const me = state.supabaseSession?.user?.id || "";
				    const rows = Array.isArray(state.sendSheetRecipients) ? state.sendSheetRecipients : [];
				    const filtered = q ? rows.filter((r) => String(r.handle || "").toLowerCase().includes(q)) : rows;

				    if (state.sendSheetLoading) {
				      const li = document.createElement("li");
				      const meta = document.createElement("div");
				      meta.className = "meta";
				      const t = document.createElement("div");
				      t.className = "title";
				      t.textContent = "Loading…";
				      const s = document.createElement("div");
				      s.className = "subtitle";
				      s.textContent = "Fetching suggestions.";
				      meta.appendChild(t);
				      meta.appendChild(s);
				      li.appendChild(meta);
				      dom.sendSheetResults.appendChild(li);
				    } else if (!filtered.length) {
				      const li = document.createElement("li");
				      const meta = document.createElement("div");
				      meta.className = "meta";
				      const t = document.createElement("div");
				      t.className = "title";
				      t.textContent = rows.length ? "No matches" : "No suggestions yet";
				      const s = document.createElement("div");
				      s.className = "subtitle";
				      s.textContent = rows.length ? "Try a different handle." : "Follow someone to get quick send suggestions.";
				      meta.appendChild(t);
				      meta.appendChild(s);
				      li.appendChild(meta);
				      dom.sendSheetResults.appendChild(li);
				    } else {
				      filtered.slice(0, 12).forEach((p) => {
				        if (!p?.user_id || p.user_id === me) return;
				        const li = document.createElement("li");
				        const meta = document.createElement("div");
				        meta.className = "meta";
				        const t = document.createElement("div");
				        t.className = "title";
				        t.textContent = p.handle ? `@${p.handle}` : p.display_name || p.user_id.slice(0, 8);
				        const s = document.createElement("div");
				        s.className = "subtitle";
				        s.textContent = p.display_name || "";
				        meta.appendChild(t);
				        meta.appendChild(s);
				        const actions = document.createElement("div");
				        actions.className = "actions";
				        const pick = document.createElement("button");
				        pick.type = "button";
				        pick.textContent = state.sendSheetSelectedUserId === p.user_id ? "Selected" : "Select";
				        pick.disabled = state.sendSheetSelectedUserId === p.user_id;
				        pick.addEventListener("click", () => {
				          state.sendSheetSelectedUserId = p.user_id;
				          if (dom.sendSheetTo) dom.sendSheetTo.value = p.handle ? `@${p.handle}` : "";
				          renderSendSheet();
				        });
				        actions.appendChild(pick);
				        li.appendChild(meta);
				        li.appendChild(actions);
				        dom.sendSheetResults.appendChild(li);
				      });
				    }

				    const canSend = !!state.sendSheetSessionId && (!!state.sendSheetSelectedUserId || q.length >= 2);
				    if (dom.sendSheetSend) dom.sendSheetSend.disabled = !canSend;
				  }

				  async function sendFromSendSheet() {
				    const client = initSupabaseClient();
				    const uid = state.supabaseSession?.user?.id || "";
				    if (!client || !uid) {
				      alert("Sign in with Supabase to send.");
				      return;
				    }
				    const sessionId = state.sendSheetSessionId;
				    if (!sessionId) return;
				    const note = String(dom.sendSheetNote?.value || "").trim();
				    let toUserId = state.sendSheetSelectedUserId || null;
				    try {
				      if (!toUserId) {
				        const handle = normalizeHandleForSend(dom.sendSheetTo?.value || "");
				        if (!handle) {
				          alert("Enter a handle like @someone");
				          return;
				        }
				        const { data, error } = await client.from("profiles").select("user_id").eq("handle", handle).maybeSingle();
				        if (error) throw error;
				        toUserId = data?.user_id || "";
				      }
				      if (!toUserId) throw new Error("Recipient not found");
				      const { error: insErr } = await client.from("inbox_items").insert({
				        from_user_id: uid,
				        to_user_id: toUserId,
				        session_id: sessionId,
				        note: note || null,
				        status: "unread",
				      });
				      if (insErr) throw insErr;
				      closeSendSheet();
				      alert("Sent");
				    } catch (err) {
				      console.warn("sendFromSendSheet failed", err);
				      alert(`Could not send: ${err?.message || "unknown error"}`);
				    }
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
			    const hostIds = Array.from(new Set((state.sessions || []).map((s) => s?.host_user_id).filter(Boolean)));
			    if (!hostIds.length) return;
			    try {
			      const { data, error } = await client
			        .from("profile_presence")
			        .select("user_id, last_seen_at, status")
			        .in("user_id", hostIds);
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
				    const client = initSupabaseClient();
				    const uid = state.supabaseSession?.user?.id || "";
				    if (!client || !uid) {
				      state.presence = new Map();
				      return;
				    }
				    const feed = state.sessionsFeed || dom.sessionsFeed?.value || "public";
				    const rows = feed === "live" || feed === "live_nearby" ? state.live || [] : state.sessions || [];
				    const hostIds = Array.from(new Set(rows.map((r) => r?.host_user_id).filter(Boolean)));
				    if (!hostIds.length) return;
				    try {
				      const { data, error } = await client
				        .from("profile_presence")
				        .select("user_id, last_seen_at, status")
				        .in("user_id", hostIds);
				      if (error) throw error;
				      state.presence = new Map((data || []).map((r) => [r.user_id, r]));
				      if (feed === "live" || feed === "live_nearby") renderSupabaseLive();
				      else renderSupabaseSessions();
				    } catch (err) {
				      console.warn("presence refresh failed", err);
				    }
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
				        .on(
				          "postgres_changes",
				          { event: "INSERT", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` },
				          (payload) => {
				            const row = payload?.new || null;
				            if (row?.followed_id) state.following.add(row.followed_id);
				            rerender();
				          },
				        )
				        .on(
				          "postgres_changes",
				          { event: "DELETE", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` },
				          (payload) => {
				            const row = payload?.old || null;
				            if (row?.followed_id) state.following.delete(row.followed_id);
				            rerender();
				          },
				        )
				        .on(
				          "postgres_changes",
				          { event: "INSERT", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` },
				          (payload) => {
				            const row = payload?.new || null;
				            if (row?.follower_id) state.followers.add(row.follower_id);
				            rerender();
				          },
				        )
				        .on(
				          "postgres_changes",
				          { event: "DELETE", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` },
				          (payload) => {
				            const row = payload?.old || null;
				            if (row?.follower_id) state.followers.delete(row.follower_id);
				            rerender();
				          },
				        )
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
				        .on(
				          "postgres_changes",
				          { event: "INSERT", schema: "public", table: "inbox_items", filter: `to_user_id=eq.${uid}` },
				          (payload) => {
				            const row = payload?.new || null;
				            if (row?.status === "unread") {
				              state.inboxUnreadCount = Math.max(0, Number(state.inboxUnreadCount) || 0) + 1;
				              updateInboxFeedLabel();
				            } else {
				              refreshInboxUnreadCount().catch(() => {});
				            }
				            if (state.sessionsFeed === "inbox") loadSupabaseSessions();
				          },
				        )
				        .subscribe();
				    } catch (err) {
			      console.warn("inbox subscribe failed", err);
			      state.inboxChannel = null;
			    }
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

			  function ensureSessionsStatsSubscription() {
			    const client = state.supabase;
			    if (!client || state.sessionsStatsChannel) return;
			    try {
		      state.sessionsStatsChannel = client
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
		      state.sessionsStatsChannel = null;
		    }
		  }

		  function applySessionStats(sessionId, stats) {
		    if (!sessionId || !stats) return;
		    const sessions = state.sessions || [];
		    const idx = sessions.findIndex((s) => s?.id === sessionId);
		    if (idx === -1) return;
		    const row = sessions[idx];
		    row.plays = stats.plays ?? row.plays ?? 0;
		    row.downloads = stats.downloads ?? row.downloads ?? 0;
		    row.likes = stats.likes ?? row.likes ?? 0;
		    patchSessionSubtitle(sessionId);
		  }

		  function formatSessionStatsText(row) {
		    const plays = row?.plays ?? 0;
		    const downloads = row?.downloads ?? 0;
		    const likes = row?.likes ?? 0;
		    return `${plays} plays · ${downloads} downloads · ${likes} likes`;
		  }

		  function formatSessionSubtitle(row) {
		    const stats = formatSessionStatsText(row);
		    const bits = [row?.host || "Unknown", row?.genre || null, stats].filter(Boolean);
		    return bits.join(" · ");
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

			  async function recordSupabaseEvent(sessionId, type) {
			    const client = initSupabaseClient();
			    if (!client || !sessionId || !type) return { ok: false, error: new Error("Supabase not configured") };
			    try {
			      const { error } = await client.functions.invoke("record_event", {
			        headers: getSupabaseAuthHeaders(),
			        body: { id: sessionId, type },
			      });
			      if (error) {
			        const msg = await describeFunctionsInvokeError(error);
			        return { ok: false, error: new Error(msg), raw: error };
			      }
			      return { ok: true, error: null };
			    } catch (err) {
			      return { ok: false, error: err };
			    }
			  }

			  async function likeSession(sessionId) {
			    if (!sessionId || isSessionLiked(sessionId)) return;
			    const client = initSupabaseClient();
			    if (!client) {
		      alert("Supabase not configured");
		      return;
			    }
			    try {
			      const res = await recordSupabaseEvent(sessionId, "like");
			      if (!res.ok) throw res.error || new Error("Like failed");
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
		      const zip =
		        feed === "nearby"
		          ? String(dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim() || null
		          : null;
		      const { data, error } = await client.functions.invoke("list_sessions", {
		        body: { q, sort: functionSort, limit: 50, zip },
		      });
		      if (error) throw error;
	      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
	      state.sessions =
	        sortKey === "likes"
	          ? sessions.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0))
	          : sessions;
	      await refreshPresenceForSessions();
	      renderSupabaseSessions();
	      setSessionsStatus(`${state.sessions.length} sessions${feed === "nearby" && zip ? ` · near ${zip}` : ""}`);
	    } catch (err) {
	      console.warn("Supabase sessions fetch failed", err);
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
		        .select(
		          "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)",
		        )
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
			        .select(
			          "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)",
			        )
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
		      await client
		        .from("inbox_items")
		        .update({ status: "read", read_at: new Date().toISOString() })
		        .eq("id", itemId)
		        .eq("to_user_id", uid);
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
		      const hostIds = Array.from(new Set(state.live.map((l) => l?.host_user_id).filter(Boolean)));
		      if (hostIds.length) {
		        const { data: presence } = await client.from("profile_presence").select("user_id, last_seen_at, status").in("user_id", hostIds);
		        state.presence = new Map((presence || []).map((r) => [r.user_id, r]));
		      } else {
		        state.presence = new Map();
		      }
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
			        title.textContent = "No live streams right now.";
			      }
				      const sub = document.createElement("div");
				      sub.className = "subtitle";
				      if (feed === "live_nearby" && (!optIn || !zip)) {
				        sub.textContent = "Update Profile → Location, then refresh.";
				      } else {
				        sub.textContent = "Go Live to create one, or check back soon.";
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
		      const requested = dom.sessionVisibility?.value || "followers";
		      const visibility = allowed.has(requested) ? requested : "followers";
		      const title = String(dom.sessionTitle?.value || "Live").trim() || "Live";
		      const zip = String(dom.sessionZip?.value || dom.profileZipInput?.value || localStorage.getItem(PROFILE_ZIP_KEY) || "").trim() || null;
		      const locationOptIn = !!dom.sessionLocationOptIn?.checked && !!zip;
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
		        title.textContent = "Add a zip code in Profile.";
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
		        sub.textContent = "Profile → Location, then refresh.";
		      } else if (feed === "following") {
		        sub.textContent = "Follow someone (Profile → People) to see their sessions.";
		      } else if (feed === "friends") {
		        sub.textContent = "Mutual follows show up here.";
		      } else {
		        sub.textContent = "Publish a show to Supabase to see it here.";
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
			      loadBtn.addEventListener("click", () => loadSupabaseSession(row));
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
		      sub.textContent = [item.note || null, when || null, item.session_id ? `session: ${item.session_id.slice(0, 8)}…` : null]
		        .filter(Boolean)
		        .join(" · ");
		      meta.appendChild(title);
		      meta.appendChild(sub);
		      const actions = document.createElement("div");
		      actions.className = "actions";
			      if (item.session_id) {
			        const loadBtn = document.createElement("button");
			        loadBtn.type = "button";
			        loadBtn.textContent = "Load";
			        loadBtn.addEventListener("click", () => {
			          loadSupabaseSession({ id: item.session_id });
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

		  async function loadSupabaseSession(entry) {
		    try {
		      state.currentSessionId = entry?.id || null;
		      const client = initSupabaseClient();
		      if (!client) throw new Error("Supabase not configured");
		      setSessionsStatus("Loading session…");
		      const { data, error } = await client.functions.invoke("get_session", {
		        headers: getSupabaseAuthHeaders(),
		        body: { id: entry?.id || null, slug: entry?.slug || null },
		      });
		      if (error) throw error;
		      if (data?.id) state.currentSessionId = data.id;
		      const url = data?.json_url || null;
		      if (!url || (!url.startsWith("http") && !url.startsWith("data:"))) {
		        throw new Error("No signed session URL");
		      }
	      if (!isSafeSessionUrl(url)) {
	        throw new Error("Session URL not allowed");
	      }
	      const res = await fetch(url, { cache: "no-store" });
	      if (!res.ok) throw new Error(`HTTP ${res.status}`);
	      const payload = await res.json();
	      if (!payload || !Array.isArray(payload.segments)) {
	        throw new Error("Invalid session payload");
	      }
	      state.segments = (await hydrateSegments(payload.segments)).filter(Boolean);
	      if (payload.meta) {
	        dom.sessionTitle.value = payload.meta.title || "";
	        dom.sessionHost.value = payload.meta.host || "";
	        dom.sessionGenre.value = payload.meta.genre || "";
	        if (payload.meta.date) dom.sessionDate.value = payload.meta.date;
	        if (dom.sessionVisibility) dom.sessionVisibility.value = payload.meta.visibility || "public";
	        if (dom.sessionZip) dom.sessionZip.value = (payload.meta.location_zip || payload.meta.zip || "").trim();
	        if (dom.sessionLocationOptIn) dom.sessionLocationOptIn.checked = !!payload.meta.location_opt_in;
	      } else {
	        dom.sessionTitle.value = data?.title || entry?.title || "";
	        dom.sessionHost.value = data?.host || entry?.host || "";
	        dom.sessionGenre.value = data?.genre || entry?.genre || "";
	      }
		      renderSegments();
		      alert(`Loaded session "${dom.sessionTitle.value || entry?.slug || entry?.id}".`);
		    } catch (err) {
		      state.currentSessionId = null;
		      alert(`Could not load session: ${err.message}`);
		    } finally {
		      setSessionsStatus(`${(state.sessions || []).length} sessions`);
		    }
		  }

		  function setSessionsStatus(text) {
		    if (dom.sessionsStatus) dom.sessionsStatus.textContent = text;
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

	  function isSafeSessionUrl(url) {
	    if (!url) return false;
	    if (url.startsWith("data:")) return true;
	    try {
	      const parsed = new URL(url, window.location.origin);
	      const allowed = new Set([window.location.origin]);
	      const supabaseUrl = localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL;
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

		  // Initialize defaults and parse callback params
		  document.addEventListener("DOMContentLoaded", () => {
    assignDom();
    bindEvents();
    renderProfileChip(null);
	    setStatus("spotify: disconnected", false);
	    hydrateLikedSessions();
	    // Always use the GitHub Pages redirect for PKCE.
	    state.redirectUri = DEFAULT_REDIRECT;
	    dom.redirectInput.value = state.redirectUri;
		    const storedClientId = sessionStorage.getItem("rs_client_id");
		    dom.clientIdInput.value = storedClientId || DEFAULT_CLIENT_ID;
		    state.clientId = dom.clientIdInput.value;
			    hydrateSupabaseConfig();
			    hydrateProfileSettingsFromLocal();
			    renderPeopleResults();
			    renderSupabaseAuthStatus();
		    loadSupabaseSessions();
		    applySavedTheme();
		    applySavedFont();
		    initMusicKit();
		    hydrateSoundcloudClientId();
		    hydrateSoundcloudToken();
		    handleSoundcloudCallback();
		    fetchSoundcloudProfile().catch(() => {});
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
	        headers: getSupabaseAuthHeaders(),
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
      } else if (segment.type === "soundcloud") {
        metaBits.push("SoundCloud");
        metaBits.push(segment.subtitle || "");
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
	    if (state.currentSessionId) {
	      recordSupabaseEvent(state.currentSessionId, "play").then((res) => {
	        if (!res.ok) console.warn("Supabase play record failed", res.error);
	      });
	    }
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

  function describeSegmentSource(segment) {
    if (!segment) return "—";
    if (segment.type === "spotify") return "Spotify";
    if (segment.type === "upload") return "Upload";
    if (segment.type === "soundcloud") return "SoundCloud";
    return "Voice";
  }

  function updateListenNow(segment) {
    if (!dom.listenTitle) return;
    dom.listenTitle.textContent = segment?.title || "—";
    dom.listenSubtitle.textContent = `${describeSegmentSource(segment)} · ${segment?.subtitle || ""}`;
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
    if (segment.type === "voice" || segment.type === "upload" || segment.type === "soundcloud") {
      const audio = new Audio(segment.url);
      audio.crossOrigin = "anonymous";
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
    if (segment.type === "voice" || segment.type === "upload" || segment.type === "soundcloud") {
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
    const audioUrl = segment.url || segment.streamUrl;
    if (!audioUrl) {
      console.warn("No audio URL for segment", segment);
      return;
    }
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
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
        visibility: dom.sessionVisibility?.value || "public",
        location_zip: (dom.sessionZip?.value || "").trim() || null,
        location_opt_in: !!dom.sessionLocationOptIn?.checked,
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
		      const { data, error } = await client.functions.invoke("create_session", {
		        headers: getSupabaseAuthHeaders(),
		        body: { payload },
		      });
		      if (error) throw error;
		      if (data?.id) state.currentSessionId = data.id;
		      const slug = data?.slug || data?.id || "";
		      loadSupabaseSessions();
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
	      state.currentSessionId = null;
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
        if (dom.sessionVisibility) dom.sessionVisibility.value = payload.meta.visibility || "public";
        if (dom.sessionZip) dom.sessionZip.value = (payload.meta.location_zip || payload.meta.zip || "").trim();
        if (dom.sessionLocationOptIn) dom.sessionLocationOptIn.checked = !!payload.meta.location_opt_in;
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
            visibility: dom.sessionVisibility?.value || "public",
            location_zip: (dom.sessionZip?.value || "").trim() || null,
            location_opt_in: !!dom.sessionLocationOptIn?.checked,
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
        if (dom.sessionVisibility) dom.sessionVisibility.value = meta.visibility || "public";
        if (dom.sessionZip) dom.sessionZip.value = (meta.location_zip || "").trim();
        if (dom.sessionLocationOptIn) dom.sessionLocationOptIn.checked = !!meta.location_opt_in;
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
