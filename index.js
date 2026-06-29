const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const KOMERZA_API_KEY = process.env.KOMERZA_API_KEY;
const KOMERZA_STORE_URL = process.env.KOMERZA_STORE_URL;

if (!BOT_TOKEN || !CHANNEL_ID || !KOMERZA_API_KEY || !KOMERZA_STORE_URL) {
  console.error("❌ FEHLER: Nicht alle Variablen gesetzt!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let letzteBestaende = new Map();

app.get("/komerza", (req, res) => {
  res.send("✅ System läuft! Prüft alle 10 Minuten den Bestand.");
});

app.get("/test-restock", async (req, res) => {
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) throw new Error("Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("📦 TEST: Bestand erhöht")
      .setDescription("Vorher: **5** → Jetzt: **20**")
      .setColor(0x22c55e)
      .setTimestamp();

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test erfolgreich!");
  } catch (err) {
    res.send(`❌ Fehler: ${err.message}`);
  }
});

// ✅ Korrekte Abfrage für mykomerza (behebt 403)
async function pruefeBestaende() {
  try {
    console.log("🔍 Prüfe Lagerbestand...");

    const antwort = await axios.get(`${KOMERZA_STORE_URL}/api/v1/products`, {
      headers: {
        "Authorization": `Bearer ${KOMERZA_API_KEY}`, // 👈 Standard für mykomerza
        "Accept": "application/json"
      },
      timeout: 12000
    });

    const produkte = Array.isArray(antwort.data) ? antwort.data : antwort.data.data || [];

    for (const produkt of produkte) {
      const id = produkt.id;
      const alt = letzteBestaende.get(id) ?? 0;
      const neu = Number(produkt.inventory_quantity ?? produkt.quantity ?? 0);

      if (neu > alt && alt !== 0) {
        console.log(`📈 Restock: ${produkt.name} | ${alt} → ${neu}`);
        const kanal = client.channels.cache.get(CHANNEL_ID);
        if (!kanal) continue;

        const embed = new EmbedBuilder()
          .setTitle(`${produkt.name || "Produkt"} ✅ Aufgefüllt`)
          .setDescription(`Vorher: **${alt}** → Jetzt: **${neu}**`)
          .addFields(
            { name: "Preis", value: produkt.price ? `${produkt.price} €` : "-", inline: true },
            { name: "Neuer Bestand", value: `${neu}`, inline: true }
          )
          .setColor(0x22c55e)
          .setTimestamp();

        if (produkt.image_url) embed.setImage(produkt.image_url);
        if (produkt.url) embed.setURL(produkt.url);

        await kanal.send({ embeds: [embed] });
      }

      letzteBestaende.set(id, neu);
    }

    console.log("✅ Prüfung abgeschlossen");
  } catch (err) {
    if (err.response?.status === 403) {
      console.log("⚠️ 403: Versuche alternative Authentifizierung...");
      try {
        const antwort2 = await axios.get(`${KOMERZA_STORE_URL}/api/v1/products`, {
          headers: {
            "X-API-KEY": KOMERZA_API_KEY, // 👈 zweite Variante
            "Accept": "application/json"
          },
          timeout: 12000
        });
        const produkte = Array.isArray(antwort2.data) ? antwort2.data : antwort2.data.data || [];
        console.log(`✅ Erfolg! ${produkte.length} Produkte geladen`);
      } catch (err2) {
        console.error("❌ Endgültig fehlgeschlagen:", err2.response?.status || err2.message);
      }
    } else {
      console.error("❌ Fehler:", err.response?.status || "unbekannt", err.message);
    }
  }
}

// ✅ Korrigiert die Warnung: nutze "clientReady" statt "ready"
client.on("clientReady", () => {
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Läuft auf Port ${PORT}`));

  pruefeBestaende();
  setInterval(pruefeBestaende, 10 * 60 * 1000);
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Bot Login fehlgeschlagen:", err.message);
  process.exit(1);
});
