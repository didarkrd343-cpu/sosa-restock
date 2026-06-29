const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '500kb' }));

// Deine Einstellungen
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = "1520996484538040342"; // Deine Restock-Rolle

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

// 📊 DASHBOARD Oberfläche
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOSA Restock Dashboard</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
      body { background: #121212; color: #fff; padding: 2rem; max-width: 700px; margin: 0 auto; }
      h1 { text-align: center; color: #dc2626; margin-bottom: 2rem; }
      .form-box { background: #1e1e1e; padding: 2rem; border-radius: 10px; border-left: 5px solid #dc2626; }
      .form-group { margin-bottom: 1.2rem; }
      label { display: block; margin-bottom: 0.5rem; color: #ddd; }
      input, textarea { width: 100%; padding: 0.8rem; background: #2a2a2a; border: 1px solid #333; border-radius: 5px; color: #fff; font-size: 1rem; }
      input:focus, textarea:focus { outline: none; border-color: #dc2626; }
      button { width: 100%; padding: 1rem; background: #dc2626; border: none; border-radius: 5px; color: #fff; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.2s; }
      button:hover { background: #b91c1c; }
      #status { margin-top: 1.5rem; padding: 1rem; border-radius: 5px; text-align: center; display: none; }
      .erfolg { background: #164e2c; border: 1px solid #22c55e; }
      .fehler { background: #4c1616; border: 1px solid #ef4444; }
    </style>
  </head>
  <body>
    <h1>📦 SOSA Restock Dashboard</h1>
    <div class="form-box">
      <div class="form-group">
        <label>Produktname:</label>
        <input type="text" id="name" placeholder="z.B. GTA V Account" required>
      </div>
      <div class="form-group">
        <label>Vorheriger Bestand:</label>
        <input type="number" id="alt" placeholder="z.B. 0" required>
      </div>
      <div class="form-group">
        <label>Neuer Bestand:</label>
        <input type="number" id="neu" placeholder="z.B. 15" required>
      </div>
      <div class="form-group">
        <label>Preis:</label>
        <input type="text" id="preis" placeholder="z.B. 8.99">
      </div>
      <div class="form-group">
        <label>Bild-Link:</label>
        <input type="url" id="bild" placeholder="https://i.imgur.com/...">
      </div>
      <div class="form-group">
        <label>Beschreibung:</label>
        <textarea id="beschreibung" rows="2" placeholder="z.B. GTA Accounts wieder verfügbar!"></textarea>
      </div>
      <button onclick="senden()">Restock senden</button>
      <div id="status"></div>
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

// Restock verarbeiten
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

    const embed = new EmbedBuilder()
      .setTitle(`${name} ✅ Restocked`)
      .setDescription(beschreibung || `Unser Produkt **${name}** ist wieder auf Lager!`)
      .setColor(0xdc2626) // ROTE LEISTE
      .addFields(
        { name: "Variante", value: name, inline: true },
        { name: "Preis", value: preis || "-", inline: true },
        { name: "Verfügbar", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp();

    if (bild && bild.startsWith("http")) embed.setImage(bild);

    // ✅ Ping an deine Rolle
    await kanal.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });

    return res.send("✅ Restock erfolgreich an Discord gesendet!");
  } catch (err) {
    console.error("Fehler:", err);
    return res.status(500).send("❌ Fehler: " + err.message);
  }
});

// Bot starten
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
