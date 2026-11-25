VIDEO PORTFOLIO (TikTok style)

FILES
  index.html   page structure
  style.css    look and feel
  app.js       behaviour
  videos.js    YOUR CONTENT: edit this one

EDITING videos.js
  PROFILE: your name, handle and bio.
  VIDEOS: one entry per video:
    {
      url: "https://vimeo.com/123456789",   (YouTube watch / youtu.be / shorts, or Vimeo)
      title: "Brand film",
      desc: "Edit + grade",
      tags: ["corporate", "edit"],           (no # needed; these build the left menu)
      orientation: "wide"                    ("wide" = 16:9, "vertical" = 9:16)
    },
  Keep the commas between entries.

VIEWING IT
  Double-click index.html to open it in your browser.
  To share it, upload the folder to a free host (Netlify Drop, GitHub Pages,
  Cloudflare Pages) and send the link.

NOTES
  Your Vimeo videos need embedding allowed. Unlisted ones need the full link with the hash.
  Some browsers limit video embeds on pages opened from a local file. If videos
  don't play when double-clicked, use a host (above) or run:  python3 -m http.server
