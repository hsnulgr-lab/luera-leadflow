#!/bin/bash

# -----------------------------------------------------------------------------
# WhatsApp Webhook Simulator
# -----------------------------------------------------------------------------
# Bu script, n8n'deki "Master Router" workflow'unu test etmek için
# sahte bir WhatsApp mesajı (Evolution API formatında) gönderir.
#
# KULLANIM:
# 1. n8n'de "WhatsApp Master Router" workflow'unu açın.
# 2. "Master Webhook" node'una çift tıklayın.
# 3. "Test Webhook URL" kısmını kopyalayın (örn: http://localhost:5678/webhook-test/...)
# 4. Aşağıdaki WEBHOOK_URL değişkenine yapıştırın.
# 5. Terminalde bu scripti çalıştırın: sh test_webhook_simulation.sh
# -----------------------------------------------------------------------------

# LÜTFEN BURAYI GÜNCELLEYİN 👇
WEBHOOK_URL="https://n8n.lueratech.com/webhook-test/whatsapp-master"

echo "📡 Test mesajı gönderiliyor: $WEBHOOK_URL..."

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
  "event": "messages.upsert",
  "instance": "testwp",
  "data": {
    "key": {
      "remoteJid": "905426026048@s.whatsapp.net",
      "fromMe": false,
      "id": "TEST_MESSAGE_ID_123"
    },
    "pushName": "Furkan",
    "message": {
      "conversation": "Merhaba",
      "messageContextInfo": {
        "deviceListMetadata": {
          "senderKeyHash": "fwEf8S",
          "senderTimestamp": "1706699123",
          "recipientKeyHash": "Ks72Fs",
          "recipientTimestamp": "1706699123"
        },
        "deviceListMetadataVersion": 2
      }
    },
    "messageType": "conversation"
  },
  "sender": "905426026048@s.whatsapp.net"
}'

echo "\n\n✅ İstek gönderildi! n8n panelini kontrol edin (Yeşil ışık yandı mı?)"
