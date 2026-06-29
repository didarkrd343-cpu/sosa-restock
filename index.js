const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Umgebungsvariablen in Railway setzen:
// BOT_TOKEN, CHANNEL_ID, KOMERZA_API_KEY, KOMERZA_STORE_URL
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const KOMERZA_API_KEY = process.env.KOMERZA_API_KEY;
const KOMERZA_STORE_URL = process.env.KOMERZA_STORE_URL;

if (!BOT_TOKEN || !CHANNEL_ID || !KOMERZA_API_KEY || !KOMERZA_STORE_URL) {
  console.error("❌ Fehlende Umgebungsvariablen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let letzteBestände = new Map(); // Speichert den letzten bekannten Bestand

// Webhook & Test-Endpunkt (bleibt erhalten)
app.get("/komerza", (req, res) => res.send("✅ Webhook aktiv"));
app.get("/test-restock", async (req, res) => {
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setTitle("📦 Test: Bestand erhöht")
      .setDescription("Vorher: 5 → Jetzt: 20")
      .setColor(0x22c55e).setTimestamp();
    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test gesendet");
  } catch (err) { res.send("❌ Fehler: " + err.message); }
});

// 🟢 Automatische Abfrage aller 10 Minuten
async function pruefeBestaende() {
  try {
    const res = await axios.get(`${KOMERZA_STORE_URL}/api/v1/products`, {
      headers: { Authorization: `Bearer ${KOMERZA_API_KEY}` }
    });
    const produkte = res.data.data || [];

    for (const p of produkte) {
      const alt = letzteBestände.get(p.id) ?? 0;
      const neu = Number(p.inventory_quantity ?? 0);

      // Nur melden, wenn Bestand gestiegen ist
      if (neu > alt && alt !== 0) {
        const kanal = client.channels.cache.get(CHANNEL_ID);
        const embed = new EmbedBuilder()
          .setTitle(`${p.name} | Bestand aufgefüllt ✅`)
          .setDescription(`Vorher: **${alt}** → Jetzt: **${neu}**`)
          .setColor(0x22c55e).setTimestamp();
        await kanal.send({ embeds: [embed] });
        console.log(`📢 Restock erkannt: ${p.name} ${alt} → ${neu}`);
      }
      letzteBestände.set(p.id, neu);
    }
  } catch (err) {
    console.error("❌ Abfrage fehlgeschlagen:", err.message);
  }
}

// Bot starten
client.on("ready", () => {
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Läuft auf Port ${PORT}`));

  // Erste Prüfung sofort, dann alle 10 Minuten
  pruefeBestaende();
  setInterval(pruefeBestaende, 10 * 60 * 1000);
});

client.login(BOT_TOKEN);
