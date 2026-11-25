// Portfolio engine. Your videos and profile live in videos.js.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const st = { tag: null, muted: true, liked: new Set() };


function parse(u) {
  let m = u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (m) return { t: "yt", id: m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (m) return { t: "vm", id: m[1], h: m[2] };
  return null;
}
function src(p, muted) {
  const mu = muted ? 1 : 0;
  if (p.t === "yt") return `https://www.youtube.com/embed/${p.id}?autoplay=1&mute=${mu}&loop=1&playlist=${p.id}&playsinline=1&rel=0&controls=0&modestbranding=1&enablejsapi=1`;
  return `https://player.vimeo.com/video/${p.id}?autoplay=1&muted=${mu}&loop=1&playsinline=1&title=0&byline=0&portrait=0${p.h ? "&h=" + p.h : ""}`;
}
function cmd(frame, p, what, val) {
  if (!frame) return;
  const w = frame.contentWindow;
  if (p.t === "yt") {
    const f = {mute:"mute", unmute:"unMute", pause:"pauseVideo", play:"playVideo"}[what];
    w.postMessage(JSON.stringify({event:"command", func:f, args:[]}), "*");
  } else {
    const o = {mute:{method:"setMuted",value:true}, unmute:{method:"setMuted",value:false}, pause:{method:"pause"}, play:{method:"play"}}[what];
    w.postMessage(JSON.stringify(o), "*");
  }
}

const ICON = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.700 0 5.800 3.800 4.300 7.200C19.500 16.400 12 21 12 21z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M14 4l8 8-8 8v-5c-6 0-9.500 2-12 6 1-7 5-12 12-13V4z"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm13.500 3A4.500 4.500 0 0014 8v8a4.500 4.500 0 002.500-4zM14 3.200v2.100a7 7 0 010 13.400v2.100a9 9 0 000-17.600z"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm16.600 3l2.400-2.400-1.400-1.400-2.400 2.400-2.400-2.400-1.400 1.400 2.400 2.400-2.400 2.400 1.400 1.400 2.400-2.400 2.400 2.400 1.400-1.400-2.400-2.400z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
};

const allTags = () => {
  const c = {};
  VIDEOS.forEach(v => v.tags.forEach(t => c[t] = (c[t] || 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
};

function renderTags() {
  const items = [[null, VIDEOS.length], ...allTags()];
  $("#tags").innerHTML = items.map(([t, n]) =>
    `<button class="tag ${st.tag === t ? "on" : ""}" data-t="${t ?? ""}"><span>${t ? "#" + esc(t) : "All work"}</span><small>${n}</small></button>`).join("");
  $("#top").innerHTML = items.map(([t]) =>
    `<button class="chip ${st.tag === t ? "on" : ""}" data-t="${t ?? ""}">${t ? "#" + esc(t) : "All"}</button>`).join("");
}

function renderFeed() {
  const list = VIDEOS.filter(v => !st.tag || v.tags.includes(st.tag));
  const feed = $("#feed");
  if (!list.length) { feed.innerHTML = '<div class="empty">No videos with that tag yet.</div>'; return; }
  feed.innerHTML = list.map((v, i) => {
    const key = VIDEOS.indexOf(v);
    return `<section class="slide" data-i="${key}">
      <div class="card ${v.orientation === "wide" ? "wide" : ""}">
        <div class="media"><span class="poster">Loading…</span></div>
        <div class="tap"></div>
        <div class="pause">${ICON.play}</div>
        <div class="shade"></div>
        <div class="cap">
          <b>@${esc(PROFILE.handle)}</b>
          <p><strong>${esc(v.title)}</strong>${v.desc ? " – " + esc(v.desc) : ""}</p>
          <div>${v.tags.map(t => `<button class="ht" data-t="${esc(t)}">#${esc(t)}</button>`).join("")}</div>
          <div class="music">♪ Original work – ${esc(PROFILE.name)}</div>
        </div>
        <div class="rail">
          <div class="pfp">${esc(PROFILE.name[0])}</div>
          <button class="rb like ${st.liked.has(key) ? "liked" : ""}"><i>${ICON.heart}</i>Like</button>
          <button class="rb share"><i>${ICON.share}</i>Share</button>
          <button class="rb snd"><i>${st.muted ? ICON.mute : ICON.sound}</i>${st.muted ? "Muted" : "Sound"}</button>
          <div class="disc"></div>
        </div>
      </div></section>`;
  }).join("");
  feed.scrollTop = 0;
  observe();
}

let io, active = null;
function observe() {
  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio > .6) activate(e.target);
    else if (!e.isIntersecting && e.target === active) deactivate(e.target);
  }), { root: $("#feed"), threshold: [0, .6] });
  document.querySelectorAll(".slide").forEach(s => io.observe(s));
}
function activate(s) {
  if (active && active !== s) deactivate(active);
  active = s;
  const v = VIDEOS[+s.dataset.i], p = parse(v.url), m = s.querySelector(".media");
  if (!p) { m.innerHTML = '<span class="poster">Couldn’t read this video link.</span>'; return; }
  if (!m.querySelector("iframe")) {
    m.innerHTML = `<iframe src="${src(p, st.muted)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen style="pointer-events:none"></iframe>`;
  }
  s.classList.remove("paused");
}
function deactivate(s) {
  s.querySelector(".media").innerHTML = '<span class="poster">Loading…</span>';
  if (active === s) active = null;
}
const frameOf = s => s && s.querySelector("iframe");

function filter(t) {
  st.tag = t || null;
  renderTags(); renderFeed();
}

document.addEventListener("click", e => {
  const tg = e.target.closest("[data-t]");
  if (tg) return filter(tg.dataset.t);
  const s = e.target.closest(".slide"); if (!s) return;
  const v = VIDEOS[+s.dataset.i], p = parse(v.url), f = frameOf(s);
  if (e.target.closest(".like")) {
    const k = +s.dataset.i; st.liked.has(k) ? st.liked.delete(k) : st.liked.add(k);
    e.target.closest(".like").classList.toggle("liked");
  } else if (e.target.closest(".share")) {
    const btn = e.target.closest(".share");
    const done = () => { btn.lastChild.textContent = "Copied!"; setTimeout(() => btn.lastChild.textContent = "Share", 1500); };
    try { navigator.clipboard.writeText(v.url).then(done, done); } catch (_) { done(); }
  } else if (e.target.closest(".snd")) {
    st.muted = !st.muted;
    cmd(f, p, st.muted ? "mute" : "unmute");
    document.querySelectorAll(".snd").forEach(b => b.innerHTML = `<i>${st.muted ? ICON.mute : ICON.sound}</i>${st.muted ? "Muted" : "Sound"}`);
  } else if (e.target.closest(".tap")) {
    const paused = s.classList.toggle("paused");
    cmd(f, p, paused ? "pause" : "play");
  }
});

const step = d => $("#feed").scrollBy({ top: d * $("#feed").clientHeight, behavior: "smooth" });
$("#up").onclick = () => step(-1);
$("#dn").onclick = () => step(1);
document.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
  if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
});

document.title = PROFILE.name + " – Video Portfolio";
$("#av").textContent = PROFILE.name[0]; $("#nm").textContent = PROFILE.name;
$("#hd").textContent = "@" + PROFILE.handle; $("#bio").textContent = PROFILE.bio;
renderTags(); renderFeed();
