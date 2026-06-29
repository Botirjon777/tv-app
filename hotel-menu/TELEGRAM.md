# Telegram integration & per-hotel POS

One bot + one deployment serves many hotels. Each hotel has a **connect code**
(6 digits, shown in the admin panel) used to link its Telegram staff group **and**
to sign in to its POS.

## One-time bot setup

1. Create a bot with [@BotFather](https://t.me/BotFather), copy the token into
   `TELEGRAM_BOT_TOKEN` (in `.env`). Choose any string for `TELEGRAM_WEBHOOK_SECRET`.
2. Register the webhook (replace the domain + values):

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d url="https://<your-domain>/api/telegram/webhook" \
     -d secret_token="<TELEGRAM_WEBHOOK_SECRET>"
   ```

   For local development, expose the dev server with a tunnel (e.g. `ngrok http 3000`)
   and use that HTTPS URL.

## Connecting a hotel (manager)

1. Open the bot and tap **Start** → it replies with the steps.
2. Add the bot to the hotel's staff group and make it an **administrator**.
3. Send the hotel's **connect code** (from Admin → Hotels → the hotel) in the group.
   The bot replies "Connected to …" and every new order is posted there.

## POS sign-in (kitchen)

Go to `/pos/login` and enter the hotel's **connect code** + **POS password**
(both shown on the hotel's admin page). The POS then shows only that hotel's orders.

Seeded demo hotels:

| Hotel   | Connect code | POS password |
| ------- | ------------ | ------------ |
| Safir   | `100001`     | `safir123`   |
| Seaside | `100002`     | `seaside123` |

New hotels get an auto-generated code + password on creation.
