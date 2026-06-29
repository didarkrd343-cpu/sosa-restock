const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("❌ FEHLER: BOT_TOKEN oder CHANNEL_ID fehlen!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Antwort im Browser
app.get("/komerza", (req, res) => {
  res.send("✅ Webhook ist aktiv! Nutze nur POST-Anfragen von Komerza.");
});

// 🟢 TEST-ENDPUNKT: Zum Ausprobieren im Browser
app.get("/test-restock", async (req, res) => {
  try {
    const kanal = client.channels.cache.get(CHANNEL_ID);
    if (!kanal) throw new Error("Kanal mit dieser ID nicht gefunden");

    const embed = new EmbedBuilder()
      .setTitle("📦 TEST: Bestand erhöht")
      .setDescription("Vorher: **5** → Jetzt: **25**")
      .addFields(
        { name: "Produkt", value: "Testartikel", inline: true },
        { name: "Preis", value: "19,99 €", inline: true },
        { name: "Neuer Bestand", value: "25", inline: true }
      )
      .setColor(0x22c55e)
      .setTimestamp();

    await kanal.send({ content: "@restock", embeds: [embed] });
    res.send("✅ Test erfolgreich! Schau in deinen Discord-Kanal.");
  } catch (err) {
    res.send(`❌ Fehler: ${err.message}`);
  }
});

// Webhook für Komerza
app.post("/komerza", async (req, res) => {
  console.log("📥 Rohdaten erhalten:", JSON.stringify(req.body, null, 2));

  // Kompatibel mit allen gängigen Formaten von Komerza
  const alt = Number(
    req.body.old_quantity ??
    req.body.previous_quantity ??
    req.body.inventory_old ??
    0
  );
  const neu = Number(
    req.body.new_quantity ??
    req.body.current_quantity ??
    req.body.inventory_new ??
    req.body.inventory_quantity ??
    0
  );

  console.log(`📊 Bestand: alt=${alt} → neu=${neu}`);

  // Nur senden, wenn Bestand gestiegen ist
  if (neu <= alt) {
    console.log("ℹ️ Keine Erhöhung → ignoriert");
    return res.json({ status: "ignoriert" });
  }

  const produkt = req.body.product ?? req.body.data ?? {};
  const variante = req.body.variant ?? {};

  const embed = new EmbedBuilder()
    .setTitle(`${produkt.name || "Produkt"} | Bestand aufgefüllt ✅`)
    .setDescription(`Vorher: **${alt}** → Jetzt: **${neu}**\n${produkt.url ? `[Zum Produkt](${produkt.url})` : ""}`)
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
    if (!kanal) throw new Error("Discord-Kanal nicht gefunden");
    await kanal.send({ content: "@restock", embeds: [embed] });
    console.log("✅ Nachricht erfolgreich an Discord gesendet");
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Fehler beim Senden:", err.message);
    return res.status(500).json({ status: "fehler", fehler: err.message });
  }
});

client.on("clientReady", () => {
  console.log(`✅ Bot verbunden als ${client.user.tag}`);
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Webhook lauscht auf Port ${PORT}`);
  });
});

client.login(BOT_TOKEN).catch(err => {
  console.error("❌ Discord Login fehlgeschlagen:", err.message);
  process.exit(1);
});
