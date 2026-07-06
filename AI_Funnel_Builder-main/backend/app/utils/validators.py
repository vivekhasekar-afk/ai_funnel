# =============================================================================
# AI FUNNEL BUILDER - VALIDATORS
# =============================================================================
# Input validation utilities
# =============================================================================

import re
import json
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
import bleach
from email_validator import validate_email as validate_email_lib, EmailNotValidError
import phonenumbers

from app.utils.exceptions import ValidationException

# =============================================================================
# READABILITY VALIDATION (MISSING FUNCTION)
# =============================================================================

def validate_readability_score(text: str) -> float:
    """
    Simple readability score without external dependencies.
    Uses sentence length and word complexity as proxy for Flesch Reading Ease.
    
    Args:
        text: Input text to analyze
        
    Returns:
        Readability score (0-100, higher = easier to read)
        
    Raises:
        ValueError: If text is too short
    """
    if len(text) < 50:
        raise ValueError("Text must be at least 50 characters for readability analysis")
    
    # Count sentences and words
    sentences = len(re.split(r'[.!?]+', text))
    words = len(re.split(r'\s+', text))
    chars = len(text)
    
    if sentences == 0 or words == 0:
        return 100.0
    
    # Simple Flesch-like formula: 200 - ASL - ASW*30 (adjusted for scale 0-100)
    avg_sentence_length = words / sentences
    avg_syllables_per_word = chars / words * 0.3  # Rough syllable estimate
    
    score = 200 - avg_sentence_length - avg_syllables_per_word * 30
    return max(0, min(100, round(score, 2)))

def get_readability_grade(score: float) -> str:
    """Convert readability score to human-readable grade."""
    if score >= 90:
        return "Very Easy (5th grade)"
    elif score >= 80:
        return "Easy (6th grade)"
    elif score >= 70:
        return "Fairly Easy (7th grade)"
    elif score >= 60:
        return "Standard (8th-9th grade)"
    elif score >= 50:
        return "Fairly Difficult (10th-12th grade)"
    elif score >= 30:
        return "Difficult (college)"
    else:
        return "Very Difficult (college graduate)"

# =============================================================================
# EMAIL VALIDATION
# =============================================================================

def validate_email(email: str, check_deliverability: bool = False) -> str:
    """
    Validate email address.
    
    Args:
        email: Email address to validate
        check_deliverability: Check if domain has MX records
    
    Returns:
        Normalized email address
    
    Raises:
        ValidationException: If email is invalid
    """
    if not email:
        raise ValidationException("Email address is required", field="email")
    
    try:
        # Use email-validator library
        validation = validate_email_lib(
            email,
            check_deliverability=check_deliverability
        )
        return validation.normalized
    except EmailNotValidError as e:
        raise ValidationException(
            f"Invalid email address: {str(e)}",
            field="email",
            details={"email": email}
        )

def is_disposable_email(email: str) -> bool:
    """
    Check if email is from a disposable email provider.
    """
    # Common disposable email domains
    disposable_domains = {
        "tempmail.com",
        "guerrillamail.com",
        "mailinator.com",
        "10minutemail.com",
        "throwaway.email",
        "temp-mail.org",
        "fakeinbox.com",
        "yopmail.com",
        "maildrop.cc",
        "trashmail.com",
    }
    
    domain = email.split("@")[-1].lower()
    return domain in disposable_domains

# =============================================================================
# URL VALIDATION
# =============================================================================

def validate_url(
    url: str,
    require_https: bool = False,
    allowed_schemes: Optional[List[str]] = None
) -> str:
    """
    Validate URL format.
    """
    if not url:
        raise ValidationException("URL is required", field="url")
    
    # Default allowed schemes
    if allowed_schemes is None:
        allowed_schemes = ["http", "https"]
    
    try:
        parsed = urlparse(url)
        
        # Check scheme
        if not parsed.scheme:
            raise ValidationException(
                "URL must include a scheme (http:// or https://)",
                field="url"
            )
        
        if parsed.scheme not in allowed_schemes:
            raise ValidationException(
                f"URL scheme must be one of: {', '.join(allowed_schemes)}",
                field="url"
            )
        
        # Check HTTPS requirement
        if require_https and parsed.scheme != "https":
            raise ValidationException(
                "URL must use HTTPS",
                field="url"
            )
        
        # Check netloc (domain)
        if not parsed.netloc:
            raise ValidationException(
                "URL must include a domain",
                field="url"
            )
        
        return url
        
    except ValidationException:
        raise
    except Exception as e:
        raise ValidationException(
            f"Invalid URL format: {str(e)}",
            field="url"
        )

def is_safe_redirect_url(url: str, allowed_hosts: Optional[List[str]] = None) -> bool:
    """
    Check if URL is safe for redirect (prevent open redirect).
    """
    if not url:
        return False
    
    # Relative URLs are safe
    if url.startswith("/") and not url.startswith("//"):
        return True
    
    # If no allowed hosts specified, reject absolute URLs
    if allowed_hosts is None:
        return False
    
    try:
        parsed = urlparse(url)
        return parsed.netloc in allowed_hosts
    except Exception:
        return False

# =============================================================================
# SLUG VALIDATION
# =============================================================================

def validate_slug(slug: str, min_length: int = 3, max_length: int = 100) -> str:
    """
    Validate slug format (URL-friendly identifier).
    """
    if not slug:
        raise ValidationException("Slug is required", field="slug")
    
    # Check length
    if len(slug) < min_length:
        raise ValidationException(
            f"Slug must be at least {min_length} characters",
            field="slug"
        )
    
    if len(slug) > max_length:
        raise ValidationException(
            f"Slug must be at most {max_length} characters",
            field="slug"
        )
    
    # Check format (lowercase letters, numbers, hyphens)
    slug_pattern = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    if not re.match(slug_pattern, slug):
        raise ValidationException(
            "Slug can only contain lowercase letters, numbers, and hyphens",
            field="slug"
        )
    
    # Cannot start or end with hyphen
    if slug.startswith("-") or slug.endswith("-"):
        raise ValidationException(
            "Slug cannot start or end with a hyphen",
            field="slug"
        )
    
    return slug

def generate_slug_from_text(text: str, max_length: int = 100) -> str:
    """
    Generate URL-friendly slug from text.
    """
    if not text:
        return ""
    
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces and underscores with hyphens
    slug = re.sub(r"[\s_]+", "-", slug)
    
    # Remove non-alphanumeric characters (except hyphens)
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    
    # Remove consecutive hyphens
    slug = re.sub(r"-+", "-", slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip("-")
    
    # Truncate to max length
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip("-")
    
    return slug or "untitled"

# =============================================================================
# COLOR VALIDATION
# =============================================================================

def validate_color_hex(color: str) -> str:
    """
    Validate hex color code.
    """
    if not color:
        raise ValidationException("Color is required", field="color")
    
    # Remove # if present
    color_clean = color.lstrip("#")
    
    # Check format (3 or 6 hex digits)
    if not re.match(r"^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$", color_clean):
        raise ValidationException(
            "Color must be a valid hex code (e.g., #FF5733 or #F57)",
            field="color"
        )
    
    # Expand 3-digit format to 6-digit
    if len(color_clean) == 3:
        color_clean = "".join([c * 2 for c in color_clean])
    
    return f"#{color_clean.upper()}"

def validate_psychology_principles(text: str) -> bool:
    """
    Validates if the provided question or text aligns with solid psychological principles,
    helping avoid common survey pitfalls such as leading questions, double-barreled items,
    complex or biased language.

    Args:
        text: The question or prompt text to validate.

    Returns:
        True if the text passes validation.

    Raises:
        ValidationException: If the text violates psychological best practices.
    """

    if not text or not text.strip():
        raise ValidationException("Question text cannot be empty", field="text")

    lowered_text = text.lower()

    # 1. Check for leading and loaded question phrases
    leading_phrases = [
        r"wouldn't you agree",
        r"isn't it true",
        r"don't you think",
        r"you must",
        r"everyone knows",
        r"always",
        r"never",
        r"obviously",
        r"agree that",
        r"clearly",
        r"right\\?",
        r"correct\\?",
    ]
    for phrase in leading_phrases:
        if re.search(phrase, lowered_text):
            clean_phrase = phrase.replace(r'\\', '?')  # Clean regex for display
            raise ValidationException(
                f"Question contains leading or biased phrase: '{clean_phrase}'. Consider neutral wording.",
                field="text"
            )

    # 2. Check for double-barreled questions
    double_barrel_pattern = r".+\\band\\b.+\\b.+"
    if re.search(double_barrel_pattern, lowered_text):
        parts = re.split(r"\band\b|\bor\b", lowered_text)
        if len(parts) > 1 and all(len(part.strip().split()) > 3 for part in parts):
            raise ValidationException(
                "Question appears to be double-barreled (asks two questions in one). Split into separate questions.",
                field="text"
            )

    # 3. Check for excessive complexity
    max_commas_allowed = 2
    comma_count = text.count(",")
    if comma_count > max_commas_allowed:
        raise ValidationException(
            f"Question is too complex (contains {comma_count} commas). Consider simplifying.",
            field="text"
        )

    # 4. Check for negative phrasing and double negatives
    negative_phrases = [
        r"not un",
        r"can't not",
        r"don't not",
        r"never not",
        r"hardly",
        r"scarcely",
        r"rarely",
        r"no one",
        r"none of",
    ]
    for phrase in negative_phrases:
        if re.search(phrase, lowered_text):
            raise ValidationException(
                f"Question contains negative or double negative phrasing: '{phrase}'. Simplify to positive statements.",
                field="text"
            )

    # 5. Check sentence length (optimal: 5-20 words)
    words = text.strip().split()
    if len(words) < 5:
        raise ValidationException(
            "Question is too short to be clear; aim for at least 5 words.",
            field="text"
        )
    if len(words) > 20:
        raise ValidationException(
            "Question is too long; try to keep it under 20 words for clarity.",
            field="text"
        )

    return True

def validate_engagement_techniques(text: str) -> bool:
    """
    Validates if question text incorporates engagement-enhancing techniques
    while avoiding manipulative or low-quality engagement tactics.
    
    Checks for:
    - Positive open-ended phrasing
    - Curiosity gap (without clickbait)
    - Personal relevance triggers
    - Avoids guilt-tripping or urgency manipulation
    
    Args:
        text: Question text to analyze
        
    Returns:
        True if engagement techniques are appropriate
        
    Raises:
        ValidationException: If engagement techniques are problematic
    """
    if not text or not text.strip():
        raise ValidationException("Question text cannot be empty", field="text")
    
    lowered_text = text.lower()
    
    # ✅ GOOD ENGAGEMENT TECHNIQUES (encouraged but not required)
    good_patterns = [
        r"your.*(experience|opinion|thoughts)",  # Personal relevance
        r"(tell me|share|what do you)",          # Open-ended invitation
        r"(favorite|best|love|enjoy)",           # Positive emotional triggers
    ]
    
    # ❌ PROBLEMATIC ENGAGEMENT TACTICS (blocked)
    bad_engagement = [
        r"hurry up",                             # False urgency
        r"limited time",                         # Fake scarcity
        r"don't miss out",                       # FOMO manipulation
        r"only.*left",                           # Artificial scarcity
        r"act now",                              # Pressure tactics
        r"exclusive.*offer",                     # Bait tactics
        r"secret.*revealed",                     # Clickbait curiosity
    ]
    
    # Check for manipulative engagement tactics
    for pattern in bad_engagement:
        if re.search(pattern, lowered_text):
            raise ValidationException(
                f"Question uses manipulative engagement tactic: '{pattern}'. "
                f"Use authentic curiosity instead of pressure tactics.",
                field="text"
            )
    
    # Check for lack of engagement entirely (too clinical)
    engagement_score = sum(1 for pattern in good_patterns if re.search(pattern, lowered_text))
    if engagement_score == 0:
        # Warning but not blocking (optional enhancement)
        print("INFO: Question could be more engaging with personal pronouns or open-ended phrasing")
    
    return True

# =============================================================================
# PHONE VALIDATION (SIMPLIFIED - NO EXTERNAL DEPENDENCIES)
# =============================================================================

def validate_phone(phone: str, region: Optional[str] = None) -> str:
    """
    Basic phone number validation (no external dependencies).
    """
    if not phone:
        raise ValidationException("Phone number is required", field="phone")
    
    # Remove common formatting characters
    clean_phone = re.sub(r"[\s\-\(\)\.]+", "", phone)
    
    # Basic validation: 10-15 digits, optional + prefix
    if not re.match(r"^\+?[0-9]{10,15}$", clean_phone):
        raise ValidationException(
            "Invalid phone number format",
            field="phone"
        )
    
    return clean_phone

# =============================================================================
# HTML SANITIZATION
# =============================================================================

def sanitize_html(
    html: str,
    allowed_tags: Optional[List[str]] = None,
    allowed_attributes: Optional[Dict[str, List[str]]] = None,
    strip: bool = False
) -> str:
    """
    Sanitize HTML content to prevent XSS.
    """
    if not html:
        return ""
    
    # Default allowed tags (safe subset)
    if allowed_tags is None:
        allowed_tags = [
            "p", "br", "strong", "em", "u", "a", "ul", "ol", "li",
            "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre"
        ]
    
    # Default allowed attributes
    if allowed_attributes is None:
        allowed_attributes = {
            "a": ["href", "title", "target"],
            "*": ["class"],
        }
    
    # Use bleach to sanitize
    cleaned = bleach.clean(
        html,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=strip,
    )
    
    return cleaned

def strip_html(html: str) -> str:
    """
    Strip all HTML tags from content.
    """
    if not html:
        return ""
    
    return bleach.clean(html, tags=[], strip=True)

# =============================================================================
# JSON VALIDATION (SIMPLIFIED)
# =============================================================================

def validate_json_string(json_string: str) -> Dict[str, Any]:
    """
    Validate and parse JSON string.
    """
    if not json_string:
        raise ValidationException("JSON string is required")
    
    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        raise ValidationException(
            f"Invalid JSON: {str(e)}",
            details={"line": e.lineno, "column": e.colno}
        )
def validate_json_schema(
    data: Any,
    schema: Dict[str, Any],
    raise_exception: bool = True
) -> bool:
    """
    Simplified JSON schema validation without external dependencies.
    
    Args:
        data: Data to validate
        schema: JSON schema (basic support only)
        raise_exception: Raise exception on validation failure
    
    Returns:
        True if valid
    
    Raises:
        ValidationException: If validation fails and raise_exception=True
    """
    if not schema or not isinstance(schema, dict):
        if raise_exception:
            raise ValidationException("Invalid schema provided")
        return False
    
    # Basic schema validation (type, required, min/max length)
    if "type" in schema:
        if schema["type"] == "string" and not isinstance(data, str):
            if raise_exception:
                raise ValidationException("Expected string value")
            return False
        
        elif schema["type"] == "number" and not isinstance(data, (int, float)):
            if raise_exception:
                raise ValidationException("Expected number value")
            return False
        
        elif schema["type"] == "integer" and not isinstance(data, int):
            if raise_exception:
                raise ValidationException("Expected integer value")
            return False
        
        elif schema["type"] == "boolean" and not isinstance(data, bool):
            if raise_exception:
                raise ValidationException("Expected boolean value")
            return False
        
        elif schema["type"] == "array" and not isinstance(data, list):
            if raise_exception:
                raise ValidationException("Expected array value")
            return False
        
        elif schema["type"] == "object" and not isinstance(data, dict):
            if raise_exception:
                raise ValidationException("Expected object value")
            return False
    
    # Required fields check
    if "required" in schema and isinstance(data, dict):
        for field in schema["required"]:
            if field not in data:
                if raise_exception:
                    raise ValidationException(f"Required field '{field}' missing")
                return False
    
    # Min/max length for strings and arrays
    if "minLength" in schema and isinstance(data, (str, list)):
        if len(data) < schema["minLength"]:
            if raise_exception:
                raise ValidationException(f"Minimum length {schema['minLength']} required")
            return False
    
    if "maxLength" in schema and isinstance(data, (str, list)):
        if len(data) > schema["maxLength"]:
            if raise_exception:
                raise ValidationException(f"Maximum length {schema['maxLength']} exceeded")
            return False
    
    return True

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================

def validate_password_strength(
    password: str,
    min_length: int = 8,
    require_uppercase: bool = True,
    require_lowercase: bool = True,
    require_digit: bool = True,
    require_special: bool = True,
) -> bool:
    """
    Validate password strength.
    """
    if not password:
        raise ValidationException("Password is required", field="password")
    
    errors = []
    
    # Check length
    if len(password) < min_length:
        errors.append(f"at least {min_length} characters")
    
    # Check uppercase
    if require_uppercase and not re.search(r"[A-Z]", password):
        errors.append("one uppercase letter")
    
    # Check lowercase
    if require_lowercase and not re.search(r"[a-z]", password):
        errors.append("one lowercase letter")
    
    # Check digit
    if require_digit and not re.search(r"[0-9]", password):
        errors.append("one digit")
    
    # Check special character
    if require_special and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("one special character")
    
    if errors:
        raise ValidationException(
            f"Password must contain {', '.join(errors)}",
            field="password",
            details={"requirements": errors}
        )
    
    return True

# =============================================================================
# NUMERIC & STRING VALIDATION
# =============================================================================

def validate_range(
    value: float,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
    field_name: str = "value"
) -> float:
    """Validate numeric value is within range."""
    if min_value is not None and value < min_value:
        raise ValidationException(
            f"{field_name} must be at least {min_value}",
            field=field_name
        )
    
    if max_value is not None and value > max_value:
        raise ValidationException(
            f"{field_name} must be at most {max_value}",
            field=field_name
        )
    
    return value

def validate_length(
    text: str,
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    field_name: str = "text"
) -> str:
    """Validate string length."""
    if not text:
        raise ValidationException(f"{field_name} is required", field=field_name)
    
    length = len(text)
    
    if min_length is not None and length < min_length:
        raise ValidationException(
            f"{field_name} must be at least {min_length} characters",
            field=field_name
        )
    
    if max_length is not None and length > max_length:
        raise ValidationException(
            f"{field_name} must be at most {max_length} characters",
            field=field_name
        )
    
    return text

def detect_pii_fields(text: str) -> List[Dict[str, Any]]:
    """
    Detects Personally Identifiable Information (PII) in text fields.
    
    Detects:
    - Email addresses
    - Phone numbers  
    - Social Security Numbers
    - Credit card numbers
    - Names (common patterns)
    - Addresses
    
    Args:
        text: Text to scan for PII
        
    Returns:
        List of detected PII with location and type
        
    Example:
        [
            {"type": "email", "value": "john@example.com", "start": 10, "end": 25},
            {"type": "phone", "value": "555-123-4567", "start": 30, "end": 42}
        ]
    """
    pii_findings = []
    
    patterns = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
        "credit_card": r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
        "name": r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Simple name pattern
        "zip_code": r'\b\d{5}(?:-\d{4})?\b',
        "street_address": r'\b\d+\s+[A-Za-z\s]+(?:St|Rd|Ave|Blvd|Dr|Ln|Ct)\.?\b'
    }
    
    for pii_type, pattern in patterns.items():
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            pii_findings.append({
                "type": pii_type,
                "value": match.group(0),
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.95  # Default confidence
            })
    
    return pii_findings

def validate_no_pii(text: str, allowed_pii_types: List[str] = None) -> bool:
    """
    Validates text contains no PII (or only allowed types).
    
    Args:
        text: Text to validate
        allowed_pii_types: List of allowed PII types (e.g., ["email"])
        
    Returns:
        True if no disallowed PII found
        
    Raises:
        ValidationException: If disallowed PII detected
    """
    findings = detect_pii_fields(text)
    
    if not findings:
        return True
    
    disallowed = []
    for finding in findings:
        if allowed_pii_types is None or finding["type"] not in allowed_pii_types:
            disallowed.append(finding)
    
    if disallowed:
        pii_types = ", ".join(set(f["type"] for f in disallowed))
        raise ValidationException(
            f"Text contains disallowed PII: {pii_types}. "
            f"Remove or anonymize personal data.",
            field="text",
            details={"pii_detected": len(disallowed), "types": pii_types}
        )
    
    return True

def validate_question_text_length(text: str, min_words: int = 5, max_words: int = 20) -> bool:
    """
    Validate question text length for clarity and engagement.

    Args:
        text: Question text to validate
        min_words: Minimum number of words allowed
        max_words: Maximum number of words allowed

    Returns:
        True if length is within limits

    Raises:
        ValidationException: If text length is not within range
    """
    if not text or not text.strip():
        raise ValidationException("Question text cannot be empty", field="text")

    word_count = len(text.strip().split())
    if word_count < min_words:
        raise ValidationException(
            f"Question is too short ({word_count} words). Minimum is {min_words} words.",
            field="text",
        )
    if word_count > max_words:
        raise ValidationException(
            f"Question is too long ({word_count} words). Maximum is {max_words} words.",
            field="text",
        )
    return True

from email_validator import validate_email as email_validator_validate, EmailNotValidError

def is_valid_email(email: str, check_deliverability: bool = False) -> bool:
    """
    Validate email address (RFC 5322 compliant).
    
    Args:
        email: Email address to validate
        check_deliverability: Check DNS MX records (slower, more thorough)
    
    Returns:
        True if valid email
    
    Examples:
        >>> is_valid_email("user@example.com")
        True
        >>> is_valid_email("invalid.email")
        False
    """
    if not email or not isinstance(email, str):
        return False
    
    try:
        # Use email-validator library for RFC compliance
        validation = email_validator_validate(email, check_deliverability=check_deliverability)
        return True
    except EmailNotValidError:
        # Fallback to regex for simple validation
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

def is_valid_url(url: str, allowed_schemes: Optional[List[str]] = None) -> bool:
    """
    Validate URL format and components.
    
    Args:
        url: URL to validate
        allowed_schemes: Allowed URL schemes (default: ['http', 'https'])
    
    Returns:
        True if valid URL
    
    Examples:
        >>> is_valid_url("https://example.com/path")
        True
        >>> is_valid_url("ftp://invalid.com")
        False (if not in allowed_schemes)
    """
    if not url or not isinstance(url, str):
        return False
    
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']
    
    try:
        result = urlparse(url)
        
        # Check required components
        if not all([result.scheme, result.netloc]):
            return False
        
        # Check scheme
        if result.scheme not in allowed_schemes:
            return False
        
        # Check domain has valid TLD
        domain_parts = result.netloc.split('.')
        if len(domain_parts) < 2:
            return False
        
        # Basic domain validation
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
        if not re.match(domain_pattern, result.netloc.split(':')[0]):  # Remove port if present
            return False
        
        return True
    except Exception:
        return False

def is_valid_phone(phone: str, region: Optional[str] = None) -> bool:
    """
    Validate phone number (E.164 international format).
    
    Args:
        phone: Phone number to validate
        region: ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'IN')
    
    Returns:
        True if valid phone number
    
    Examples:
        >>> is_valid_phone("+14155552671")
        True
        >>> is_valid_phone("415-555-2671", region="US")
        True
        >>> is_valid_phone("invalid")
        False
    """
    if not phone or not isinstance(phone, str):
        return False
    
    try:
        # Use phonenumbers library for international validation
        parsed = phonenumbers.parse(phone, region)
        return phonenumbers.is_valid_number(parsed)
    except Exception:
        # Fallback to basic regex for simple validation
        # Matches: +1234567890, (123) 456-7890, 123-456-7890, etc.
        pattern = r'^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$'
        return bool(re.match(pattern, phone.strip()))

# =============================================================================
# ADDITIONAL VALIDATORS
# =============================================================================

def is_valid_uuid(uuid_string: str) -> bool:
    """
    Validate UUID format (v4).
    
    Examples:
        >>> is_valid_uuid("550e8400-e29b-41d4-a716-446655440000")
        True
    """
    pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    return bool(re.match(pattern, uuid_string.lower()))

def is_safe_string(text: str, max_length: int = 1000) -> bool:
    """
    Check if string is safe (no SQL injection, XSS).
    
    Args:
        text: String to validate
        max_length: Maximum allowed length
    
    Returns:
        True if safe
    """
    if not text or len(text) > max_length:
        return False
    
    # SQL injection patterns
    sql_patterns = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(--)",
        r"(;.*--)",
        r"(\bOR\b.*=.*)",
    ]
    
    # XSS patterns
    xss_patterns = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
    ]
    
    for pattern in sql_patterns + xss_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    
    return True

def is_valid_funnel_slug(slug: str) -> bool:
    """
    Validate funnel slug (URL-safe identifier).
    
    Rules:
    - Only lowercase letters, numbers, hyphens
    - 3-50 characters
    - No leading/trailing hyphens
    
    Examples:
        >>> is_valid_funnel_slug("my-awesome-funnel")
        True
        >>> is_valid_funnel_slug("My Funnel!")
        False
    """
    pattern = r'^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$'
    return bool(re.match(pattern, slug))

def is_valid_color_hex(color: str) -> bool:
    """
    Validate hex color code.
    
    Examples:
        >>> is_valid_color_hex("#FF5733")
        True
        >>> is_valid_color_hex("#F57")
        True
    """
    pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    return bool(re.match(pattern, color))

def is_valid_json_string(json_string: str) -> bool:
    """Validate JSON string."""
    import json
    try:
        json.loads(json_string)
        return True
    except (ValueError, TypeError):
        return False

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Readability (REQUIRED)
    "validate_readability_score",
    "get_readability_grade",
    
    # Email
    "validate_email",
    "is_disposable_email",
    
    # URL
    "validate_url",
    "is_safe_redirect_url",
    
    # Slug
    "validate_slug",
    "generate_slug_from_text",
    
    # Color
    "validate_color_hex",
    
    # Phone
    "validate_phone",
    
    # HTML
    "sanitize_html",
    "strip_html",
    
    # JSON
    "validate_json_string",
    "validate_json_schema",
    
    # Password
    "validate_password_strength",
    
    # Numeric/String
    "validate_range",
    "validate_length",

    "validate_psychology_principles",
    "validate_engagement_techniques",

    # PII Detection (NEW)
    "detect_pii_fields",           # ← ADD THESE
    "validate_no_pii",             # ← ADD THESE
    "validate_question_text_length",

    "is_valid_email",
    "is_valid_url",
    "is_valid_phone",
    "is_valid_uuid",
    "is_safe_string",
    "is_valid_funnel_slug",
    "is_valid_color_hex",
    "is_valid_json_string",

]
