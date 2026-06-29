const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.MTUyMDg3NDk2NTc1NzMzMzY0NQ.GAcScV.kP1417yWTWM_3HG_bG3bgnjCgVLv8XC4s9fl8Q;
const CHANNEL_ID = process.env.1513272345366761553;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

app.post("/komerza", async (req, res) => {
  console.log("📥 Daten erhalten:", req.body);
  const alt = Number(req.body.old_quantity ?? req.body.previous_quantity ?? 0);
  const neu = Number(req.body.new_quantity ?? req.body.current_quantity ?? 0);

  console.log(`📊 Bestand: alt=${alt} → neu=${neu}`);

  if (neu <= alt) {
    console.log("ℹ️ Keine Erhöhung → ignoriert");
    return res.send({ status: "ignoriert" });
  }

  const produkt = req.body.product ?? {};
  const variante = req.body.variant ?? {};

  const embed = new EmbedBuilder()
    .setTitle(`${produkt.name || "Produkt"} | Bestand erhöht`)
    .setDescription(`Vorher: ${alt} → Jetzt: ${neu}\n${produkt.url || "#"}`)
    .addFields(
      { name: "Variante", value: variante.title || "-", inline: true },
      { name: "Preis", value: variante.price || "-", inline: true },
      { name: "Neuer Bestand", value: String(neu), inline: true }
    )
    .setColor("#2ecc71")
    .setTimestamp();

  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) throw new Error("Kanal nicht gefunden");
    await kanal.send({ content: "@restock", embeds: [embed] });
    console.log("✅ Nachricht gesendet");
    return res.send({ status: "ok" });
  } catch (err) {
    console.error("❌ Fehler:", err.message);
    return res.status(500).send({ status: "fehler" });
  }
});

client.on("ready", () => console.log("✅ Bot verbunden"));
client.login(BOT_TOKEN);

// ✅ Korrigierter Port für Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Webhook lauscht auf /komerza"));
