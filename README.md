# ZOE AI™ Website

A sleek, Apple-inspired website for ZOE AI - the portable, air-gapped legal AI system.

## 🚀 Quick Start

### Local Testing

1. Open `index.html` directly in your web browser, or
2. Use a local server (recommended for best results):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```
3. Navigate to `http://localhost:8000` in your browser

### File Structure

```
zoe-ai-website/
├── index.html          # Main HTML file
├── styles.css          # All styling (Apple-inspired design)
├── script.js           # Smooth scrolling and animations
├── assets/             # Media files
│   ├── logo-static.png
│   ├── logo-animated.gif
│   ├── ZOE_AI1.jpg
│   ├── ZOE_AI2.jpg
│   ├── william-wei.png
│   ├── ZOE_AI_INTRO.mp4
│   └── favicon.png
└── README.md
```

## 📝 Google Form Integration

The website has a placeholder for a Google Form. To complete the setup:

### Step 1: Create Your Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form with these fields:
   - **Name** (required - Short answer)
   - **Organization/Company** (required - Short answer)
   - **Work Email** (required - Short answer)
   - **Work Phone** (optional - Short answer)
   - **Work Address** (required - Paragraph)
   - **Personal Email** (optional - Short answer)
   - **Personal Phone** (optional - Short answer)

### Step 2: Get the Embed Code

1. Click the **Send** button in your Google Form
2. Click the **< >** (embed) icon
3. Copy the iframe code that appears

### Step 3: Add to Website

1. Open `index.html` in a text editor
2. Find the comment that says `<!-- REPLACE THE SECTION BELOW WITH YOUR GOOGLE FORM EMBED CODE -->`
3. Replace the placeholder section with your iframe code
4. Remove or hide the `.form-placeholder` div

Example:
```html
<!-- REPLACE THIS -->
<div class="form-placeholder">
    ...
</div>

<!-- WITH YOUR GOOGLE FORM -->
<iframe 
    src="YOUR_GOOGLE_FORM_URL_HERE" 
    width="100%" 
    height="1200" 
    frameborder="0" 
    marginheight="0" 
    marginwidth="0">
    Loading…
</iframe>
```

### Google Form Response Tracking

Google Forms automatically:
- ✅ Timestamps each submission
- ✅ Numbers entries (1, 2, 3, etc.)
- ✅ Stores all responses in a connected Google Sheet
- ✅ Can send you email notifications
- ✅ Allows CSV/Excel export

## 🌐 GitHub Pages Deployment

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click **New Repository**
3. Name it (e.g., `zoe-ai-website`)
4. Keep it **Public** (required for free GitHub Pages)
5. Click **Create Repository**

### Step 2: Upload Files

**Option A: Via GitHub Web Interface**
1. Click **uploading an existing file**
2. Drag and drop all files/folders
3. Commit the changes

**Option B: Via Git Command Line**
```bash
git init
git add .
git commit -m "Initial commit - ZOE AI website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository **Settings**
2. Click **Pages** in the left sidebar
3. Under **Source**, select **main** branch
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

⏱️ **Note**: It may take 2-5 minutes for your site to go live after enabling GitHub Pages.

## 🎨 Design Features

- ✨ **Apple-inspired** minimal aesthetic
- 🎬 **Auto-playing hero video** (muted)
- 🌊 **Smooth scroll animations**
- 📱 **Fully responsive** design
- ⚡ **Performance optimized**
- 🎯 **Scroll-triggered** element animations
- 💫 **Parallax effects**

## 🔧 Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --white: #ffffff;
    --light-gray: #f5f5f7;
    --dark-gray: #1d1d1f;
    --accent: #0071e3;
}
```

### Content
All content can be edited directly in `index.html`

### Images
Replace files in the `assets/` folder with your own (keep the same filenames)

## 📄 Legal Pages

The website includes modal popups for:
- **Privacy Policy** - Standard B2B data collection policy
- **Terms of Use** - Standard website terms

These can be customized in the `index.html` file in the modal sections.

## 🛠️ Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 📞 Support

For questions or issues, refer to the inline HTML comments in `index.html` or CSS comments in `styles.css`.

## 📜 Copyright

© 2026 ZOE AI™. All rights reserved.

---

**Built with attention to detail and inspired by the best in tech design.**
