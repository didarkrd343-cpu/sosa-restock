const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '500kb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let istBereit = false;

app.get("/", (req, res) => {
  res.send(istBereit ? "✅ Bot läuft & bereit!" : "⏳ Bot startet noch...");
});

app.get("/test-restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit – bitte kurz warten");
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Discord-Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("Spotify Lifetime Key ✅ Restocked")
      .setDescription("Our product **Spotify Lifetime Key** has just been restocked!")
      .setColor(0x1DB954)
      .addFields(
        { name: "Variant", value: "Spotify Lifetime Key", inline: true },
        { name: "Price", value: "$4.50", inline: true },
        { name: "Stock", value: "509", inline: true }
      )
      .setImage("https://i.imgur.com/3JZ7k8L.png") // Beispielbild Spotify
      .setTimestamp();

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test mit Bild & Details gesendet!");
  } catch (err) {
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

// Restock mit allen Optionen
app.get("/restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");
  try {
    const { name, alt, neu, preis, link, bild, beschreibung } = req.query;

    if (!name || !alt || !neu) {
      return res.send(`
        ❌ Aufbau:<br>
        <code>/restock?name=Name&alt=Vorher&neu=Jetzt&preis=4.50&link=https://deinlink.com&bild=https://dein-bild.de/foto.jpg&beschreibung=Text</code>
      `);
    }

    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) return res.send("❌ Bestand muss eine Zahl sein");
    if (neuZahl <= altZahl) return res.send("ℹ️ Keine Erhöhung – keine Nachricht gesendet");

    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.send("❌ Discord-Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle(`${name} ✅ Restocked`)
      .setDescription(beschreibung || `Our product **${name}** has just been restocked!`)
      .setColor(0x22c55e)
      .addFields(
        { name: "Variant", value: name, inline: true },
        { name: "Price", value: preis ? `$${preis}` : "-", inline: true },
        { name: "Stock", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp();

    if (link) embed.setURL(link);
    if (bild) embed.setImage(bild);

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send(`✅ Nachricht mit Bild & Details gesendet!`);
  } catch (err) {
    console.error("❌ Fehler:", err.message);
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

client.on("clientReady", () => {
  istBereit = true;
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Dienst läuft auf Port ${PORT}`));
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Login fehlgeschlagen:", err.message);
  process.exit(1);
});
