# 🛠 H-Tech Studio — Pre-built Website Templates (Sales Kit)

Client လာတိုင်း ပြန်မဆောက်ဘဲ — ဒီ templates တွေကို **customize လုပ်ပြီး ချက်ချင်းရောင်း** လို့ရပါတယ်။

Template တိုင်းက **တစ်ခုတည်းသော `index.html`** (HTML + CSS + JS အားလုံး inline) — hosting ထည့်လိုက်ရင် ရပြီ။

---

## 📁 Template List & ဈေး

| Folder | Service | ဈေး (Ks) |
|---|---|---|
| `landing-page` | Landing Page | 30K – 150K |
| `business-website` | Business Website (5 pages) | 80K – 250K |
| `ecommerce-store` | E-commerce Store | 300K – 1.2M |
| `restaurant-website` | Restaurant Website | 120K – 300K |
| `tuition-school` | Tuition / School Website | 100K – 300K |
| `gallery-portfolio` | Gallery / Portfolio | 80K – 200K |
| `hotel-booking` | Hotel / Booking | 150K – 400K |
| `birthday-page` | Birthday / Anniversary Page | 15K – 60K |

## 💎 Premium Templates (ဈေးအကြီး, Feature အစုံ)

| Folder | Service | ဈေး (Ks) |
|---|---|---|
| `premium/ecommerce-premium` | Full E-commerce (filters, reviews, wishlist, checkout) | 800K – 1.5M |
| `premium/real-estate` | Real Estate / Property | 300K – 800K |
| `premium/car-dealer` | Car Dealership | 300K – 700K |
| `premium/food-delivery` | Online Food Ordering + tracking | 400K – 900K |
| `premium/lms-membership` | LMS / Online Courses (login, enroll, progress) | 500K – 1M |
| `premium/multilang-blog` | Multi-language (EN/MM) + Blog | 400K – 900K |
| `premium/admin-panel` | Admin Dashboard (products, orders, reports) | 500K – 1.2M |

---

## ⚙️ Customize လုပ်နည်း (Template တိုင်း တူ)

Template တိုင်းမှာ **နေရာ ၂ ခုပဲ** ပြင်ရပါတယ်:

### 1. CSS Variables (အပေါ်ဆုံး `<style>` ထဲ)
```css
:root {
  --primary: #c2775a;   /* brand အရောင် */
  --accent: #000000;     /* accent အရောင် */
  --font: 'Poppins', sans-serif;
}
```
> ဒီမှာ brand အရောင်ပြောင်းရင် site တစ်ခုလုံး ပြောင်းသွားမယ်။

### 2. JS CONFIG Object (အပေါ်ဆုံး `<script>` ထဲ)
```js
const CONFIG = {
  name: "Business Name",
  phone: "09-123456789",
  telegramLink: "t.me/hein_public_ai_bot",
  currencyLabel: "Ks",
  // ... template အလိုက်
};
```
> နာမည်/ဖုန်း/content တွေ ပြောင်းလို့ရမယ်။

### 3. Content Array (product/menu/course/room)
```js
const PRODUCTS = [  // CUSTOMIZE YOUR PRODUCTS HERE
  { name: "ပစ္စည်း ၁", price: 15000, category: "Apparel", emoji: "👕" },
  // ... ထည့်/ဖျက် လိုက်ရုံ
];
```
> ထုတ်ကုန်/menu/သင်တန်း/အခန်း တွေ ဒီ array မှာ ထည့်ရုံပဲ — grid/filter က auto ပေါ်မယ်။

---

## 🔌 Order လက်ခံပုံ

Template တစ်ခုချင်းစီမှာ **form + Telegram link** (`t.me/hein_public_ai_bot`) ပါတယ် — client/customer က form ဖြည့်ရင် Telegram confirm ပေးတယ်။

အလိုအလျောက် order drop ချင်ရင် → order bot (`api/bot.js`) နဲ့ ချိတ်ဆက်နိုင်တယ်။

---

## 🆕 Sold Template အသစ်ဆောက်နည်း

1. Template folder ကို copy လုပ်ပါ (ဥပမာ `ecommerce-store`)
2. နာမည်/အရောင်/content ပြောင်းပါ
3. Vercel / Netlify / cPanel ပေါ် deploy လုပ်ပါ
4. Domain ချိတ်ပြီး client ကို ပို့ပါ

---

## 🎁 Resell Tip

Template တစ်ခုကို client ၁၀ ယောက်ကို ရောင်းလို့ရတယ် — တစ်ကြိမ်ဆောက်ပြီးရင် **ကျန်တာ အမြတ်တွေပဲ**။ အတိုင်းအတာ တစ်ခုလို့ ဈေးနှုန်း သတ်မှတ်ပါ။
