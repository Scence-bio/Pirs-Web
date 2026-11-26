# Firebase بۆ پرس

پڕۆژە: **pirs-a1b0b**

بەبێ `.env`یش ئەپەکە کار دەکات (هەژمار/کویز لە هەمان ئامێر).

## چوونەژوورەوە

- **Email/Password** — چالاکە
- **Google** — چالاکە (دوگمەی «چوونەژوورەوە بە گووگڵ»)

## ڕێکخستن (ئەگەر پڕۆژەیەکی نوێ)

1. پڕۆژە لە [Firebase Console](https://console.firebase.google.com)
2. Authentication → Email/Password + Google
3. Firestore Database + یاساکانی `firestore.rules`
4. Web app → config بۆ `.env` (لە `.env.example` ببینە)
5. Authentication → Settings → Authorized domains: `localhost` و `scence-bio.github.io`

بۆ GitHub Pages: هەمان `VITE_FIREBASE_*` وەک Secrets دابنێ و لە کاتی بیلددا تێیان بکە.
