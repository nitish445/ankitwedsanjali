# अंकित संग अंजली — शुभ विवाह निमंत्रण

A single-page wedding invitation for Ankit & Anjali (24 November 2026), built from the WhatsApp video invitation.

- `index.html` — the invitation page (no build step; open it directly or host with GitHub Pages)
- `assets/invitation.mp4` — compressed copy of the video invitation (also used as background music)
- `assets/poster.jpg` — video poster / link-preview image
- `assets/ganesh.webp` — Shri Ganesh image (taken from the video)

Features: Ganesh opening screen, marigold toran, falling petals, events with countdown, add-to-calendar and WhatsApp share, and an interactive **Shri Ganesh Aarti** mode (rotating aarti thali, bell, shankh, flower shower, and the lyrics of “Jai Ganesh Deva”).

### Aarti audio
When the aarti starts, an instrumental *Jai Ganesh Deva* is played. It is generated in the browser (harmonium melody, tanpura drone, dholak, manjira and bells), so there is no audio file to download. The highlighted lyrics follow the music.

To use a real aarti recording instead, add it as `assets/aarti.mp3`. The page picks it up automatically and plays it on loop during the aarti. Use a recording you have the rights to share.

Created by Nitish Kumar || Software Engineer

To publish: Settings → Pages → Deploy from branch → select the branch and `/ (root)`.
