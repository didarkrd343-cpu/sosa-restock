const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ✅ Korrekte Variablen (keine Zahlen im Namen!)
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Prüfung
if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen in Railway → Variables!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

app.post("/komerza", async (req, res) => {
  console.log("📥 Daten erhalten:", req.body);

  const alt = Number(req.body.old_quantity ?? req.body.previous_quantity ?? 0);
  const neu = Number(req.body.new_quantity ?? req.body.current_quantity ?? 0);

  console.log(`📊 Bestand: alt=${alt} → neu=${neu}`);

  // Regel: Nur bei Erhöhung senden
  if (neu <= alt) {
    console.log("ℹ️ Keine Erhöhung → ignoriert");
    return res.json({ status: "ignoriert" });
  }

  const produkt = req.body.product ?? {};
  const variante = req.body.variant ?? {};

  const embed = new EmbedBuilder()
    .setTitle(`${produkt.name || "Produkt"} | Bestand erhöht`)
    .setDescription(`Vorher: **${alt}** → Jetzt: **${neu}**\n[Zum Produkt](${produkt.url || "#"})`)
    .addFields(
      { name: "Variante", value: variante.title || "-", inline: true },
      { name: "Preis", value: variante.price || "-", inline: true },
      { name: "Neuer Bestand", value: String(neu), inline: true }
    )
    .setColor(0x22c55e)
    .setImage(produkt.image_url || null)
    .setTimestamp();

  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) throw new Error(`Kanal mit ID ${CHANNEL_ID} nicht gefunden`);
    await kanal.send({ content: "@restock", embeds: [embed] });
    console.log("✅ Nachricht erfolgreich an Discord gesendet");
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Fehler beim Senden:", err.message);
    return res.status(500).json({ status: "fehler" });
  }
});

// ✅ Geänderte Zeile: clientReady statt ready → Warnung ist weg!
client.on("clientReady", () => {
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Discord-Anmeldung fehlgeschlagen:", err.message);
  process.exit(1);
});

// ✅ Port für Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Webhook läuft auf Port ${PORT} und wartet auf Anfragen`);
});
