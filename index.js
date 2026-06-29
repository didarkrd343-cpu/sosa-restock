const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '500kb' }));

// 📌 Nur diese beiden Variablen werden gebraucht
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

// Status-Seite
app.get("/", (req, res) => {
  res.send(istBereit ? "✅ Bot läuft & bereit!" : "⏳ Bot startet noch...");
});

// Test-Befehl
app.get("/test-restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit – bitte kurz warten");
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Discord-Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("📦 TEST: Bestand aufgefüllt")
      .setDescription("Vorher: **5** → Jetzt: **20**")
      .setColor(0x22c55e)
      .setTimestamp();

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test-Nachricht gesendet! Schau in Discord.");
  } catch (err) {
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

// Restock-Auslöser
app.get("/restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");
  try {
    const { name, alt, neu, preis, link } = req.query;
    if (!name || !alt || !neu) {
      return res.send(`
        ❌ Fehlende Angaben!<br>
        Nutze so:<br>
        <code>/restock?name=Produkt&alt=3&neu=25&preis=14.99&link=https://deinlink.com</code>
      `);
    }

    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) return res.send("❌ Bestand muss eine Zahl sein");
    if (neuZahl <= altZahl) return res.send("ℹ️ Keine Erhöhung – keine Nachricht gesendet");

    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.send("❌ Discord-Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle(`${name} ✅ Bestand aufgefüllt`)
      .setDescription(`Vorher: **${altZahl}** Stück → Jetzt: **${neuZahl}** Stück`)
      .setColor(0x22c55e)
      .setTimestamp();

    if (preis) embed.addFields({ name: "Preis", value: `${preis}`, inline: true });
    embed.addFields({ name: "Neuer Bestand", value: `${neuZahl}`, inline: true });
    if (link) embed.setURL(link);

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send(`✅ Nachricht gesendet für: ${name}`);
  } catch (err) {
    console.error("❌ Restock-Fehler:", err.message);
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

// Bot starten
client.on("clientReady", () => {
  istBereit = true;
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Dienst läuft auf Port ${PORT}`));
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Discord Login fehlgeschlagen:", err.message);
  process.exit(1);
});
