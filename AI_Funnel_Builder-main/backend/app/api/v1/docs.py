"""
OpenAPI Tags Metadata - Enterprise FunnelML API
===============================================
Production-grade OpenAPI v3.1 tags with descriptions, external docs, and
grouping for all API endpoints. Used by FastAPI openapi_tags parameter.

🎯 FEATURES:
- 18+ organized tag groups
- Rich descriptions with Markdown
- External documentation links
- Feature flag references
- Security & compliance tags
- ML/AI endpoint grouping
- Production SLA annotations
"""

from typing import List, Dict, Any

tags_metadata: List[Dict[str, Any]] = [
    {
        "name": "health",
        "description": "**Service Health & Monitoring**",
        "externalDocs": {
            "description": "Kubernetes Probes Guide",
            "url": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"
        }
    },
    {
        "name": "auth",
        "description": "**Authentication & Authorization**<br/>JWT, API Keys, OAuth2, RBAC",
        "externalDocs": {
            "description": "Auth Documentation",
            "url": "https://funnelml.com/docs/auth"
        }
    },
    {
        "name": "users",
        "description": "**User Management**<br/>CRUD, profiles, permissions, GDPR deletion",
        "externalDocs": {
            "description": "User API Reference",
            "url": "https://funnelml.com/api/users"
        }
    },
    {
        "name": "funnels",
        "description": "**AI Funnels**<br/>Create, optimize, A/B test, analytics",
        "externalDocs": {
            "description": "Funnel Builder Guide",
            "url": "https://funnelml.com/docs/funnels"
        }
    },
    {
        "name": "templates",
        "description": "**Funnel Templates**<br/>Browse, customize, premium templates",
        "externalDocs": {
            "description": "Template Gallery",
            "url": "https://funnelml.com/templates"
        }
    },
    {
        "name": "questions",
        "description": "**Smart Questions**<br/>Generate, optimize, A/B test questions",
        "externalDocs": {
            "description": "Question Engine",
            "url": "https://funnelml.com/docs/questions"
        }
    },
    {
        "name": "leads",
        "description": "**Lead Management**<br/>Scoring, enrichment, qualification, CRM sync",
        "externalDocs": {
            "description": "Lead Scoring ML",
            "url": "https://funnelml.com/docs/leads"
        }
    },
    {
        "name": "analytics",
        "description": "**Real-time Analytics**<br/>Completion rates, drop-off analysis, heatmaps",
        "externalDocs": {
            "description": "Analytics Dashboard",
            "url": "https://funnelml.com/docs/analytics"
        }
    },
    {
        "name": "ai",
        "description": "**AI/ML Endpoints**<br/>**🚀 GPT-4o + Llama 3.1**<br/>Funnel generation, question optimization, lead scoring",
        "externalDocs": {
            "description": "AI Platform Docs",
            "url": "https://funnelml.com/docs/ai"
        }
    },
    {
        "name": "ml-models",
        "description": "**Machine Learning**<br/>Model serving, explainability, retraining triggers",
        "externalDocs": {
            "description": "ML Platform",
            "url": "https://funnelml.com/docs/mlops"
        }
    },
    {
        "name": "ab-testing",
        "description": "**A/B Testing**<br/>Automated experiments, statistical significance, winner selection",
        "externalDocs": {
            "description": "Experimentation Guide",
            "url": "https://funnelml.com/docs/ab-testing"
        }
    },
    {
        "name": "webhooks",
        "description": "**Webhooks & Integrations**<br/>CRM sync, Slack, Zapier, custom endpoints",
        "externalDocs": {
            "description": "Integrations",
            "url": "https://funnelml.com/docs/webhooks"
        }
    },
    {
        "name": "billing",
        "description": "**Billing & Subscriptions**<br/>Usage tracking, invoices, Stripe integration",
        "externalDocs": {
            "description": "Pricing & Billing",
            "url": "https://funnelml.com/pricing"
        }
    },
    {
        "name": "admin",
        "description": "**Admin Dashboard**<br/>🔐 **Admin Only**<br/>Users, usage, system config, feature flags",
        "externalDocs": {
            "description": "Admin Guide",
            "url": "https://funnelml.com/admin/docs"
        }
    },
    {
        "name": "feature-flags",
        "description": "**Feature Flags**<br/>LaunchDarkly integration, canary releases, A/B experiments",
        "externalDocs": {
            "description": "Feature Management",
            "url": "https://funnelml.com/docs/feature-flags"
        }
    },
    {
        "name": "compliance",
        "description": "**GDPR/CCPA Compliance**<br/>Data deletion, consent management, audit logs",
        "externalDocs": {
            "description": "Privacy Policy",
            "url": "https://funnelml.com/privacy"
        }
    },
    {
        "name": "metrics",
        "description": "**Observability**<br/>Prometheus, Grafana, tracing, service health",
        "externalDocs": {
            "description": "Monitoring Guide",
            "url": "https://funnelml.com/docs/observability"
        }
    },
    {
        "name": "info",
        "description": "**API Information**<br/>Version, status, OpenAPI spec",
        "externalDocs": {
            "description": "API Reference",
            "url": "https://funnelml.com/api"
        }
    },
    {
        "name": "root",
        "description": "**API Root**<br/>Entry points and redirects",
        "externalDocs": {
            "description": "Getting Started",
            "url": "https://funnelml.com/docs/getting-started"
        }
    }
]

# Backward compatibility
TagsMetadata = tags_metadata

__all__ = ["tags_metadata", "TagsMetadata"]
