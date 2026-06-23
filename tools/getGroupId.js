const {
  Client,
  LocalAuth,
} = require("whatsapp-web.js");

const qrcode =
  require("qrcode-terminal");

const client =
  new Client({
    authStrategy:
      new LocalAuth({
        clientId: "dad-setup",
      }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox"],
    },
  });

client.on("qr", (qr) => {
  console.log(
    "\nScan with Dad's WhatsApp\n"
  );

  qrcode.generate(qr, {
    small: true,
  });
});

client.on("ready", async () => {
  console.log(
    "\nWhatsApp Connected\n"
  );

  const chats =
    await client.getChats();

  const groups =
    chats.filter(
      (chat) => chat.isGroup
    );

  console.log(
    "\n===== GROUPS =====\n"
  );

  groups.forEach((group) => {
    console.log(
      `${group.name}`
    );
    console.log(
      group.id._serialized
    );
    console.log(
      "-------------------"
    );
  });

  console.log(
    "\nSetup Complete\n"
  );
});

client.initialize();