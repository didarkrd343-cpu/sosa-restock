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
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.status(404).send("❌ Kanal nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("Test Produkt ✅ Restocked")
      .setDescription("Testmeldung")
      .setColor(0xdc2626)
      .addFields(
        { name: "Variante", value: "Test", inline: true },
        { name: "Preis", value: "5.99", inline: true },
        { name: "Verfügbar", value: "20", inline: true }
      )
      .setTimestamp();

    await kanal.send({ content: "<@&DEINE_ROLLEN_ID>", embeds: [embed] });
    res.send("✅ Test gesendet");
  } catch (err) {
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

app.get("/restock", async (req, res) => {
  if (!istBereit) return res.status(503).send("⏳ Bot noch nicht bereit");
  try {
    const { name, alt, neu, preis, bild, beschreibung } = req.query;

    if (!name || !alt || !neu) {
      return res.send(`
        ❌ Aufbau:<br>
        <code>/restock?name=Name&alt=Vorher&neu=Jetzt&preis=8.99&bild=Bild-Link&beschreibung=Text</code>
      `);
    }

    const altZahl = Number(alt);
    const neuZahl = Number(neu);
    if (isNaN(altZahl) || isNaN(neuZahl)) return res.send("❌ Bestand muss eine Zahl sein!");
    if (neuZahl <= altZahl) return res.send("ℹ️ Keine Erhöhung – keine Nachricht.");

    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) return res.send("❌ Kanal nicht gefunden!");

    const embed = new EmbedBuilder()
      .setTitle(`${name} ✅ Restocked`)
      .setDescription(beschreibung || `Unser Produkt **${name}** ist wieder auf Lager!`)
      .setColor(0xdc2626) // ROTE LEISTE
      .addFields(
        { name: "Variante", value: name, inline: true },
        { name: "Preis", value: preis ? `${preis}` : "-", inline: true },
        { name: "Verfügbar", value: `${neuZahl}`, inline: true }
      )
      .setTimestamp();

    if (bild && bild.startsWith("http")) embed.setImage(bild);

    // 👇 NUR die Rolle anpingen, sonst nichts
    await kanal.send({
      content: "<@&DEINE_ROLLEN_ID>",
      embeds: [embed]
    });

    res.send(`✅ Restock-Meldung gesendet!`);
  } catch (err) {
    console.error("❌ Fehler:", err.message);
    res.status(500).send("❌ Fehler: " + err.message);
  }
});

client.on("ready", () => {
  istBereit = true;
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Läuft auf Port ${PORT}`));
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Login fehlgeschlagen:", err.message);
  process.exit(1);
});
