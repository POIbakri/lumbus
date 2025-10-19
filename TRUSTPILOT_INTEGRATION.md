# 🌟 Trustpilot Integration - Lumbus

## ✅ Trustpilot Setup

### Your Unique Trustpilot Email:
```
getlumbus.com+d39cc9736f@invite.trustpilot.com
```

**IMPORTANT**: This email is unique to your business. Keep it secure!

---

## 🔧 How to Integrate

### Option 1: Manual BCC (Immediate)
When you send order confirmation emails, add this email to BCC field:
```
BCC: getlumbus.com+d39cc9736f@invite.trustpilot.com
```

Trustpilot will automatically:
1. Detect the customer email
2. Wait 5-7 days after purchase
3. Send review invitation to customer

---

### Option 2: Automated Integration (Recommended)

Update your email sending code to automatically BCC Trustpilot:

#### In `/lib/email.ts` or your email service:

```typescript
// Add to your order confirmation email function
async function sendOrderConfirmation(orderDetails: {
  customerEmail: string,
  orderId: string,
  // ... other details
}) {
  const emailContent = `
    <!-- Your order confirmation email -->
  `;

  // Send email with Trustpilot BCC
  await sendEmail({
    to: orderDetails.customerEmail,
    bcc: 'getlumbus.com+d39cc9736f@invite.trustpilot.com', // Trustpilot
    subject: 'Your Lumbus eSIM Order Confirmation',
    html: emailContent,
  });
}
```

---

### Option 3: Resend Integration (If using Resend)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Lumbus <orders@getlumbus.com>',
  to: customerEmail,
  bcc: 'getlumbus.com+d39cc9736f@invite.trustpilot.com',
  subject: 'Your eSIM is Ready!',
  html: orderConfirmationTemplate,
});
```

---

### Option 4: Stripe Integration (Alternative)

If you want Trustpilot to trigger from Stripe webhooks:

1. Go to Trustpilot dashboard
2. Navigate to Integrations
3. Select "Stripe"
4. Connect your Stripe account
5. Trustpilot will auto-invite customers after successful payment

---

## 📧 Which Emails to BCC

### ✅ DO BCC Trustpilot on:
- Order confirmation emails
- eSIM delivery emails
- Purchase receipt emails

### ❌ DON'T BCC Trustpilot on:
- Password reset emails
- Marketing emails
- Support tickets
- Abandoned cart emails

---

## ⚡ Quick Implementation (Copy-Paste)

Find where you send order confirmation emails in your code.

**Before**:
```typescript
sendEmail({
  to: customer.email,
  subject: 'Order Confirmation',
  // ...
})
```

**After**:
```typescript
sendEmail({
  to: customer.email,
  bcc: 'getlumbus.com+d39cc9736f@invite.trustpilot.com',
  subject: 'Order Confirmation',
  // ...
})
```

---

## 🎯 Benefits

### SEO Value:
- ✅ Backlink from Trustpilot (High Domain Authority)
- ✅ Rich snippets in Google (star ratings)
- ✅ Trust signals for customers
- ✅ Social proof for conversions

### Expected Results:
- Week 1-2: First reviews come in
- Month 1: 10-20 reviews (if you have orders)
- Month 3: 50+ reviews
- Goal: Maintain 4.5+ star rating

---

## 📊 Review Invitation Timeline

Trustpilot automatically:
1. **Day 0**: Customer receives order confirmation (you BCC Trustpilot)
2. **Day 5-7**: Trustpilot sends review invitation
3. **Day 10**: Follow-up reminder (if no review)
4. **Reviews appear on**:
   - Your Trustpilot profile
   - Google search results (via rich snippets)
   - Your website (if you add Trustpilot widget)

---

## 🎨 Add Trustpilot Widget to Website (Optional)

### Display Reviews on Homepage:

1. Go to Trustpilot dashboard → Get Reviews
2. Copy TrustBox widget code
3. Add to `/app/page.tsx`:

```typescript
// Add before closing </div> on homepage
<section className="py-20 px-4 bg-white">
  <div className="container mx-auto text-center">
    <h2 className="text-4xl font-black mb-8">WHAT CUSTOMERS SAY</h2>

    {/* Trustpilot Widget */}
    <div
      className="trustpilot-widget"
      data-locale="en-GB"
      data-template-id="YOUR_TEMPLATE_ID"
      data-businessunit-id="YOUR_BUSINESS_ID"
      data-style-height="240px"
      data-style-width="100%"
      data-theme="light"
    >
      <a
        href="https://uk.trustpilot.com/review/getlumbus.com"
        target="_blank"
        rel="noopener"
      >
        Trustpilot
      </a>
    </div>

    <script
      type="text/javascript"
      src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
      async
    />
  </div>
</section>
```

---

## 🚀 Next Steps

### Immediate (Today):
1. ✅ Save Trustpilot email in secure location
2. ✅ Add BCC to order confirmation emails
3. ✅ Test with a real order (use your own email)
4. ✅ Verify Trustpilot receives the email

### This Week:
1. Add Trustpilot widget to homepage
2. Claim your business profile on Trustpilot
3. Customize review invitation template
4. Set up email notifications for new reviews

### Ongoing:
1. Monitor reviews weekly
2. Respond to all reviews (good and bad)
3. Aim for 4.5+ star average
4. Feature best reviews on homepage

---

## 📝 Testing Checklist

Before going live, test the integration:

- [ ] Send test order confirmation to your email
- [ ] Verify BCC includes Trustpilot email
- [ ] Wait 5-7 days and check if you receive review invitation
- [ ] Leave a test review
- [ ] Verify review appears on Trustpilot profile
- [ ] Check if star rating appears in Google search

---

## 🎯 SEO Impact

### Google Search Results:
Once you have 5+ reviews, Google will show:
```
★★★★★ 5.0 (25 reviews)
Lumbus - Fast eSIM Store | Instant eSIMs for 150+ Countries
https://getlumbus.com
Get instant eSIMs for 150+ countries. Rated 5.0 by customers...
```

### Trust Signals:
- Increased click-through rate (CTR) by 20-30%
- Higher conversions (people trust reviews)
- Better Google rankings (Google favors sites with reviews)

---

## ⚠️ Important Notes

### Keep This Email Private:
- ❌ Don't share publicly
- ❌ Don't add to public GitHub
- ❌ Don't post on social media
- ✅ Add to `.env.local` if storing in code:
  ```
  TRUSTPILOT_BCC_EMAIL=getlumbus.com+d39cc9736f@invite.trustpilot.com
  ```

### Review Guidelines:
- Always respond to reviews (24-48 hours)
- Thank customers for positive reviews
- Address negative reviews professionally
- Never incentivize reviews (against Trustpilot TOS)
- Never write fake reviews

---

## 🔗 Trustpilot SEO Benefits Summary

### Domain Authority: 92
- One of the highest authority review sites
- Backlink from Trustpilot = major SEO boost

### Rich Snippets:
- Star ratings in Google search
- Review count displayed
- Increased visibility

### Trust Factor:
- Customers see social proof
- Conversion rate increases
- Return rate decreases

---

## 📞 Support

**Trustpilot Support**:
- Email: support@trustpilot.com
- Help Center: https://support.trustpilot.com/

**Your Business Page** (once live):
- https://uk.trustpilot.com/review/getlumbus.com

---

## ✅ Implementation Status

- [x] Trustpilot account created
- [x] Unique BCC email received
- [ ] Email integration added to code
- [ ] First test order sent
- [ ] First review received
- [ ] Widget added to website
- [ ] Star ratings appear in Google

---

**Add this integration NOW to start collecting reviews and building trust! 🌟**
