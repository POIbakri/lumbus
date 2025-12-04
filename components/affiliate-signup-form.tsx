'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function AffiliateSignupForm() {
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    website: '',
    audience_description: '',
    traffic_sources: '',
    promotional_methods: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <Card className="bg-mint border-4 border-primary shadow-2xl">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase mb-4">
            APPLICATION SUBMITTED!
          </h3>
          <p className="text-base sm:text-lg font-bold text-foreground/70 mb-6">
            Thank you for applying to the Lumbus Affiliate Program. We'll review your application and get back to you within 1-2 business days at <strong>{formData.email}</strong>.
          </p>
          <div className="bg-yellow/30 border-2 border-yellow rounded-xl p-4 sm:p-6">
            <p className="font-black uppercase text-sm sm:text-base mb-2">WHAT'S NEXT?</p>
            <ul className="text-left font-bold text-sm sm:text-base text-foreground/80 space-y-2">
              <li>✓ We'll review your application</li>
              <li>✓ You'll receive an email with our decision</li>
              <li>✓ Once approved, you'll get access to your affiliate dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-4 border-primary shadow-2xl">
      <CardContent className="p-6 sm:p-8 md:p-10">
        <div className="mb-6 sm:mb-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3">
            APPLY NOW
          </h3>
          <p className="text-sm sm:text-base font-bold text-foreground/70">
            Fill out the form below to join our affiliate program
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Display Name */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              Your Name / Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="John Doe / Travel Blog"
              required
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              Website / Social Media Profile
            </label>
            <Input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com or @yourusername"
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg"
            />
            <p className="text-xs font-bold text-foreground/60 mt-1">
              Your blog, YouTube channel, Instagram, TikTok, etc.
            </p>
          </div>

          {/* Audience Description */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              Describe Your Audience <span className="text-red-500">*</span>
            </label>
            <textarea
              name="audience_description"
              value={formData.audience_description}
              onChange={handleChange}
              placeholder="Tell us about your audience: who they are, their interests, demographics, etc."
              required
              rows={4}
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg resize-none"
            />
          </div>

          {/* Traffic Sources */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              Traffic Sources <span className="text-red-500">*</span>
            </label>
            <textarea
              name="traffic_sources"
              value={formData.traffic_sources}
              onChange={handleChange}
              placeholder="Where does your traffic come from? (e.g., Instagram 10K followers, blog with 50K monthly visitors, YouTube 5K subscribers)"
              required
              rows={3}
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg resize-none"
            />
          </div>

          {/* Promotional Methods */}
          <div>
            <label className="block font-black uppercase text-xs sm:text-sm mb-2">
              How Will You Promote Lumbus? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="promotional_methods"
              value={formData.promotional_methods}
              onChange={handleChange}
              placeholder="Describe your promotion strategy (e.g., blog reviews, social media posts, email newsletters, comparison articles, YouTube videos)"
              required
              rows={4}
              className="w-full px-4 py-3 text-sm sm:text-base font-bold border-2 border-foreground/10 rounded-lg resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <p className="font-bold text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-white hover:bg-foreground/90 font-black text-base sm:text-lg px-8 py-6 rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </Button>

          <p className="text-xs sm:text-sm font-bold text-foreground/60 text-center">
            By submitting this form, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
