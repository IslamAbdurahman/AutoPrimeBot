# 🚗 AutoPrimeBot — Avtomaktab Mashg'ulotlarini Boshqarish va Baholash Tizimi

**AutoPrimeBot** — avtomaktablarda haydovchilik amaliy darslarini (drivings) samarali rejalashtirish, instruktorlar ishini nazorat qilish va talabalar tomonidan Telegram bot orqali dars sifatini real vaqt rejimida baholash uchun mo'ljallangan zamonaviy axborot tizimi.

---

## ✨ Asosiy Imkoniyatlar (Features)

### 👨‍💼 1. Admin Paneli
- **Instruktorlar Boshqaruvi (CRUD):** Instruktorlarni ro'yxatga olish, ularga guruhlar biriktirish, o'rtacha reyting va KPI (%) ko'rsatkichlarini kuzatish.
- **Past Reyting Ogohlantirishi (Warnings):** O'rtacha reytingi `≤ 3.0` bo'lgan yoki 3 ta va undan ortiq shikoyat olgan instruktorlar avtomatik tarzda **`⚠️ Ogohlantirish`** belgisi bilan ajratiladi.
- **Guruhlar va O'quvchilar (Students & Groups):** Guruhlar yaratish, o'quvchilarni birma-bir yoki Excel shablon orqali ommaviy import qilish.
- **Avtodromlar (Autodromes):** Avtodromlar va ularning geo-lokatsiyalarini (kenglik va uzoqlik) boshqarish.
- **Amaliy Darslar (Drivings):** Darslar ro'yxati, filtrlash (sana, instruktor, status), darsni tugatish yoki bekor qilish.
- **Adminlar CRUD:** ID 1 bo'lgan Asosiy Admin barcha adminlarni boshqarishi hamda rol va huquqlarni berishi mumkin.

---

### 👨‍🏫 2. Instruktor Kabineti
- **Dars Boshlash va Yakunlash:** Instruktorlar amaliy mashg'ulot yaratadi, avtodromni tanlaydi (yoki ixtiyoriy qoldiradi).
- **Holatlar Nazorati:** Dars yakunlangan yoki bekor qilingan bo'lsa, uni tahrirlash va o'chirish taqiqlanadi (modal tasdiqlovlar bilan).
- **Instruktor Statistikasi:** Shaxsiy dashboard, biriktirilgan guruhlar va baholash natijalari.

---

### 🤖 3. Telegram Bot Integratsiyasi (Nutgram)
- **Avtomatik Xabarnomalar:** 
  - Dars yaratilganda talabaga bildirishnoma boradi.
  - Avtodrom tanlangan bo'lsa, avtodrom geo-lokatsiyasi Telegram **Map (Location)** shaklida yuboriladi.
  - Dars yakunlanganda yoki bekor qilinganda talabaga zudlik bilan xabar yetkaziladi.
- **Interaktiv Baholash Tizimi:**
  - Dars tugashi bilanoq talabaga 1 dan 5 gacha yulduzcha (`⭐`) tanlash taklif etiladi.
  - **Ko'p martalik izohlar (Multi-select Tags):** Talaba bitta emas, bir nechta izohlarni (masalan: `🧠 Zargona tushuntirdi`, `🧼 Mashina toza`, `⏰ Kechikdi`) belgilab, `✅ Yuborish` tugmasi orqali yubora oladi.

---

## 🛠 Texnologiyalar Steki (Tech Stack)

| Qatlam | Texnologiya |
|---|---|
| **Backend Framework** | [Laravel 13](https://laravel.com) (PHP 8.3+) |
| **Frontend Framework** | [Inertia.js v3](https://inertiajs.com) + [React 19](https://react.dev) |
| **Styling & UI** | [TailwindCSS v4](https://tailwindcss.com) + Lucide Icons |
| **Telegram SDK** | [Nutgram v4](https://nutgram.dev) |
| **Database** | MySQL 8.0 / MariaDB 10.6 |
| **Route Generation** | Laravel Wayfinder (`@/actions`, `@/routes`) |
| **Testing** | Pest PHP v4 |

---

## 📂 Loyiha Strukturasi (Project Structure)

```text
AutoPrimeBot/
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/              # Admin paneli nazoratchilari (Instructors, Drivings, Students, etc.)
│   │   ├── InstructorController.php
│   │   └── ProfileController.php
│   ├── Models/                 # Eloquent modellar (User, Driving, Review, Autodrome, Group, Student)
│   └── Services/
│       └── TelegramService.php # Telegram xabarnomalari va Map jo'natish xizmati
├── database/
│   ├── migrations/             # Baza jadvallari strukturasi
│   └── seeders/                # Boshlang'ich Superadmin seederi
├── resources/js/
│   ├── Components/             # UI komponentlar (Buttons, Dialogs, Pagination)
│   ├── Layouts/                # Admin va Instruktor maketlari
│   └── pages/                  # Inertia React sahifalari (Admin, Instructor, Auth)
├── routes/
│   ├── web.php                 # Veb-marshrutlar
│   └── telegram.php            # Nutgram bot buyruqlari va baholash handleri
└── INSTALL.md                  # Serverga o'rnatish bo'yicha to'liq qo'llanma
```

---

## 🚀 Serverga O'rnatish (Deployment)

Loyiha serverini (FastPanel / NGINX / Ubuntu) to'liq sozlash, muhit o'zgaruvchilari (`.env`), database migratsiyalari va Telegram Webhook ulash bo'yicha to'liq qo'llanma bilan **[INSTALL.md](INSTALL.md)** faylida tanishishingiz mumkin.

Qisqacha buyruqlar:

```bash
# 1. Kutubxonalarni o'rnatish
composer install --no-dev --optimize-autoloader
npm install && npm run build

# 2. Bazani migratsiya qilish
php artisan migrate --force
php artisan db:seed --force

# 3. Webhook ni ulash
php artisan nutgram:hook:set https://bot.autoprime.uz/api/telegram
```

---

## 🔑 Standart Tizimga Kirish Ma'lumotlari

- **Telefon:** `+998911157709`
- **Parol:** `12345678`
- **Rol:** Asosiy Admin

---

## 📄 Litsenziya (License)

Ushbu loyiha maxsus mualliflik huquqi ostida ishlab chiqilgan.
