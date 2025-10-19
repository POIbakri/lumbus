# 🚀 SEO Quick Reference - Lumbus

## ✅ DONE - What's Already Implemented

### Core Infrastructure
- ✅ **Sitemap**: Auto-generates at `/sitemap.xml`
- ✅ **Robots.txt**: Optimized for Google + AI crawlers at `/robots.txt`
- ✅ **Google Verification**: Code added
- ✅ **Bing Verification**: Code added

### Metadata & Schema
- ✅ **8 Schema Types**: Organization, Website, Product, FAQ, HowTo, Service, Breadcrumb, ItemList
- ✅ **Open Graph Tags**: Social media previews configured
- ✅ **Twitter Cards**: Large image cards enabled
- ✅ **Page-Specific Metadata**: Plans, Destinations, Help, How It Works

### Performance
- ✅ **Image Optimization**: AVIF + WebP
- ✅ **Compression**: Enabled
- ✅ **Security Headers**: HSTS, CSP, XSS protection
- ✅ **Caching**: Aggressive for static assets

### Content
- ✅ **FAQ Schema**: 20+ questions on /help
- ✅ **HowTo Schema**: 3-step guide on /how-it-works
- ✅ **Comparison Tables**: Lumbus vs Roaming

---

## ⏳ TODO - What You Need to Do

### 1. Create OG Images (PRIORITY 1)
**Time: 1-2 hours**

Create these images (1200x630px each):

```
/public/og-image.png              - Homepage image
/public/og-image-plans.png        - Plans page image
/public/og-image-destinations.png - Destinations image
/public/og-image-how-it-works.png - How-it-works image
```

**Quick Design Tips**:
- Use Canva free templates
- Search "Open Graph template 1200x630"
- Include Lumbus logo + key message
- Use brand colors (purple, cyan, yellow)
- Test at: https://www.opengraph.xyz/

### 2. Submit Sitemaps (PRIORITY 1)
**Time: 10 minutes**

#### Google Search Console
1. Go to: https://search.google.com/search-console
2. Select property: getlumbus.com
3. Click "Sitemaps" in left menu
4. Add: `https://getlumbus.com/sitemap.xml`
5. Click Submit

#### Bing Webmaster Tools
1. Go to: https://www.bing.com/webmasters
2. Select site: getlumbus.com
3. Go to "Sitemaps"
4. Add: `https://getlumbus.com/sitemap.xml`
5. Click Submit

### 3. Create Social Accounts (PRIORITY 2)
**Time: 30 minutes**

Create accounts:
- [ ] Twitter/X: @lumbus
- [ ] Facebook Page: Lumbus
- [ ] LinkedIn Company: Lumbus

Then update `/components/structured-data.tsx:30`:
```typescript
sameAs: [
  'https://twitter.com/YOUR_HANDLE',
  'https://facebook.com/YOUR_PAGE',
  'https://linkedin.com/company/YOUR_COMPANY',
],
```

And update Twitter handle in `/app/layout.tsx:78-79`.

---

## 🧪 Testing After Deploy

### Immediate Tests (Do Right After Deploy):

1. **Sitemap Check**
   ```
   URL: https://getlumbus.com/sitemap.xml
   Should show: XML with all pages listed
   ```

2. **Robots Check**
   ```
   URL: https://getlumbus.com/robots.txt
   Should show: Crawler rules
   ```

3. **Rich Results Test**
   ```
   Go to: https://search.google.com/test/rich-results
   Test URL: https://getlumbus.com
   Should show: Organization + Website + FAQ schemas ✅
   ```

4. **Mobile-Friendly Test**
   ```
   Go to: https://search.google.com/test/mobile-friendly
   Test URL: https://getlumbus.com
   Should show: Mobile-friendly ✅
   ```

5. **Page Speed Test**
   ```
   Go to: https://pagespeed.web.dev/
   Test URL: https://getlumbus.com
   Target: 90+ score on mobile & desktop
   ```

6. **Social Preview Test**
   ```
   Go to: https://www.opengraph.xyz/
   Test URL: https://getlumbus.com
   Should show: Your OG images
   ```

---

## 📊 Weekly Monitoring Checklist

### Google Search Console (Every Monday):
- [ ] Check total impressions (should increase)
- [ ] Check total clicks (should increase)
- [ ] Check average position (should decrease = better)
- [ ] Check for any errors/warnings
- [ ] Review new indexed pages

### Vercel Analytics (Every Monday):
- [ ] Check total page views
- [ ] Check traffic sources
- [ ] Check top pages
- [ ] Check bounce rate

### Manual Search Tests (Every 2 Weeks):
- [ ] Google "Lumbus eSIM" → Should be #1
- [ ] Google "cheap eSIM" → Monitor ranking
- [ ] Google "eSIM for travel" → Monitor ranking
- [ ] ChatGPT: "Best eSIM provider?" → Check if mentioned
- [ ] Perplexity: "Cheap eSIM for Europe" → Check citations

---

## 🎯 Target Metrics (3 Months)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Google Impressions | 10,000/month | TBD | ⏳ |
| Organic Clicks | 500/month | TBD | ⏳ |
| Average Position | <20 | TBD | ⏳ |
| Indexed Pages | 1700+ | TBD | ⏳ |
| Page Speed Score | 90+ | TBD | ⏳ |
| Rich Results | 3+ types | TBD | ⏳ |

---

## 🐛 Common Issues & Fixes

### Issue: Sitemap not updating
**Fix**: Sitemap revalidates every hour. Wait 60 min after changes.

### Issue: OG images not showing
**Fix**:
1. Clear social media cache
2. Facebook: https://developers.facebook.com/tools/debug/
3. Twitter: Tweet the URL, check preview

### Issue: Schema errors in Search Console
**Fix**:
1. Go to: https://search.google.com/test/rich-results
2. Test the specific page
3. Fix errors shown
4. Redeploy

### Issue: Pages not indexed
**Fix**:
1. Check `robots.txt` - ensure not blocked
2. Submit URL manually in Search Console
3. Check for `noindex` tags (should be none)

---

## 📞 SEO Health Checklist

Run this monthly:

- [ ] All pages indexed in Google (check Search Console)
- [ ] No 404 errors (check Search Console)
- [ ] No mobile usability issues (check Search Console)
- [ ] No structured data errors (check Search Console)
- [ ] Page speed >90 (check PageSpeed Insights)
- [ ] All OG images loading (check social shares)
- [ ] Sitemap up to date (check /sitemap.xml)
- [ ] Robots.txt correct (check /robots.txt)
- [ ] HTTPS working (check certificate)
- [ ] No broken links (use Screaming Frog free tier)

---

## 🚀 Quick Deploy Commands

```bash
# Test build locally
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod

# Or push to main branch (if auto-deploy configured)
git add .
git commit -m "SEO enhancements: sitemap, robots, schema, metadata"
git push origin main
```

---

## 📚 Key Files Reference

### SEO Configuration:
- `/app/sitemap.ts` - Dynamic sitemap
- `/app/robots.ts` - Crawler rules
- `/app/layout.tsx` - Global metadata
- `/components/structured-data.tsx` - Schema templates
- `/middleware.ts` - Security headers
- `/next.config.ts` - Performance config

### Page Metadata:
- `/app/plans/metadata.ts`
- `/app/destinations/metadata.ts`
- `/app/help/metadata.ts`
- `/app/how-it-works/metadata.ts`

### Documentation:
- `SEO_IMPLEMENTATION_SUMMARY.md` - Full overview
- `SEO_MISSING_ASSETS.md` - Detailed action items
- `SEO_QUICK_REFERENCE.md` - This file

---

## 💡 Pro Tips

1. **Content is King**: Keep adding FAQs based on customer questions
2. **Speed Matters**: Monitor Core Web Vitals monthly
3. **AI Optimization**: Write clear, factual content (no fluff)
4. **Update Regularly**: Add new destinations/plans = fresh content
5. **Monitor Competitors**: Check their rankings monthly
6. **Build Links**: Get mentioned on travel blogs, forums
7. **Local SEO**: If you have office, add LocalBusiness schema
8. **Video Content**: Add YouTube videos → embed on site
9. **User Reviews**: Collect real reviews → add Review schema
10. **Blog**: Add "/blog" with travel tips → more keywords

---

## 🎉 You're Ready!

Your SEO is **EXPERT-LEVEL**. Just need to:
1. ✅ Create OG images (1-2 hours)
2. ✅ Submit sitemaps (5 minutes)
3. ✅ Deploy to production
4. ✅ Monitor weekly

**Then watch your rankings climb! 🚀📈**
