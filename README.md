# FB News Bot - Setup Guide (Hinglish)

Ye bot roz **10 baar** trending India + world news ko tumhare naye Facebook Page pe automatically post karega - RSS feeds se news uthake, apna original Hinglish caption banake, aur original article ka link share karke. Kabhi bhi poora article copy nahi karta - sirf legal link-share format.

---

## STEP 1: Naya Facebook Page Banao

1. Facebook pe login karo, top-right profile icon click karo -> "Pages" ya seedha facebook.com/pages/create pe jao
2. Page ka naam do (jaise "Daily News Buzz" ya jo bhi sochna hai)
3. Category select karo - "News & Media Website" ya "Media/News Company"
4. "Create Page" click karo
5. Page ban jaye to uska **Page ID** note kar lo (About section mein milega, ya jaisa movie bot mein nikala tha)

---

## STEP 2: Gemini API Key

Agar movie bot ke liye pehle se bana li hai, wahi reuse kar sakte ho. Nahi to:
1. aistudio.google.com pe jao, "Get API key" -> "Create API key" (free, koi card nahi chahiye)
2. Key copy karke save kar lo

---

## STEP 3: Facebook Page Access Token

Movie bot jaisa hi process hai - agar ek baar kar chuke ho to jaldi ho jayega:

1. developers.facebook.com pe naya app banao ("Create App" -> "Business" -> naam do)
2. App ke dashboard mein "Use cases" -> "Customize" -> "Permissions and features" mein jaake ye 3 permissions "Add" karo:
   - pages_manage_posts
   - pages_read_engagement
   - pages_show_list
3. Ye URL browser mein kholo (APP_ID apni app ka daalna, Dashboard -> Settings -> Basic mein milega):

```
https://www.facebook.com/v21.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=https://developers.facebook.com/tools/explorer/callback&scope=pages_manage_posts,pages_read_engagement,pages_show_list&response_type=token
```

4. Allow karo, apna naya News Page select karo. Token milega - copy karo.
5. Isko 60-din wale long-lived token mein convert karo:

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
```

6. Jo `access_token` mile, usse Page token nikalo:

```
https://graph.facebook.com/v21.0/YOUR_PAGE_ID?fields=access_token&access_token=YOUR_LONG_TOKEN
```

7. Final `access_token` yahi hai - ye tumhara `FB_PAGE_ACCESS_TOKEN` hai.

**Note:** Ye token 60 din mein expire hoga, tab Step 3 dobara karna padega (movie bot mein bhi yahi rule hai).

---

## STEP 4: GitHub Pe Deploy Karo

1. github.com/new pe naya **Private** repo banao (jaise `fb-news-bot`)
2. Is poore folder ki saari files usme upload karo (drag & drop se, jaisa movie bot mein kiya tha) - `.github` folder bhi zaroor jaye
3. Repo -> Settings -> Secrets and variables -> Actions mein 3 secrets add karo:
   - `GEMINI_API_KEY`
   - `FB_PAGE_ID`
   - `FB_PAGE_ACCESS_TOKEN`

---

## STEP 5: Test Karo

Actions tab -> "Auto Post Trending News" -> "Run workflow" -> manually trigger karo. Green tick aaye to Facebook Page check karo - naya post dikhna chahiye headline preview ke saath.

---

## Bas, ho gaya!

Bot roz 10 baar (subah se raat tak spread hue) khud news dhundega aur post karega. News sources: Times of India, NDTV, Hindustan Times (India), BBC, Al Jazeera, CNN (World) - inme se jo bhi latest/trending hoga wahi pick hoga.

Kabhi frequency ya sources change karne hain, bata dena.
