const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// Geheime Daten kommen später sicher in Railway
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

app.post("/komerza", async (req, res) => {
  const daten = req.body;
  const alt = Number(daten.old_quantity ?? daten.previous_quantity ?? 0);
  const neu = Number(daten.new_quantity ?? daten.current_quantity ?? 0);

  if (!(alt <= 0 && neu > 0)) return res.send({ status: "ignoriert" });

  const produkt = daten.product ?? {};
  const variante = daten.variant ?? {};

  const produktName = produkt.name ?? "Unbenanntes Produkt";
  const varName = variante.title ?? produkt.name ?? "Standard";
  const preis = variante.price ?? produkt.price ?? "0.00";
  const bestand = neu;
  const link = produkt.url ?? "#";
  const bild = produkt.image_url ?? "";

  const embed = new EmbedBuilder()
    .setTitle(`${produktName} ist wieder auf Lager!`)
    .setDescription(`**${produktName}** wurde nachgefüllt!\n[Zum Produkt](${link})`)
    .addFields(
      { name: "Variante", value: varName, inline: true },
      { name: "Preis", value: `$${preis}`, inline: true },
      { name: "Verfügbar", value: `${bestand}`, inline: true }
    )
    .setColor(0x0099FF)
    .setImage(bild)
    .setTimestamp();

  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (kanal) await kanal.send({ content: "@restock", embeds: [embed] });
    return res.send({ status: "ok" });
  } catch (err) {
    console.error("Fehler:", err);
    return res.status(500).send({ status: "fehler" });
  }
});

client.on("ready", () => console.log("✅ Bot ist verbunden"));
client.login(BOT_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Empfangsbereit für Komerza"));
