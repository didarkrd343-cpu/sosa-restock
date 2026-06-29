const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '500kb' }));

// 📋 DEINE EINSTELLUNGEN
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = "1520996484538040342";
const SHOP_URL = "https://sosaservicee.mykomerza.com/";

// 🖼️ DEINE BILDER für das Dashboard
const BANNER_URL = "https://i.imgur.com/fc9b97c2-6ddd-43ff-85f9-0f766674237e.png";
const LOGO_URL = "https://i.imgur.com/21e29bb1-b4af-4812-91cd-30618e45136e.png";

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

// 🚀 DASHBOARD mit deinem Design
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOSA Service | Restock Bot</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
      body {
        background: #0a0a0a;
        color: #fff;
        min-height: 100vh;
        padding: 2rem 1.2rem;
        background-image: radial-gradient(circle at top, rgba(220, 38, 38, 0.15) 0%, transparent 50%);
      }
      .container { max-width: 720px; margin: 0 auto; }

      /* Header mit Banner & Logo */
      .header {
        text-align: center;
        margin-bottom: 2.5rem;
        position: relative;
      }
      .banner {
        width: 100%;
        max-height: 240px;
        object-fit: cover;
        border-radius: 12px;
        border: 2px solid rgba(220, 38, 38, 0.6);
        box-shadow: 0 0 35px rgba(220, 38, 38, 0.4);
      }
      .logo {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid #dc2626;
        box-shadow: 0 0 25px rgba(220, 38, 38, 0.6);
        background: #0a0a0a;
        padding: 5px;
        margin-top: -60px;
        position: relative;
        z-index: 2;
      }
      h1 {
        margin-top: 1rem;
        font-size: 2.2rem;
        color: #dc2626;
        text-shadow: 0 0 15px rgba(220, 38, 38, 0.5);
        letter-spacing: 2px;
      }
      .subhead {
        color: #b0b0b0;
        font-size: 1rem;
        margin-top: 0.3rem;
      }

      /* Formular */
      .form-card {
        background: linear-gradient(145deg, #121212, #1a1a1a);
        border-radius: 16px;
        padding: 2rem;
        border: 1px solid rgba(220, 38, 38, 0.3);
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      }
      .form-group { margin-bottom: 1.4rem; }
      label {
        display: block;
        margin-bottom: 0.6rem;
        color: #f0f0f0;
        font-weight: 500;
      }
      input, textarea {
        width: 100%;
        padding: 1rem;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 1rem;
        transition: 0.2s;
      }
      input:focus, textarea:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
      }
      button {
        width: 100%;
        padding: 1.1rem;
        background: linear-gradient(90deg, #dc2626, #991b1b);
        border: none;
        border-radius: 8px;
        color: #fff;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        transition: 0.2s;
      }
      button:hover {
        background: linear-gradient(90deg, #ef4444, #b91c1c);
        transform: translateY(-1px);
      }
      #status {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 8px;
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
      <!-- Header mit Banner & Logo -->
      <div class="header">
        <img src="${BANNER_URL}" alt="SOSA Service Banner" class="banner">
        <img src="${LOGO_URL}" alt="SOSA Service Logo" class="logo">
        <h1>SOSA SERVICE</h1>
        <p class="subhead">Restock Bot • Steuerung</p>
      </div>

      <!-- Formular -->
      <div class="form-card">
        <div class="form-group">
          <label>📦 Produktname</label>
          <input type="text" id="name" placeholder="z.B. FiveM Ready Account" required>
        </div>
        <div class="form-group">
          <label>📉 Vorheriger Bestand</label>
          <input type="number" id="alt" placeholder="z.B. 0" required>
        </div>
        <div class="form-group">
          <label>📈 Neuer Bestand</label>
          <input type="number" id="neu" placeholder="z.B. 21" required>
        </div>
        <div class="form-group">
          <label>💰 Preis</label>
          <input type="text" id="preis" placeholder="z.B. 0.15">
        </div>
        <div class="form-group">
          <label>🖼️ Bild-Link für Discord</label>
          <input type="url" id="bild" placeholder="https://i.imgur.com/...">
        </div>
        <div class="form-group">
          <label>📝 Beschreibung (leer lassen = keine Zeile)</label>
          <textarea id="beschreibung" rows="2" placeholder="Optional, sonst leer lassen"></textarea>
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

// 🤖 RESTOCK FUNKTION FÜR DISCORD
app.post("/restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");

  try {
    const { name, alt, neu, preis, bild, beschreibung } = req.body;

    if (!name || !alt || !neu) {
      return res.status(400).send("❌ Bitte Name, vorherigen und neuen Bestand ausfüllen!");
    }

    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) {
      return res.status(400).send("❌ Bestand muss eine Zahl sein!");
    }
    if (neuZahl <= altZahl) {
      return res.send("ℹ️ Keine Erhöhung – keine Nachricht gesendet.");
    }

    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Discord-Kanal nicht gefunden!");

    // ✅ Beschreibung NUR anzeigen, wenn etwas eingegeben wurde – sonst leer
    const embed = new EmbedBuilder()
      .setTitle(`${name} Restocked`)
      .setDescription(beschreibung || null) // Leer lassen statt Standardtext
      .setURL(SHOP_URL)
      .setColor(0xdc2626)
      .addFields(
        { name: "Variante", value: name, inline: true },
        { name: "Preis", value: preis || "-", inline: true },
        { name: "Verfügbar", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp();

    if (bild && bild.startsWith("http")) embed.setImage(bild);

    await kanal.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });

    return res.send("✅ Restock erfolgreich gesendet!");
  } catch (err) {
    console.error("Fehler:", err);
    return res.status(500).send("❌ Fehler: " + err.message);
  }
});

// 🚀 Bot starten
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
