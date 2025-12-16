(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const html = htm.bind(React.createElement);

  const STORAGE = {
    theme: "rs_mobile_theme",
    accent: "rs_mobile_accent",
    recent: "rs_mobile_recent_sessions",
    likes: "rs_liked_sessions",
    builder: "rs_mobile_builder_segments",
  };

  const SUPABASE_URL_KEY = "rs_supabase_url";
  const SUPABASE_ANON_KEY = "rs_supabase_anon";
  const PROFILE_HANDLE_KEY = "rs_profile_handle";
  const PROFILE_ZIP_KEY = "rs_profile_zip";
  const PROFILE_ZIP_OPTIN_KEY = "rs_profile_zip_optin";
  const SPOTIFY_CLIENT_ID_KEY = "rs_spotify_client_id";
  const SPOTIFY_TOKEN_KEY = "rs_spotify_token";
  const SPOTIFY_REDIRECT_KEY = "rs_spotify_redirect";
  const SOUNDCLOUD_CLIENT_ID_KEY = "rs_sc_client_id";
  const SOUNDCLOUD_TOKEN_KEY = "rs_sc_token";
  const DEFAULT_CLIENT_ID = "0e01ffabf4404a23b1798c0e1c9b4762";
  const DEFAULT_SOUNDCLOUD_CLIENT_ID = "a281953d7fedd08d1a49c517fdbeba2c"; // Public SoundCloud client ID for default access
  const DEFAULT_SUPABASE_URL = "https://jduyihzjqpcczekhorrq.supabase.co";
  const DEFAULT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ";
  const SPOTIFY_SCOPES = "streaming user-modify-playback-state user-read-playback-state user-library-read playlist-read-private playlist-read-collaborative user-read-private user-read-email";

  const ACCENTS = [
    { name: "Azure", value: "#0b84ff" },
    { name: "Emerald", value: "#30d158" },
    { name: "Amber", value: "#ff9f0a" },
    { name: "Rose", value: "#ff375f" },
    { name: "Violet", value: "#af52de" },
  ];

  const SAMPLE_TRACKS = [
    { id: "t1", title: "I Can't Stop This Feeling", artist: "Pangaea Remix / Untold", source: "Spotify", duration: "4:58" },
    { id: "t2", title: "I Can't Stop This Feeling", artist: "The Vargas", source: "Spotify", duration: "3:42" },
    { id: "t3", title: "Kanpeki", artist: "BoA", source: "Apple Music", duration: "4:15" },
    { id: "t4", title: "Midnight Drive", artist: "Various Artists", source: "SoundCloud", duration: "5:22" },
  ];

  const SAMPLE_SESSIONS = [
    { id: "s1", title: "Morning Bell", host: "gaurav", trackCount: 5, duration: "18:44", likes: 12, genre: "downtempo" },
    { id: "s2", title: "First Try", host: "gaurav", trackCount: 3, duration: "12:30", likes: 8, genre: "house" },
    { id: "s3", title: "Web Check", host: "user", trackCount: 7, duration: "25:15", likes: 15, genre: "breaks" },
    { id: "s4", title: "Midnight Drive", host: "alex", trackCount: 4, duration: "14:30", likes: 23, genre: "ambient" },
    { id: "s5", title: "Sunday Morning", host: "sarah", trackCount: 6, duration: "20:45", likes: 19, genre: "r&b" },
  ];

  function cx(...parts) {
    return parts.filter(Boolean).join(" ");
  }

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function uid() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
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

  function useLocalStorageState(key, getDefault) {
    const [value, setValue] = useState(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) return safeJsonParse(raw, getDefault());
      } catch {}
      return getDefault();
    });

    useEffect(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }, [key, value]);

    return [value, setValue];
  }

  function useLocalStorageString(key, defaultValue = "") {
    const [value, setValue] = useState(() => {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? defaultValue : String(raw);
      } catch {
        return defaultValue;
      }
    });

    useEffect(() => {
      try {
        const next = String(value || "");
        if (next) localStorage.setItem(key, next);
        else localStorage.removeItem(key);
      } catch {}
    }, [key, value]);

    return [value, setValue];
  }

  function useLocalStorageBool(key, defaultValue = false) {
    const [value, setValue] = useState(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return !!defaultValue;
        return raw === "true";
      } catch {
        return !!defaultValue;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem(key, value ? "true" : "false");
      } catch {}
    }, [key, value]);

    return [value, setValue];
  }

  function useSupabase(url, anon) {
    const client = useMemo(() => {
      const cleanUrl = String(url || "").trim().replace(/\s+/g, "");
      const cleanAnon = String(anon || "").trim().replace(/\s+/g, "");
      if (!cleanUrl || !cleanAnon) return null;
      if (typeof window === "undefined" || !window.supabase) return null;
      try {
        return window.supabase.createClient(cleanUrl, cleanAnon);
      } catch {
        return null;
      }
    }, [url, anon]);

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!client) {
        setSession(null);
        setLoading(false);
        return;
      }
      let sub = null;
      let mounted = true;
      
      // Check for existing session first
      client.auth
        .getSession()
        .then(({ data }) => {
          if (mounted) {
            setSession(data?.session || null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
        });
      
      // Listen for auth state changes
      try {
        const { data } = client.auth.onAuthStateChange((_event, next) => {
          if (mounted) {
            setSession(next || null);
            setLoading(false);
          }
        });
        sub = data?.subscription || null;
      } catch {
        sub = null;
      }
      
      return () => {
        mounted = false;
        try {
          sub?.unsubscribe();
        } catch {}
      };
    }, [client]);

    const authHeaders = useMemo(() => {
      const token = session?.access_token || "";
      return token ? { Authorization: `Bearer ${token}` } : {};
    }, [session]);

    return { client, session, authHeaders, loading };
  }

  function useToast() {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);

    const show = (message) => {
      setToast({ message, id: String(Date.now()) });
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setToast(null), 2200);
    };

    useEffect(
      () => () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      },
      []
    );

    return { toast, show };
  }

  function Icon({ name }) {
    const common = { fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (name === "home") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M4 10.8 12 4l8 6.8V20a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 20z" /><path ...${common} d="M9.2 21.6v-7.2h5.6v7.2" /></svg>`;
    }
    if (name === "search") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><circle ...${common} cx="11" cy="11" r="6.5" /><path ...${common} d="M16.6 16.6 21 21" /></svg>`;
    }
    if (name === "mic") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M12 14.4a3.6 3.6 0 0 0 3.6-3.6V6.6A3.6 3.6 0 0 0 12 3a3.6 3.6 0 0 0-3.6 3.6v4.2A3.6 3.6 0 0 0 12 14.4z" /><path ...${common} d="M5.4 10.8a6.6 6.6 0 0 0 13.2 0" /><path ...${common} d="M12 14.4V21" /><path ...${common} d="M8.6 21h6.8" /></svg>`;
    }
    if (name === "stack") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M12 3l9 5-9 5-9-5z" /><path ...${common} d="M3 12.5l9 5 9-5" /><path ...${common} d="M3 17l9 5 9-5" /></svg>`;
    }
    if (name === "user") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M20 21a8 8 0 0 0-16 0" /><circle ...${common} cx="12" cy="8" r="4" /></svg>`;
    }
    if (name === "plus") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M12 5v14" /><path ...${common} d="M5 12h14" /></svg>`;
    }
    if (name === "play") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M9 7.5v9l8-4.5z" /></svg>`;
    }
    if (name === "heart") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M20.5 8.6c0 5.8-8.5 11.4-8.5 11.4S3.5 14.4 3.5 8.6A4.6 4.6 0 0 1 8.1 4c1.6 0 3 .8 3.9 2 1-1.2 2.3-2 3.9-2a4.6 4.6 0 0 1 4.6 4.6z" /></svg>`;
    }
    if (name === "spark") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8z" /></svg>`;
    }
    if (name === "discover") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><circle ...${common} cx="12" cy="12" r="10" /><circle ...${common} cx="12" cy="12" r="3" /><path ...${common} d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>`;
    }
    if (name === "headphones") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path ...${common} d="M3 14v-4a9 9 0 0 1 18 0v4" /><path ...${common} d="M3 14h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3M18 14h3a2 2 0 0 0 2 2v2a2 2 0 0 0-2 2h-3" /></svg>`;
    }
    if (name === "settings") {
      return html`<svg viewBox="0 0 24 24" aria-hidden="true"><circle ...${common} cx="12" cy="12" r="3" /><path ...${common} d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" /></svg>`;
    }
    return null;
  }

  function TopBar({ title, subtitle, right }) {
    return html`<div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="kicker">${subtitle || "radio-lab"}</div>
          <div className="title">${title}</div>
        </div>
        <div className="top-actions">${right}</div>
      </div>
    </div>`;
  }

  function TabBar({ value, onChange }) {
    const tabs = [
      { key: "build", label: "build", icon: "mic" },
      { key: "discover", label: "discover", icon: "discover" },
      { key: "listen", label: "listen", icon: "headphones" },
      { key: "me", label: "me", icon: "user" },
    ];
    return html`<div className="tabbar">
      <div className="tabbar-inner">
        ${tabs.map(
          (t) =>
            html`<button
              className=${cx("tab", value === t.key && "active", t.key === "listen" && value === t.key && "listen-active")}
              onClick=${() => onChange(t.key)}
              aria-label=${t.label}
              type="button"
            >
            <${Icon} name=${t.icon} />
            <div className="l">${t.label}</div>
          </button>`
        )}
      </div>
    </div>`;
  }

  function Toast({ toast }) {
    if (!toast) return null;
    return html`<div className="toast fade-in" role="status" aria-live="polite">
      <div className="toast-inner">${toast.message}</div>
    </div>`;
  }

  function SignInScreen({
    supabase,
    supabaseSession,
    supabaseEmail,
    setSupabaseEmail,
    onSupabaseSignIn,
    spotifyClientId,
    spotifyConnected,
    onSpotifyAuth,
    soundcloudClientId,
    soundcloudConnected,
    onSoundcloudAuth,
    toast,
  }) {
    const authedEmail = supabaseSession?.user?.email || "";
    const isSupabaseConnected = !!authedEmail;
    const isSpotifyConnected = !!spotifyConnected;
    const isSoundcloudConnected = !!soundcloudConnected;

    return html`<div style=${{ 
      minHeight: "100dvh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "var(--pad)",
      textAlign: "center"
    }}>
      <div style=${{ marginBottom: "80px" }}>
        <h1 style=${{ 
          fontSize: "32px", 
          fontWeight: 700, 
          margin: "0 0 12px",
          letterSpacing: "0.02em",
          color: "var(--text)"
        }}>Radio Lab</h1>
        <div style=${{ 
          fontSize: "18px", 
          color: "var(--muted)",
          textTransform: "lowercase",
          letterSpacing: "0.01em"
        }}>sign in</div>
      </div>

      <div style=${{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="card" style=${{ padding: "20px" }}>
          <div style=${{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", textAlign: "left" }}>Services</div>
          
          <div style=${{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style=${{ flex: 1, textAlign: "left" }}>
                <div style=${{ fontSize: "15px", fontWeight: 600 }}>Supabase</div>
                <div style=${{ fontSize: "12px", color: "var(--muted)" }}>${isSupabaseConnected ? authedEmail : "Required for app features"}</div>
              </div>
              <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
                ${isSupabaseConnected 
                  ? html`<div className="chip" style=${{ background: "rgba(48, 209, 88, 0.1)", color: "rgba(48, 209, 88, 1)", borderColor: "rgba(48, 209, 88, 0.3)" }}>Connected</div>`
                  : html`<div className="chip">Not connected</div>`}
              </div>
            </div>

            ${!isSupabaseConnected && html`
              <div style=${{ marginTop: "8px" }}>
                <div className="field">
                  <input 
                    value=${supabaseEmail} 
                    onChange=${(e) => setSupabaseEmail(e.target.value)} 
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
                <button 
                  className="pill primary" 
                  onClick=${onSupabaseSignIn} 
                  type="button"
                  style=${{ width: "100%", marginTop: "8px" }}
                  disabled=${!supabaseEmail.trim()}
                >
                  Sign in with Email
                </button>
              </div>
            `}
          </div>
        </div>

        <div className="card" style=${{ padding: "20px" }}>
          <div style=${{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", textAlign: "left" }}>Music Services</div>
          
          <div style=${{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style=${{ flex: 1, textAlign: "left" }}>
                <div style=${{ fontSize: "15px", fontWeight: 600 }}>Spotify</div>
                <div style=${{ fontSize: "12px", color: "var(--muted)" }}>${isSpotifyConnected ? "Connected" : spotifyClientId ? "Ready to connect" : "Add Client ID in Settings"}</div>
              </div>
              <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
                ${isSpotifyConnected 
                  ? html`<div className="chip" style=${{ background: "rgba(48, 209, 88, 0.1)", color: "rgba(48, 209, 88, 1)", borderColor: "rgba(48, 209, 88, 0.3)" }}>Connected</div>`
                  : html`<div className="chip">Not connected</div>`}
              </div>
            </div>

            ${!isSpotifyConnected && spotifyClientId && html`
              <button 
                className="pill primary" 
                onClick=${onSpotifyAuth} 
                type="button"
                style=${{ width: "100%", marginTop: "8px" }}
              >
                Connect Spotify
              </button>
            `}

            <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
              <div style=${{ flex: 1, textAlign: "left" }}>
                <div style=${{ fontSize: "15px", fontWeight: 600 }}>SoundCloud</div>
                <div style=${{ fontSize: "12px", color: "var(--muted)" }}>${isSoundcloudConnected ? "Connected" : soundcloudClientId ? "Ready to connect" : "Add Client ID in Settings"}</div>
              </div>
              <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
                ${isSoundcloudConnected 
                  ? html`<div className="chip" style=${{ background: "rgba(48, 209, 88, 0.1)", color: "rgba(48, 209, 88, 1)", borderColor: "rgba(48, 209, 88, 0.3)" }}>Connected</div>`
                  : html`<div className="chip">Not connected</div>`}
              </div>
            </div>

            ${!isSoundcloudConnected && soundcloudClientId && html`
              <button 
                className="pill primary" 
                onClick=${onSoundcloudAuth} 
                type="button"
                style=${{ width: "100%", marginTop: "8px" }}
              >
                Connect SoundCloud
              </button>
            `}
          </div>
        </div>

        ${isSupabaseConnected && html`
          <div style=${{ marginTop: "20px", padding: "16px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style=${{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Signed in as ${authedEmail}</div>
            <div style=${{ fontSize: "12px", color: "var(--muted)", lineHeight: "1.5", marginBottom: "12px" }}>
              You can access the app. Connect music services below or continue to the app.
            </div>
            <button 
              className="pill primary" 
              onClick=${() => window.location.reload()} 
              type="button"
              style=${{ width: "100%" }}
            >
              Continue to App
            </button>
          </div>
        `}
      </div>
    </div>`;
  }

  function NowPlayingBar({ currentTrack, isPlaying, currentTime, duration, onPlayPause, onNavigateToListen }) {
    if (!currentTrack) return null;
    
    const formatTime = (seconds) => {
      const total = Math.floor(seconds || 0);
      const m = String(Math.floor(total / 60));
      const s = String(total % 60).padStart(2, "0");
      return `${m}:${s}`;
    };

    return html`<div className="now-playing-bar" onClick=${onNavigateToListen} style=${{ cursor: "pointer" }}>
      <div className="now-playing-inner">
        <div style=${{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <div className="thumb" style=${{ width: "40px", height: "40px", flexShrink: 0, backgroundImage: currentTrack.cover_url ? `url(${currentTrack.cover_url})` : "none", backgroundSize: "cover" }}></div>
          <div style=${{ flex: 1, minWidth: 0 }}>
            <div style=${{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${currentTrack.title || "Untitled"}</div>
            <div style=${{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${currentTrack.host || currentTrack.artist || "Unknown"}</div>
          </div>
        </div>
        <div style=${{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style=${{ width: "60px", height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", overflow: "hidden" }}>
            <div style=${{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, height: "100%", background: "var(--accent)", transition: "width 0.1s linear" }}></div>
          </div>
          <button
            className="pill icon"
            onClick=${(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            type="button"
            style=${{ width: "32px", height: "32px", padding: 0 }}
          >
            ${isPlaying
              ? html`<svg viewBox="0 0 24 24" fill="currentColor" style=${{ width: "16px", height: "16px" }}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>`
              : html`<svg viewBox="0 0 24 24" fill="currentColor" style=${{ width: "16px", height: "16px" }}><path d="M8 5v14l11-7z" /></svg>`}
          </button>
        </div>
      </div>
    </div>`;
  }

  function Segmented({ options, value, onChange }) {
    return html`<div className="segmented" role="tablist">
      ${options.map(
        (o) => html`<button
          className=${cx(value === o.value && "active")}
          role="tab"
          aria-selected=${value === o.value}
          onClick=${() => onChange(o.value)}
          type="button"
        >
          ${o.label}
        </button>`
      )}
    </div>`;
  }

  function Toggle({ value, onChange, label }) {
    return html`<button
      className=${cx("toggle", value && "on")}
      role="switch"
      aria-checked=${value}
      aria-label=${label}
      onClick=${() => onChange(!value)}
      type="button"
    ></button>`;
  }

  function HomeScreen({ recentSessions, services, onNewShow, onBrowse, onLoadSession }) {
    return html`<div className="fade-in">
      <div className="hero">
        <h1>Build a show that feels like you.</h1>
        <p>Drop tracks, record the glue, and publish. Minimal controls — maximum vibe.</p>
        <div className="row" style=${{ marginTop: "14px" }}>
          <button className="pill primary" onClick=${onNewShow} type="button">
            <span style=${{ display: "inline-flex", marginRight: "8px" }}><${Icon} name="spark" /></span>
            New Show
          </button>
          <button className="pill" onClick=${onBrowse} type="button">Browse Sessions</button>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Recent Sessions</div>
          <div className="section-note">${recentSessions.length ? `${recentSessions.length} saved` : "nothing yet"}</div>
        </div>
        <div className="list">
          ${recentSessions.length
            ? recentSessions.slice(0, 3).map((s) => html`<div className="item">
                  <div className="thumb"></div>
                  <div className="grow meta">
                    <div className="t">${s.title}</div>
                    <div className="s">${s.trackCount} tracks · ${s.duration}</div>
                  </div>
                  <button className="pill primary" onClick=${() => onLoadSession(s)} type="button">Load</button>
                </div>`)
            : html`<div className="card">
                <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>
                  Load a session from the community or start a new show — we’ll keep your recent sessions here.
                </div>
              </div>`}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Connected</div>
          <div className="section-note">bring your library</div>
        </div>
        <div className="list">
          ${services.map(
            (svc) => html`<div className="item">
              <div className="thumb"></div>
              <div className="grow meta">
                <div className="t">${svc.name}</div>
                <div className="s">${svc.connected ? "Connected" : svc.available ? "Available" : "Not connected"}</div>
              </div>
              <div className="chip">${svc.connected ? "Ready" : svc.available ? "Default" : "Optional"}</div>
            </div>`
          )}
        </div>
      </div>
    </div>`;
  }

  async function searchSoundCloud(query, clientId, token) {
    if (!query || !clientId) return [];
    try {
      const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${encodeURIComponent(clientId)}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`SoundCloud API error: ${res.status}`);
      const data = await res.json();
      return (data.collection || []).map((track) => ({
        id: `sc_${track.id}`,
        title: track.title || "Untitled",
        artist: track.user?.username || track.user?.full_name || "Unknown Artist",
        source: "SoundCloud",
        duration: formatTrackDuration(track.duration),
        soundcloudId: track.id,
        uri: track.permalink_url,
        artwork: track.artwork_url,
      }));
    } catch (err) {
      console.error("SoundCloud search failed", err);
      return [];
    }
  }

  async function searchSpotify(query, token) {
    if (!query || !token) return [];
    try {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
      const data = await res.json();
      return (data.tracks?.items || []).map((track) => ({
        id: `sp_${track.id}`,
        title: track.name || "Untitled",
        artist: track.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
        source: "Spotify",
        duration: formatTrackDuration(track.duration_ms),
        spotifyId: track.id,
        uri: track.uri,
        artwork: track.album?.images?.[0]?.url,
      }));
    } catch (err) {
      console.error("Spotify search failed", err);
      return [];
    }
  }

  function formatTrackDuration(ms) {
    if (!ms) return "0:00";
    const total = Math.floor(Number(ms) / 1000);
    const m = String(Math.floor(total / 60));
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function FindScreen({ tracks, onAddTrack, soundcloudClientId, soundcloudToken, spotifyToken, soundcloudAvailable }) {
    const [mode, setMode] = useState("search");
    const [q, setQ] = useState("");
    const [provider, setProvider] = useState("soundcloud");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const availableProviders = useMemo(() => {
      const providers = [];
      if (soundcloudAvailable) providers.push({ value: "soundcloud", label: "SoundCloud" });
      if (spotifyToken) providers.push({ value: "spotify", label: "Spotify" });
      return providers.length ? providers : [{ value: "soundcloud", label: "SoundCloud" }];
    }, [soundcloudAvailable, spotifyToken]);

    useEffect(() => {
      if (availableProviders.length && !availableProviders.find((p) => p.value === provider)) {
        setProvider(availableProviders[0].value);
      }
    }, [availableProviders, provider]);

    useEffect(() => {
      if (mode !== "search" || !q.trim()) {
        setSearchResults([]);
        return;
      }

      let cancelled = false;
      setSearching(true);
      (async () => {
        try {
          let results = [];
          if (provider === "soundcloud") {
            results = await searchSoundCloud(q, soundcloudClientId || DEFAULT_SOUNDCLOUD_CLIENT_ID, soundcloudToken);
          } else if (provider === "spotify" && spotifyToken) {
            results = await searchSpotify(q, spotifyToken);
          }
          if (!cancelled) setSearchResults(results);
        } catch (err) {
          console.error("Search error", err);
          if (!cancelled) setSearchResults([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [q, provider, mode, soundcloudClientId, soundcloudToken, spotifyToken]);

    const filtered = useMemo(() => {
      if (mode === "search") {
        return searchResults;
      }
      const query = q.trim().toLowerCase();
      const base = tracks.slice(0, 10);
      if (!query) return base;
      return base.filter((t) => `${t.title} ${t.artist} ${t.source}`.toLowerCase().includes(query));
    }, [mode, q, tracks, searchResults]);

    return html`<div className="fade-in">
      <div className="section" style=${{ marginTop: 0 }}>
        <div className="section-head">
          <div className="section-title">Find</div>
          <div className="section-note">search & saved</div>
        </div>
        <${Segmented}
          options=${[
            { label: "Search", value: "search" },
            { label: "Saved", value: "saved" },
          ]}
          value=${mode}
          onChange=${setMode}
        />
      </div>

      ${mode === "search" && availableProviders.length > 1 && html`<div className="section" style=${{ marginTop: "-8px" }}>
        <${Segmented}
          options=${availableProviders}
          value=${provider}
          onChange=${setProvider}
        />
      </div>`}

      <div className="section">
        <div className="field">
          <input
            value=${q}
            onChange=${(e) => setQ(e.target.value)}
            placeholder=${mode === "saved" ? "Filter saved tracks…" : `Search ${provider === "soundcloud" ? "SoundCloud" : "Spotify"} tracks…`}
            disabled=${searching}
          />
          ${q && html`<button className="pill icon" onClick=${() => setQ("")} aria-label="Clear" type="button">
            <span style=${{ fontWeight: 700, opacity: 0.75 }}>×</span>
          </button>`}
        </div>
      </div>

      <div className="section">
        ${searching && html`<div className="card">
          <div style=${{ color: "var(--muted)", textAlign: "center" }}>Searching...</div>
        </div>`}
        ${!searching && mode === "search" && !q.trim() && html`<div className="card">
          <div style=${{ color: "var(--muted)", lineHeight: 1.5, textAlign: "center" }}>
            Enter a search query to find tracks from ${provider === "soundcloud" ? "SoundCloud" : "Spotify"}
          </div>
        </div>`}
        ${!searching && mode === "search" && q.trim() && !filtered.length && html`<div className="card">
          <div style=${{ color: "var(--muted)", lineHeight: 1.5, textAlign: "center" }}>No results found</div>
        </div>`}
        <div className="list">
          ${filtered.map(
            (t) => html`<div className="item">
              ${t.artwork ? html`<div className="thumb" style=${{ backgroundImage: `url(${t.artwork})`, backgroundSize: "cover" }}></div>` : html`<div className="thumb"></div>`}
              <div className="grow meta">
                <div className="t">${t.title}</div>
                <div className="s">${t.artist} · ${t.source} · ${t.duration}</div>
              </div>
              <button className="pill icon primary" onClick=${() => onAddTrack(t)} aria-label="Add to show" type="button">
                <${Icon} name="plus" />
              </button>
            </div>`
          )}
        </div>
      </div>
    </div>`;
  }

	  function SaveDialog({ segments, onSaveLocal, onSaveSupabase, onClose, supabase, authHeaders, profileHandle, zip, zipOptIn }) {
    const [title, setTitle] = useState("");
    const [genre, setGenre] = useState("");
    const [tags, setTags] = useState("");
    const [visibility, setVisibility] = useState("public");
    const [saving, setSaving] = useState(false);

    const parseDuration = (durationStr) => {
      const parts = String(durationStr || "0:00").split(":");
      const minutes = parseInt(parts[0] || "0", 10);
      const seconds = parseInt(parts[1] || "0", 10);
      return (minutes * 60 + seconds) * 1000;
    };

    const calculateTotalDuration = () => {
      return segments.reduce((total, seg) => total + parseDuration(seg.duration), 0);
    };

    const formatSegments = () => {
      return segments.map((seg) => {
        const base = {
          id: seg.id || `seg_${Date.now()}_${Math.random()}`,
          type: seg.type === "voice" ? "voice" : seg.source === "Spotify" ? "spotify" : seg.source === "SoundCloud" ? "soundcloud" : "upload",
          title: seg.title || "Untitled",
          subtitle: seg.artist || "—",
          duration: parseDuration(seg.duration),
          fadeIn: !!seg.fade,
          fadeOut: !!seg.fade,
          cue: !!seg.cue,
        };
        if (seg.audioData) {
          base.audioData = seg.audioData; // Base64 data URL for voice recordings
        }
        if (seg.uri) base.uri = seg.uri;
        if (seg.spotifyId) base.spotifyId = seg.spotifyId;
        if (seg.soundcloudId) base.soundcloudId = seg.soundcloudId;
        return base;
      });
    };

    const handleSaveLocal = async () => {
      if (!title.trim()) {
        toast("Please enter a title");
        return;
      }
      setSaving(true);
      try {
        const payload = {
          version: 2,
          tracksOnly: false,
          meta: {
            title: title.trim(),
            host: profileHandle || "Anonymous",
            genre: genre.trim() || null,
            tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            date: new Date().toISOString().split("T")[0],
            duration_ms: calculateTotalDuration(),
          },
          segments: formatSegments(),
        };
        await onSaveLocal(payload);
        onClose();
      } catch (err) {
        toast("Save failed: " + (err.message || "Unknown error"));
      } finally {
        setSaving(false);
      }
    };

    const handleSaveSupabase = async () => {
      if (!title.trim()) {
        toast("Please enter a title");
        return;
      }
      if (!supabase) {
        toast("Supabase not configured");
        return;
      }
      setSaving(true);
      try {
        const payload = {
          meta: {
            title: title.trim(),
            host: profileHandle || "Anonymous",
            genre: genre.trim() || null,
            tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            duration_ms: calculateTotalDuration(),
            visibility: visibility,
            location_zip: zipOptIn && zip ? zip.trim() : null,
            location_opt_in: zipOptIn && zip ? true : false,
          },
          segments: formatSegments(),
        };

        const { data, error } = await supabase.functions.invoke("create_session", {
          headers: authHeaders || {},
          body: { payload },
        });

        if (error) throw error;
        toast("Published to Supabase!");
        onClose();
      } catch (err) {
        toast("Publish failed: " + (err.message || "Unknown error"));
      } finally {
        setSaving(false);
      }
    };

    return html`<div className="modal-overlay" onClick=${onClose}>
      <div className="modal" onClick=${(e) => e.stopPropagation()}>
        <div className="section" style=${{ marginTop: 0 }}>
          <div className="section-head">
            <div className="section-title">Save Session</div>
            <button className="pill icon" onClick=${onClose} aria-label="Close" type="button">×</button>
          </div>
        </div>
        <div className="section">
          <div className="field">
            <div style=${{ marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Title *</div>
            <input value=${title} onChange=${(e) => setTitle(e.target.value)} placeholder="My Radio Show" />
          </div>
          <div className="field">
            <div style=${{ marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Genre</div>
            <input value=${genre} onChange=${(e) => setGenre(e.target.value)} placeholder="house, breaks, ambient..." />
          </div>
          <div className="field">
            <div style=${{ marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Tags (comma-separated)</div>
            <input value=${tags} onChange=${(e) => setTags(e.target.value)} placeholder="chill, morning, live" />
          </div>
          ${supabase && html`<div className="field">
            <div style=${{ marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Visibility</div>
            <${Segmented}
              options=${[
                { label: "Public", value: "public" },
                { label: "Unlisted", value: "unlisted" },
                { label: "Followers", value: "followers" },
              ]}
              value=${visibility}
              onChange=${setVisibility}
            />
          </div>`}
        </div>
        <div className="section">
          <div className="row">
            <button
              className="pill"
              style=${{ flex: 1 }}
              onClick=${handleSaveLocal}
              disabled=${saving || !title.trim()}
              type="button"
            >
              Save Locally
            </button>
            ${supabase && html`<button
              className="pill primary"
              style=${{ flex: 1 }}
              onClick=${handleSaveSupabase}
              disabled=${saving || !title.trim()}
              type="button"
            >
              ${saving ? "Publishing..." : "Publish to Supabase"}
            </button>`}
          </div>
        </div>
      </div>
    </div>`;
  }

	  function EditSongModal({ segment, onClose, onSave, onDelete }) {
	    const [startTime, setStartTime] = useState(0);
	    const [endTime, setEndTime] = useState(segment?.duration || 0);
	    const [fadeIn, setFadeIn] = useState(0);
	    const [fadeOut, setFadeOut] = useState(0);
	    const [note, setNote] = useState("");
	    const [duckUnderVoice, setDuckUnderVoice] = useState(true);

	    const formatTime = (seconds) => {
	      const total = Math.floor(seconds || 0);
	      const m = String(Math.floor(total / 60));
	      const s = String(total % 60).padStart(2, "0");
	      return `${m}:${s}`;
	    };

	    const parseDuration = (durationStr) => {
	      if (!durationStr) return 0;
	      const parts = String(durationStr).split(":");
	      if (parts.length === 2) {
	        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
	      }
	      return 0;
	    };

	    useEffect(() => {
	      if (segment) {
	        const totalSeconds = parseDuration(segment.duration);
	        setEndTime(totalSeconds);
	      }
	    }, [segment]);

	    const handleSave = () => {
	      onSave({
	        ...segment,
	        startTime,
	        endTime,
	        fadeIn,
	        fadeOut,
	        note: note.trim() || null,
	        duckUnderVoice,
	      });
	      onClose();
	    };

	    const totalSeconds = parseDuration(segment?.duration || "0:00");
	    const selectedDuration = endTime - startTime;

	    return html`<div className="modal-overlay" onClick=${onClose}>
	      <div className="modal" onClick=${(e) => e.stopPropagation()}>
	        <div className="sheet-head">
	          <div>
	            <div className="sheet-title">Edit Song</div>
	          </div>
	          <button className="pill icon" onClick=${onClose} type="button">×</button>
	        </div>

	        <div style=${{ marginBottom: "20px" }}>
	          <div style=${{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
	            <div className="thumb" style=${{ width: "60px", height: "60px" }}></div>
	            <div style=${{ flex: 1 }}>
	              <div style=${{ fontWeight: 700, marginBottom: "4px" }}>${segment?.title || "Untitled"}</div>
	              <div style=${{ color: "var(--muted)", fontSize: "14px" }}>${segment?.artist || "Unknown"}</div>
	            </div>
	            <button className="pill primary" onClick=${() => toast("Preview (prototype)")} type="button">Preview</button>
	          </div>
	        </div>

	        <div style=${{ marginBottom: "20px" }}>
	          <div style=${{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
	            <div>
	              <div style=${{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Start</div>
	              <div style=${{ fontSize: "18px", fontWeight: 700 }}>${formatTime(startTime)}</div>
	            </div>
	            <div>
	              <div style=${{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>End:</div>
	              <div style=${{ fontSize: "18px", fontWeight: 700 }}>${formatTime(endTime)}</div>
	            </div>
	          </div>
	          <div style=${{ background: "var(--surface)", borderRadius: "12px", padding: "12px", marginBottom: "8px" }}>
	            <div style=${{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
	              <div style=${{ flex: 1, height: "40px", background: "rgba(0,0,0,0.1)", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
	                <div style=${{ position: "absolute", left: `${(startTime / totalSeconds) * 100}%`, width: `${(selectedDuration / totalSeconds) * 100}%`, height: "100%", background: "var(--accent)", opacity: 0.6 }}></div>
	              </div>
	            </div>
	            <div style=${{ fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>${formatTime(totalSeconds)}</div>
	          </div>
	          <div style=${{ display: "flex", gap: "12px" }}>
	            <button className="pill" onClick=${() => setStartTime(Math.max(0, startTime - 1))} type="button" style=${{ flex: 1 }}>-1s</button>
	            <button className="pill" onClick=${() => setStartTime(Math.min(endTime - 1, startTime + 1))} type="button" style=${{ flex: 1 }}>+1s</button>
	            <button className="pill" onClick=${() => setEndTime(Math.max(startTime + 1, endTime - 1))} type="button" style=${{ flex: 1 }}>-1s</button>
	            <button className="pill" onClick=${() => setEndTime(Math.min(totalSeconds, endTime + 1))} type="button" style=${{ flex: 1 }}>+1s</button>
	          </div>
	        </div>

	        <div style=${{ marginBottom: "20px" }}>
	          <div style=${{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Fade In</div>
	          <div style=${{ display: "flex", alignItems: "center", gap: "12px" }}>
	            <input
	              type="range"
	              min="0"
	              max="2"
	              step="0.1"
	              value=${fadeIn}
	              onChange=${(e) => setFadeIn(parseFloat(e.target.value))}
	              style=${{ flex: 1 }}
	            />
	            <div style=${{ minWidth: "40px", textAlign: "right", fontSize: "14px" }}>${fadeIn.toFixed(1)}s</div>
	          </div>
	          <div style=${{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>1 s</div>
	        </div>

	        <div style=${{ marginBottom: "20px" }}>
	          <div style=${{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Fade Out</div>
	          <div style=${{ display: "flex", alignItems: "center", gap: "12px" }}>
	            <input
	              type="range"
	              min="0"
	              max="2"
	              step="0.1"
	              value=${fadeOut}
	              onChange=${(e) => setFadeOut(parseFloat(e.target.value))}
	              style=${{ flex: 1 }}
	            />
	            <div style=${{ minWidth: "40px", textAlign: "right", fontSize: "14px" }}>${fadeOut.toFixed(1)}s</div>
	          </div>
	          <div style=${{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>2 s</div>
	        </div>

	        <div style=${{ marginBottom: "20px" }}>
	          <div style=${{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Add Note</div>
	          <input
	            value=${note}
	            onChange=${(e) => setNote(e.target.value)}
	            placeholder="Optional note..."
	            style=${{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface)", color: "var(--text)" }}
	          />
	        </div>

	        <div style=${{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
	          <div style=${{ fontSize: "13px", fontWeight: 600 }}>Duck Under Voice</div>
	          <${Toggle} value=${duckUnderVoice} onChange=${setDuckUnderVoice} label="Duck Under Voice" />
	        </div>

	        <div style=${{ display: "flex", gap: "12px", marginBottom: "20px" }}>
	          <button className="pill danger" onClick=${() => { onDelete(segment.id); onClose(); }} type="button" style=${{ flex: 1 }}>
	            Delete Clip
	          </button>
	          <button className="pill primary" onClick=${handleSave} type="button" style=${{ flex: 1 }}>
	            Done
	          </button>
	        </div>
	      </div>
	    </div>`;
	  }

	  function BuilderScreen({ segments, setSegments, toast, supabase, authHeaders, profileHandle, zip, zipOptIn }) {
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [editingSegment, setEditingSegment] = useState(null);
    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
      if (!recording) return;
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }, [recording]);

    useEffect(() => {
      if (!recording) {
        setSeconds(0);
        audioChunksRef.current = [];
      }
    }, [recording]);

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Recording failed", err);
        toast("Microphone access denied or unavailable");
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
    };

    const addVoice = async () => {
      stopRecording();
      
      // Wait a bit for the recording to finalize
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm",
        });

        // Convert to base64 data URL
        const reader = new FileReader();
        const audioData = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
        const ss = String(seconds % 60).padStart(2, "0");

        const seg = {
          id: `v_${Date.now()}`,
          type: "voice",
          title: "Voice take",
          artist: "Host mic",
          source: "Mic",
          duration: `${mm}:${ss}`,
          cue: true,
          fade: true,
          audioData: audioData, // Base64 data URL
        };
        setSegments((prev) => [seg, ...prev]);
        toast("Voice take added");
      } catch (err) {
        console.error("Failed to process recording", err);
        toast("Failed to save recording");
      }
    };

    const cancelRecording = () => {
      stopRecording();
      audioChunksRef.current = [];
      toast("Recording cancelled");
    };

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    const toggle = (id, key) => {
      setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: !s[key] } : s)));
    };

    const remove = (id) => setSegments((prev) => prev.filter((s) => s.id !== id));

    return html`<div className="fade-in">
      <div className="section" style=${{ marginTop: 0 }}>
        <div className="section-head">
          <div className="section-title">Builder</div>
          <div className="section-note">voice + track flow</div>
        </div>
        <div className="card hero">
          <div className="row">
            <div className="grow">
              <div style=${{ fontWeight: 700, marginBottom: "4px" }}>Voice Recording</div>
              <div style=${{ color: "var(--muted)" }}>Punch in for bumps, links, and talk-over.</div>
            </div>
            <div className="chip">${mm}:${ss}</div>
          </div>
          <div className="row" style=${{ marginTop: "12px" }}>
            ${recording
              ? html`<button className="pill primary" onClick=${addVoice} type="button">Stop & Add</button>
                  <button className="pill" onClick=${cancelRecording} type="button">Cancel</button>`
              : html`<button className="pill primary" onClick=${startRecording} type="button">
                  <span style=${{ display: "inline-flex", marginRight: "8px" }}><${Icon} name="mic" /></span>
                  Start Recording
                </button>`}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Tracks</div>
          <div className="section-note">${segments.length ? `${segments.length} in queue` : "add from Find"}</div>
        </div>
        <div className="list">
          ${segments.map(
            (s) => html`<div className="item" style=${{ cursor: "pointer" }} onClick=${() => setEditingSegment(s)}>
              <div className="thumb"></div>
              <div className="grow meta">
                <div className="t">${s.title}</div>
                <div className="s">${s.artist} · ${s.source} · ${s.duration}</div>
                <div className="row" style=${{ marginTop: "10px", gap: "10px" }}>
                  <div className="chip">
                    Cue
                    <${Toggle} value=${!!s.cue} onChange=${(e) => { e.stopPropagation(); toggle(s.id, "cue"); }} label="Cue" />
                  </div>
                  <div className="chip">
                    Fade
                    <${Toggle} value=${!!s.fade} onChange=${(e) => { e.stopPropagation(); toggle(s.id, "fade"); }} label="Fade" />
                  </div>
                </div>
              </div>
              <button className="pill icon" onClick=${(e) => { e.stopPropagation(); remove(s.id); }} aria-label="Remove" type="button">
                <span style=${{ fontWeight: 700, opacity: 0.75 }}>×</span>
              </button>
            </div>`
          )}
          ${!segments.length &&
          html`<div className="card">
            <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>
              Start in <b>Find</b>, tap <b>+</b> to add tracks, then come back here to record and shape transitions.
            </div>
          </div>`}
        </div>
      </div>

      <div className="section">
        <div className="row">
          <button className="pill primary" style=${{ flex: 1 }} onClick=${() => toast("Play (prototype)")} type="button">
            <span style=${{ display: "inline-flex", marginRight: "8px" }}><${Icon} name="play" /></span>
            Play
          </button>
          <button className="pill" style=${{ flex: 1 }} onClick=${() => setShowSaveDialog(true)} type="button" disabled=${!segments.length}>
            Publish
          </button>
        </div>
      </div>

      <div style=${{ position: "fixed", bottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 20px)", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <button
          className="pill primary"
          onClick=${startRecording}
          type="button"
          style=${{ width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow)" }}
          disabled=${recording}
        >
          <${Icon} name="mic" />
        </button>
      </div>

      ${editingSegment && html`<${EditSongModal}
        segment=${editingSegment}
        onClose=${() => setEditingSegment(null)}
        onSave=${(updated) => {
          setSegments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          toast("Segment updated");
        }}
        onDelete=${(id) => {
          remove(id);
          toast("Segment deleted");
        }}
      />`}
      ${showSaveDialog && html`<${SaveDialog}
        segments=${segments}
        onSaveLocal=${async (payload) => {
          try {
            const sessions = JSON.parse(localStorage.getItem(STORAGE.recent) || "[]");
            const sessionEntry = {
              id: `local_${Date.now()}`,
              title: payload.meta.title,
              trackCount: payload.segments.length,
              duration: formatDuration(payload.meta.duration_ms || 0),
              genre: payload.meta.genre,
              savedAt: Date.now(),
              payload: payload,
            };
            const updated = [sessionEntry, ...sessions].slice(0, 10);
            localStorage.setItem(STORAGE.recent, JSON.stringify(updated));
            toast("Saved locally");
          } catch (err) {
            toast("Save failed: " + (err.message || "Unknown error"));
            throw err;
          }
        }}
        onSaveSupabase=${async () => {}}
        onClose=${() => setShowSaveDialog(false)}
        supabase=${supabase}
        authHeaders=${authHeaders}
        profileHandle=${profileHandle}
        zip=${zip}
        zipOptIn=${zipOptIn}
      />`}
	    </div>`;
	  }

	  function formatDuration(ms) {
	    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
	    const m = String(Math.floor(total / 60));
	    const s = String(total % 60).padStart(2, "0");
	    return `${m}:${s}`;
	  }

	  function LiveRoomScreen({ supabase, live, userId, onClose, toast }) {
	    const [events, setEvents] = useState([]);
	    const [text, setText] = useState("");
	    const [micOn, setMicOn] = useState(false);
	    const [audioOn, setAudioOn] = useState(false);
	    const [voiceStatus, setVoiceStatus] = useState("—");
	    const profilesRef = useRef(new Map());
	    const scrollerRef = useRef(null);
	    const audioRef = useRef(null);
	    const rtcRef = useRef({
	      processed: new Set(),
	      micEnabled: false,
	      listening: false,
	      localStream: null,
	      peers: new Map(),
	      pc: null,
	      remoteStream: null,
	      pendingOffers: new Map(),
	      pendingCandidates: new Map(),
	    });

	    const RTC_EVENT_TYPES = new Set(["webrtc_offer", "webrtc_answer", "webrtc_ice", "webrtc_hangup"]);
	    const isHost = !!(userId && live?.host_user_id && userId === live.host_user_id);

		    const updateVoice = () => {
		      const rtc = rtcRef.current;
		      const peerCount = rtc.peers instanceof Map ? rtc.peers.size : 0;
		      setMicOn(!!rtc.micEnabled);
		      setAudioOn(!!rtc.listening);
	      if (!userId) {
	        setVoiceStatus("Sign in for voice");
	      } else if (isHost) {
	        if (rtc.micEnabled) setVoiceStatus(`Mic on · ${peerCount} listener${peerCount === 1 ? "" : "s"}`);
	        else setVoiceStatus(rtc.pendingOffers?.size ? `Enable mic to accept ${rtc.pendingOffers.size} listener${rtc.pendingOffers.size === 1 ? "" : "s"}` : "Mic off");
	      } else {
	        setVoiceStatus(rtc.listening ? "Listening" : "Audio off");
		      }
		    };

		    const shutdownRtc = () => {
		      const rtc = rtcRef.current;
		      try {
		        rtc.pc?.close();
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
	        rtc.localStream?.getTracks?.().forEach((t) => t.stop());
	      } catch {}
	      rtc.localStream = null;
	      rtc.remoteStream = null;
	      rtc.micEnabled = false;
	      rtc.listening = false;
	      rtc.pendingOffers = new Map();
	      rtc.pendingCandidates = new Map();
		      if (audioRef.current) {
		        try {
		          audioRef.current.srcObject = null;
		        } catch {}
		      }
		    };

		    const resetRtc = () => {
		      shutdownRtc();
		      updateVoice();
		    };

		    useEffect(() => {
		      rtcRef.current.processed = new Set();
		      resetRtc();
		      return () => {
		        try {
		          const rtc = rtcRef.current;
		          const hostId = live?.host_user_id || "";
		          if (userId && hostId && rtc) {
		            if (userId === hostId) {
		              const peerIds = Array.from(rtc.peers instanceof Map ? rtc.peers.keys() : []);
		              const pendingIds = Array.from(rtc.pendingOffers instanceof Map ? rtc.pendingOffers.keys() : []);
		              const toHangup = Array.from(new Set([...peerIds, ...pendingIds])).filter(Boolean);
		              for (const remoteUserId of toHangup) {
		                sendRtcEvent("webrtc_hangup", { to_user_id: remoteUserId, from_user_id: userId, reason: "host_room_closed" }).catch(() => {});
		              }
		            } else if (rtc.listening) {
		              sendRtcEvent("webrtc_hangup", { to_user_id: hostId, from_user_id: userId, reason: "listener_room_closed" }).catch(() => {});
		            }
		          }
		        } catch {}
		        shutdownRtc();
		      };
		      // eslint-disable-next-line react-hooks/exhaustive-deps
		    }, [live?.id]);

	    useEffect(() => {
	      profilesRef.current = new Map();
	      setEvents([]);
	      if (!supabase || !live?.id) return;
	      let cancelled = false;
	      (async () => {
	        try {
	          const { data, error } = await supabase
	            .from("live_events")
	            .select("id, live_session_id, user_id, type, payload, created_at")
	            .eq("live_session_id", live.id)
	            .order("created_at", { ascending: true })
	            .limit(100);
	          if (cancelled) return;
	          if (error) throw error;
	          const rows = Array.isArray(data) ? data : [];
		          const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
		          if (userIds.length) {
		            const { data: profiles } = await supabase.from("profiles").select("user_id, handle, display_name").in("user_id", userIds);
		            if (cancelled) return;
		            (profiles || []).forEach((p) => profilesRef.current.set(p.user_id, p));
		          }
		          if (cancelled) return;
		          const enriched = rows.map((r) => ({ ...r, user: r.user_id ? profilesRef.current.get(r.user_id) || null : null }));
		          const display = [];
		          for (const ev of enriched) {
		            if (RTC_EVENT_TYPES.has(ev.type)) {
		              // Process any pending RTC signals in history (offers/answers/ice).
		              await handleRtcSignal(ev);
		            } else {
		              display.push(ev);
		            }
		          }
		          setEvents(display);
		        } catch (err) {
		          console.warn("live events load failed", err);
		          toast("Couldn't load chat");
		          setEvents([]);
	        }
	      })();
	      return () => {
	        cancelled = true;
	      };
	    }, [supabase, live?.id]);

		    useEffect(() => {
		      if (!supabase || !live?.id) return;
		      const channel = supabase
		        .channel(`rs-live-events-${live.id}`)
		        .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_events", filter: `live_session_id=eq.${live.id}` }, async (payload) => {
		          const ev = payload?.new || null;
		          if (!ev?.id) return;
		          if (RTC_EVENT_TYPES.has(ev.type)) {
		            await handleRtcSignal(ev);
		            return;
		          }
		          let user = null;
		          if (ev.user_id) {
		            user = profilesRef.current.get(ev.user_id) || null;
		            if (!user) {
	              try {
	                const { data: profile } = await supabase.from("profiles").select("user_id, handle, display_name").eq("user_id", ev.user_id).maybeSingle();
	                if (profile?.user_id) {
	                  profilesRef.current.set(profile.user_id, profile);
	                  user = profile;
	                }
		              } catch {}
		            }
		          }
		          setEvents((prev) => [...prev, { ...ev, user }]);
		        })
		        .subscribe();
	      return () => {
	        try {
	          channel.unsubscribe().catch(() => {});
	        } catch {}
	      };
	    }, [supabase, live?.id]);

		    useEffect(() => {
		      requestAnimationFrame(() => {
		        try {
		          scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
		        } catch {}
		      });
		    }, [events.length]);

		    const sendRtcEvent = async (type, payload) => {
		      if (!supabase || !userId || !live?.id) return { ok: false };
		      try {
		        const { error } = await supabase.from("live_events").insert({
		          live_session_id: live.id,
		          user_id: userId,
		          type,
		          payload: payload || {},
		        });
		        if (error) throw error;
		        return { ok: true };
		      } catch (err) {
		        console.warn("sendRtcEvent failed", err);
		        return { ok: false, error: err };
		      }
		    };

		    const normalizeCandidate = (candidate) => {
		      if (!candidate) return null;
		      if (typeof candidate === "string") return { candidate };
		      if (typeof candidate === "object" && candidate.candidate) return candidate;
		      return null;
		    };

		    const hostAcceptOffer = async (remoteUserId, offerSdp) => {
		      const rtc = rtcRef.current;
		      if (!supabase || !userId || !live?.id || !remoteUserId || !offerSdp) return;
		      if (!rtc.localStream) return;

		      if (rtc.peers.has(remoteUserId)) {
		        try {
		          rtc.peers.get(remoteUserId).close();
		        } catch {}
		        rtc.peers.delete(remoteUserId);
		      }

		      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
		      rtc.peers.set(remoteUserId, pc);
		      rtc.localStream.getTracks().forEach((t) => pc.addTrack(t, rtc.localStream));

		      pc.onicecandidate = (e) => {
		        if (!e.candidate) return;
		        const cand = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
		        sendRtcEvent("webrtc_ice", { to_user_id: remoteUserId, from_user_id: userId, candidate: cand }).catch(() => {});
		      };

		      pc.onconnectionstatechange = () => {
		        const st = pc.connectionState || "";
		        if (st === "failed" || st === "disconnected" || st === "closed") {
		          try {
		            pc.close();
		          } catch {}
		          rtc.peers.delete(remoteUserId);
		          updateVoice();
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
		        await sendRtcEvent("webrtc_answer", { to_user_id: remoteUserId, from_user_id: userId, sdp: answer.sdp });
		      } catch (err) {
		        console.warn("hostAcceptOffer failed", err);
		        try {
		          pc.close();
		        } catch {}
		        rtc.peers.delete(remoteUserId);
		      }
		      updateVoice();
		    };

			    const handleRtcSignal = async (ev) => {
			      const rtc = rtcRef.current;
			      if (!ev?.id || rtc.processed.has(ev.id)) return;
			      rtc.processed.add(ev.id);
			      const payload = ev?.payload || {};

		      if (ev.type === "webrtc_offer" && isHost) {
		        const to = payload.to_user_id || live?.host_user_id || "";
		        if (to && userId && to !== userId) return;
		        const fromUserId = payload.from_user_id || ev.user_id || "";
		        const sdp = payload.sdp || "";
		        if (!fromUserId || !sdp) return;
		        if (!rtc.micEnabled || !rtc.localStream) {
		          rtc.pendingOffers.set(fromUserId, sdp);
		          updateVoice();
		          return;
		        }
		        await hostAcceptOffer(fromUserId, sdp);
		        return;
		      }

		      if (ev.type === "webrtc_answer" && !isHost) {
		        const to = payload.to_user_id || "";
		        if (!userId || to !== userId) return;
		        const sdp = payload.sdp || "";
		        if (!sdp || !rtc.pc) return;
		        try {
		          await rtc.pc.setRemoteDescription({ type: "answer", sdp });
		        } catch (err) {
		          console.warn("setRemoteDescription(answer) failed", err);
		        }
		        const hostId = live?.host_user_id || "";
		        const queued = rtc.pendingCandidates.get(hostId) || [];
		        for (const cand of queued) {
		          try {
		            await rtc.pc.addIceCandidate(cand);
		          } catch {}
		        }
		        rtc.pendingCandidates.delete(hostId);
		        updateVoice();
		        return;
		      }

			      if (ev.type === "webrtc_ice") {
			        const to = payload.to_user_id || "";
			        if (!userId || to !== userId) return;
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
		        const hostId = live?.host_user_id || "";
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
			        if (to && userId && to !== userId) return;
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
			          updateVoice();
			          return;
			        }
			        const hostId = live?.host_user_id || "";
			        if (hostId && fromUserId !== hostId) return;
			        resetRtc();
			        rtc.processed = new Set();
			        return;
			      }
			    };

			    const toggleMic = async () => {
			      if (!userId) return toast("Sign in to enable mic");
			      if (!isHost) return toast("Only host can enable mic");
			      const rtc = rtcRef.current;
			      if (rtc.micEnabled) {
			        const peerIds = Array.from(rtc.peers instanceof Map ? rtc.peers.keys() : []);
			        const pendingIds = Array.from(rtc.pendingOffers instanceof Map ? rtc.pendingOffers.keys() : []);
			        const toHangup = Array.from(new Set([...peerIds, ...pendingIds])).filter(Boolean);
			        for (const remoteUserId of toHangup) {
			          sendRtcEvent("webrtc_hangup", { to_user_id: remoteUserId, from_user_id: userId, reason: "host_mic_off" }).catch(() => {});
			        }
			        resetRtc();
			        rtc.processed = new Set();
			        return;
			      }
		      try {
		        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		        rtc.localStream = stream;
		        rtc.micEnabled = true;
		        updateVoice();
		        const offers = Array.from(rtc.pendingOffers.entries());
		        rtc.pendingOffers.clear();
		        for (const [remoteUserId, sdp] of offers) {
		          await hostAcceptOffer(remoteUserId, sdp);
		        }
		      } catch (err) {
		        console.warn("getUserMedia failed", err);
		        toast("Mic permission denied");
		      }
		      updateVoice();
		    };

			    const toggleAudio = async () => {
			      if (!userId) return toast("Sign in to enable audio");
			      if (isHost) return toggleMic();
			      const rtc = rtcRef.current;
			      const hostId = live?.host_user_id || "";
			      if (!hostId) return;
			      if (rtc.listening) {
			        sendRtcEvent("webrtc_hangup", { to_user_id: hostId, from_user_id: userId, reason: "listener_off" }).catch(() => {});
			        resetRtc();
			        rtc.processed = new Set();
			        return;
			      }
		      try {
		        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
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
		          if (audioRef.current) {
		            try {
		              audioRef.current.srcObject = remoteStream;
		              audioRef.current.play().catch(() => {});
		            } catch {}
		          }
		          updateVoice();
		        };
		        pc.onicecandidate = (e) => {
		          if (!e.candidate) return;
		          const cand = e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex };
		          sendRtcEvent("webrtc_ice", { to_user_id: hostId, from_user_id: userId, candidate: cand }).catch(() => {});
		        };
		        const offer = await pc.createOffer();
		        await pc.setLocalDescription(offer);
		        await sendRtcEvent("webrtc_offer", { to_user_id: hostId, from_user_id: userId, sdp: offer.sdp });
		        updateVoice();
		      } catch (err) {
		        console.warn("toggleAudio failed", err);
		        resetRtc();
		        toast("Couldn't start audio");
		      }
		    };

		    const hostLabel = live?.host ? (String(live.host).startsWith("@") ? String(live.host) : `@${live.host}`) : "live";
			    const subtitle = [hostLabel, live?.room_name ? `room: ${live.room_name}` : null, "voice (beta)"].filter(Boolean).join(" · ");

	    const send = async () => {
	      const t = String(text || "").trim();
	      if (!t) return;
	      if (!userId) return toast("Sign in to chat");
	      if (!supabase || !live?.id) return;
	      setText("");
	      try {
	        const { error } = await supabase.from("live_events").insert({
	          live_session_id: live.id,
	          user_id: userId,
	          type: "chat",
	          payload: { text: t },
	        });
	        if (error) throw error;
	      } catch (err) {
	        console.warn("chat send failed", err);
	        toast("Couldn't send");
	      }
	    };

		    return html`<div>
		      <div className="section">
		        <div className="section-head">
		          <div className="section-title">${live?.title || "Live Room"}</div>
		          <button className="pill" onClick=${onClose} type="button">Back</button>
		        </div>
		        <div className="card">
		          <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>${subtitle}</div>
		          <div className="row" style=${{ marginTop: "12px", flexWrap: "wrap", justifyContent: "space-between" }}>
		            <button className=${cx("pill", (isHost ? micOn : audioOn) ? "primary" : "ghost")} onClick=${isHost ? toggleMic : toggleAudio} type="button">
		              ${isHost ? (micOn ? "Disable Mic" : "Enable Mic") : audioOn ? "Disable Audio" : "Enable Audio"}
		            </button>
		            <div className="chip">${voiceStatus}</div>
		          </div>
		        </div>
		      </div>

	      <div className="section">
	        <div className="card strong" ref=${scrollerRef} style=${{ maxHeight: "46vh", overflowY: "auto" }}>
	          <div className="list">
	            ${(events || []).map((ev) => {
	              const who = ev?.user?.handle ? `@${ev.user.handle}` : ev?.user_id ? ev.user_id.slice(0, 8) : "anon";
	              const when = ev?.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
	              const title = [who, when].filter(Boolean).join(" · ");
	              const body =
	                ev.type === "chat"
	                  ? String(ev?.payload?.text || "").trim() || "…"
	                  : ev.type === "now_playing"
	                    ? [ev?.payload?.title || ev?.payload?.track || "Now playing", ev?.payload?.artist || null].filter(Boolean).join(" · ")
	                    : ev.type || "event";
	              return html`<div className="item chat-item">
	                <div className="thumb"></div>
	                <div className="grow meta">
	                  <div className="t">${title}</div>
	                  <div className="s">${body}</div>
	                </div>
	              </div>`;
	            })}
	            ${(!events || !events.length) && html`<div className="card"><div style=${{ color: "var(--muted)" }}>No messages yet.</div></div>`}
	          </div>
	        </div>
	      </div>

		      <div className="section">
		        <div className="row" style=${{ alignItems: "stretch" }}>
		          <div className="field grow">
	            <input
	              value=${text}
	              onChange=${(e) => setText(e.target.value)}
	              placeholder=${userId ? "Message…" : "Sign in to chat"}
	              onKeyDown=${(e) => {
	                if (e.key === "Enter") send();
	              }}
	            />
	          </div>
	          <button className=${cx("pill", userId ? "primary" : "ghost")} disabled=${!userId || !String(text || "").trim()} onClick=${send} type="button">
	            Send
	          </button>
		        </div>
		      </div>
		      <audio ref=${audioRef} playsInline style=${{ display: "none" }}></audio>
			    </div>`;
			  }

			  function UserSheet({ supabase, viewerUserId, userId, onClose, following, followers, toggleFollow, onLoad, onSend, toast }) {
			    const [profile, setProfile] = useState(null);
			    const [presence, setPresence] = useState(null);
			    const [sessions, setSessions] = useState([]);
			    const [loading, setLoading] = useState(false);

			    const isActive = (p) => {
			      const last = Date.parse(p?.last_seen_at || "");
			      return Number.isFinite(last) && Date.now() - last < 70_000;
			    };

			    useEffect(() => {
			      let ignore = false;
			      if (!supabase || !userId) {
			        setProfile(null);
			        setPresence(null);
			        setSessions([]);
			        setLoading(false);
			        return;
			      }
			      setLoading(true);
			      (async () => {
			        try {
			          const wantsPresence = !!viewerUserId;
			          const [{ data: p }, { data: pres }, { data: sess }] = await Promise.all([
			            supabase.from("profiles").select("user_id, handle, display_name").eq("user_id", userId).maybeSingle(),
			            wantsPresence
			              ? supabase.from("profile_presence").select("user_id, last_seen_at, status").eq("user_id", userId).maybeSingle()
			              : Promise.resolve({ data: null }),
			            supabase
			              .from("sessions")
			              .select(
			                "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes)",
			              )
			              .eq("host_user_id", userId)
			              .order("created_at", { ascending: false })
			              .limit(20),
			          ]);
			          if (ignore) return;
			          setProfile(p || null);
			          setPresence(pres || null);
			          const rows = Array.isArray(sess) ? sess : [];
			          setSessions(
			            rows.map((row) => ({
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
			            })),
			          );
			        } catch (err) {
			          console.warn("UserSheet load failed", err);
			          if (!ignore) {
			            setProfile(null);
			            setPresence(null);
			            setSessions([]);
			            toast("Couldn't load profile");
			          }
			        } finally {
			          if (!ignore) setLoading(false);
			        }
			      })();
			      return () => {
			        ignore = true;
			      };
			    }, [supabase, userId, viewerUserId]);

			    const p = profile || {};
			    const title = p?.display_name || (p?.handle ? `@${p.handle}` : "Profile");
			    const subtitleBits = [];
			    if (p?.handle) subtitleBits.push(`@${p.handle}`);
			    if (p?.display_name) subtitleBits.push(p.display_name);
			    if (presence && isActive(presence)) subtitleBits.push("active");

			    const isFollowing = !!following?.has?.(userId);
			    const isFriend = isFollowing && !!followers?.has?.(userId);
			    const followLabel = isFriend ? "Friend ✓" : isFollowing ? "Following" : "Follow";
			    const canFollow = !!viewerUserId && userId !== viewerUserId;

			    const sessionSubtitle = (s) => {
			      const bits = [];
			      if (s?.genre) bits.push(s.genre);
			      const stats = [];
			      if (typeof s?.plays === "number") stats.push(`${s.plays} plays`);
			      if (typeof s?.likes === "number") stats.push(`${s.likes} likes`);
			      if (stats.length) bits.push(stats.join(" · "));
			      return bits.join(" · ");
			    };

			    return html`<div
			      className="sheet-overlay"
			      onClick=${(e) => {
			        if (e.target === e.currentTarget) onClose();
			      }}
			    >
			      <div className="sheet">
			        <div className="sheet-head">
			          <div>
			            <div className="sheet-title">${title}</div>
			            <div className="sheet-subtitle">
			              ${subtitleBits.filter(Boolean).join(" · ") || userId.slice(0, 8)}
			              ${presence && isActive(presence)
			                ? html`<span style=${{ marginLeft: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
			                    <span className="presence-dot"></span><span className="presence-label">active</span>
			                  </span>`
			                : ""}
			            </div>
			          </div>
			          <button className="pill" onClick=${onClose} type="button">Close</button>
			        </div>

			        <div className="row" style=${{ justifyContent: "space-between", flexWrap: "wrap" }}>
			          ${canFollow
			            ? html`<button className=${cx("pill", isFollowing ? "ghost" : "primary")} onClick=${() => toggleFollow(userId)} type="button">
			                ${followLabel}
			              </button>`
			            : html`<div className="chip">${viewerUserId ? "—" : "browse"}</div>`}
			          <button
			            className="pill ghost"
			            onClick=${() => toast("DMs coming soon — send sessions for now")}
			            type="button"
			          >
			            Message
			          </button>
			        </div>

			        <div className="divider"></div>
			        <div className="section-head" style=${{ marginBottom: "10px" }}>
			          <div className="section-title" style=${{ fontSize: "14px" }}>Recent Sessions</div>
			        </div>

			        <div className="list">
			          ${loading &&
			          html`<div className="card">
			            <div style=${{ color: "var(--muted)" }}>Loading…</div>
			          </div>`}
			          ${!loading && (!sessions || !sessions.length) && html`<div className="card"><div style=${{ color: "var(--muted)" }}>No sessions yet.</div></div>`}
			          ${!loading &&
			          (sessions || []).map(
			            (s) => html`<div className="item">
			              <div className="thumb"></div>
			              <div className="grow meta">
			                <div className="t">${s.title || s.slug || "Untitled"}</div>
			                <div className="s">${sessionSubtitle(s)}</div>
			              </div>
			              <div style=${{ display: "flex", gap: "10px" }}>
			                ${s.id &&
			                html`<button className="pill icon" onClick=${() => onSend(s.id)} aria-label="Send" type="button">
			                  <${Icon} name="plus" />
			                </button>`}
			                <button className="pill icon primary" onClick=${() => onLoad(s)} aria-label="Load" type="button">
			                  <${Icon} name="play" />
			                </button>
			              </div>
			            </div>`,
			          )}
			        </div>
			      </div>
			    </div>`;
			  }

			  function DiscoverScreen({
			    supabase,
			    supabaseSession,
			    authHeaders,
			    zip,
			    zipOptIn,
			    likes,
			    toggleLike,
			    following,
			    followers,
			    toggleFollow,
			    followVersion,
			    onLoad,
			    toast,
			    onNavigateToListen,
			  }) {
			    const [searchQuery, setSearchQuery] = useState("");
			    const [filterMode, setFilterMode] = useState("today");
			    const [trendingRows, setTrendingRows] = useState([]);
			    const [recommendationsBuilt, setRecommendationsBuilt] = useState([]);
			    const [recommendationsListened, setRecommendationsListened] = useState([]);
			    const [inboxTab, setInboxTab] = useState("New");
			    const [inbox, setInbox] = useState([]);
			    const [liveRoom, setLiveRoom] = useState(null);
			    const [presence, setPresence] = useState(() => new Map());
			    const userId = supabaseSession?.user?.id || "";

			    if (liveRoom) {
			      return html`<${LiveRoomScreen} supabase=${supabase} live=${liveRoom} userId=${userId} onClose=${() => setLiveRoom(null)} toast=${toast} />`;
			    }

			    const fetchPresence = async (hostIds) => {
			      if (!supabase || !userId || !hostIds.length) {
			        setPresence(new Map());
			        return;
			      }
			      try {
			        const { data, error } = await supabase.from("profile_presence").select("user_id, last_seen_at, status").in("user_id", hostIds);
			        if (error) throw error;
			        setPresence(new Map((data || []).map((r) => [r.user_id, r])));
			      } catch {
			        setPresence(new Map());
			      }
			    };

			    const isActive = (p) => {
			      const last = Date.parse(p?.last_seen_at || "");
			      return Number.isFinite(last) && Date.now() - last < 70_000;
			    };

			    useEffect(() => {
			      if (!supabase || !userId) return;
			      const channel = supabase
			        .channel(`rs-inbox-${userId}`)
			        .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_items", filter: `to_user_id=eq.${userId}` }, (payload) => {
			          const it = payload?.new || null;
			          if (!it?.id) return;
			          setInbox((prev) => {
			            const arr = Array.isArray(prev) ? prev : [];
			            if (arr.some((x) => x?.id === it.id)) return arr;
			            return [{ ...it, from: null }, ...arr];
			          });
			        })
			        .subscribe();
			      return () => {
			        try {
			          channel.unsubscribe().catch(() => {});
			        } catch {}
			      };
			    }, [supabase, userId]);

			    useEffect(() => {
			      let ignore = false;
			      const run = async () => {
			        if (!supabase) {
			          if (!ignore) setTrendingRows([]);
			          if (!ignore) setInbox([]);
			          if (!ignore) setPresence(new Map());
			          return;
			        }

			        try {
			          const zipFilter = filterMode === "nearby" ? (zip || null) : null;
			          const sort = filterMode === "live" ? null : "top";
			          
			          if (filterMode === "live") {
			            const { data, error } = await supabase.functions.invoke("list_live", {
			              headers: authHeaders || {},
			              body: { zip: zipFilter, limit: 50 },
			            });
			            if (error) throw error;
			            const live = Array.isArray(data?.live) ? data.live : [];
			            if (!ignore) setTrendingRows(live);
			            await fetchPresence(Array.from(new Set(live.map((x) => x.host_user_id).filter(Boolean))));
			          } else {
			            const { data, error } = await supabase.functions.invoke("list_sessions", {
			              body: { q: searchQuery.trim() || null, sort, limit: 50, zip: zipFilter },
			            });
			            if (error) throw error;
			            const next = Array.isArray(data?.sessions) ? data.sessions : [];
			            if (!ignore) setTrendingRows(next);
			            await fetchPresence(Array.from(new Set(next.map((x) => x.host_user_id).filter(Boolean))));
			          }

			          if (userId) {
			            const likedIds = Array.from(likes || []);
			            if (likedIds.length) {
			              const { data: recData } = await supabase
			                .from("sessions")
			                .select("id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes)")
			                .in("id", likedIds.slice(0, 5))
			                .limit(5);
			              if (recData && recData.length) {
			                const recSessions = recData.map((row) => ({
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
			                }));
			                if (!ignore) setRecommendationsListened(recSessions);
			              }
			            }
			          }
			        } catch {
			          if (!ignore) setTrendingRows([]);
			          if (!ignore) setPresence(new Map());
			        }
			      };
			      run();
			      return () => {
			        ignore = true;
			      };
			    }, [supabase, userId, filterMode, searchQuery, zip, zipOptIn, likes]);

			    useEffect(() => {
			      let ignore = false;
			      if (!supabase || !userId || inboxTab !== "New") {
			        if (!ignore) setInbox([]);
			        return;
			      }
			      (async () => {
			        try {
			          const { data, error } = await supabase
			            .from("inbox_items")
			            .select("id, from_user_id, session_id, note, status, created_at")
			            .eq("to_user_id", userId)
			            .order("created_at", { ascending: false })
			            .limit(50);
			          if (error) throw error;
			          const items = Array.isArray(data) ? data : [];
			          const fromIds = Array.from(new Set(items.map((x) => x.from_user_id).filter(Boolean)));
			          const senders = new Map();
			          if (fromIds.length) {
			            const { data: profiles } = await supabase.from("profiles").select("user_id, handle, display_name").in("user_id", fromIds);
			            (profiles || []).forEach((p) => senders.set(p.user_id, p));
			          }
			          if (!ignore) setInbox(items.map((x) => ({ ...x, from: senders.get(x.from_user_id) || null })));
			        } catch {
			          if (!ignore) setInbox([]);
			        }
			      })();
			      return () => {
			        ignore = true;
			      };
			    }, [supabase, userId, inboxTab]);

			    const formatTimeAgo = (dateStr) => {
			      if (!dateStr) return "";
			      const date = new Date(dateStr);
			      const now = new Date();
			      const diffMs = now - date;
			      const diffMins = Math.floor(diffMs / 60000);
			      const diffHours = Math.floor(diffMs / 3600000);
			      const diffDays = Math.floor(diffMs / 86400000);
			      if (diffMins < 60) return `${diffMins}m`;
			      if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
			      return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
			    };

			    const subtitle = (s) => {
			      const bits = [];
			      if (s?.host) bits.push(`by ${s.host}`);
			      if (s?.genre) bits.push(s.genre);
			      const stats = [];
			      if (typeof s?.plays === "number") stats.push(`${s.plays} plays`);
			      if (typeof s?.likes === "number") stats.push(`${s.likes} likes`);
			      if (stats.length) bits.push(stats.join(" · "));
			      return bits.join(" · ");
			    };

			    return html`<div className="fade-in">
			      <div className="section" style=${{ marginTop: 0 }}>
			        <div className="field" style=${{ marginBottom: "12px" }}>
			          <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
			            <span style=${{ color: "var(--muted)", fontSize: "14px" }}>discover</span>
			            <div style=${{ display: "flex", alignItems: "center", gap: "8px", flex: 1, marginLeft: "12px" }}>
			              <input
			                value=${searchQuery}
			                onChange=${(e) => setSearchQuery(e.target.value)}
			                placeholder="search"
			                style=${{ border: "none", outline: "none", background: "transparent", flex: 1, color: "var(--text)" }}
			              />
			              <${Icon} name="search" />
			            </div>
			          </div>
			        </div>
			        <${Segmented}
			          options=${[
			            { label: "Trending nearby", value: "nearby" },
			            { label: "today", value: "today" },
			            { label: "live", value: "live" },
			          ]}
			          value=${filterMode}
			          onChange=${setFilterMode}
			        />
			      </div>

			      <div className="section">
			        <div className="section-head">
			          <div className="section-title">Trending nearby today live</div>
			        </div>
			        <div className="list">
			          ${(trendingRows || []).slice(0, 3).map((s) => {
			            const isLiked = likes.has(s.id);
			            const likeCount = (s.likes || 0) + (isLiked ? 1 : 0);
			            const p = s?.host_user_id ? presence.get(s.host_user_id) : null;
			            const active = p && isActive(p);
			            return html`<div className="item" style=${{ cursor: "pointer" }} onClick=${() => onLoad(s)}>
			              <div className="thumb" style=${{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : "none", backgroundSize: "cover" }}></div>
			              <div className="grow meta">
			                <div className="t">${s.title || s.slug || "Untitled"}</div>
			                <div className="s">
			                  ${s.duration || "0:00"} · ${likeCount} likes
			                  ${s.host ? ` · @${s.host}` : ""} ${s.zip || s.location || ""}
			                  ${s.downloads ? ` · ${s.downloads > 1000 ? `${(s.downloads / 1000).toFixed(0)}k` : s.downloads} downloads` : ""}
			                </div>
			              </div>
			            </div>`;
			          })}
			          ${(!trendingRows || !trendingRows.length) &&
			          html`<div className="card">
			            <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>No trending shows found.</div>
			          </div>`}
			        </div>
			      </div>

			      ${recommendationsBuilt.length > 0 &&
			      html`<div className="section">
			        <div className="section-head">
			          <div className="section-title">
			            Because you <span style=${{ color: "var(--accent)" }}>built</span> ${recommendationsBuilt[0]?.title || "a show"}
			          </div>
			        </div>
			        <div className="list">
			          ${recommendationsBuilt.slice(0, 3).map((s) => html`<div className="item" style=${{ cursor: "pointer" }} onClick=${() => onLoad(s)}>
			            <div className="thumb"></div>
			            <div className="grow meta">
			              <div className="t">${s.title || "Untitled"}</div>
			              <div className="s">${s.host ? `by ${s.host}` : ""} · ${s.likes || 0} likes</div>
			            </div>
			          </div>`)}
			        </div>
			      </div>`}

			      ${recommendationsListened.length > 0 &&
			      html`<div className="section">
			        <div className="section-head">
			          <div className="section-title">
			            Because you <span style=${{ color: "var(--accent)" }}>listened</span> to ${recommendationsListened[0]?.title || "a show"}
			          </div>
			        </div>
			        <div className="list">
			          ${recommendationsListened.slice(0, 3).map((s) => html`<div className="item" style=${{ cursor: "pointer" }} onClick=${() => onLoad(s)}>
			            <div className="thumb"></div>
			            <div className="grow meta">
			              <div className="t">${s.title || "Untitled"}</div>
			              <div className="s">${s.host ? `by ${s.host}` : ""} · ${s.likes || 0} likes</div>
			            </div>
			          </div>`)}
			        </div>
			      </div>`}

			      <div className="section">
			        <div className="section-head">
			          <div className="section-title">Inbox</div>
			        </div>
			        <${Segmented}
			          options=${[
			            { label: "New", value: "New" },
			            { label: "Sent to you", value: "Sent to you" },
			            { label: "Following", value: "Following" },
			          ]}
			          value=${inboxTab}
			          onChange=${setInboxTab}
			        />
			        <div style=${{ marginTop: "12px" }}>
			          <div className="list">
			            ${(inbox || []).map((it) => {
			              const from = it?.from?.handle ? `@${it.from.handle}` : it?.from?.display_name || "Someone";
			              return html`<div className="item" style=${{ cursor: "pointer" }} onClick=${() => onLoad({ id: it.session_id })}>
			                <div className="thumb"></div>
			                <div className="grow meta">
			                  <div className="t">${it.status === "unread" ? "New session" : "Session"} · ${from}</div>
			                  <div className="s">${[it.note || null, formatTimeAgo(it.created_at)].filter(Boolean).join(" · ")}</div>
			                </div>
			              </div>`;
			            })}
			            ${(!inbox || !inbox.length) &&
			            html`<div className="card">
			              <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>${userId ? "No messages yet." : "Sign in to view your inbox."}</div>
			            </div>`}
			          </div>
			        </div>
			      </div>
			    </div>`;
			  }

			  function SessionsScreen({
			    supabase,
			    supabaseSession,
			    authHeaders,
			    zip,
			    zipOptIn,
			    likes,
			    toggleLike,
			    onLoad,
			    toast,
			    following,
			    followers,
			    toggleFollow,
			    followVersion,
			  }) {
			    const [mode, setMode] = useState("new");
			    const [liveScope, setLiveScope] = useState("all");
			    const [followScope, setFollowScope] = useState("following");
			    const [q, setQ] = useState("");
			    const [rows, setRows] = useState(SAMPLE_SESSIONS);
			    const [liveRoom, setLiveRoom] = useState(null);
			    const [profileUserId, setProfileUserId] = useState(null);
			    const [presence, setPresence] = useState(() => new Map());
			    const [inbox, setInbox] = useState([]);
			    const userId = supabaseSession?.user?.id || "";

	    if (liveRoom) {
	      return html`<${LiveRoomScreen} supabase=${supabase} live=${liveRoom} userId=${userId} onClose=${() => setLiveRoom(null)} toast=${toast} />`;
	    }

	    const fetchPresence = async (hostIds) => {
	      if (!supabase || !userId || !hostIds.length) {
	        setPresence(new Map());
	        return;
	      }
	      try {
	        const { data, error } = await supabase.from("profile_presence").select("user_id, last_seen_at, status").in("user_id", hostIds);
	        if (error) throw error;
	        setPresence(new Map((data || []).map((r) => [r.user_id, r])));
	      } catch {
	        setPresence(new Map());
	      }
	    };

		    const isActive = (p) => {
		      const last = Date.parse(p?.last_seen_at || "");
		      return Number.isFinite(last) && Date.now() - last < 70_000;
		    };

		    useEffect(() => {
		      if (!supabase || !userId) return;
		      const channel = supabase
		        .channel(`rs-inbox-${userId}`)
		        .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_items", filter: `to_user_id=eq.${userId}` }, (payload) => {
		          const it = payload?.new || null;
		          if (!it?.id) return;
		          setInbox((prev) => {
		            const arr = Array.isArray(prev) ? prev : [];
		            if (arr.some((x) => x?.id === it.id)) return arr;
		            return [{ ...it, from: null }, ...arr];
		          });
		        })
		        .subscribe();
		      return () => {
		        try {
		          channel.unsubscribe().catch(() => {});
		        } catch {}
		      };
		    }, [supabase, userId]);

		    useEffect(() => {
		      if (!supabase || !userId) return;
		      if (mode === "inbox") return;
		      const timer = window.setInterval(() => {
		        const hostIds = Array.from(new Set((rows || []).map((x) => x?.host_user_id).filter(Boolean)));
		        if (!hostIds.length) return;
		        fetchPresence(hostIds);
		      }, 25_000);
		      return () => window.clearInterval(timer);
		    }, [supabase, userId, mode, rows]);

		    useEffect(() => {
		      let ignore = false;

	      const run = async () => {
        if (!supabase) {
          if (!ignore) setRows(SAMPLE_SESSIONS);
          if (!ignore) setInbox([]);
          if (!ignore) setPresence(new Map());
          return;
        }

        const query = q.trim();

        try {
          if (mode === "inbox") {
            if (!userId) {
              if (!ignore) setInbox([]);
              if (!ignore) setRows([]);
              return;
            }
            const { data, error } = await supabase
              .from("inbox_items")
              .select("id, from_user_id, session_id, note, status, created_at")
              .eq("to_user_id", userId)
              .order("created_at", { ascending: false })
              .limit(50);
            if (error) throw error;
            const items = Array.isArray(data) ? data : [];
            const fromIds = Array.from(new Set(items.map((x) => x.from_user_id).filter(Boolean)));
            const senders = new Map();
            if (fromIds.length) {
              const { data: profiles } = await supabase.from("profiles").select("user_id, handle, display_name").in("user_id", fromIds);
              (profiles || []).forEach((p) => senders.set(p.user_id, p));
            }
            if (!ignore) setInbox(items.map((x) => ({ ...x, from: senders.get(x.from_user_id) || null })));
            if (!ignore) setRows([]);
            return;
          }

		          if (mode === "following") {
		            if (!userId) {
		              if (!ignore) setRows([]);
		              if (!ignore) setPresence(new Map());
		              return;
		            }
		            let ids = Array.from(following || []);
		            if (followScope === "friends") {
		              const revSet = followers instanceof Set ? followers : new Set();
		              ids = ids.filter((id) => revSet.has(id));
		            }
		            if (!ids.length) {
		              if (!ignore) setRows([]);
		              if (!ignore) setPresence(new Map());
		              return;
		            }
            let qy = supabase
              .from("sessions")
              .select("id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes)")
              .in("host_user_id", ids)
              .order("created_at", { ascending: false })
              .limit(50);
            if (query) {
              const pattern = `%${query}%`;
              qy = qy.or([`title.ilike.${pattern}`, `host_name.ilike.${pattern}`, `genre.ilike.${pattern}`].join(","));
            }
            const { data, error } = await qy;
            if (error) throw error;
            const mapped = (data || []).map((row) => ({
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
            }));
            if (!ignore) setRows(mapped);
            await fetchPresence(Array.from(new Set(mapped.map((x) => x.host_user_id).filter(Boolean))));
            return;
          }

	          if (mode === "live") {
	            const wantsNear = liveScope === "near";
	            const zipFilter = zip ? String(zip).trim() : null;
	            if (wantsNear && (!zipFilter || !zipOptIn)) {
	              if (!ignore) setRows([]);
	              if (!ignore) setPresence(new Map());
	              return;
	            }
	            const { data, error } = await supabase.functions.invoke("list_live", {
	              headers: authHeaders || {},
	              body: { zip: wantsNear ? zipFilter || null : null, limit: 50 },
	            });
	            if (error) throw error;
	            const live = Array.isArray(data?.live) ? data.live : [];
	            if (!ignore) setRows(live);
            await fetchPresence(Array.from(new Set(live.map((x) => x.host_user_id).filter(Boolean))));
            return;
          }

          const sort = mode === "popular" ? "top" : "new";
          const zipFilter = mode === "nearby" ? (zip || null) : null;
          const { data, error } = await supabase.functions.invoke("list_sessions", { body: { q: query || null, sort, limit: 50, zip: zipFilter } });
          if (error) throw error;
          const next = Array.isArray(data?.sessions) ? data.sessions : [];
          if (!ignore) setRows(next);
          await fetchPresence(Array.from(new Set(next.map((x) => x.host_user_id).filter(Boolean))));
        } catch {
          if (!ignore) setRows([]);
          if (!ignore) setPresence(new Map());
          if (!ignore) setInbox([]);
        }
      };

	      run();
	      return () => {
	        ignore = true;
	      };
		    }, [supabase, userId, mode, liveScope, followScope, q, zip, zipOptIn, followVersion]);

		    const markInboxRead = async (itemId) => {
		      if (!supabase || !userId || !itemId) return;
		      try {
		        await supabase
	          .from("inbox_items")
	          .update({ status: "read", read_at: new Date().toISOString() })
	          .eq("id", itemId)
	          .eq("to_user_id", userId);
	        setInbox((prev) => (prev || []).map((it) => (it.id === itemId ? { ...it, status: "read" } : it)));
	      } catch {
	        // ignore
	      }
	    };

	    const sendToHandle = async (sessionId) => {
	      if (!supabase || !userId) {
	        toast("Sign in to send");
	        return;
      }
      const raw = window.prompt("Send to handle (e.g. @someone):") || "";
      const handle = String(raw).trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]+/g, "");
      if (!handle) return;
      const note = (window.prompt("Optional note:") || "").trim();
      try {
        const { data, error } = await supabase.from("profiles").select("user_id").eq("handle", handle).maybeSingle();
        if (error) throw error;
        const toUserId = data?.user_id || "";
        if (!toUserId) throw new Error("not found");
        const { error: insErr } = await supabase.from("inbox_items").insert({
          from_user_id: userId,
          to_user_id: toUserId,
          session_id: sessionId,
          note: note || null,
          status: "unread",
        });
        if (insErr) throw insErr;
        toast("Sent");
      } catch {
        toast("Send failed");
      }
    };

	    const subtitle = (s) => {
	      const bits = [];
	      if (s?.host) bits.push(`by ${s.host}`);
	      if (s?.genre) bits.push(s.genre);
      const stats = [];
      if (typeof s?.plays === "number") stats.push(`${s.plays} plays`);
      if (typeof s?.likes === "number") stats.push(`${s.likes} likes`);
      if (stats.length) bits.push(stats.join(" · "));
	      return bits.join(" · ");
	    };

	    const unreadInbox = (inbox || []).filter((it) => it?.status === "unread").length;
	    const inboxLabel = unreadInbox ? `Inbox (${unreadInbox})` : "Inbox";

	    return html`<div className="fade-in">
	      <div className="section" style=${{ marginTop: 0 }}>
	        <div className="section-head">
	          <div className="section-title">Sessions</div>
          <div className="section-note">${supabase ? (userId ? "connected" : "browse") : "demo"}</div>
        </div>
	        <${Segmented}
	          options=${[
	            { label: "New", value: "new" },
	            { label: "Top", value: "popular" },
	            { label: "Near", value: "nearby" },
	            { label: "Follow", value: "following" },
	            { label: inboxLabel, value: "inbox" },
	            { label: "Live", value: "live" },
	          ]}
	          value=${mode}
	          onChange=${setMode}
        />
      </div>

      <div className="section">
        <div className="field">
          <input value=${q} onChange=${(e) => setQ(e.target.value)} placeholder=${mode === "inbox" ? "Filter not wired…" : "Search sessions…"} />
        </div>
      </div>

		      ${mode === "live" &&
		      html`<div className="section" style=${{ marginTop: "-8px" }}>
		        <${Segmented}
		          options=${[
		            { label: "All", value: "all" },
		            { label: zip ? `Near ${zip}` : "Near", value: "near" },
		          ]}
		          value=${liveScope}
		          onChange=${setLiveScope}
		        />
		      </div>`}

		      ${mode === "following" &&
		      html`<div className="section" style=${{ marginTop: "-8px" }}>
		        <${Segmented}
		          options=${[
		            { label: "Following", value: "following" },
		            { label: "Friends", value: "friends" },
		          ]}
		          value=${followScope}
		          onChange=${setFollowScope}
		        />
		      </div>`}

		      ${mode === "inbox"
		        ? html`<div className="section">
		            <div className="list">
              ${(inbox || []).map((it) => {
                const from = it?.from?.handle ? `@${it.from.handle}` : it?.from?.display_name || "Someone";
                return html`<div className="item">
                  <div className="thumb"></div>
                  <div className="grow meta">
                    <div className="t">${it.status === "unread" ? "New session" : "Session"} · ${from}</div>
                    <div className="s">${[it.note || null, it.created_at ? new Date(it.created_at).toLocaleString() : null].filter(Boolean).join(" · ")}</div>
	                  </div>
	                  <button
	                    className="pill icon primary"
	                    onClick=${() => {
	                      if (it.status === "unread") markInboxRead(it.id);
	                      onLoad({ id: it.session_id });
	                    }}
	                    aria-label="Load"
	                    type="button"
	                  >
	                    <${Icon} name="play" />
	                  </button>
	                </div>`;
	              })}
              ${(!inbox || !inbox.length) &&
              html`<div className="card">
                <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>${userId ? "No messages yet." : "Sign in to view your inbox."}</div>
              </div>`}
            </div>
          </div>`
        : html`<div className="section">
            <div className="list">
              ${(rows || []).map((s) => {
                const isLive = mode === "live";
                const isLiked = likes.has(s.id);
                const likeCount = (s.likes || 0) + (isLiked ? 1 : 0);
                const p = s?.host_user_id ? presence.get(s.host_user_id) : null;
	                const active = p && isActive(p);
	                const canFollow = !!(userId && s?.host_user_id && s.host_user_id !== userId);
	                const followed = canFollow && following.has(s.host_user_id);
	                const friend = followed && followers.has(s.host_user_id);
	                const followLabel = !followed ? "Follow" : friend ? "Friend ✓" : "Following";
		                if (isLive) {
		                  const started = s?.started_at ? new Date(s.started_at).toLocaleString() : null;
		                  const join = () => {
	                    if (!s?.id) return toast("No live id");
	                    setLiveRoom(s);
	                  };
		                  return html`<div className="item">
		                    <div className="thumb"></div>
	                    <div className="grow meta">
	                      <div className="t">${s.title || "Live"}</div>
		                      <div className="s">
		                        ${[s.host || "Unknown", started, s.zip || null].filter(Boolean).join(" · ")}
		                        ${active &&
		                        html`<span style=${{ marginLeft: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
		                          <span className="presence-dot"></span><span className="presence-label">active</span>
		                        </span>`}
	                      </div>
		                      <div className="row" style=${{ marginTop: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
		                        ${canFollow &&
		                        html`<button className=${cx("pill", followed ? "ghost" : "primary")} onClick=${() => toggleFollow(s.host_user_id)} type="button">
		                          ${followLabel}
		                        </button>`}
		                        <div className="chip">${s.visibility || "followers"}</div>
		                      </div>
		                    </div>
	                    <div style=${{ display: "flex", gap: "10px" }}>
	                      ${s?.host_user_id &&
	                      html`<button className="pill icon" onClick=${() => setProfileUserId(s.host_user_id)} aria-label="Profile" type="button">
	                        <${Icon} name="user" />
	                      </button>`}
	                      <button className="pill icon primary" onClick=${join} aria-label="Join" type="button">
	                        <${Icon} name="play" />
	                      </button>
	                    </div>
	                  </div>`;
	                }
	                return html`<div className="item">
	                  <div className="thumb"></div>
	                  <div className="grow meta">
                    <div className="t">${s.title || s.slug || "Untitled"}</div>
                    <div className="s">
                      ${subtitle(s)}
                      ${active &&
                      html`<span style=${{ marginLeft: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span className="presence-dot"></span><span className="presence-label">active</span>
                      </span>`}
                    </div>
	                    <div className="row" style=${{ marginTop: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
	                      <button className="pill" onClick=${() => toggleLike(s.id)} aria-label="Like" type="button">
                        <span style=${{ display: "inline-flex", marginRight: "8px", opacity: isLiked ? 1 : 0.8 }}>
                          <${Icon} name="heart" />
                        </span>
                        ${isLiked ? "Liked" : "Like"} · ${likeCount}
                      </button>
	                      ${canFollow &&
	                      html`<button className=${cx("pill", followed ? "ghost" : "primary")} onClick=${() => toggleFollow(s.host_user_id)} type="button">
	                        ${followLabel}
	                      </button>`}
		                    </div>
		                  </div>
	                  <div style=${{ display: "flex", gap: "10px" }}>
	                    ${s?.host_user_id &&
	                    html`<button className="pill icon" onClick=${() => setProfileUserId(s.host_user_id)} aria-label="Profile" type="button">
	                      <${Icon} name="user" />
	                    </button>`}
	                    ${s.id &&
	                    html`<button className="pill icon" onClick=${() => sendToHandle(s.id)} aria-label="Send" type="button">
	                      <${Icon} name="plus" />
	                    </button>`}
	                    <button className="pill icon primary" onClick=${() => onLoad(s)} aria-label="Load" type="button">
	                      <${Icon} name="play" />
	                    </button>
	                  </div>
	                </div>`;
              })}
		              ${(!rows || !rows.length) &&
		              html`<div className="card">
		                <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>
		                  ${mode === "nearby" && !zip
		                    ? "Add a zip code in Profile to see nearby sessions."
		                    : mode === "live" && liveScope === "near" && (!zip || !zipOptIn)
		                      ? "Enable Location + add a zip in Profile to see nearby live."
		                      : mode === "live"
		                        ? "No live streams right now."
		                        : mode === "following" && !userId
		                          ? "Sign in to see Following and Friends."
		                          : mode === "following" && followScope === "friends"
		                            ? "Friends feed is empty — mutual follows show up here."
		                            : mode === "following"
		                              ? "Following feed is empty — follow someone first."
		                              : "No results."}
		                </div>
		              </div>`}
		            </div>
			          </div>`}
		      ${profileUserId &&
		      html`<${UserSheet}
		        supabase=${supabase}
		        viewerUserId=${userId}
		        userId=${profileUserId}
		        onClose=${() => setProfileUserId(null)}
		        following=${following}
		        followers=${followers}
		        toggleFollow=${toggleFollow}
		        onLoad=${onLoad}
		        onSend=${sendToHandle}
		        toast=${toast}
		      />`}
		    </div>`;
		  }

	  function ListenScreen({ supabase, supabaseSession, authHeaders, likes, toggleLike, toast, currentTrack, setCurrentTrack, isPlaying, setIsPlaying, currentTime, setCurrentTime, trackDuration, setTrackDuration }) {
	    const [volume, setVolume] = useState(1);
	    const [showComments, setShowComments] = useState(false);

	    useEffect(() => {
	      if (!currentTrack) {
	        const stored = localStorage.getItem("rs_current_track");
	        if (stored) {
	          try {
	            const track = JSON.parse(stored);
	            setCurrentTrack(track);
	            setTrackDuration(track.duration || 0);
	          } catch {}
	        }
	      }
	    }, []);

	    const formatTime = (seconds) => {
	      const total = Math.floor(seconds || 0);
	      const m = String(Math.floor(total / 60));
	      const s = String(total % 60).padStart(2, "0");
	      return `${m}:${s}`;
	    };

	    const handlePlayPause = () => {
	      setIsPlaying(!isPlaying);
	    };

	    const handleSeek = (e) => {
	      const rect = e.currentTarget.getBoundingClientRect();
	      const x = e.clientX - rect.left;
	      const percent = Math.max(0, Math.min(1, x / rect.width));
	      const newTime = percent * trackDuration;
	      setCurrentTime(newTime);
	    };

	    const handleVolumeChange = (e) => {
	      const rect = e.currentTarget.getBoundingClientRect();
	      const x = e.clientX - rect.left;
	      const newVolume = Math.max(0, Math.min(1, x / rect.width));
	      setVolume(newVolume);
	    };

	    const remainingTime = trackDuration - currentTime;
	    const isLiked = currentTrack?.id ? likes.has(currentTrack.id) : false;

	    return html`<div className="fade-in">
	      <div style=${{ textAlign: "center", padding: "20px 0 10px", fontSize: "14px", color: "var(--muted)", textTransform: "lowercase" }}>
	        listen
	      </div>
	      <div style=${{ padding: "0 var(--pad)" }}>
	        ${currentTrack ? html`
	          <div style=${{ textAlign: "center", marginBottom: "30px" }}>
	            <div
	              style=${{ width: "100%", maxWidth: "400px", aspectRatio: "1/1", margin: "0 auto", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)", backgroundImage: currentTrack.cover_url ? `url(${currentTrack.cover_url})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}
	            ></div>
	          </div>
	          <div style=${{ textAlign: "center", marginBottom: "40px" }}>
	            <h1 style=${{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px" }}>${currentTrack.title || "Untitled"}</h1>
	            <div style=${{ color: "var(--muted)", fontSize: "16px" }}>${currentTrack.host || currentTrack.artist || "Unknown"}</div>
	          </div>
	          <div style=${{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
	            <div style=${{ marginBottom: "16px" }}>
	              <div style=${{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "var(--muted)" }}>
	                <span>${formatTime(currentTime)}</span>
	                <span>-${formatTime(remainingTime)}</span>
	              </div>
	              <div
	                style=${{ width: "100%", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", cursor: "pointer", position: "relative" }}
	                onClick=${handleSeek}
	              >
	                <div style=${{ width: `${trackDuration > 0 ? (currentTime / trackDuration) * 100 : 0}%`, height: "100%", background: "var(--accent)", borderRadius: "2px" }}></div>
	              </div>
	            </div>
	            <div style=${{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", marginBottom: "16px" }}>
	              <button className="pill icon" onClick=${() => setCurrentTime(Math.max(0, currentTime - 10))} type="button" style=${{ fontSize: "20px" }}>
	                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
	              </button>
	              <button className="pill icon primary" onClick=${handlePlayPause} type="button" style=${{ width: "64px", height: "64px", fontSize: "24px" }}>
	                ${isPlaying
	                  ? html`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>`
	                  : html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>`}
	              </button>
	              <button className="pill icon" onClick=${() => setCurrentTime(Math.min(trackDuration, currentTime + 10))} type="button" style=${{ fontSize: "20px" }}>
	                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
	              </button>
	            </div>
	            <div style=${{ marginBottom: "16px" }}>
	              <div style=${{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
	                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h3M9 18V8a4 4 0 0 1 4-4h3" /></svg>
	                <div
	                  style=${{ flex: 1, height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", cursor: "pointer", position: "relative" }}
	                  onClick=${handleVolumeChange}
	                >
	                  <div style=${{ width: `${volume * 100}%`, height: "100%", background: "var(--accent)", borderRadius: "2px" }}></div>
	                </div>
	                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19 10a2 2 0 0 1 0 4" /></svg>
	              </div>
	            </div>
	            <div style=${{ display: "flex", justifyContent: "center", gap: "16px" }}>
	              <button className="pill icon" onClick=${() => setShowComments(!showComments)} type="button">
	                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
	              </button>
	              <button className="pill icon" type="button">
	                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
	              </button>
	              <button className="pill icon" type="button">
	                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
	              </button>
	            </div>
	          </div>
	          <div style=${{ display: "flex", justifyContent: "space-around", padding: "20px 0" }}>
	            <button className="pill" onClick=${() => setShowComments(!showComments)} type="button" style=${{ flex: 1, marginRight: "8px" }}>
	              Comment
	            </button>
	            <button
	              className=${cx("pill", isLiked && "primary")}
	              onClick=${() => currentTrack?.id && toggleLike(currentTrack.id)}
	              type="button"
	              style=${{ flex: 1, marginLeft: "8px" }}
	            >
	              Like
	            </button>
	          </div>
	        ` : html`
	          <div style=${{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
	            <div style=${{ fontSize: "18px", marginBottom: "12px" }}>No track playing</div>
	            <div style=${{ fontSize: "14px" }}>Select a show from Discover to start listening</div>
	          </div>
	        `}
	      </div>
	    </div>`;
	  }

	  function SettingsModal({
	    theme,
	    setTheme,
	    accent,
	    setAccent,
	    services,
	    toast,
	    supabase,
	    supabaseSession,
	    supabaseUrl,
	    setSupabaseUrl,
	    supabaseAnon,
	    setSupabaseAnon,
	    authedEmail,
	    supabaseEmail,
	    setSupabaseEmail,
	    onSignIn,
	    onSignOut,
	    profileHandle,
	    setProfileHandle,
	    zip,
	    setZip,
	    zipOptIn,
	    setZipOptIn,
	    onSaveProfile,
	    myLive,
	    onGoLive,
	    onEndLive,
	    following,
	    followers,
	    toggleFollow,
	    spotifyClientId,
	    setSpotifyClientId,
	    spotifyRedirect,
	    setSpotifyRedirect,
	    spotifyConnected,
	    onSpotifyAuth,
	    onSpotifyDisconnect,
	    soundcloudClientId,
	    setSoundcloudClientId,
	    soundcloudConnected,
	    onSoundcloudAuth,
	    onSoundcloudDisconnect,
	    onClose,
	  }) {
	    const userId = supabaseSession?.user?.id || "";
	    const [peopleQ, setPeopleQ] = useState("");
	    const [people, setPeople] = useState([]);
	    const [peoplePresence, setPeoplePresence] = useState(() => new Map());

	    const isActive = (p) => {
	      const last = Date.parse(p?.last_seen_at || "");
	      return Number.isFinite(last) && Date.now() - last < 70_000;
	    };

	    useEffect(() => {
	      let ignore = false;
	      const q = String(peopleQ || "").trim().toLowerCase();
      if (!supabase) {
        setPeople([]);
        setPeoplePresence(new Map());
        return;
      }
      if (!q || q.length < 2) {
        setPeople([]);
        setPeoplePresence(new Map());
        return;
      }
      const qSafe = q.replace(/[^a-z0-9_ ]+/g, " ").replace(/\s+/g, " ").slice(0, 32);
      (async () => {
        try {
          const pattern = `%${qSafe}%`;
          const { data, error } = await supabase
            .from("profiles")
            .select("user_id, handle, display_name")
            .or(`handle.ilike.${pattern},display_name.ilike.${pattern}`)
            .limit(12);
          if (ignore) return;
          if (error) throw error;
          const rows = (data || []).filter((r) => r?.user_id && r.user_id !== userId);
          setPeople(rows);
          const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
          if (!ids.length) {
            setPeoplePresence(new Map());
            return;
          }
          try {
            const { data: presence } = await supabase.from("profile_presence").select("user_id, last_seen_at, status").in("user_id", ids);
            if (ignore) return;
            setPeoplePresence(new Map((presence || []).map((p) => [p.user_id, p])));
          } catch {
            if (!ignore) setPeoplePresence(new Map());
          }
        } catch {
          if (!ignore) {
            setPeople([]);
            setPeoplePresence(new Map());
          }
        }
      })();
      return () => {
        ignore = true;
      };
	    }, [supabase, userId, peopleQ]);

	    return html`<div className="sheet-overlay" onClick=${onClose}>
	      <div className="sheet" onClick=${(e) => e.stopPropagation()}>
	        <div className="sheet-head">
	          <div>
	            <div className="sheet-title">Settings</div>
	          </div>
	          <button className="pill icon" onClick=${onClose} type="button">×</button>
	        </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Supabase</div>
          <div className="section-note">${authedEmail ? "linked" : "optional"}</div>
        </div>
        <div className="card">
          <div className="row" style=${{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div className="row">
              <div className="field grow">
                <input value=${supabaseEmail} onChange=${(e) => setSupabaseEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              ${authedEmail
                ? html`<button className="pill" onClick=${onSignOut} type="button">Sign Out</button>`
                : html`<button className="pill primary" onClick=${onSignIn} type="button">Email Link</button>`}
            </div>
          </div>
        </div>
      </div>

	      <div className="section">
	        <div className="section-head">
	          <div className="section-title">Discovery</div>
	          <div className="section-note">zip + opt-in</div>
	        </div>
        <div className="card">
          <div className="row" style=${{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div className="field">
              <input value=${profileHandle} onChange=${(e) => setProfileHandle(e.target.value)} placeholder="Handle (public)" />
            </div>
            <div className="row">
              <div className="field grow">
                <input value=${zip} onChange=${(e) => setZip(e.target.value)} placeholder="Zip (used for Nearby)" />
              </div>
              <div className="chip">
                Opt-in
                <${Toggle} value=${zipOptIn} onChange=${setZipOptIn} label="Location opt-in" />
              </div>
            </div>
            <button className="pill primary" onClick=${onSaveProfile} type="button">Save Profile</button>
          </div>
        </div>
	      </div>

	      <div className="section">
	        <div className="section-head">
	          <div className="section-title">People</div>
	          <div className="section-note">follow + active</div>
	        </div>
	        <div className="card">
	          <div className="field">
	            <input value=${peopleQ} onChange=${(e) => setPeopleQ(e.target.value)} placeholder="Search handles or names…" />
	          </div>
	          <div style=${{ height: "12px" }}></div>
	          <div className="list">
	            ${(people || []).map((p) => {
	              const handle = p?.handle ? `@${p.handle}` : p?.display_name || p?.user_id?.slice(0, 8) || "user";
	              const sub = p?.display_name && p?.handle ? p.display_name : p?.handle ? "" : p?.user_id ? p.user_id.slice(0, 8) : "";
	              const active = p?.user_id ? isActive(peoplePresence.get(p.user_id)) : false;
	              const followed = !!(p?.user_id && following.has(p.user_id));
	              const friend = followed && !!(p?.user_id && followers.has(p.user_id));
	              const label = !followed ? "Follow" : friend ? "Friend ✓" : "Following";
	              const canFollow = !!(p?.user_id && userId);
	              return html`<div className="item">
	                <div className="thumb"></div>
	                <div className="grow meta">
	                  <div className="t">${handle}</div>
	                  <div className="s">
	                    ${sub}
	                    ${active &&
	                    html`<span style=${{ marginLeft: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
	                      <span className="presence-dot"></span><span className="presence-label">active</span>
	                    </span>`}
	                  </div>
	                </div>
	                <button className=${cx("pill", followed ? "ghost" : "primary")} disabled=${!canFollow} onClick=${() => toggleFollow(p.user_id)} type="button">
	                  ${canFollow ? label : "Sign in"}
	                </button>
	              </div>`;
	            })}
	            ${(!peopleQ || String(peopleQ).trim().length < 2) &&
	            html`<div className="card">
	              <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>Search 2+ characters to find handles.</div>
	            </div>`}
	            ${(peopleQ && String(peopleQ).trim().length >= 2 && (!people || !people.length)) &&
	            html`<div className="card">
	              <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>No matches.</div>
	            </div>`}
	          </div>
	        </div>
	      </div>

		      <div className="section">
		        <div className="section-head">
		          <div className="section-title">Live</div>
	          <div className="section-note">voice (beta)</div>
	        </div>
	        <div className="card">
          <div className="row" style=${{ justifyContent: "space-between" }}>
            <div className="chip">${myLive?.id ? "Live" : "Offline"}</div>
            ${myLive?.id
              ? html`<button className="pill danger" onClick=${onEndLive} type="button">End</button>`
              : html`<button className="pill primary" onClick=${onGoLive} type="button">Go Live</button>`}
          </div>
          ${myLive?.room_name &&
          html`<div style=${{ marginTop: "10px", color: "var(--muted)", lineHeight: 1.45 }}>
            Room: <b>${myLive.room_name}</b>
          </div>`}
	          <div style=${{ marginTop: "10px", color: "var(--muted)", lineHeight: 1.45 }}>
	            Voice streaming works today via WebRTC P2P. Next: scale with an SFU provider behind Edge Functions.
	          </div>
	        </div>
	      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Appearance</div>
          <div className="section-note">calm + luxe</div>
        </div>
        <div className="row" style=${{ justifyContent: "space-between" }}>
          <div className="chip">Theme</div>
          <${Segmented}
            options=${[
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            value=${theme}
            onChange=${setTheme}
          />
        </div>
        <div style=${{ height: "12px" }}></div>
        <div className="row" style=${{ justifyContent: "space-between" }}>
          <div className="chip">Accent</div>
          <div className="chip" style=${{ color: "var(--text)" }}>${ACCENTS.find((a) => a.value === accent)?.name || "Custom"}</div>
        </div>
        <div style=${{ height: "12px" }}></div>
        <div className="swatches">
          ${ACCENTS.map(
            (a) =>
              html`<button
                className=${cx("swatch", a.value === accent && "active")}
                style=${{ background: a.value }}
                onClick=${() => setAccent(a.value)}
                aria-label=${a.name}
                title=${a.name}
                type="button"
              ></button>`
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Spotify</div>
          <div className="section-note">${spotifyConnected ? "connected" : "optional"}</div>
        </div>
        <div className="card">
          <div className="row" style=${{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div className="field">
              <input value=${spotifyClientId} onChange=${(e) => setSpotifyClientId(e.target.value)} placeholder="Client ID (PKCE)" />
            </div>
            <div className="field">
              <input value=${spotifyRedirect} onChange=${(e) => setSpotifyRedirect(e.target.value)} placeholder="Redirect URI (optional, auto if empty)" />
            </div>
            <div style=${{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>
              ${!spotifyRedirect ? `Auto: ${window.location.origin}/mobile/` : `Custom: ${spotifyRedirect}`}
              <br />
              <span style=${{ fontSize: "11px" }}>Must match your Spotify Dashboard settings exactly</span>
            </div>
            <div className="row">
              ${spotifyConnected
                ? html`<button className="pill danger" onClick=${onSpotifyDisconnect} type="button">Disconnect</button>`
                : html`<button className="pill primary" onClick=${onSpotifyAuth} type="button">Authorize with Spotify</button>`}
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">SoundCloud</div>
          <div className="section-note">${soundcloudConnected ? "connected" : "optional"}</div>
        </div>
        <div className="card">
          <div className="row" style=${{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div className="field">
              <input value=${soundcloudClientId} onChange=${(e) => setSoundcloudClientId(e.target.value)} placeholder="Client ID" />
            </div>
            ${(/^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname)) &&
            html`<div style=${{ fontSize: "12px", color: "var(--danger)", lineHeight: 1.4, padding: "8px", background: "rgba(255, 59, 48, 0.1)", borderRadius: "8px" }}>
              ⚠️ SoundCloud doesn't allow local IPs. Use localhost or deploy to a public URL.
            </div>`}
            <div style=${{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>
              Redirect: ${window.location.origin}${window.location.pathname}
            </div>
            <div className="row">
              ${soundcloudConnected
                ? html`<button className="pill danger" onClick=${onSoundcloudDisconnect} type="button">Disconnect</button>`
                : html`<button className="pill primary" onClick=${onSoundcloudAuth} type="button">Authorize SoundCloud</button>`}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>`;
  }

	  function ProfileScreen({
	    theme,
	    setTheme,
	    accent,
	    setAccent,
    services,
    toast,
    supabase,
    supabaseSession,
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnon,
    setSupabaseAnon,
    authedEmail,
    supabaseEmail,
    setSupabaseEmail,
    onSignIn,
    onSignOut,
    profileHandle,
    setProfileHandle,
    zip,
    setZip,
    zipOptIn,
    setZipOptIn,
    onSaveProfile,
	    myLive,
	    onGoLive,
	    onEndLive,
	    following,
	    followers,
	    toggleFollow,
	    spotifyClientId,
	    setSpotifyClientId,
	    spotifyRedirect,
	    setSpotifyRedirect,
	    spotifyConnected,
	    onSpotifyAuth,
	    onSpotifyDisconnect,
	    soundcloudClientId,
	    setSoundcloudClientId,
	    soundcloudConnected,
	    onSoundcloudAuth,
	    onSoundcloudDisconnect,
	  }) {
	    const userId = supabaseSession?.user?.id || "";
	    const [userShows, setUserShows] = useState([]);
	    const [showSettings, setShowSettings] = useState(false);
	    const [userStats, setUserStats] = useState({ followers: 0, following: 0, likes: 0 });
	    const [displayName, setDisplayName] = useState("");

	    useEffect(() => {
	      if (!supabase || !userId) {
	        setUserShows([]);
	        setUserStats({ followers: 0, following: 0, likes: 0 });
	        return;
	      }
	      let ignore = false;
	      (async () => {
	        try {
	          const { data: shows } = await supabase
	            .from("sessions")
	            .select("id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes)")
	            .eq("host_user_id", userId)
	            .order("created_at", { ascending: false })
	            .limit(50);
	          if (ignore) return;
	          if (shows) {
	            setUserShows(shows.map((row) => ({
	              id: row.id,
	              slug: row.slug,
	              title: row.title,
	              host: row.host_name,
	              genre: row.genre,
	              cover_url: row.cover_url,
	              duration: "0:00",
	              likes: row.session_stats?.[0]?.likes ?? 0,
	              downloads: row.session_stats?.[0]?.downloads ?? 0,
	              location: null,
	              created_at: row.created_at,
	            })));
	          }
	          const [{ data: fwd }, { data: rev }, { data: profile }] = await Promise.all([
	            supabase.from("follows").select("followed_id").eq("follower_id", userId).limit(5000),
	            supabase.from("follows").select("follower_id").eq("followed_id", userId).limit(5000),
	            supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
	          ]);
	          if (ignore) return;
	          setUserStats({
	            followers: (rev || []).length,
	            following: (fwd || []).length,
	            likes: 0,
	          });
	          if (profile?.display_name) setDisplayName(profile.display_name);
	        } catch {
	          if (!ignore) {
	            setUserShows([]);
	            setUserStats({ followers: 0, following: 0, likes: 0 });
	          }
	        }
	      })();
	      return () => {
	        ignore = true;
	      };
	    }, [supabase, userId]);

	    const formatNumber = (n) => {
	      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
	      if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
	      return String(n);
	    };

	    const formatDuration = (durationStr) => {
	      return durationStr || "0:00";
	    };

	    return html`<div className="fade-in">
	      <div className="section" style=${{ marginTop: 0 }}>
	        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
	          <div style=${{ fontSize: "16px", fontWeight: 600 }}>${profileHandle || "Host name"}</div>
	          <button className="pill icon" onClick=${() => setShowSettings(true)} aria-label="Settings" type="button">
	            <${Icon} name="settings" />
	          </button>
	        </div>
	        <div style=${{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "24px" }}>
	          <div className="thumb" style=${{ width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0 }}></div>
	          <div style=${{ flex: 1, minWidth: 0 }}>
	            <div style=${{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>${displayName || profileHandle || "User"}</div>
	            <div style=${{ fontSize: "14px", color: "var(--muted)", marginBottom: "12px" }}>${profileHandle ? `@${profileHandle}` : "@handle"}</div>
	            <div style=${{ display: "flex", gap: "16px", fontSize: "14px" }}>
	              <div>
	                <div style=${{ fontWeight: 700 }}>${formatNumber(userStats.followers)}</div>
	                <div style=${{ color: "var(--muted)", fontSize: "12px" }}>followers</div>
	              </div>
	              <div>
	                <div style=${{ fontWeight: 700 }}>${formatNumber(userStats.following)}</div>
	                <div style=${{ color: "var(--muted)", fontSize: "12px" }}>following</div>
	              </div>
	              <div>
	                <div style=${{ fontWeight: 700 }}>${formatNumber(userStats.likes)}</div>
	                <div style=${{ color: "var(--muted)", fontSize: "12px" }}>likes</div>
	              </div>
	            </div>
	          </div>
	        </div>
	      </div>

	      <div className="section">
	        <div className="section-head">
	          <div className="section-title">${userShows.length} Shows</div>
	        </div>
	        <div className="list">
	          ${userShows.map((s) => html`<div className="item" style=${{ cursor: "pointer" }}>
	            <div className="thumb" style=${{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : "none", backgroundSize: "cover" }}></div>
	            <div className="grow meta">
	              <div className="t">${s.title || s.slug || "Untitled"}</div>
	              <div className="s">
	                ${formatDuration(s.duration)} · ${s.likes || 0} likes
	                ${s.host ? ` · @${s.host}` : ""}
	                ${s.location ? ` · ${s.location}` : ""}
	                ${s.downloads ? ` · ${formatNumber(s.downloads)} downloads` : ""}
	              </div>
	            </div>
	          </div>`)}
	          ${(!userShows || !userShows.length) &&
	          html`<div className="card">
	            <div style=${{ color: "var(--muted)", lineHeight: 1.5 }}>${userId ? "No shows yet. Create one in Builder." : "Sign in to see your shows."}</div>
	          </div>`}
	        </div>
	      </div>

	      ${showSettings && html`<${SettingsModal}
	        theme=${theme}
	        setTheme=${setTheme}
	        accent=${accent}
	        setAccent=${setAccent}
	        services=${services}
	        toast=${toast}
	        supabase=${supabase}
	        supabaseSession=${supabaseSession}
	        supabaseUrl=${supabaseUrl}
	        setSupabaseUrl=${setSupabaseUrl}
	        supabaseAnon=${supabaseAnon}
	        setSupabaseAnon=${setSupabaseAnon}
	        authedEmail=${authedEmail}
	        supabaseEmail=${supabaseEmail}
	        setSupabaseEmail=${setSupabaseEmail}
	        onSignIn=${onSignIn}
	        onSignOut=${onSignOut}
	        profileHandle=${profileHandle}
	        setProfileHandle=${setProfileHandle}
	        zip=${zip}
	        setZip=${setZip}
	        zipOptIn=${zipOptIn}
	        setZipOptIn=${setZipOptIn}
	        onSaveProfile=${onSaveProfile}
	        myLive=${myLive}
	        onGoLive=${onGoLive}
	        onEndLive=${onEndLive}
	        following=${following}
	        followers=${followers}
	        toggleFollow=${toggleFollow}
	        spotifyClientId=${spotifyClientId}
	        setSpotifyClientId=${setSpotifyClientId}
	        spotifyRedirect=${spotifyRedirect}
	        setSpotifyRedirect=${setSpotifyRedirect}
	        spotifyConnected=${spotifyConnected}
	        onSpotifyAuth=${onSpotifyAuth}
	        onSpotifyDisconnect=${onSpotifyDisconnect}
	        soundcloudClientId=${soundcloudClientId}
	        setSoundcloudClientId=${setSoundcloudClientId}
	        soundcloudConnected=${soundcloudConnected}
	        onSoundcloudAuth=${onSoundcloudAuth}
	        onSoundcloudDisconnect=${onSoundcloudDisconnect}
	        onClose=${() => setShowSettings(false)}
	      />`}
    </div>`;
  }

  function App() {
    const [tab, setTab] = useState("discover");
    const [theme, setTheme] = useLocalStorageState(STORAGE.theme, () => (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"));
    const [accent, setAccent] = useLocalStorageState(STORAGE.accent, () => ACCENTS[0].value);
    const { toast, show } = useToast();

    const [supabaseUrl, setSupabaseUrl] = useLocalStorageString(SUPABASE_URL_KEY, DEFAULT_SUPABASE_URL);
    const [supabaseAnon, setSupabaseAnon] = useLocalStorageString(SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON);
    const { client: supabase, session: supabaseSession, authHeaders, loading: supabaseLoading } = useSupabase(supabaseUrl || DEFAULT_SUPABASE_URL, supabaseAnon || DEFAULT_SUPABASE_ANON);
    const [supabaseEmail, setSupabaseEmail] = useState("");

    const [spotifyClientId, setSpotifyClientId] = useLocalStorageString(SPOTIFY_CLIENT_ID_KEY, DEFAULT_CLIENT_ID);
    const [spotifyToken, setSpotifyToken] = useLocalStorageString(SPOTIFY_TOKEN_KEY, "");
    const [spotifyRedirect, setSpotifyRedirect] = useLocalStorageString(SPOTIFY_REDIRECT_KEY, "");
    const [spotifyConnected, setSpotifyConnected] = useState(!!spotifyToken);

    const [soundcloudClientId, setSoundcloudClientId] = useLocalStorageString(SOUNDCLOUD_CLIENT_ID_KEY, DEFAULT_SOUNDCLOUD_CLIENT_ID);
    const [soundcloudToken, setSoundcloudToken] = useLocalStorageString(SOUNDCLOUD_TOKEN_KEY, "");
    // SoundCloud is available by default (has client ID), connected means authenticated
    const [soundcloudConnected, setSoundcloudConnected] = useState(!!soundcloudToken);
    const soundcloudAvailable = useMemo(() => !!(soundcloudClientId || DEFAULT_SOUNDCLOUD_CLIENT_ID), [soundcloudClientId]);

    const [profileHandle, setProfileHandle] = useLocalStorageString(PROFILE_HANDLE_KEY, "");
    const [zip, setZip] = useLocalStorageString(PROFILE_ZIP_KEY, "");
    const [zipOptIn, setZipOptIn] = useLocalStorageBool(PROFILE_ZIP_OPTIN_KEY, false);
    const [myLive, setMyLive] = useState(null);

    const [segments, setSegments] = useLocalStorageState(STORAGE.builder, () => []);
    const [recentSessions, setRecentSessions] = useLocalStorageState(STORAGE.recent, () => []);

    const [likes, setLikes] = useLocalStorageState(STORAGE.likes, () => []);
    const likeSet = useMemo(() => new Set(Array.isArray(likes) ? likes : []), [likes]);

    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [trackDuration, setTrackDuration] = useState(0);

    useEffect(() => {
      if (currentTrack) {
        try {
          localStorage.setItem("rs_current_track", JSON.stringify(currentTrack));
        } catch {}
      }
    }, [currentTrack]);

    useEffect(() => {
      if (!isPlaying || !trackDuration) return;
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= trackDuration) {
            setIsPlaying(false);
            return trackDuration;
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    }, [isPlaying, trackDuration]);

    useEffect(() => {
      if (!supabase || !supabaseSession?.user?.id) return;
      let ignore = false;
      const uid = supabaseSession.user.id;
      (async () => {
        try {
          const { data: profile } = await supabase.from("profiles").select("handle").eq("user_id", uid).maybeSingle();
          if (!ignore && profile?.handle) setProfileHandle(profile.handle);
        } catch {}
        try {
          const { data: loc } = await supabase.from("profile_locations").select("zip, opt_in").eq("user_id", uid).maybeSingle();
          if (ignore) return;
          if (loc?.zip) setZip(String(loc.zip));
          if (typeof loc?.opt_in === "boolean") setZipOptIn(!!loc.opt_in);
        } catch {}
      })();
      return () => {
        ignore = true;
      };
    }, [supabase, supabaseSession?.user?.id]);

	    useEffect(() => {
	      if (!supabase || !supabaseSession?.user?.id) return;
	      const uid = supabaseSession.user.id;
	      let timer = null;
	      let cancelled = false;
	      const upsert = async (offline) => {
	        if (cancelled) return;
	        try {
	          await supabase.from("profile_presence").upsert({
	            user_id: uid,
	            last_seen_at: new Date().toISOString(),
	            status: offline ? "offline" : "online",
	          });
	        } catch {}
	      };
	      const start = () => {
	        if (timer) return;
	        upsert(false);
	        timer = window.setInterval(() => upsert(false), 30_000);
	      };
	      const stop = (offline) => {
	        if (timer) window.clearInterval(timer);
	        timer = null;
	        if (offline) upsert(true);
	      };
	      const onVis = () => {
	        if (document.hidden) stop(true);
	        else start();
	      };
	      const onHide = () => stop(true);
	      document.addEventListener("visibilitychange", onVis);
	      window.addEventListener("pagehide", onHide);
	      if (document.hidden) stop(true);
	      else start();
	      return () => {
	        stop(true);
	        cancelled = true;
	        document.removeEventListener("visibilitychange", onVis);
	        window.removeEventListener("pagehide", onHide);
	      };
	    }, [supabase, supabaseSession?.user?.id]);

	    const authedEmail = supabaseSession?.user?.email || "";
	    const authedUserId = supabaseSession?.user?.id || "";
	    const [following, setFollowing] = useState(() => new Set());
	    const [followers, setFollowers] = useState(() => new Set());
	    const [followVersion, setFollowVersion] = useState(0);

	    useEffect(() => {
	      let ignore = false;
	      if (!supabase || !authedUserId) {
	        setFollowing(new Set());
	        setFollowers(new Set());
	        setFollowVersion((v) => v + 1);
	        return;
	      }
	      (async () => {
	        try {
	          const [{ data: fwd }, { data: rev }] = await Promise.all([
	            supabase.from("follows").select("followed_id").eq("follower_id", authedUserId).limit(5000),
	            supabase.from("follows").select("follower_id").eq("followed_id", authedUserId).limit(5000),
	          ]);
	          if (ignore) return;
	          setFollowing(new Set((fwd || []).map((r) => r.followed_id).filter(Boolean)));
	          setFollowers(new Set((rev || []).map((r) => r.follower_id).filter(Boolean)));
	          setFollowVersion((v) => v + 1);
	        } catch {
	          if (!ignore) {
	            setFollowing(new Set());
	            setFollowers(new Set());
	            setFollowVersion((v) => v + 1);
	          }
	        }
	      })();
	      return () => {
	        ignore = true;
	      };
	    }, [supabase, authedUserId]);

	    useEffect(() => {
	      if (!supabase || !authedUserId) return;
	      const uid = authedUserId;
	      const channel = supabase
	        .channel(`rs-follows-${uid}`)
	        .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` }, (payload) => {
	          const id = payload?.new?.followed_id || "";
	          if (!id) return;
	          setFollowing((prev) => {
	            const next = new Set(prev);
	            next.add(id);
	            return next;
	          });
	          setFollowVersion((v) => v + 1);
	        })
	        .on("postgres_changes", { event: "DELETE", schema: "public", table: "follows", filter: `follower_id=eq.${uid}` }, (payload) => {
	          const id = payload?.old?.followed_id || "";
	          if (!id) return;
	          setFollowing((prev) => {
	            const next = new Set(prev);
	            next.delete(id);
	            return next;
	          });
	          setFollowVersion((v) => v + 1);
	        })
	        .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` }, (payload) => {
	          const id = payload?.new?.follower_id || "";
	          if (!id) return;
	          setFollowers((prev) => {
	            const next = new Set(prev);
	            next.add(id);
	            return next;
	          });
	          setFollowVersion((v) => v + 1);
	        })
	        .on("postgres_changes", { event: "DELETE", schema: "public", table: "follows", filter: `followed_id=eq.${uid}` }, (payload) => {
	          const id = payload?.old?.follower_id || "";
	          if (!id) return;
	          setFollowers((prev) => {
	            const next = new Set(prev);
	            next.delete(id);
	            return next;
	          });
	          setFollowVersion((v) => v + 1);
	        });
	      channel.subscribe();
	      return () => {
	        channel.unsubscribe().catch(() => {});
	      };
	    }, [supabase, authedUserId]);

	    async function supabaseSignIn() {
	      if (!supabase) {
	        show("Add Supabase URL + anon key");
        return;
      }
      const email = String(supabaseEmail || "").trim();
      if (!email) {
        show("Enter an email");
        return;
      }
      try {
        const redirect = `${window.location.origin}${window.location.pathname}`;
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        show("Check email for link");
      } catch (err) {
        show(`Sign-in failed`);
      }
    }

    async function supabaseSignOut() {
      if (!supabase) return;
      try {
        await supabase.auth.signOut();
        show("Signed out");
      } catch {
        // ignore
      }
    }

    async function startSpotifyAuth() {
      const clientId = spotifyClientId || DEFAULT_CLIENT_ID;
      // Use custom redirect URI if set, otherwise use current origin + /mobile/
      // This allows local IP addresses like 192.168.1.71:5173 to work
      // Default matches what user configured in Spotify Dashboard: http://192.168.1.71:5173/mobile/
      const redirectUri = spotifyRedirect || `${window.location.origin}/mobile/`;
      
      if (!clientId) {
        show("Add Spotify Client ID");
        return;
      }

      try {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const authState = uid();
        sessionStorage.setItem("rs_pkce_verifier", verifier);
        sessionStorage.setItem("rs_pkce_state", authState);
        sessionStorage.setItem("rs_pkce_redirect", redirectUri);
        sessionStorage.setItem("rs_pkce_client", clientId);
        const scopes = encodeURIComponent(SPOTIFY_SCOPES);
        const redirect = encodeURIComponent(redirectUri);
        const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${redirect}&code_challenge_method=S256&code_challenge=${challenge}&state=${authState}&show_dialog=true`;
        console.log("Starting Spotify auth with redirect URI:", redirectUri);
        window.location.href = url;
      } catch (err) {
        console.error("Spotify auth failed", err);
        show("Auth failed: " + (err.message || "Unknown error"));
      }
    }

    async function handleSpotifyCallback() {
      // Check both query params (from /mobile/?code=...) and hash (from callback.html redirect)
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      
      // Try query params first, then hash
      const code = searchParams.get("code") || hashParams.get("code");
      const error = searchParams.get("error") || hashParams.get("error");
      const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");
      const returnedState = searchParams.get("state") || hashParams.get("state");
      
      // Check for error in callback
      if (error) {
        console.error("Spotify auth error:", error, errorDescription);
        show(`Spotify auth error: ${errorDescription || error}`);
        sessionStorage.removeItem("rs_pkce_verifier");
        sessionStorage.removeItem("rs_pkce_state");
        sessionStorage.removeItem("rs_pkce_redirect");
        sessionStorage.removeItem("rs_pkce_client");
        // Clean URL - remove both query and hash
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        return false;
      }

      if (!code) return false;
      
      console.log("Spotify callback detected with code:", code ? "present" : "missing", "state:", returnedState ? "present" : "missing");
      
      const storedState = sessionStorage.getItem("rs_pkce_state");
      const verifier = sessionStorage.getItem("rs_pkce_verifier");
      // Use stored redirect URI or fallback to auto-calculated one
      const redirectUri = sessionStorage.getItem("rs_pkce_redirect") || `${window.location.origin}/mobile/`;
      const clientId = sessionStorage.getItem("rs_pkce_client") || DEFAULT_CLIENT_ID;
      
      if (!verifier) {
        console.error("Missing PKCE verifier in sessionStorage");
        show("Auth session expired - please try again");
        return false;
      }
      
      if (!storedState || storedState !== returnedState) {
        console.error("State mismatch:", { stored: storedState, returned: returnedState });
        show("Auth state mismatch - possible security issue");
        sessionStorage.removeItem("rs_pkce_verifier");
        sessionStorage.removeItem("rs_pkce_state");
        sessionStorage.removeItem("rs_pkce_redirect");
        sessionStorage.removeItem("rs_pkce_client");
        return false;
      }
      
      try {
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: verifier,
        });
        console.log("Exchanging Spotify code for token with redirect URI:", redirectUri);
        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Spotify token exchange failed:", res.status, errorText);
          let errorMsg = "Token exchange failed";
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.error_description || errorJson.error || errorMsg;
          } catch {
            errorMsg = errorText || errorMsg;
          }
          show(`Spotify auth failed: ${errorMsg}. Check redirect URI matches dashboard.`);
          throw new Error(errorMsg);
        }
        const data = await res.json();
        setSpotifyToken(data.access_token);
        setSpotifyConnected(true);
        sessionStorage.removeItem("rs_pkce_verifier");
        sessionStorage.removeItem("rs_pkce_state");
        sessionStorage.removeItem("rs_pkce_redirect");
        sessionStorage.removeItem("rs_pkce_client");
        // Clean URL - remove both query params and hash
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        show("Spotify connected");
        return true;
      } catch (err) {
        console.error("Spotify callback failed", err);
        const errorMsg = err.message || "Unknown error";
        if (errorMsg.includes("redirect_uri")) {
          show(`Redirect URI mismatch. Current: ${redirectUri}. Update Spotify app settings.`);
        } else {
          show(`Spotify auth failed: ${errorMsg}`);
        }
        return false;
      }
    }

    function disconnectSpotify() {
      setSpotifyToken("");
      setSpotifyConnected(false);
      show("Spotify disconnected");
    }

    async function startSoundcloudAuth() {
      const clientId = soundcloudClientId || DEFAULT_SOUNDCLOUD_CLIENT_ID;
      if (!clientId) {
        show("Add SoundCloud Client ID");
        return;
      }
      // Auto-calculate redirect URI - must match what's configured in SoundCloud app
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      // Check if we're in local development
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || /^192\.168\./.test(window.location.hostname);
      if (isLocal) {
        const errorMsg = `SoundCloud doesn't allow local IPs (${window.location.hostname}). Use localhost or deploy to a public URL. Current redirect: ${redirectUri}`;
        console.error(errorMsg);
        show("SoundCloud auth requires localhost or public URL. Local IPs not allowed.");
        return;
      }
      
      const authState = uid();
      sessionStorage.setItem("rs_sc_state", authState);
      try {
        const url = `https://soundcloud.com/connect?client_id=${clientId}&response_type=token&scope=non-expiring&display=popup&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(authState)}`;
        console.log("Starting SoundCloud auth with redirect URI:", redirectUri);
        window.location.href = url;
      } catch (err) {
        console.error("SoundCloud auth failed", err);
        show("Auth failed: " + (err.message || "Unknown error"));
      }
    }

    async function handleSoundcloudCallback() {
      const hash = window.location.hash || "";
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const token = params.get("access_token");
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      const returnedState = params.get("state");
      const storedState = sessionStorage.getItem("rs_sc_state");
      
      if (error) {
        console.error("SoundCloud auth error:", error, errorDescription);
        let errorMsg = errorDescription || error || "Unknown error";
        if (error === "redirect_uri_mismatch") {
          errorMsg = `Redirect URI mismatch. Current: ${window.location.origin}${window.location.pathname}. Update SoundCloud app settings.`;
        }
        show(`SoundCloud auth failed: ${errorMsg}`);
        sessionStorage.removeItem("rs_sc_state");
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, cleanUrl);
        return false;
      }
      
      if (!hash.includes("access_token")) return false;
      
      if (storedState && returnedState && storedState !== returnedState) {
        console.error("State mismatch:", { stored: storedState, returned: returnedState });
        show("SoundCloud auth state mismatch - possible security issue");
        sessionStorage.removeItem("rs_sc_state");
        return false;
      }
      
      if (!token) return false;
      
      setSoundcloudToken(token);
      setSoundcloudConnected(true);
      sessionStorage.removeItem("rs_sc_state");
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, document.title, cleanUrl);
      show("SoundCloud connected");
      return true;
    }

    function disconnectSoundcloud() {
      setSoundcloudToken("");
      setSoundcloudConnected(false);
      show("SoundCloud disconnected");
    }

    // Auto-populate Supabase values with defaults if empty
    useEffect(() => {
      if (!supabaseUrl || supabaseUrl.trim() === "") {
        setSupabaseUrl(DEFAULT_SUPABASE_URL);
      }
      if (!supabaseAnon || supabaseAnon.trim() === "") {
        setSupabaseAnon(DEFAULT_SUPABASE_ANON);
      }
    }, []);

    useEffect(() => {
      handleSpotifyCallback().catch(() => {});
      handleSoundcloudCallback().catch(() => {});
    }, []);

    async function saveProfile() {
      if (!supabase || !authedUserId) {
        show("Sign in to save");
        return;
      }
      const handle = String(profileHandle || "")
        .trim()
        .replace(/^@+/, "")
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "")
        .slice(0, 24);
      const zipClean = String(zip || "").trim();
      try {
        if (handle) {
          const { error } = await supabase.from("profiles").upsert({ user_id: authedUserId, handle });
          if (error) throw error;
          setProfileHandle(handle);
        }
        await supabase.from("profile_locations").upsert({ user_id: authedUserId, zip: zipClean || null, opt_in: !!zipOptIn });
        show("Profile saved");
      } catch {
        show("Save failed");
      }
    }

    async function goLive() {
      if (!supabase || !authedUserId) {
        show("Sign in to go live");
        return;
      }
      const title = (window.prompt("Live title:", "Live") || "Live").trim().slice(0, 120) || "Live";
      const zipClean = String(zip || "").trim() || null;
      const locationOptIn = !!zipOptIn && !!zipClean;
      try {
        const { data, error } = await supabase.functions.invoke("start_live", {
          headers: authHeaders,
          body: { title, visibility: "followers", zip: zipClean, location_opt_in: locationOptIn },
        });
        if (error) throw error;
        setMyLive(data?.live || null);
        show(data?.live?.room_name ? `Live room: ${data.live.room_name}` : "You're live");
      } catch {
        show("Could not go live");
      }
    }

    async function stopLive() {
      if (!supabase || !authedUserId || !myLive?.id) {
        show("No active live");
        return;
      }
      try {
        const { error } = await supabase.functions.invoke("end_live", { headers: authHeaders, body: { id: myLive.id } });
        if (error) throw error;
        setMyLive(null);
        show("Live ended");
      } catch {
        show("Could not end live");
      }
    }

    const services = useMemo(
      () => [
        { name: "SoundCloud", connected: soundcloudConnected, available: soundcloudAvailable },
        { name: "Spotify", connected: spotifyConnected },
        { name: "Apple Music", connected: false },
      ],
      [spotifyConnected, soundcloudConnected, soundcloudAvailable]
    );

    useEffect(() => {
      if (theme) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.setAttribute("data-theme", theme);
      }
    }, [theme]);

    useEffect(() => {
      document.documentElement.style.setProperty("--accent", accent);
    }, [accent]);

    useEffect(() => {
      let ignore = false;
      fetch("../sessions/top-sessions.json")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
        .then((data) => {
          if (ignore) return;
          const rows = Array.isArray(data?.sessions) ? data.sessions : [];
          if (!rows.length) return;
          const mapped = rows.map((s, idx) => ({
            id: s.url || `remote_${idx}`,
            title: s.title || "Untitled",
            host: s.host || "unknown",
            trackCount: 4 + ((idx * 3) % 5),
            duration: ["18:44", "12:30", "25:15", "14:30", "20:45"][idx % 5],
            likes: Number(s.downloads || 0),
            genre: s.genre || "mix",
            url: s.url,
          }));
          setSessions((prev) => {
            const next = [...mapped, ...(Array.isArray(prev) ? prev : [])];
            const dedup = [];
            const seen = new Set();
            for (const row of next) {
              if (!row?.id || seen.has(row.id)) continue;
              seen.add(row.id);
              dedup.push(row);
            }
            return dedup;
          });
        })
        .catch(() => {});
      return () => {
        ignore = true;
      };
    }, []);

	    const toggleLike = (id) => {
	      setLikes((prev) => {
	        const set = new Set(Array.isArray(prev) ? prev : []);
	        if (set.has(id)) set.delete(id);
	        else set.add(id);
	        return Array.from(set);
	      });
	    };

	    const toggleFollow = async (targetUserId) => {
	      if (!supabase || !authedUserId) {
	        show("Sign in to follow");
	        return;
	      }
	      if (!targetUserId || targetUserId === authedUserId) return;
	      const isFollowingNow = following.has(targetUserId);
	      setFollowing((prev) => {
	        const next = new Set(prev);
	        if (isFollowingNow) next.delete(targetUserId);
	        else next.add(targetUserId);
	        return next;
	      });
	      setFollowVersion((v) => v + 1);
	      try {
	        if (isFollowingNow) {
	          const { error } = await supabase.from("follows").delete().eq("follower_id", authedUserId).eq("followed_id", targetUserId);
	          if (error) throw error;
	        } else {
	          const { error } = await supabase.from("follows").insert({ follower_id: authedUserId, followed_id: targetUserId });
	          if (error) throw error;
	        }
	      } catch (err) {
	        console.warn("toggleFollow failed", err);
	        setFollowing((prev) => {
	          const next = new Set(prev);
	          if (isFollowingNow) next.add(targetUserId);
	          else next.delete(targetUserId);
	          return next;
	        });
	        setFollowVersion((v) => v + 1);
	        show("Follow failed");
	      }
	    };

	    const onAddTrack = (t) => {
	      const seg = {
	        id: `${t.id}_${Date.now()}`,
	        type: "track",
        title: t.title,
        artist: t.artist,
        source: t.source,
        duration: t.duration,
        cue: true,
        fade: true,
      };
      setSegments((prev) => [seg, ...prev]);
      show("Added to Builder");
    };

    const onNewShow = () => {
      setSegments([]);
      show("New show started");
      setTab("builder");
    };

    const onLoadSession = async (s) => {
      const entry = { ...s, loadedAt: Date.now() };
      setRecentSessions((prev) => {
        const next = [entry, ...(Array.isArray(prev) ? prev : [])];
        const dedup = [];
        const seen = new Set();
        for (const item of next) {
          const key = item.id || item.slug || item.title;
          if (!key || seen.has(key)) continue;
          seen.add(key);
          dedup.push(item);
        }
        return dedup.slice(0, 10);
      });

      if (supabase && (s?.id || s?.slug)) {
        try {
          const { data, error } = await supabase.functions.invoke("get_session", {
            headers: authHeaders,
            body: { id: s?.id || null, slug: s?.slug || null },
          });
          if (error) throw error;
          const url = data?.json_url || null;
          if (url) {
            const res = await fetch(url, { cache: "no-store" });
            const payload = await res.json();
            const segs = Array.isArray(payload?.segments) ? payload.segments : [];
            const mmss = (ms) => {
              const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
              const m = String(Math.floor(total / 60));
              const s2 = String(total % 60).padStart(2, "0");
              return `${m}:${s2}`;
            };
            const mapped = segs
              .map((seg) => {
                if (!seg) return null;
                const base = {
                  id: seg.id || `seg_${Date.now()}`,
                  title: seg.title || "Untitled",
                  artist: seg.subtitle || seg.artist || "—",
                  source: seg.type === "spotify" ? "Spotify" : seg.type === "upload" ? "Upload" : seg.type === "voice" ? "Mic" : "Track",
                  duration: typeof seg.duration === "number" ? mmss(seg.duration) : seg.duration ? String(seg.duration) : "0:00",
                  cue: !!seg.cue,
                  fade: !!seg.fadeIn || !!seg.fadeOut,
                };
                return base;
              })
              .filter(Boolean);
            if (mapped.length) setSegments(mapped);
            show(`Loaded "${payload?.meta?.title || data?.title || s?.title || "Session"}"`);
          } else {
            show("No session URL");
          }
        } catch {
          show("Load failed");
        }
      } else {
        show("Session loaded");
      }

      setTab("builder");
    };

    // Show loading state while checking session
    if (supabaseLoading) {
      return html`<div className="shell" style=${{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style=${{ textAlign: "center", color: "var(--muted)" }}>
          <div style=${{ fontSize: "16px" }}>Loading...</div>
        </div>
      </div>`;
    }

    // Show sign-in screen if not authenticated with Supabase (required)
    if (!authedEmail) {
      return html`<div className="shell" style=${{ minHeight: "100dvh" }}>
        <${SignInScreen}
          supabase=${supabase}
          supabaseSession=${supabaseSession}
          supabaseEmail=${supabaseEmail}
          setSupabaseEmail=${setSupabaseEmail}
          onSupabaseSignIn=${supabaseSignIn}
          spotifyClientId=${spotifyClientId}
          spotifyConnected=${spotifyConnected}
          onSpotifyAuth=${startSpotifyAuth}
          soundcloudClientId=${soundcloudClientId}
          soundcloudConnected=${soundcloudConnected}
          onSoundcloudAuth=${startSoundcloudAuth}
          toast=${show}
        />
        <${Toast} toast=${toast} />
      </div>`;
    }

    const right = html`<button className="pill icon" onClick=${() => show("Settings (prototype)")} aria-label="Settings" type="button">
      <${Icon} name="spark" />
    </button>`;

    let title = "discover";
    let subtitle = "";

    if (tab === "discover") title = "discover";
    if (tab === "build") title = "builder";
    if (tab === "listen") title = "listen";
    if (tab === "me") title = profileHandle ? `@${profileHandle}` : "me";

    const screen =
      tab === "discover"
        ? html`<${DiscoverScreen}
            supabase=${supabase}
            supabaseSession=${supabaseSession}
            authHeaders=${authHeaders}
            zip=${zip}
            zipOptIn=${zipOptIn}
            likes=${likeSet}
            toggleLike=${toggleLike}
            following=${following}
            followers=${followers}
            toggleFollow=${toggleFollow}
            followVersion=${followVersion}
            onLoad=${(s) => {
              onLoadSession(s);
              setCurrentTrack({ id: s.id, title: s.title, host: s.host, cover_url: s.cover_url, duration: 0 });
              setTrackDuration(0);
            }}
            toast=${show}
            onNavigateToListen=${() => setTab("listen")}
          />`
        : tab === "build"
        ? html`<${BuilderScreen}
            segments=${segments}
            setSegments=${setSegments}
            toast=${show}
            supabase=${supabase}
            authHeaders=${authHeaders}
            profileHandle=${profileHandle}
            zip=${zip}
            zipOptIn=${zipOptIn}
          />`
        : tab === "listen"
        ? html`<${ListenScreen}
            supabase=${supabase}
            supabaseSession=${supabaseSession}
            authHeaders=${authHeaders}
            likes=${likeSet}
            toggleLike=${toggleLike}
            toast=${show}
            currentTrack=${currentTrack}
            setCurrentTrack=${setCurrentTrack}
            isPlaying=${isPlaying}
            setIsPlaying=${setIsPlaying}
            currentTime=${currentTime}
            setCurrentTime=${setCurrentTime}
            trackDuration=${trackDuration}
            setTrackDuration=${setTrackDuration}
          />`
        : html`<${ProfileScreen}
	            theme=${theme}
	            setTheme=${(t) => {
	              setTheme(t);
	              show(`Theme: ${t}`);
	            }}
	            accent=${accent}
	            setAccent=${(a) => {
	              setAccent(a);
	              show("Accent updated");
	            }}
	            services=${services}
	            toast=${show}
	            supabase=${supabase}
	            supabaseSession=${supabaseSession}
	            supabaseUrl=${supabaseUrl}
	            setSupabaseUrl=${setSupabaseUrl}
	            supabaseAnon=${supabaseAnon}
            setSupabaseAnon=${setSupabaseAnon}
            authedEmail=${authedEmail}
            supabaseEmail=${supabaseEmail}
            setSupabaseEmail=${setSupabaseEmail}
            onSignIn=${supabaseSignIn}
            onSignOut=${supabaseSignOut}
            profileHandle=${profileHandle}
            setProfileHandle=${setProfileHandle}
            zip=${zip}
            setZip=${setZip}
            zipOptIn=${zipOptIn}
            setZipOptIn=${setZipOptIn}
            onSaveProfile=${saveProfile}
	            myLive=${myLive}
	            onGoLive=${goLive}
	            onEndLive=${stopLive}
	            following=${following}
	            followers=${followers}
	            toggleFollow=${toggleFollow}
	            spotifyClientId=${spotifyClientId}
	            setSpotifyClientId=${setSpotifyClientId}
	            spotifyRedirect=${spotifyRedirect}
	            setSpotifyRedirect=${setSpotifyRedirect}
	            spotifyConnected=${spotifyConnected}
	            onSpotifyAuth=${startSpotifyAuth}
	            onSpotifyDisconnect=${disconnectSpotify}
	            soundcloudClientId=${soundcloudClientId}
	            setSoundcloudClientId=${setSoundcloudClientId}
	            soundcloudConnected=${soundcloudConnected}
	            onSoundcloudAuth=${startSoundcloudAuth}
	            onSoundcloudDisconnect=${disconnectSoundcloud}
	          />`;

    return html`<div className="shell">
      <${TopBar} title=${title} subtitle=${subtitle} right=${right} />
      <div className="content">${screen}</div>
      <${NowPlayingBar}
        currentTrack=${currentTrack}
        isPlaying=${isPlaying}
        currentTime=${currentTime}
        duration=${trackDuration}
        onPlayPause=${() => setIsPlaying(!isPlaying)}
        onNavigateToListen=${() => setTab("listen")}
      />
      <${TabBar} value=${tab} onChange=${setTab} />
      <${Toast} toast=${toast} />
    </div>`;
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(html`<${App} />`);

  // Register Service Worker for PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/mobile/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }
})();
