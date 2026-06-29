const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

// 📌 Diese Werte trägst du später in Railway ein!
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const KOMERZA_API_KEY = process.env.KOMERZA_API_KEY;
const KOMERZA_STORE_URL = process.env.KOMERZA_STORE_URL;

// Prüfung ob alle Einstellungen vorhanden sind
if (!BOT_TOKEN || !CHANNEL_ID || !KOMERZA_API_KEY || !KOMERZA_STORE_URL) {
  console.error("❌ FEHLER: Nicht alle benötigten Umgebungsvariablen sind gesetzt!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let letzteBestaende = new Map(); // Speichert den letzten bekannten Bestand

// Antwort im Browser zur Kontrolle
app.get("/komerza", (req, res) => {
  res.send("✅ System läuft! Prüft automatisch alle 10 Minuten den Bestand.");
});

// Testfunktion bleibt erhalten
app.get("/test-restock", async (req, res) => {
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) throw new Error("Discord-Kanal nicht gefunden!");

    const embed = new EmbedBuilder()
      .setTitle("📦 TEST: Bestand erhöht")
      .setDescription("Vorher: **5** → Jetzt: **20**")
      .setColor(0x22c55e)
      .setTimestamp();

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test-Nachricht wurde an Discord gesendet!");
  } catch (err) {
    res.send(`❌ Fehler: ${err.message}`);
  }
});

// 🚀 Automatische Prüfung des Lagerbestands
async function pruefeBestaende() {
  try {
    console.log("🔍 Prüfe aktuellen Lagerbestand...");

    const antwort = await axios.get(`${KOMERZA_STORE_URL}/api/v1/products`, {
      headers: {
        Authorization: `Bearer ${KOMERZA_API_KEY}`,
        Accept: "application/json"
      },
      timeout: 10000
    });

    const produkte = antwort.data.data || [];

    for (const produkt of produkte) {
      const produktId = produkt.id;
      const alt = letzteBestaende.get(produktId) ?? 0;
      const neu = Number(produkt.inventory_quantity ?? 0);

      // Nur melden, wenn Bestand gestiegen ist
      if (neu > alt && alt !== 0) {
        console.log(`📈 Restock erkannt: ${produkt.name} | ${alt} → ${neu}`);

        const kanal = client.channels.cache.get(CHANNEL_ID);
        if (!kanal) continue;

        const embed = new EmbedBuilder()
          .setTitle(`${produkt.name} ✅ Bestand aufgefüllt`)
          .setDescription(`Vorher: **${alt}** Stück → Jetzt: **${neu}** Stück`)
          .addFields(
            { name: "Preis", value: produkt.price ? `${produkt.price} €` : "-", inline: true },
            { name: "Neuer Bestand", value: `${neu}`, inline: true }
          )
          .setColor(0x22c55e)
          .setTimestamp();

        if (produkt.image_url) embed.setImage(produkt.image_url);
        if (produkt.url) embed.setURL(produkt.url);

        await kanal.send({ content: "@restock", embeds: [embed] });
      }

      // Neuen Stand merken
      letzteBestaende.set(produktId, neu);
    }

    console.log("✅ Prüfung abgeschlossen");
  } catch (err) {
    console.error("❌ Fehler bei der Bestandsprüfung:", err.message);
  }
}

// Bot starten
client.on("ready", () => {
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Dienst läuft auf Port ${PORT}`);
  });

  // Erste Prüfung sofort durchführen, dann alle 10 Minuten wiederholen
  pruefeBestaende();
  setInterval(pruefeBestaende, 10 * 60 * 1000);
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Discord-Anmeldung fehlgeschlagen:", err.message);
  process.exit(1);
});
