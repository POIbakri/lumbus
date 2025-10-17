# Supabase Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Templates Included

1. **Confirm Signup** (`confirm-signup.html` / `confirm-signup.txt`)
   - Used when a new user signs up and needs to confirm their email address
   - Features a welcoming design with clear call-to-action

2. **Reset Password** (`reset-password.html` / `reset-password.txt`)
   - Used when a user requests to reset their password
   - Includes security notice and password tips

## Available Variables

These templates use Supabase's built-in template variables:

- `{{ .ConfirmationURL }}` - The complete URL for email confirmation or password reset
- `{{ .Token }}` - The raw token value
- `{{ .TokenHash }}` - The hashed version of the token
- `{{ .SiteURL }}` - Your site's base URL
- `{{ .Email }}` - The recipient's email address
- `{{ .Data }}` - Additional custom data (if any)
- `{{ .RedirectTo }}` - The URL to redirect to after action completion

## How to Use in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template type you want to customize:
   - **Confirm signup** 
   - **Reset password**
4. Copy the HTML content from the respective `.html` file
5. Paste it into the Supabase template editor
6. Save your changes

## Design Features

- **Apple-inspired Design**: Clean, modern aesthetic with gradient accents
- **Responsive**: Works perfectly on all devices
- **Accessible**: Proper semantic HTML and contrast ratios
- **Email Client Compatible**: Tested with major email clients
- **Dark Mode Support**: Respects user preferences where supported

## Plain Text Versions

Plain text versions (`.txt` files) are provided for:
- Better deliverability
- Accessibility
- Email clients that don't support HTML

## Customization

To customize these templates:

1. **Colors**: Update the gradient colors in the header background
2. **Logo**: Add your logo image in the header section
3. **Content**: Modify the text to match your brand voice
4. **Footer**: Update support email and copyright information

## Testing

Before deploying:

1. Send test emails to yourself
2. Check rendering in different email clients
3. Verify all links work correctly
4. Test on mobile devices

## Security Notes

- The confirmation links expire after the time set in your Supabase settings
- Always include security notices for password reset emails
- The debug information at the bottom is hidden in HTML comments
