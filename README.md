# 🛵 Pagina Web de Înscriere Curieri Bolt Food (Optimizată 100% Mobil & Vercel)

Această aplicație web înlocuiește definitiv **Google Forms**, eliminând complet:
- ❌ Cerința obligatorie de conectare cu cont Google (permite înscrierea oricărui candidat, inclusiv utilizatori de Yahoo, iCloud etc.).
- ❌ Erorile de încărcare a buletinului pe telefoane **Samsung** (*Smart Anti-Tracking*).
- ❌ Erorile de încărcare pe **iPhone** (*Safari cross-site prevention*).
- ❌ Erorile din browserul intern **WhatsApp / Facebook / Instagram**.

---

## ⚡ Caracteristici Principale

1. **Design Mobile-First Stil Bolt Food:**
   - Paletă de culori oficială Bolt Food (verde vibrant `#00D287`, fundal întunecat elegant, carduri albe cu finisaj modern).
   - Butoane mari, prietenoase pentru degetul mare pe ecran mobil.
   - 3 carduri tapabile pentru selecția vehiculului: 🚗 Mașină, 🛵 Scuter / Moto, 🚲 Bicicletă.
   - Dropdown nativ cu **cele 30 de orașe oficiale Bolt Food** din România.

2. **Compresie Automată Client-Side a Pozei de Buletin (HTML5 Canvas):**
   - Când candidatul face o poză cu camera telefonului (4K de 5–10 MB), browserul o redimensionează și o comprimă automat în **0.1 secunde** la un fișier JPEG clar de aproximativ **800 KB – 1.2 MB**.
   - Încărcarea se face în sub **1 secundă**, chiar și pe conexiuni mobile 4G/3G slabe, cu zero blocaje sau timeout-uri.
   - Suportă captură directă din camera foto (`📸 Fă Poză Acum`) sau selecție din galerie (`📁 Alege din Galerie`).
   - Formate acceptate: **JPG, PNG, HEIC, PDF** (până la 15 MB).

3. **Arhitectură Securizată Vercel Serverless:**
   - Datele sunt trimise către ruta `/api/submit` (funcție serverless Vercel Node.js).
   - Funcția transmite cererea securizat către Webhook-ul **Google Apps Script & Google Sheets**.
   - Candidatul apare instantaneu în **Google Sheets** (cu status `NOU`).
   - Robotul Python preia automat datele în câteva secunde și trimite pe **Telegram** cardul interactiv cu butoanele `[ ✅ Confirmă și Trimite la Bolt ]` și `[ ❌ Respinge ]`!

---

## 📁 Structura Fișierelor

```
inscriere-curieri/
├── api/
│   └── submit.js       # Vercel Serverless Function (proxy securizat către Google Apps Script)
├── public/
│   ├── index.html      # Landing page + formular optimizat mobil
│   ├── styles.css      # Design modern, responsive, stil Bolt Food
│   └── app.js          # Validare client, compresie Canvas, preview foto & submit
├── vercel.json         # Configurație rutare & CORS pentru Vercel
├── package.json        # Metadate proiect Vercel
└── README.md           # Ghidul de instalare și publicare
```
