const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '500kb' }));

// Deine festen Einstellungen
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = "1520996484538040342";
const SHOP_URL = "https://sosaservicee.mykomerza.com/";

// 🖼️ 👉 HIER DEINE NEUEN, DIREKTEN IMGUR-LINKS EINTRAGEN
const BANNER_URL = "https://i.imgur.com/DEIN_BANNER_CODE.png"; // z.B. https://i.imgur.com/abc123.png
const LOGO_URL = "https://i.imgur.com/DEIN_LOGO_CODE.png";     // z.B. https://i.imgur.com/def456.png

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

// 📊 Dashboard
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOSA Service | Restock Bot</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, Arial, sans-serif; }
      body {
        background: #0a0a0a;
        color: #f8f8f8;
        min-height: 100vh;
        padding: 2rem 1.2rem;
        background-image: radial-gradient(circle at top, rgba(220, 38, 38, 0.18) 0%, transparent 55%);
      }
      .container { max-width: 720px; margin: 0 auto; }
      .header {
        text-align: center;
        margin-bottom: 3rem;
        position: relative;
      }
      .banner {
        width: 100%;
        max-height: 240px;
        object-fit: cover;
        border-radius: 14px;
        border: 2px solid rgba(220, 38, 38, 0.6);
        box-shadow: 0 0 40px rgba(220, 38, 38, 0.45);
      }
      .logo {
        width: 130px;
        height: 130px;
        border-radius: 50%;
        border: 4px solid #dc2626;
        box-shadow: 0 0 35px rgba(220, 38, 38, 0.6);
        background: #0a0a0a;
        padding: 6px;
        margin-top: -65px;
        position: relative;
        z-index: 2;
      }
      h1 {
        margin-top: 1.2rem;
        font-size: 2.3rem;
        font-weight: 800;
        color: #dc2626;
        text-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
        letter-spacing: 2.5px;
      }
      .subhead {
        color: #b0b0b0;
        font-size: 1rem;
        margin-top: 0.4rem;
      }
      .form-box {
        background: linear-gradient(145deg, #121212, #1a1a1a);
        border-radius: 18px;
        padding: 2.2rem;
        border: 1px solid rgba(220, 38, 38, 0.35);
        box-shadow: 0 10px 35px rgba(0,0,0,0.7);
      }
      .form-group { margin-bottom: 1.5rem; }
      label {
        display: block;
        margin-bottom: 0.6rem;
        color: #f1f1f1;
        font-weight: 500;
        font-size: 1rem;
      }
      input, textarea {
        width: 100%;
        padding: 1rem 1.2rem;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 10px;
        color: #ffffff;
        font-size: 1rem;
        transition: all 0.25s ease;
      }
      input:focus, textarea:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
        background: #242424;
      }
      textarea { resize: vertical; min-height: 90px; }
      button {
        width: 100%;
        padding: 1.1rem;
        background: linear-gradient(90deg, #dc2626, #991b1b);
        border: none;
        border-radius: 10px;
        color: #ffffff;
        font-size: 1.15rem;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 5px 18px rgba(220, 38, 38, 0.35);
        transition: all 0.2s ease;
      }
      button:hover {
        background: linear-gradient(90deg, #ef4444, #b91c1c);
        box-shadow: 0 7px 22px rgba(220, 38, 38, 0.5);
        transform: translateY(-1px);
      }
      #status {
        margin-top: 1.8rem;
        padding: 1.2rem;
        border-radius: 10px;
        text-align: center;
        font-weight: 500;
        display: none;
      }
      .erfolg { background: rgba(34, 197, 94, 0.12); border: 1px solid #22c55e; color: #86efac; }
      .fehler { background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; color: #fca5a5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${BANNER_URL}" alt="SOSA Service Banner" class="banner">
        <img src="${LOGO_URL}" alt="SOSA Service Logo" class="logo">
        <h1>SOSA SERVICE</h1>
        <p class="subhead">Restock Bot • Steuerung & Verwaltung</p>
      </div>
      <div class="form-box">
        <div class="form-group">
          <label>📦 Produktname:</label>
          <input type="text" id="name" placeholder="z.B. Minecraft Accounts" required>
        </div>
        <div class="form-group">
          <label>📉 Vorheriger Bestand:</label>
          <input type="number" id="alt" placeholder="z.B. 0" required>
        </div>
        <div class="form-group">
          <label>📈 Neuer Bestand:</label>
          <input type="number" id="neu" placeholder="z.B. 20" required>
        </div>
        <div class="form-group">
          <label>💰 Preis:</label>
          <input type="text" id="preis" placeholder="z.B. 4.99">
        </div>
        <div class="form-group">
          <label>🖼️ Bild-Link:</label>
          <input type="url" id="bild" placeholder="https://i.imgur.com/...">
        </div>
        <div class="form-group">
          <label>📝 Beschreibung:</label>
          <textarea id="beschreibung" rows="2" placeholder="z.B. Minecraft Accounts wieder auf Lager!"></textarea>
        </div>
        <button onclick="senden()">Restock senden</button>
        <div id="status"></div>
      </div>
    </div>
    <script>
      async function senden() {
        const daten = {
          name: document.getElementById('name').value.trim(),
          alt: document.getElementById('alt').value,
          neu: document.getElementById('neu').value,
          preis: document.getElementById('preis').value.trim(),
          bild: document.getElementById('bild').value.trim(),
          beschreibung: document.getElementById('beschreibung').value.trim()
        };
        const status = document.getElementById('status');
        status.style.display = 'none';
        try {
          const antwort = await fetch('/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(daten)
          });
          const ergebnis = await antwort.text();
          status.textContent = ergebnis;
          status.className = antwort.ok ? 'erfolg' : 'fehler';
        } catch (err) {
          status.textContent = '❌ Fehler beim Senden!';
          status.className = 'fehler';
        }
        status.style.display = 'block';
      }
    </script>
  </body>
  </html>
  `);
});

// Restock Funktion (unverändert)
app.post("/restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");
  try {
    const { name, alt, neu, preis, bild, beschreibung } = req.body;
    if (!name || !alt || !neu) return res.status(400).send("❌ Bitte Name, vorherigen und neuen Bestand ausfüllen!");
    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) return res.status(400).send("❌ Bestand muss eine Zahl sein!");
    if (neuZahl <= altZahl) return res.send("ℹ️ Keine Erhöhung – keine Nachricht gesendet.");
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Discord-Kanal nicht gefunden!");
    const embed = new EmbedBuilder()
      .setTitle(`${name} Restocked`)
      .setDescription(beschreibung || `Unser Produkt **${name}** ist wieder auf Lager!`)
      .setURL(SHOP_URL)
      .setColor(0xdc2626)
      .addFields(
        { name: "Variante", value: name, inline: true },
        { name: "Preis", value: preis || "-", inline: true },
        { name: "Verfügbar", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp();
    if (bild && bild.startsWith("http")) embed.setImage(bild);
    await kanal.send({ content: `<@&${ROLE_ID}>`, embeds: [embed] });
    return res.send("✅ Restock erfolgreich gesendet!");
  } catch (err) {
    console.error("Fehler:", err);
    return res.status(500).send("❌ Fehler: " + err.message);
  }
});

client.on("ready", () => {
  istBereit = true;
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Dashboard läuft auf Port ${PORT}`));
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Login fehlgeschlagen:", err.message);
  process.exit(1);
});
