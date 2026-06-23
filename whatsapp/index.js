const {
  Client,
  LocalAuth,
} = require("whatsapp-web.js");

const qrcode =
  require("qrcode-terminal");

const {
  LEDGER_GROUP_ID,
} = require("./config");

const {
  handleMessage,
} = require("./handlers/messageHandler");

const client =
  new Client({
    authStrategy:
      new LocalAuth({
        clientId:
          "ledger-bot",
      }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
      ],
    },
  });

client.on("qr", (qr) => {
  qrcode.generate(qr, {
    small: true,
  });
});

client.on("ready", () => {
  console.log(
    "WhatsApp Ready"
  );
  console.log(
    "Logged In As:",
    client.info.pushname
  );

  console.log(
    "Phone:",
    client.info.wid._serialized
  );
});

client.on(
  "auth_failure",
  (msg) => {
    console.error(
      "Auth Failure:",
      msg
    );
  }
);
client.on(
  "loading_screen",
  (percent, message) => {
    console.log(
      `Loading ${percent}%`,
      message
    );
  }
);

client.on(
  "message_create",
  async (msg) => {

    // if (msg.fromMe) {
    //   return;
    // }
    const chat =
      await msg.getChat();

    if (
      !chat.isGroup
    )
      return;

    if (
      chat.id
        ._serialized !==
      LEDGER_GROUP_ID
    )
      return;

    try {
      await handleMessage(
        msg,
        chat
      );
    } catch (error) {
      console.error(
        "Message Handler Error:",
        error
      );
    }
  }
);

client.initialize();

module.exports = client;