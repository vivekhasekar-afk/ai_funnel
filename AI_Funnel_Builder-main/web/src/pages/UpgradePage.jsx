// =============================================================================
// AI FUNNEL PLATFORM - Upgrade Page (Production Premium)
// =============================================================================

import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './UpgradePage.css';

const UpgradePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state || {};
  
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState('annual');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  // Pricing data
  const plans = {
    starter: {
      name: 'Starter',
      tagline: 'Perfect for getting started',
      monthlyPrice: 29,
      annualPrice: 290,
      savings: 20,
      features: [
        { name: 'Up to 5 active funnels', included: true },
        { name: '1,000 leads per month', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'Custom domain', included: true },
        { name: 'Basic integrations', included: true },
        { name: 'Advanced AI features', included: false },
        { name: 'Priority support', included: false },
        { name: 'Whitelabel', included: false },
      ],
      cta: 'Start 14-day trial',
      popular: false,
    },
    professional: {
      name: 'Professional',
      tagline: 'Most popular for growing teams',
      monthlyPrice: 79,
      annualPrice: 790,
      savings: 20,
      features: [
        { name: 'Unlimited funnels', included: true },
        { name: '10,000 leads per month', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Priority email & chat support', included: true },
        { name: 'Custom domains (unlimited)', included: true },
        { name: 'Advanced integrations', included: true },
        { name: 'AI strategy generator', included: true },
        { name: 'A/B testing', included: true },
        { name: 'Team collaboration (5 members)', included: true },
        { name: 'Whitelabel', included: false },
      ],
      cta: 'Start 14-day trial',
      popular: true,
    },
    enterprise: {
      name: 'Enterprise',
      tagline: 'For large-scale operations',
      monthlyPrice: 299,
      annualPrice: 2990,
      savings: 20,
      features: [
        { name: 'Everything in Professional, plus:', included: true, bold: true },
        { name: 'Unlimited leads', included: true },
        { name: 'Custom analytics dashboard', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'White-label solution', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SLA guarantee', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Advanced security features', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  };

  const currentTier = (state.currentTier || user?.subscription_tier || 'free').toLowerCase();
  const requiredTier = (state.requiredTier || 'professional').toLowerCase();

  const getPrice = (plan) => {
    return billingCycle === 'annual' 
      ? plans[plan].annualPrice 
      : plans[plan].monthlyPrice;
  };

  const getMonthlyPrice = (plan) => {
    return billingCycle === 'annual' 
      ? plans[plan].annualPrice / 12 
      : plans[plan].monthlyPrice;
  };

  const handleUpgrade = (plan) => {
    // Navigate to checkout or payment page
    navigate('/checkout', { 
      state: { 
        plan, 
        billingCycle,
        from: location.state?.from 
      } 
    });
  };

  return (
    <div className={`upgrade-page ${isAnimating ? 'is-animating' : ''}`}>
      {/* Background Elements */}
      <div className="upgrade-bg">
        <div className="upgrade-bg-gradient upgrade-bg-gradient--1"></div>
        <div className="upgrade-bg-gradient upgrade-bg-gradient--2"></div>
        <div className="upgrade-bg-grid"></div>
      </div>

      {/* Header */}
      <div className="upgrade-header">
        <button className="upgrade-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      {/* Hero Section */}
      <div className="upgrade-hero">
        <div className="upgrade-hero-badge">
          <svg className="upgrade-hero-badge-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>Unlock Premium Features</span>
        </div>

        <h1 className="upgrade-hero-title">
          Upgrade to <span className="upgrade-hero-title-gradient">{plans[requiredTier]?.name}</span>
        </h1>
        
        <p className="upgrade-hero-subtitle">
          {state.currentTier ? (
            <>You're currently on the <strong>{currentTier}</strong> plan. Upgrade to unlock advanced features and scale your funnels.</>
          ) : (
            <>Choose the perfect plan for your business needs and start growing today.</>
          )}
        </p>

        {/* Billing Toggle */}
        <div className="upgrade-billing-toggle">
          <button
            className={`upgrade-billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`upgrade-billing-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="upgrade-billing-badge">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="upgrade-plans">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`upgrade-plan ${plan.popular ? 'upgrade-plan--popular' : ''} ${
              selectedPlan === key ? 'upgrade-plan--selected' : ''
            }`}
            onClick={() => setSelectedPlan(key)}
          >
            {plan.popular && (
              <div className="upgrade-plan-badge">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Most Popular
              </div>
            )}

            <div className="upgrade-plan-header">
              <h3 className="upgrade-plan-name">{plan.name}</h3>
              <p className="upgrade-plan-tagline">{plan.tagline}</p>
            </div>

            <div className="upgrade-plan-pricing">
              <div className="upgrade-plan-price">
                <span className="upgrade-plan-price-currency">$</span>
                <span className="upgrade-plan-price-amount">
                  {Math.floor(getMonthlyPrice(key))}
                </span>
                <span className="upgrade-plan-price-period">/month</span>
              </div>
              {billingCycle === 'annual' && (
                <div className="upgrade-plan-price-note">
                  Billed ${getPrice(key)} annually
                </div>
              )}
            </div>

            <button
              className={`upgrade-plan-cta ${plan.popular ? 'upgrade-plan-cta--popular' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleUpgrade(key);
              }}
            >
              {plan.cta}
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="upgrade-plan-features">
              <ul className="upgrade-plan-features-list">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`upgrade-plan-feature ${
                      !feature.included ? 'upgrade-plan-feature--disabled' : ''
                    } ${feature.bold ? 'upgrade-plan-feature--bold' : ''}`}
                  >
                    {feature.included ? (
                      <svg className="upgrade-plan-feature-icon upgrade-plan-feature-icon--check" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="upgrade-plan-feature-icon upgrade-plan-feature-icon--cross" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="upgrade-trust">
        <div className="upgrade-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>14-day money-back guarantee</strong>
            <p>No questions asked</p>
          </div>
        </div>
        <div className="upgrade-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <div>
            <strong>Cancel anytime</strong>
            <p>No long-term contracts</p>
          </div>
        </div>
        <div className="upgrade-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>24/7 support</strong>
            <p>We're here to help</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="upgrade-faq">
        <h2 className="upgrade-faq-title">Frequently Asked Questions</h2>
        <div className="upgrade-faq-grid">
          <div className="upgrade-faq-item">
            <h3>Can I change plans later?</h3>
            <p>Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate the difference.</p>
          </div>
          <div className="upgrade-faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
          </div>
          <div className="upgrade-faq-item">
            <h3>Is there a setup fee?</h3>
            <p>No setup fees. Ever. Just pay for your subscription and start building immediately.</p>
          </div>
          <div className="upgrade-faq-item">
            <h3>Do you offer discounts for nonprofits?</h3>
            <p>Yes! Nonprofits and educational institutions qualify for 30% off. Contact us for details.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="upgrade-footer">
        <div className="upgrade-footer-content">
          <h3>Still have questions?</h3>
          <p>Our team is here to help you choose the right plan</p>
          <div className="upgrade-footer-actions">
            <button 
              className="upgrade-footer-btn upgrade-footer-btn--primary"
              onClick={() => navigate('/contact')}
            >
              Talk to Sales
            </button>
            <button 
              className="upgrade-footer-btn upgrade-footer-btn--secondary"
              onClick={() => navigate('/demo')}
            >
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
