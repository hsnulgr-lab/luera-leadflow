# LUERA - Lead Yönetim Paneli 🚀

Bu proje, React, Vite ve TypeScript kullanılarak geliştirilmiş modern bir Lead Yönetim Paneli'dir. n8n entegrasyonu sayesinde Google Maps üzerinden gerçek zamanlı işletme verilerini (Lead) çekebilir, bunları listeleyebilir ve yönetebilirsiniz.

## 🌟 Öne Çıkan Özellikler

*   **Gerçek Zamanlı Veri Çekme:** Google Maps üzerinden Şehir, İlçe ve Sektör bazlı arama.
*   **n8n Entegrasyonu:** Karmaşık scraping işlemlerini arkada n8n workflow'u yönetir.
*   **Proxy Desteği:** Yerel geliştirme ortamında CORS hatalarını aşmak için otomatik proxy yapılandırması.
*   **Modern UI:** Tailwind CSS ve Shadcn-like bileşenler ile şık tasarım.
*   **Detaylı Lead Yönetimi:** Arama yapma, listeleme, detay görüntüleme ve toplu işlemler.

---

## 🛠️ Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js (v18 veya üzeri)
*   npm

### 1. Bağımlılıkları Yükleyin
Terminali proje klasöründe açın ve komutu çalıştırın:
```bash
npm install
```

### 2. Çevresel Değişkenleri (.env) Ayarlayın
Projenin çalışması için n8n Webhook adresine ihtiyacı vardır. Proje kök dizininde `.env` adında bir dosya oluşturun (yoksa) ve içine şu satırı ekleyin:

```env
# Test aşaması için (Tavsiye Edilen):
VITE_N8N_WEBHOOK_URL=https://lueratech.app.n8n.cloud/webhook-test/e3c9c128-2078-4702-8fc2-bf55da50302c

# Canlı (Production) mod için:
# VITE_N8N_WEBHOOK_URL=https://lueratech.app.n8n.cloud/webhook/e3c9c128-2078-4702-8fc2-bf55da50302c
```

### 3. Uygulamayı Başlatın
Geliştirme sunucusunu başlatmak için:
```bash
npm run dev
```
Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı görebilirsiniz.

---

## 🔗 n8n Workflow Entegrasyonu

Bu panelin çalışması için n8n tarafında özel bir workflow'un kurulu ve aktif olması gerekir.

### Workflow Yapısı
1.  **Webhook Trigger:** Panelden gelen verileri (Şehir, Sektör, Sayı) karşılar.
2.  **Apify / Scraper:** Google Maps üzerinde arama yapar.
3.  **Aggregate Node:** Bulunan tüm verileri tek bir liste (JSON Array) haline getirir.
4.  **Respond to Webhook:** Toplanan listeyi panele geri gönderir.

### Test Etme (Önemli!)
Eğer `.env` dosyasında **Test URL** (`webhook-test`) kullanıyorsanız:
1.  n8n panelinde ilgili workflow'u açın.
2.  **"Execute Workflow"** (veya Listen) butonuna basın.
3.  Web panelinden **"Lead Bul"** butonuna basın.

Eğer **Production URL** kullanıyorsanız, n8n workflow'unun **"Active"** konumda olduğundan emin olun.

---

## 📂 Proje Yapısı

*   `src/components`: Tüm UI bileşenleri (Kartlar, Butonlar, Paneller).
*   `src/hooks`: Mantıksal işlemler (ör: `useLeads` hook'u).
*   `src/services`: API servisleri (ör: `n8nService.ts`).
*   `src/pages`: Sayfa tasarımları.
*   `src/types`: TypeScript tip tanımlamaları.

---

**İyi çalışmalar!** 🚀
