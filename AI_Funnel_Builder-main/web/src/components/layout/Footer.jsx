// =============================================================================
// AI FUNNEL PLATFORM - Footer Component (Self-Contained)
// =============================================================================
// Footer with links, social media, newsletter, and multi-column layout
// Depends on: Button, Input components from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const FOOTER_STYLES = `
/* Footer Container */
.footer {
  background-color: #111827;
  color: #d1d5db;
  border-top: 1px solid #1f2937;
}

.footer--light {
  background-color: #f9fafb;
  color: #6b7280;
  border-top-color: #e5e7eb;
}

/* Footer Inner */
.footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.footer--compact .footer__inner {
  padding: 2rem 2rem;
}

/* Footer Top */
.footer__top {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 3rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid #1f2937;
}

.footer--light .footer__top {
  border-bottom-color: #e5e7eb;
}

.footer--compact .footer__top {
  gap: 2rem;
  padding-bottom: 2rem;
}

/* Brand Section */
.footer__brand {
  grid-column: span 1;
}

.footer__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  text-decoration: none;
  color: inherit;
}

.footer__logo-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.footer__logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.footer--light .footer__logo-text {
  color: #111827;
}

.footer__tagline {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #9ca3af;
  margin: 0 0 1.5rem 0;
  max-width: 280px;
}

.footer--light .footer__tagline {
  color: #6b7280;
}

/* Social Links */
.footer__social {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #1f2937;
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.footer__social-link:hover {
  background-color: #374151;
  color: #ffffff;
  transform: translateY(-2px);
}

.footer--light .footer__social-link {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.footer--light .footer__social-link:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.footer__social-link svg {
  width: 20px;
  height: 20px;
}

/* Footer Column */
.footer__column {
  display: flex;
  flex-direction: column;
}

.footer__column-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.footer--light .footer__column-title {
  color: #111827;
}

.footer__links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer__link {
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__link:hover {
  color: #ffffff;
}

.footer--light .footer__link {
  color: #6b7280;
}

.footer--light .footer__link:hover {
  color: #111827;
}

.footer__link-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #3b82f6;
  color: #ffffff;
  border-radius: 9999px;
  line-height: 1;
}

/* Newsletter Section */
.footer__newsletter {
  grid-column: span 1;
}

.footer__newsletter-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
}

.footer--light .footer__newsletter-title {
  color: #111827;
}

.footer__newsletter-description {
  font-size: 0.875rem;
  color: #9ca3af;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.footer--light .footer__newsletter-description {
  color: #6b7280;
}

.footer__newsletter-form {
  display: flex;
  gap: 0.5rem;
}

.footer__newsletter-input {
  flex: 1;
}

.footer__newsletter-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #064e3b;
  border: 1px solid #065f46;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #d1fae5;
}

.footer--light .footer__newsletter-success {
  background-color: #d1fae5;
  border-color: #a7f3d0;
  color: #065f46;
}

.footer__newsletter-success svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Footer Bottom */
.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding-top: 2rem;
  flex-wrap: wrap;
}

.footer--compact .footer__bottom {
  padding-top: 1.5rem;
}

.footer__copyright {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.footer__bottom-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer__bottom-link {
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.footer__bottom-link:hover {
  color: #ffffff;
}

.footer--light .footer__bottom-link {
  color: #6b7280;
}

.footer--light .footer__bottom-link:hover {
  color: #111827;
}

/* Language Selector */
.footer__language {
  position: relative;
}

.footer__language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.footer__language-button:hover {
  background-color: #374151;
  border-color: #4b5563;
}

.footer--light .footer__language-button {
  background-color: #ffffff;
  border-color: #d1d5db;
  color: #374151;
}

.footer--light .footer__language-button:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.footer__language-button svg {
  width: 16px;
  height: 16px;
}

/* Badge */
.footer__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  font-size: 0.813rem;
  color: #d1d5db;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.footer__badge:hover {
  background-color: #374151;
  border-color: #4b5563;
}

.footer--light .footer__badge {
  background-color: #ffffff;
  border-color: #e5e7eb;
  color: #6b7280;
}

.footer--light .footer__badge:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.footer__badge svg {
  width: 20px;
  height: 20px;
}

/* Responsive */
@media (max-width: 1024px) {
  .footer__top {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .footer__brand {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .footer__inner {
    padding: 2rem 1.5rem;
  }
  
  .footer__top {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer__brand {
    grid-column: span 1;
  }
  
  .footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .footer__bottom-links {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .footer__newsletter-form {
    flex-direction: column;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .footer__social-link,
  .footer__link,
  .footer__bottom-link,
  .footer__language-button,
  .footer__badge {
    transition: none;
  }
  
  .footer__social-link:hover {
    transform: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'footer');
  styleElement.textContent = FOOTER_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const GlobeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Social Media Icons
const SocialIcons = {
  twitter: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
  ),
  linkedin: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  ),
  facebook: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
  ),
  youtube: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
    </svg>
  ),
  instagram: (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  ),
};

// =============================================================================
// FOOTER COMPONENT
// =============================================================================

const Footer = ({
  // Branding
  logo,
  logoText = 'AI Funnel',
  tagline = 'Build intelligent funnels that convert.',
  
  // Links
  columns = [],
  
  // Social Media
  socialLinks = [],
  
  // Newsletter
  showNewsletter = true,
  newsletterTitle = 'Stay Updated',
  newsletterDescription = 'Get the latest updates and insights delivered to your inbox.',
  onNewsletterSubmit,
  
  // Bottom
  copyright,
  bottomLinks = [],
  
  // Language
  showLanguage = false,
  currentLanguage = 'English',
  
  // Styling
  variant = 'dark',
  compact = false,
  
  // Custom
  children,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [email, setEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || newsletterLoading) return;

    setNewsletterLoading(true);
    try {
      if (onNewsletterSubmit) {
        await onNewsletterSubmit(email);
      }
      setNewsletterSuccess(true);
      setEmail('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const footerClasses = [
    'footer',
    `footer--${variant}`,
    compact && 'footer--compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <footer className={footerClasses} {...props}>
      <div className="footer__inner">
        {/* Footer Top */}
        <div className="footer__top">
          {/* Brand Section */}
          <div className="footer__brand">
            <a href="/" className="footer__logo">
              {logo && (
                typeof logo === 'string' ? (
                  <img src={logo} alt={logoText} className="footer__logo-image" />
                ) : (
                  logo
                )
              )}
              <span className="footer__logo-text">{logoText}</span>
            </a>
            {tagline && <p className="footer__tagline">{tagline}</p>}
            
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="footer__social">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer__social-link"
                    aria-label={social.label}
                  >
                    {SocialIcons[social.icon] || social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index} className="footer__column">
              <h4 className="footer__column-title">{column.title}</h4>
              <ul className="footer__links">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href={link.url} className="footer__link">
                      {link.label}
                      {link.badge && (
                        <span className="footer__link-badge">{link.badge}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Section */}
          {showNewsletter && (
            <div className="footer__newsletter">
              <h4 className="footer__newsletter-title">{newsletterTitle}</h4>
              {newsletterDescription && (
                <p className="footer__newsletter-description">
                  {newsletterDescription}
                </p>
              )}
              
              {newsletterSuccess ? (
                <div className="footer__newsletter-success">
                  <CheckIcon />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="footer__newsletter-form">
                  <div className="footer__newsletter-input">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={newsletterLoading}
                  >
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Custom Children */}
          {children}
        </div>

        {/* Footer Bottom */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            {copyright || `© ${currentYear} ${logoText}. All rights reserved.`}
          </p>

          {/* Bottom Links */}
          {bottomLinks.length > 0 && (
            <ul className="footer__bottom-links">
              {bottomLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.url} className="footer__bottom-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Language Selector */}
          {showLanguage && (
            <div className="footer__language">
              <button className="footer__language-button">
                <GlobeIcon />
                <span>{currentLanguage}</span>
                <ChevronDownIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Footer.propTypes = {
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  logoText: PropTypes.string,
  tagline: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
          badge: PropTypes.string,
        })
      ).isRequired,
    })
  ),
  socialLinks: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      url: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  showNewsletter: PropTypes.bool,
  newsletterTitle: PropTypes.string,
  newsletterDescription: PropTypes.string,
  onNewsletterSubmit: PropTypes.func,
  copyright: PropTypes.string,
  bottomLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
  showLanguage: PropTypes.bool,
  currentLanguage: PropTypes.string,
  variant: PropTypes.oneOf(['dark', 'light']),
  compact: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Footer;
export { Footer };
