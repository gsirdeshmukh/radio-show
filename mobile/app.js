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
      { key: "home", label: "Home", icon: "home" },
      { key: "find", label: "Find", icon: "search" },
      { key: "builder", label: "Builder", icon: "mic" },
      { key: "sessions", label: "Sessions", icon: "stack" },
      { key: "profile", label: "Profile", icon: "user" },
    ];
    return html`<div className="tabbar">
      <div className="tabbar-inner">
        ${tabs.map(
          (t) =>
            html`<button
              className=${cx("tab", value === t.key && "active")}
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
                <div className="s">${svc.connected ? "Connected" : "Not connected"}</div>
              </div>
              <div className="chip">${svc.connected ? "Ready" : "Optional"}</div>
            </div>`
          )}
        </div>
      </div>
    </div>`;
  }

  function FindScreen({ tracks, onAddTrack }) {
    const [mode, setMode] = useState("search");
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
      const query = q.trim().toLowerCase();
      const base = mode === "saved" ? tracks.slice(0, 2) : tracks;
      if (!query) return base;
      return base.filter((t) => `${t.title} ${t.artist} ${t.source}`.toLowerCase().includes(query));
    }, [mode, q, tracks]);

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

      <div className="section">
        <div className="field">
          <${Icon} name="search" />
          <input value=${q} onChange=${(e) => setQ(e.target.value)} placeholder=${mode === "saved" ? "Filter saved tracks…" : "Search tracks…"} />
          <button className="pill icon" onClick=${() => setQ("")} aria-label="Clear" type="button">
            <span style=${{ fontWeight: 700, opacity: 0.75 }}>×</span>
          </button>
        </div>
      </div>

      <div className="section">
        <div className="list">
          ${filtered.map(
            (t) => html`<div className="item">
              <div className="thumb"></div>
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

  function BuilderScreen({ segments, setSegments, toast }) {
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
      if (!recording) return;
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }, [recording]);

    useEffect(() => {
      if (!recording) setSeconds(0);
    }, [recording]);

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    const toggle = (id, key) => {
      setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: !s[key] } : s)));
    };

    const remove = (id) => setSegments((prev) => prev.filter((s) => s.id !== id));

    const addVoice = () => {
      setRecording(false);
      const seg = {
        id: `v_${Date.now()}`,
        type: "voice",
        title: "Voice take",
        artist: "Host mic",
        source: "Mic",
        duration: `${mm}:${ss}`,
        cue: true,
        fade: true,
      };
      setSegments((prev) => [seg, ...prev]);
      toast("Voice take added");
    };

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
                  <button className="pill" onClick=${() => setRecording(false)} type="button">Cancel</button>`
              : html`<button className="pill primary" onClick=${() => setRecording(true)} type="button">
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
            (s) => html`<div className="item">
              <div className="thumb"></div>
              <div className="grow meta">
                <div className="t">${s.title}</div>
                <div className="s">${s.artist} · ${s.source} · ${s.duration}</div>
                <div className="row" style=${{ marginTop: "10px", gap: "10px" }}>
                  <div className="chip">
                    Cue
                    <${Toggle} value=${!!s.cue} onChange=${() => toggle(s.id, "cue")} label="Cue" />
                  </div>
                  <div className="chip">
                    Fade
                    <${Toggle} value=${!!s.fade} onChange=${() => toggle(s.id, "fade")} label="Fade" />
                  </div>
                </div>
              </div>
              <button className="pill icon" onClick=${() => remove(s.id)} aria-label="Remove" type="button">
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
          <button className="pill" style=${{ flex: 1 }} onClick=${() => toast("Publish (prototype)")} type="button">Publish</button>
        </div>
      </div>
    </div>`;
  }

  function SessionsScreen({ sessions, likes, toggleLike, onLoad }) {
    const [sort, setSort] = useState("new");
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
      const query = q.trim().toLowerCase();
      const base = query ? sessions.filter((s) => `${s.title} ${s.host} ${s.genre}`.toLowerCase().includes(query)) : sessions.slice();
      if (sort === "popular") base.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      return base;
    }, [q, sessions, sort]);

    return html`<div className="fade-in">
      <div className="section" style=${{ marginTop: 0 }}>
        <div className="section-head">
          <div className="section-title">Sessions</div>
          <div className="section-note">community</div>
        </div>
        <${Segmented}
          options=${[
            { label: "Newest", value: "new" },
            { label: "Popular", value: "popular" },
            { label: "Following", value: "following" },
          ]}
          value=${sort}
          onChange=${setSort}
        />
      </div>

      <div className="section">
        <div className="field">
          <${Icon} name="search" />
          <input value=${q} onChange=${(e) => setQ(e.target.value)} placeholder="Search sessions…" />
        </div>
      </div>

      <div className="section">
        <div className="list">
          ${filtered.map((s) => {
            const isLiked = likes.has(s.id);
            const likeCount = (s.likes || 0) + (isLiked ? 1 : 0);
            return html`<div className="item">
              <div className="thumb"></div>
              <div className="grow meta">
                <div className="t">${s.title}</div>
                <div className="s">by ${s.host} · ${s.trackCount} tracks · ${s.duration}</div>
                <div className="row" style=${{ marginTop: "10px", justifyContent: "space-between" }}>
                  <button className="pill" onClick=${() => toggleLike(s.id)} aria-label="Like" type="button">
                    <span style=${{ display: "inline-flex", marginRight: "8px", opacity: isLiked ? 1 : 0.8 }}>
                      <${Icon} name="heart" />
                    </span>
                    ${isLiked ? "Liked" : "Like"} · ${likeCount}
                  </button>
                  <div className="chip">${s.genre}</div>
                </div>
              </div>
              <button className="pill icon primary" onClick=${() => onLoad(s)} aria-label="Load" type="button">
                <${Icon} name="play" />
              </button>
            </div>`;
          })}
        </div>
      </div>
    </div>`;
  }

  function ProfileScreen({ theme, setTheme, accent, setAccent, services, toast }) {
    return html`<div className="fade-in">
      <div className="section" style=${{ marginTop: 0 }}>
        <div className="card">
          <div className="row">
            <div className="thumb" style=${{ borderRadius: "18px" }}></div>
            <div className="grow">
              <div style=${{ fontSize: "18px", fontWeight: 750, lineHeight: 1.2 }}>Gaurav S.</div>
              <div style=${{ color: "var(--muted)", marginTop: "4px" }}>@gaurav</div>
            </div>
            <button className="pill icon" onClick=${() => toast("Edit profile (prototype)")} aria-label="Edit" type="button">
              <${Icon} name="spark" />
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="n">12</div>
              <div className="k">Shows</div>
            </div>
            <div className="stat">
              <div className="n">45</div>
              <div className="k">Likes</div>
            </div>
            <div className="stat">
              <div className="n">8</div>
              <div className="k">Following</div>
            </div>
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
          <div className="section-title">Connected Services</div>
          <div className="section-note">optional</div>
        </div>
        <div className="list">
          ${services.map(
            (svc) => html`<div className="item">
              <div className="thumb"></div>
              <div className="grow meta">
                <div className="t">${svc.name}</div>
                <div className="s">${svc.connected ? "Connected" : "Not connected"}</div>
              </div>
              <button
                className=${cx("pill", svc.connected ? "danger" : "primary")}
                onClick=${() => toast(`${svc.connected ? "Disconnect" : "Connect"} (prototype)`)}
                type="button"
              >
                ${svc.connected ? "Disconnect" : "Connect"}
              </button>
            </div>`
          )}
          <div className="item">
            <div className="thumb"></div>
            <div className="grow meta">
              <div className="t">Saved Tracks</div>
              <div className="s">your library, offline-ready</div>
            </div>
            <button className="pill" onClick=${() => toast("Open saved tracks (prototype)")} type="button">Open</button>
          </div>
        </div>
      </div>

      <div className="section">
        <button className="pill danger" style=${{ width: "100%" }} onClick=${() => toast("Logged out (prototype)")} type="button">Log Out</button>
      </div>
    </div>`;
  }

  function App() {
    const [tab, setTab] = useState("home");
    const [theme, setTheme] = useLocalStorageState(STORAGE.theme, () => (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"));
    const [accent, setAccent] = useLocalStorageState(STORAGE.accent, () => ACCENTS[0].value);
    const { toast, show } = useToast();

    const [segments, setSegments] = useLocalStorageState(STORAGE.builder, () => []);
    const [recentSessions, setRecentSessions] = useLocalStorageState(STORAGE.recent, () => []);

    const [likes, setLikes] = useLocalStorageState(STORAGE.likes, () => []);
    const likeSet = useMemo(() => new Set(Array.isArray(likes) ? likes : []), [likes]);

    const [sessions, setSessions] = useState(SAMPLE_SESSIONS);

    const services = useMemo(
      () => [
        { name: "Spotify", connected: true },
        { name: "Apple Music", connected: false },
        { name: "SoundCloud", connected: false },
      ],
      []
    );

    useEffect(() => {
      document.documentElement.dataset.theme = theme;
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

    const onLoadSession = (s) => {
      const entry = { ...s, loadedAt: Date.now() };
      setRecentSessions((prev) => {
        const next = [entry, ...(Array.isArray(prev) ? prev : [])];
        const dedup = [];
        const seen = new Set();
        for (const item of next) {
          const key = item.id || item.title;
          if (!key || seen.has(key)) continue;
          seen.add(key);
          dedup.push(item);
        }
        return dedup.slice(0, 10);
      });
      show("Session loaded");
      setTab("builder");
    };

    const right = html`<button className="pill icon" onClick=${() => show("Settings (prototype)")} aria-label="Settings" type="button">
      <${Icon} name="spark" />
    </button>`;

    let title = "RADIO·LAB";
    let subtitle = "curate · speak · share";

    if (tab === "home") title = "RADIO·LAB";
    if (tab === "find") title = "Find";
    if (tab === "builder") title = "Builder";
    if (tab === "sessions") title = "Sessions";
    if (tab === "profile") title = "Profile";

    const screen =
      tab === "home"
        ? html`<${HomeScreen}
            recentSessions=${recentSessions}
            services=${services}
            onNewShow=${onNewShow}
            onBrowse=${() => setTab("sessions")}
            onLoadSession=${onLoadSession}
          />`
        : tab === "find"
        ? html`<${FindScreen} tracks=${SAMPLE_TRACKS} onAddTrack=${onAddTrack} />`
        : tab === "builder"
        ? html`<${BuilderScreen} segments=${segments} setSegments=${setSegments} toast=${show} />`
        : tab === "sessions"
        ? html`<${SessionsScreen} sessions=${sessions} likes=${likeSet} toggleLike=${toggleLike} onLoad=${onLoadSession} />`
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
          />`;

    return html`<div className="shell">
      <${TopBar} title=${title} subtitle=${subtitle} right=${right} />
      <div className="content">${screen}</div>
      <${TabBar} value=${tab} onChange=${setTab} />
      <${Toast} toast=${toast} />
    </div>`;
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(html`<${App} />`);
})();
