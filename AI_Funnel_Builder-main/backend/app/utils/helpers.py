# =============================================================================
# AI FUNNEL BUILDER - HELPERS
# =============================================================================
# Utility helper functions
# =============================================================================

import re
import uuid
import hashlib
import secrets
import string
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, date
from user_agents import parse as parse_ua
from fastapi import Request


# =============================================================================
# ID GENERATION
# =============================================================================

def generate_unique_id(prefix: Optional[str] = None) -> str:
    """
    Generate unique UUID identifier.
    
    Args:
        prefix: Optional prefix (e.g., "usr_", "fnl_")
    
    Returns:
        Unique identifier
    
    Examples:
        >>> generate_unique_id()
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
        >>> generate_unique_id("usr_")
        'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    """
    unique_id = str(uuid.uuid4())
    
    if prefix:
        return f"{prefix}{unique_id}"
    
    return unique_id


def generate_short_id(length: int = 8, prefix: Optional[str] = None) -> str:
    """
    Generate short unique identifier (URL-safe).
    
    Args:
        length: Length of ID (default: 8)
        prefix: Optional prefix
    
    Returns:
        Short unique ID
    
    Examples:
        >>> generate_short_id()
        'a1B2c3D4'
        >>> generate_short_id(12, "fnl_")
        'fnl_a1B2c3D4e5F6'
    """
    # Use URL-safe characters
    alphabet = string.ascii_letters + string.digits
    short_id = "".join(secrets.choice(alphabet) for _ in range(length))
    
    if prefix:
        return f"{prefix}{short_id}"
    
    return short_id


def generate_nano_id(length: int = 21) -> str:
    """
    Generate Nano ID (alternative to UUID, shorter and URL-safe).
    
    Args:
        length: Length of ID (default: 21)
    
    Returns:
        Nano ID
    
    Examples:
        >>> generate_nano_id()
        'V1StGXR8_Z5jdHi6B-myT'
    """
    try:
        from nanoid import generate
        return generate(size=length)
    except ImportError:
        # Fallback if nanoid not installed
        alphabet = string.ascii_letters + string.digits + "_-"
        return "".join(secrets.choice(alphabet) for _ in range(length))


# =============================================================================
# API KEY GENERATION
# =============================================================================

def generate_api_key(prefix: str = "sk", length: int = 32) -> str:
    """
    Generate API key.
    
    Args:
        prefix: Key prefix (e.g., "sk" for secret key)
        length: Length of key (excluding prefix)
    
    Returns:
        API key
    
    Examples:
        >>> generate_api_key()
        'sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'
    """
    key = secrets.token_hex(length // 2)  # hex is 2 chars per byte
    return f"{prefix}_{key}"


def hash_api_key(api_key: str) -> str:
    """
    Hash API key for secure storage.
    
    Args:
        api_key: API key to hash
    
    Returns:
        Hashed API key
    """
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(api_key: str, hashed_key: str) -> bool:
    """
    Verify API key against hash.
    
    Args:
        api_key: API key to verify
        hashed_key: Stored hash
    
    Returns:
        True if key matches, False otherwise
    """
    return hash_api_key(api_key) == hashed_key


# =============================================================================
# TOKEN GENERATION
# =============================================================================

def generate_token(length: int = 32) -> str:
    """
    Generate secure random token.
    
    Args:
        length: Token length in bytes
    
    Returns:
        URL-safe token
    
    Examples:
        >>> generate_token()
        'kJ8x9L2m3N4p5Q6r7S8t9U0v1W2x3Y4z'
    """
    return secrets.token_urlsafe(length)


def generate_numeric_code(length: int = 6) -> str:
    """
    Generate numeric verification code.
    
    Args:
        length: Code length
    
    Returns:
        Numeric code
    
    Examples:
        >>> generate_numeric_code()
        '123456'
    """
    return "".join(secrets.choice(string.digits) for _ in range(length))


# =============================================================================
# HASH GENERATION
# =============================================================================

def generate_hash(data: str, algorithm: str = "sha256") -> str:
    """
    Generate hash of data.
    
    Args:
        data: Data to hash
        algorithm: Hash algorithm (md5, sha1, sha256, sha512)
    
    Returns:
        Hex digest of hash
    """
    hash_func = getattr(hashlib, algorithm)
    return hash_func(data.encode()).hexdigest()


def generate_file_hash(file_content: bytes, algorithm: str = "sha256") -> str:
    """
    Generate hash of file content.
    
    Args:
        file_content: File content bytes
        algorithm: Hash algorithm
    
    Returns:
        Hex digest of hash
    """
    hash_func = getattr(hashlib, algorithm)
    return hash_func(file_content).hexdigest()


# =============================================================================
# USER AGENT PARSING
# =============================================================================

def parse_user_agent(user_agent_string: str) -> Dict[str, Any]:
    """
    Parse user agent string.
    
    Args:
        user_agent_string: User agent string
    
    Returns:
        Parsed user agent information
    
    Examples:
        >>> parse_user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0...")
        {
            'browser': 'Mobile Safari',
            'browser_version': '14.0',
            'os': 'iOS',
            'os_version': '14.0',
            'device': 'iPhone',
            'device_brand': 'Apple',
            'is_mobile': True,
            'is_tablet': False,
            'is_pc': False,
            'is_bot': False
        }
    """
    try:
        ua = parse_ua(user_agent_string)
        
        return {
            "browser": ua.browser.family,
            "browser_version": ua.browser.version_string,
            "os": ua.os.family,
            "os_version": ua.os.version_string,
            "device": ua.device.family,
            "device_brand": ua.device.brand,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_pc": ua.is_pc,
            "is_bot": ua.is_bot,
        }
    except Exception:
        return {
            "browser": "Unknown",
            "os": "Unknown",
            "device": "Unknown",
            "is_mobile": False,
            "is_tablet": False,
            "is_pc": False,
            "is_bot": False,
        }


def get_device_type(user_agent_string: str) -> str:
    """
    Get device type from user agent.
    
    Args:
        user_agent_string: User agent string
    
    Returns:
        Device type (mobile, tablet, desktop, bot)
    """
    ua = parse_ua(user_agent_string)
    
    if ua.is_bot:
        return "bot"
    elif ua.is_mobile:
        return "mobile"
    elif ua.is_tablet:
        return "tablet"
    else:
        return "desktop"


# =============================================================================
# IP ADDRESS HELPERS
# =============================================================================

def get_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP address from request.
    
    Handles proxies and load balancers (X-Forwarded-For, X-Real-IP).
    
    Args:
        request: FastAPI request object
    
    Returns:
        Client IP address
    """
    # Check X-Forwarded-For header (comma-separated list)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get first IP (client)
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return None


def is_private_ip(ip: str) -> bool:
    """
    Check if IP address is private.
    
    Args:
        ip: IP address
    
    Returns:
        True if private, False otherwise
    """
    try:
        import ipaddress
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except (ValueError, ImportError):
        return False


# =============================================================================
# RATE CALCULATION
# =============================================================================

def calculate_completion_rate(completes: int, starts: int) -> float:
    """
    Calculate completion rate.
    
    Args:
        completes: Number of completions
        starts: Number of starts
    
    Returns:
        Completion rate (0-1)
    """
    if starts == 0:
        return 0.0
    return min(1.0, completes / starts)


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """
    Calculate percentage change between two values.
    
    Args:
        old_value: Original value
        new_value: New value
    
    Returns:
        Percentage change (e.g., 0.25 = 25% increase)
    """
    if old_value == 0:
        return 0.0 if new_value == 0 else float("inf")
    
    return (new_value - old_value) / old_value


def calculate_growth_rate(
    old_value: float,
    new_value: float,
    periods: int = 1
) -> float:
    """
    Calculate compound growth rate.
    
    Args:
        old_value: Starting value
        new_value: Ending value
        periods: Number of periods
    
    Returns:
        Growth rate per period
    """
    if old_value == 0 or periods == 0:
        return 0.0
    
    return ((new_value / old_value) ** (1 / periods)) - 1


# =============================================================================
# DATA STRUCTURE HELPERS
# =============================================================================

def deep_merge(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries.
    
    Args:
        dict1: First dictionary
        dict2: Second dictionary (takes precedence)
    
    Returns:
        Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    
    return result


def flatten_dict(
    d: Dict[str, Any],
    parent_key: str = "",
    separator: str = "."
) -> Dict[str, Any]:
    """
    Flatten nested dictionary.
    
    Args:
        d: Dictionary to flatten
        parent_key: Parent key prefix
        separator: Key separator
    
    Returns:
        Flattened dictionary
    
    Examples:
        >>> flatten_dict({"a": {"b": 1, "c": 2}})
        {'a.b': 1, 'a.c': 2}
    """
    items = []
    
    for k, v in d.items():
        new_key = f"{parent_key}{separator}{k}" if parent_key else k
        
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, separator).items())
        else:
            items.append((new_key, v))
    
    return dict(items)


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split list into chunks.
    
    Args:
        lst: List to chunk
        chunk_size: Size of each chunk
    
    Returns:
        List of chunks
    
    Examples:
        >>> chunk_list([1, 2, 3, 4, 5], 2)
        [[1, 2], [3, 4], [5]]
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def remove_none_values(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove None values from dictionary.
    
    Args:
        d: Dictionary
    
    Returns:
        Dictionary without None values
    """
    return {k: v for k, v in d.items() if v is not None}


def remove_empty_values(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove empty values (None, "", [], {}) from dictionary.
    
    Args:
        d: Dictionary
    
    Returns:
        Dictionary without empty values
    """
    def is_empty(value):
        return value is None or value == "" or value == [] or value == {}
    
    return {k: v for k, v in d.items() if not is_empty(v)}


# =============================================================================
# DATE/TIME HELPERS
# =============================================================================

def get_date_range(
    time_range: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> tuple[date, date]:
    """
    Get date range for predefined time ranges.
    
    Args:
        time_range: Time range (today, yesterday, last_7_days, etc.)
        start_date: Custom start date
        end_date: Custom end date
    
    Returns:
        Tuple of (start_date, end_date)
    """
    from datetime import timedelta
    
    today = date.today()
    
    if time_range == "custom":
        if not start_date or not end_date:
            raise ValueError("start_date and end_date required for custom range")
        return start_date, end_date
    
    elif time_range == "today":
        return today, today
    
    elif time_range == "yesterday":
        yesterday = today - timedelta(days=1)
        return yesterday, yesterday
    
    elif time_range == "last_7_days":
        return today - timedelta(days=7), today
    
    elif time_range == "last_30_days":
        return today - timedelta(days=30), today
    
    elif time_range == "last_90_days":
        return today - timedelta(days=90), today
    
    elif time_range == "this_month":
        return date(today.year, today.month, 1), today
    
    elif time_range == "last_month":
        last_month = today.replace(day=1) - timedelta(days=1)
        return date(last_month.year, last_month.month, 1), last_month
    
    elif time_range == "this_year":
        return date(today.year, 1, 1), today
    
    else:
        raise ValueError(f"Invalid time range: {time_range}")


def is_weekend(date_obj: date) -> bool:
    """
    Check if date is weekend.
    
    Args:
        date_obj: Date to check
    
    Returns:
        True if weekend (Saturday or Sunday)
    """
    return date_obj.weekday() >= 5  # 5=Saturday, 6=Sunday


# =============================================================================
# STRING HELPERS
# =============================================================================

def extract_domain_from_email(email: str) -> Optional[str]:
    """
    Extract domain from email address.
    
    Args:
        email: Email address
    
    Returns:
        Domain name
    
    Examples:
        >>> extract_domain_from_email("user@example.com")
        'example.com'
    """
    if "@" not in email:
        return None
    
    return email.split("@")[-1].lower()


def mask_email(email: str) -> str:
    """
    Mask email address for privacy.
    
    Args:
        email: Email address
    
    Returns:
        Masked email
    
    Examples:
        >>> mask_email("john.doe@example.com")
        'j***@example.com'
    """
    if "@" not in email:
        return email
    
    local, domain = email.split("@")
    
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "***"
    
    return f"{masked_local}@{domain}"


def mask_phone(phone: str, visible_digits: int = 4) -> str:
    """
    Mask phone number for privacy.
    
    Args:
        phone: Phone number
        visible_digits: Number of visible digits at end
    
    Returns:
        Masked phone number
    
    Examples:
        >>> mask_phone("+14155552671")
        '***2671'
    """
    if len(phone) <= visible_digits:
        return phone
    
    return "*" * (len(phone) - visible_digits) + phone[-visible_digits:]


# =============================================================================
# COMPARISON HELPERS
# =============================================================================

def fuzzy_match(str1: str, str2: str, threshold: float = 0.8) -> bool:
    """
    Fuzzy string matching.
    
    Args:
        str1: First string
        str2: Second string
        threshold: Similarity threshold (0-1)
    
    Returns:
        True if strings are similar
    """
    try:
        from difflib import SequenceMatcher
        
        ratio = SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
        return ratio >= threshold
    except ImportError:
        # Fallback to exact match
        return str1.lower() == str2.lower()


from unidecode import unidecode

def generate_slug(text: str, max_length: int = 100) -> str:
    """
    Generate SEO-friendly slug from text.
    
    Args:
        text: Input text
        max_length: Maximum slug length
        
    Returns:
        Clean slug (lowercase, hyphenated, no special chars)
        
    Examples:
        >>> generate_slug("Spring 2024 Skincare Campaign!")
        "spring-2024-skincare-campaign"
        >>> generate_slug("My Café 🎉", 15)
        "my-cafe"
    """
    if not text:
        return "untitled"
    
    # Normalize unicode → ASCII
    text = unidecode(text)
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters, keep letters/numbers/hyphens
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    
    # Replace spaces/multiple hyphens with single hyphen
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    
    # Strip leading/trailing hyphens
    text = text.strip('-')
    
    # Truncate to max_length (reserve space for ID if needed)
    if len(text) > max_length:
        text = text[:max_length].rstrip('-')
    
    return text if text else "untitled"

# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # ID generation
    "generate_unique_id",
    "generate_short_id",
    "generate_nano_id",
    
    # API keys
    "generate_api_key",
    "hash_api_key",
    "verify_api_key",
    
    # Tokens
    "generate_token",
    "generate_numeric_code",
    
    # Hashing
    "generate_hash",
    "generate_file_hash",
    
    # User agent
    "parse_user_agent",
    "get_device_type",
    
    # IP address
    "get_client_ip",
    "is_private_ip",
    
    # Rate calculation
    "calculate_completion_rate",
    "calculate_percentage_change",
    "calculate_growth_rate",
    
    # Data structures
    "deep_merge",
    "flatten_dict",
    "chunk_list",
    "remove_none_values",
    "remove_empty_values",
    
    # Date/time
    "get_date_range",
    "is_weekend",
    
    # String helpers
    "extract_domain_from_email",
    "mask_email",
    "mask_phone",
    
    # Comparison
    "fuzzy_match",

    "generate_slug",
]
