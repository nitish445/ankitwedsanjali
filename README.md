# अंकित संग अंजली — शुभ विवाह निमंत्रण

A single-page wedding invitation for Ankit & Anjali (24 November 2026), built from the WhatsApp video invitation.

- `index.html` — the invitation page (no build step; open it directly or host with GitHub Pages)
- `assets/invitation.mp4` — compressed copy of the video invitation (also used as background music)
- `assets/poster.jpg` — video poster / link-preview image
- `assets/ganesh.webp` — Shri Ganesh image (taken from the video)

Features: Ganesh opening screen, marigold toran, falling petals, events with countdown, add-to-calendar and WhatsApp share, and an interactive **Shri Ganesh Aarti** mode (rotating aarti thali, bell, shankh, flower shower, and the lyrics of “Jai Ganesh Deva”).

### Hindi / English
The हिं | EN switch in the top-left corner changes all the text, the aarti lyrics (shown in Roman script) and the downloadable card. The choice is remembered on that phone. To send someone the English version directly, add `?lang=en` to the link.

### दीप जलाएँ (Light a diya)
Guests tap the diya to light it for the yagya. Each lit diya joins the row below with “आपने दीप प्रज्वलित किया 🙏”, and every 11th diya brings a flower shower. The count is kept on each guest's own phone (there is no server, so diyas from different guests are not added together).

### Shehnai welcome
When a guest taps “निमंत्रण खोलें”, a short shehnai tune (about 15 seconds, made in the browser) plays, and then the invitation music starts. The ♪ button stops it.

### Invitation card image
The “📥 निमंत्रण डाउनलोड करें” button draws a 1080×1920 invitation card (Ganesh ji, the couple, all events and the baraat details) and lets guests download it or share it straight to WhatsApp on phones. The card is drawn in the browser, so it only works when the page is opened from its web link (for example GitHub Pages), not as a local file.

### Aarti audio
When the aarti starts, an instrumental *Jai Ganesh Deva* is played. It is generated in the browser (harmonium melody, tanpura drone, dholak, manjira and bells), so there is no audio file to download. The highlighted lyrics follow the music.

To use a real aarti recording instead, add it as `assets/aarti.mp3`. The page picks it up automatically and plays it on loop during the aarti. Use a recording you have the rights to share.

Created by Nitish Kumar || Software Engineer

To publish: Settings → Pages → Deploy from branch → select the branch and `/ (root)`.
