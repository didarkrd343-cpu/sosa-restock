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
// 🔐 Passwort für Dashboard
const ADMIN_PASSWORT = "SOSA2026";

// 🖼️ DEINE BILDER
const BANNER_URL = "https://i.imgur.com/LUUFW8O.png";
const LOGO_URL = "https://i.imgur.com/7Yd5Q8R.png";

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

// 🔐 Zugriffsschutz
function nurAdmin(req, res, next) {
  const pass = req.headers['x-passwort'] || req.query.pass;
  if (pass === ADMIN_PASSWORT) return next();
  return res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Zugriff verweigert</title>
      <style>
        body{background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;text-align:center;}
        .box{background:#121212;padding:2rem;border-radius:12px;border:1px solid #dc2626;box-shadow:0 0 30px rgba(220,38,38,0.3);}
        input{padding:0.8rem;width:220px;margin:1rem 0;background:#1e1e1e;border:1px solid #333;color:#fff;border-radius:6px;}
        button{padding:0.8rem 1.5rem;background:#dc2626;border:none;color:#fff;border-radius:6px;cursor:pointer;}
      </style>
    </head>
    <body>
      <div class="box">
        <h2>🔒 Geschützter Bereich</h2>
        <p>Bitte Passwort eingeben:</p>
        <input type="password" id="pw" placeholder="Passwort">
        <br>
        <button onclick="location.href='/?pass='+document.getElementById('pw').value">Anmelden</button>
      </div>
    </body>
    </html>
  `);
}

// 🚀 DASHBOARD
app.get("/", nurAdmin, (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOSA Service | Restock Bot</title>
    <style>
      * {margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif;}
      body {background:#050505;color:#f8f8f8;min-height:100vh;padding:2rem 1.2rem;background-image:radial-gradient(circle at top left,rgba(220,38,38,0.2) 0%,transparent 45%),radial-gradient(circle at bottom right,rgba(220,38,38,0.15) 0%,transparent 50%);}
      .container {max-width:760px;margin:0 auto;}
      .header {text-align:center;margin-bottom:3rem;position:relative;padding:2rem 1rem;border-radius:14px;border:2px solid rgba(220,38,38,0.55);box-shadow:0 0 40px rgba(220,38,38,0.45);background:url("${BANNER_URL}") center / cover no-repeat;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:2rem;}
      .logo {width:130px;height:130px;border-radius:50%;border:4px solid #dc2626;box-shadow:0 0 35px rgba(220,38,38,0.6);background:#050505;padding:6px;margin-top:-65px;position:relative;z-index:2;}
      h1 {margin-top:1.2rem;font-size:2.4rem;font-weight:800;color:#dc2626;text-shadow:0 0 20px rgba(220,38,38,0.8),0 0 40px rgba(0,0,0,0.9);letter-spacing:2.5px;position:relative;z-index:2;}
      .subhead {color:#e0e0e0;font-size:1.05rem;margin-top:0.5rem;text-shadow:0 0 15px rgba(0,0,0,0.9);position:relative;z-index:2;}
      .form-card {background:linear-gradient(145deg,#0e0e0e,#161616);border-radius:18px;padding:2.4rem;border:1px solid rgba(220,38,38,0.3);box-shadow:0 10px 40px rgba(0,0,0,0.7),inset 0 0 0 1px rgba(255,255,255,0.04);}
      .form-group {margin-bottom:1.6rem;}
      label {display:block;margin-bottom:0.7rem;color:#f1f1f1;font-weight:500;font-size:1rem;}
      input, textarea {width:100%;padding:1.1rem 1.3rem;background:#1a1a1a;border:1px solid #303030;border-radius:10px;color:#ffffff;font-size:1rem;transition:all 0.25s ease;}
      input:focus, textarea:focus {outline:none;border-color:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,0.22);background:#202020;}
      textarea {resize:vertical;min-height:100px;}
      button {width:100%;padding:1.2rem;background:linear-gradient(90deg,#dc2626,#991b1b);border:none;border-radius:10px;color:#ffffff;font-size:1.2rem;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1.2px;box-shadow:0 5px 18px rgba(220,38,38,0.35);transition:all 0.2s ease;}
      button:hover {background:linear-gradient(90deg,#ef4444,#b91c1c);box-shadow:0 7px 24px rgba(220,38,38,0.5);transform:translateY(-1px);}
      #status {margin-top:2rem;padding:1.3rem;border-radius:10px;text-align:center;font-weight:500;display:none;}
      .erfolg {background:rgba(34,197,94,0.1);border:1px solid #22c55e;color:#86efac;}
      .fehler {background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#fca5a5;}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${LOGO_URL}" alt="SOSA Service Logo" class="logo">
        <h1>SOSA SERVICE</h1>
        <p class="subhead">Restock Bot • Steuerung & Verwaltung</p>
      </div>
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
          <label>💰 Preis (nur Zahl)</label>
          <input type="text" id="preis" placeholder="z.B. 0.15">
        </div>
        <div class="form-group">
          <label>🖼️ Bild-Link für Discord</label>
          <input type="url" id="bild" placeholder="https://i.imgur.com/...">
        </div>
        <div class="form-group">
          <label>📝 Beschreibung</label>
          <textarea id="beschreibung" placeholder="z.B. Unser Produkt ist wieder auf Lager!"></textarea>
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
            headers: { 
              'Content-Type': 'application/json', 
              'X-Passwort': new URLSearchParams(window.location.search).get('pass') || '' 
            },
            body: JSON.stringify(daten)
          });
          const ergebnis = await antwort.text();
          status.textContent = ergebnis;
          status.className = antwort.ok ? 'erfolg' : 'fehler';
        } catch (err) {
          status.textContent = '❌ Fehler beim Verbinden mit dem Bot!';
          status.className = 'fehler';
        }
        status.style.display = 'block';
      }
    </script>
  </body>
  </html>
  `);
});

// 🤖 RESTOCK NACHRICHT – GENAU WIE ZUVOR
app.post("/restock", nurAdmin, async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot ist noch nicht bereit – bitte warten");

  try {
    const { name, alt, neu, preis, bild, beschreibung } = req.body;

    if (!name || !alt || !neu) {
      return res.status(400).send("❌ Bitte Produktname, alten und neuen Bestand ausfüllen!");
    }

    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) {
      return res.status(400).send("❌ Bestand muss eine gültige Zahl sein!");
    }
    if (neuZahl <= altZahl) {
      return res.send("ℹ️ Keine Erhöhung des Bestands – keine Nachricht gesendet.");
    }

    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Discord-Kanal nicht gefunden!");

    // ✅ Preis mit €-Zeichen, genau wie im oberen Bild
    const preisMitEuro = preis ? `${preis} €` : "-";

    const embed = new EmbedBuilder()
      .setTitle(`${name} Restocked`)
      .setDescription(beschreibung || `Unser Produkt **${name}** ist wieder auf Lager!`)
      .setURL(SHOP_URL)
      .setColor(0xdc2626) // Rote Leiste
      .addFields(
        { name: "Variante", value: name, inline: true },
        { name: "Preis", value: preisMitEuro, inline: true },
        { name: "Verfügbar", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "SOSA Service • Restock Bot", iconURL: LOGO_URL });

    // Bild nur hinzufügen, wenn du eins angibst
    if (bild && bild.startsWith("http")) embed.setImage(bild);

    await kanal.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });

    return res.send("✅ Erfolgreich! Restock wurde an Discord gesendet.");
  } catch (err) {
    console.error("Fehler bei Restock:", err);
    return res.status(500).send("❌ Fehler: " + err.message);
  }
});

// 🚀 Bot starten
client.on("ready", () => {
  istBereit = true;
  console.log(`✅ Bot eingeloggt als: ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🌐 Dashboard läuft: https://sosa-restock-production.up.railway.app`));
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Login fehlgeschlagen:", err.message);
  process.exit(1);
});
