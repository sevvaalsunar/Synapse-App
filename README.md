# SYNAPSE Neuro Lab

SYNAPSE, bilişsel performans ve nörobilim temalı bir React uygulamasıdır. Vite + React + Tailwind CSS kullanılarak oluşturulmuş bu proje; oyun kütüphanesi, nöro-analiz ekranı, profil yönetimi ve tema desteği sunan tek sayfalık bir arayüzdür.

## Özellikler

- Ana sayfa ve giriş akışı
- Oyun kütüphanesi ve bilişsel protokoller
- Nöro-analiz ekranı ve radar grafiği
- Kullanıcı profili ve avatar yönetimi
- Karanlık / koyu / açık tema seçenekleri
- Yerel depolama ile profil ve oyun durumu takibi
- Mobil uyumlu responsive tasarım

## Teknolojiler

- React 19
- TypeScript 5.7
- Vite 8
- Tailwind CSS v4
- @vitejs/plugin-react
- oxfmt

## Proje Yapısı

```text
.
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
└── README.md
```

## Kurulum

Projeyi çalıştırmadan önce bağımlılıkları kurun:

```bash
npm install
```

## Çalıştırma

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Varsayılan olarak Vite sunucusu şu adreste çalışacaktır:

```text
http://localhost:8443
```

## Build

Production build oluşturmak için:

```bash
npm run build
```

## Önizleme

Üretilmiş build'i önizlemek için:

```bash
npm run preview
```

## Kullanım notları

- Uygulama, `src/App.tsx` içinde ana akışı ve arayüz bileşenlerini barındırır.
- `src/index.css` dosyası global stiller ve Tailwind girişini yönetir.
- Tema ve profil bilgileri, uygulama içinde dinamik olarak güncellenir.
- Vite konfigürasyonu, proje için `@` alias ve port ayarlarını içerir.

## Geliştirme Bilgileri

Bu proje, Figma Make ortamında çalışacak şekilde yapılandırılmıştır. Vite sunucusu önceden hazır durumda olabilir; gerekli olduğunda manuel olarak çalıştırılabilir.

## Lisans

Bu proje için ek bir lisans dosyası belirtilmemiştir. Kural olarak repo içindeki kullanım ve dağıtım koşulları sizin organizasyonunuzun politikalarına göre değerlendirilmelidir.
