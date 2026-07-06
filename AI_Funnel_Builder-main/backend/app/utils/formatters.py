# =============================================================================
# AI FUNNEL BUILDER - FORMATTERS
# =============================================================================
# Data formatting utilities
# =============================================================================

import re
from datetime import datetime, date
from typing import Optional, Union
from decimal import Decimal


# =============================================================================
# CURRENCY FORMATTING
# =============================================================================

def format_currency(
    amount: Union[int, float, Decimal],
    currency: str = "USD",
    locale: str = "en_US",
    include_symbol: bool = True,
    decimal_places: int = 2,
) -> str:
    """
    Format number as currency.
    
    Args:
        amount: Amount to format
        currency: Currency code (ISO 4217)
        locale: Locale code
        include_symbol: Include currency symbol
        decimal_places: Number of decimal places
    
    Returns:
        Formatted currency string
    
    Examples:
        >>> format_currency(1234.56)
        '$1,234.56'
        >>> format_currency(1234.56, currency="EUR", locale="de_DE")
        '1.234,56 €'
    """
    try:
        from babel.numbers import format_currency as babel_format_currency
        
        return babel_format_currency(
            amount,
            currency,
            locale=locale,
            format=None if include_symbol else "¤#,##0.00",
        )
    except ImportError:
        # Babel not installed, use simple formatting
        if include_symbol:
            symbol = get_currency_symbol(currency)
            return f"{symbol}{amount:,.{decimal_places}f}"
        return f"{amount:,.{decimal_places}f}"


def get_currency_symbol(currency: str) -> str:
    """
    Get currency symbol.
    
    Args:
        currency: Currency code (ISO 4217)
    
    Returns:
        Currency symbol
    """
    symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥",
        "CNY": "¥",
        "INR": "₹",
        "AUD": "A$",
        "CAD": "C$",
        "CHF": "Fr",
        "BRL": "R$",
        "MXN": "MX$",
    }
    return symbols.get(currency.upper(), currency)


def format_price(
    amount: Union[int, float, Decimal],
    currency: str = "USD",
    show_free: bool = True,
) -> str:
    """
    Format price with special handling for free/zero amounts.
    
    Args:
        amount: Price amount
        currency: Currency code
        show_free: Show "Free" instead of "$0.00" for zero amounts
    
    Returns:
        Formatted price string
    
    Examples:
        >>> format_price(0)
        'Free'
        >>> format_price(29.99)
        '$29.99'
    """
    if amount == 0 and show_free:
        return "Free"
    
    return format_currency(amount, currency=currency)


# =============================================================================
# NUMBER FORMATTING
# =============================================================================

def format_number(
    number: Union[int, float],
    decimal_places: int = 0,
    use_grouping: bool = True,
) -> str:
    """
    Format number with thousands separators.
    
    Args:
        number: Number to format
        decimal_places: Number of decimal places
        use_grouping: Use thousands separator
    
    Returns:
        Formatted number string
    
    Examples:
        >>> format_number(1234567)
        '1,234,567'
        >>> format_number(1234.5678, decimal_places=2)
        '1,234.57'
    """
    if use_grouping:
        return f"{number:,.{decimal_places}f}"
    return f"{number:.{decimal_places}f}"


def format_compact_number(number: Union[int, float]) -> str:
    """
    Format large numbers in compact form (K, M, B).
    
    Args:
        number: Number to format
    
    Returns:
        Compact number string
    
    Examples:
        >>> format_compact_number(1234)
        '1.2K'
        >>> format_compact_number(1234567)
        '1.2M'
        >>> format_compact_number(1234567890)
        '1.2B'
    """
    if number < 1000:
        return str(number)
    elif number < 1_000_000:
        return f"{number / 1000:.1f}K"
    elif number < 1_000_000_000:
        return f"{number / 1_000_000:.1f}M"
    else:
        return f"{number / 1_000_000_000:.1f}B"


def format_ordinal(number: int) -> str:
    """
    Format number as ordinal (1st, 2nd, 3rd, etc.).
    
    Args:
        number: Number to format
    
    Returns:
        Ordinal string
    
    Examples:
        >>> format_ordinal(1)
        '1st'
        >>> format_ordinal(22)
        '22nd'
        >>> format_ordinal(103)
        '103rd'
    """
    if 10 <= number % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(number % 10, "th")
    
    return f"{number}{suffix}"


# =============================================================================
# PERCENTAGE FORMATTING
# =============================================================================

def format_percentage(
    value: Union[int, float],
    decimal_places: int = 1,
    multiply_by_100: bool = True,
) -> str:
    """
    Format value as percentage.
    
    Args:
        value: Value to format (0-1 if multiply_by_100=True, else 0-100)
        decimal_places: Number of decimal places
        multiply_by_100: Whether to multiply by 100
    
    Returns:
        Formatted percentage string
    
    Examples:
        >>> format_percentage(0.755)
        '75.5%'
        >>> format_percentage(75.5, multiply_by_100=False)
        '75.5%'
    """
    if multiply_by_100:
        value = value * 100
    
    return f"{value:.{decimal_places}f}%"


def format_change_percentage(
    old_value: Union[int, float],
    new_value: Union[int, float],
    include_sign: bool = True,
) -> str:
    """
    Format percentage change between two values.
    
    Args:
        old_value: Original value
        new_value: New value
        include_sign: Include +/- sign
    
    Returns:
        Formatted percentage change
    
    Examples:
        >>> format_change_percentage(100, 120)
        '+20.0%'
        >>> format_change_percentage(100, 80)
        '-20.0%'
    """
    if old_value == 0:
        return "N/A"
    
    change = ((new_value - old_value) / old_value) * 100
    
    if include_sign:
        sign = "+" if change >= 0 else ""
        return f"{sign}{change:.1f}%"
    
    return f"{abs(change):.1f}%"


# =============================================================================
# DATE & TIME FORMATTING
# =============================================================================

def format_date(
    date_obj: Union[date, datetime],
    format_str: str = "%Y-%m-%d",
) -> str:
    """
    Format date object.
    
    Args:
        date_obj: Date or datetime object
        format_str: strftime format string
    
    Returns:
        Formatted date string
    
    Examples:
        >>> format_date(date(2024, 1, 15))
        '2024-01-15'
        >>> format_date(date(2024, 1, 15), "%B %d, %Y")
        'January 15, 2024'
    """
    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()
    
    return date_obj.strftime(format_str)


def format_datetime(
    datetime_obj: datetime,
    format_str: str = "%Y-%m-%d %H:%M:%S",
    timezone: Optional[str] = None,
) -> str:
    """
    Format datetime object.
    
    Args:
        datetime_obj: Datetime object
        format_str: strftime format string
        timezone: Target timezone (e.g., "America/New_York")
    
    Returns:
        Formatted datetime string
    
    Examples:
        >>> format_datetime(datetime(2024, 1, 15, 14, 30))
        '2024-01-15 14:30:00'
    """
    if timezone:
        try:
            import pytz
            tz = pytz.timezone(timezone)
            datetime_obj = datetime_obj.astimezone(tz)
        except ImportError:
            pass  # pytz not installed, use as-is
    
    return datetime_obj.strftime(format_str)


def format_relative_time(datetime_obj: datetime) -> str:
    """
    Format datetime as relative time (e.g., "2 hours ago").
    
    Args:
        datetime_obj: Datetime object
    
    Returns:
        Relative time string
    
    Examples:
        >>> format_relative_time(datetime.now() - timedelta(minutes=5))
        '5 minutes ago'
    """
    now = datetime.utcnow()
    
    # Ensure timezone-aware comparison
    if datetime_obj.tzinfo is None:
        datetime_obj = datetime_obj.replace(tzinfo=None)
    if now.tzinfo is None:
        now = now.replace(tzinfo=None)
    
    delta = now - datetime_obj
    
    seconds = delta.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    elif seconds < 31536000:
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = int(seconds / 31536000)
        return f"{years} year{'s' if years != 1 else ''} ago"


# =============================================================================
# TEXT FORMATTING
# =============================================================================

def truncate_text(
    text: str,
    max_length: int,
    suffix: str = "...",
    preserve_words: bool = True,
) -> str:
    """
    Truncate text to maximum length.
    
    Args:
        text: Text to truncate
        max_length: Maximum length (including suffix)
        suffix: Suffix to append when truncated
        preserve_words: Don't break words in the middle
    
    Returns:
        Truncated text
    
    Examples:
        >>> truncate_text("Hello world this is a test", 20)
        'Hello world this...'
    """
    if not text or len(text) <= max_length:
        return text
    
    # Account for suffix length
    target_length = max_length - len(suffix)
    
    if preserve_words:
        # Find last space before target length
        truncated = text[:target_length]
        last_space = truncated.rfind(" ")
        
        if last_space > 0:
            truncated = truncated[:last_space]
    else:
        truncated = text[:target_length]
    
    return truncated + suffix


def slugify(
    text: str,
    max_length: int = 100,
    separator: str = "-",
) -> str:
    """
    Convert text to URL-friendly slug.
    
    Args:
        text: Text to slugify
        max_length: Maximum slug length
        separator: Word separator
    
    Returns:
        Slugified text
    
    Examples:
        >>> slugify("Hello World! 123")
        'hello-world-123'
        >>> slugify("Café & Bar")
        'cafe-bar'
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Replace accented characters
    text = (
        text.replace("á", "a").replace("é", "e").replace("í", "i")
        .replace("ó", "o").replace("ú", "u").replace("ñ", "n")
        .replace("ü", "u").replace("ç", "c")
    )
    
    # Remove special characters
    text = re.sub(r"[^\w\s-]", "", text)
    
    # Replace whitespace and underscores with separator
    text = re.sub(r"[\s_]+", separator, text)
    
    # Remove duplicate separators
    text = re.sub(f"{separator}+", separator, text)
    
    # Remove leading/trailing separators
    text = text.strip(separator)
    
    # Truncate to max length
    if len(text) > max_length:
        text = text[:max_length].rstrip(separator)
    
    return text or "untitled"


def title_case(text: str) -> str:
    """
    Convert text to title case (capitalize first letter of each word).
    
    Args:
        text: Text to convert
    
    Returns:
        Title cased text
    
    Examples:
        >>> title_case("hello world")
        'Hello World'
    """
    if not text:
        return ""
    
    # Words that shouldn't be capitalized (unless first/last)
    lowercase_words = {"a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of"}
    
    words = text.split()
    result = []
    
    for i, word in enumerate(words):
        if i == 0 or i == len(words) - 1 or word.lower() not in lowercase_words:
            result.append(word.capitalize())
        else:
            result.append(word.lower())
    
    return " ".join(result)


# =============================================================================
# PHONE NUMBER FORMATTING
# =============================================================================

def format_phone_number(
    phone: str,
    format_type: str = "national",
) -> str:
    """
    Format phone number for display.
    
    Args:
        phone: Phone number (E164 format recommended)
        format_type: Format type (national, international)
    
    Returns:
        Formatted phone number
    
    Examples:
        >>> format_phone_number("+14155552671", "national")
        '(415) 555-2671'
        >>> format_phone_number("+14155552671", "international")
        '+1 415-555-2671'
    """
    try:
        import phonenumbers
        from phonenumbers import PhoneNumberFormat
        
        parsed = phonenumbers.parse(phone, None)
        
        if format_type == "international":
            return phonenumbers.format_number(parsed, PhoneNumberFormat.INTERNATIONAL)
        else:
            return phonenumbers.format_number(parsed, PhoneNumberFormat.NATIONAL)
    
    except ImportError:
        # phonenumbers not installed, basic formatting
        digits = re.sub(r"\D", "", phone)
        
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11:
            return f"+{digits[0]} ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        
        return phone
    
    except Exception:
        return phone


# =============================================================================
# FILE SIZE FORMATTING
# =============================================================================

def format_file_size(
    bytes_size: int,
    decimal_places: int = 1,
) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        bytes_size: Size in bytes
        decimal_places: Number of decimal places
    
    Returns:
        Formatted file size
    
    Examples:
        >>> format_file_size(1024)
        '1.0 KB'
        >>> format_file_size(1048576)
        '1.0 MB'
        >>> format_file_size(1073741824)
        '1.0 GB'
    """
    for unit in ["B", "KB", "MB", "GB", "TB", "PB"]:
        if bytes_size < 1024.0:
            return f"{bytes_size:.{decimal_places}f} {unit}"
        bytes_size /= 1024.0
    
    return f"{bytes_size:.{decimal_places}f} EB"


# =============================================================================
# DURATION FORMATTING
# =============================================================================

def format_duration(
    seconds: int,
    short: bool = False,
) -> str:
    """
    Format duration in seconds to human-readable format.
    
    Args:
        seconds: Duration in seconds
        short: Use short format (1h 30m vs 1 hour 30 minutes)
    
    Returns:
        Formatted duration
    
    Examples:
        >>> format_duration(90)
        '1 minute 30 seconds'
        >>> format_duration(90, short=True)
        '1m 30s'
        >>> format_duration(3665)
        '1 hour 1 minute 5 seconds'
    """
    if seconds < 60:
        return f"{seconds}s" if short else f"{seconds} second{'s' if seconds != 1 else ''}"
    
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    
    if minutes < 60:
        parts = []
        if minutes > 0:
            parts.append(f"{minutes}m" if short else f"{minutes} minute{'s' if minutes != 1 else ''}")
        if remaining_seconds > 0:
            parts.append(f"{remaining_seconds}s" if short else f"{remaining_seconds} second{'s' if remaining_seconds != 1 else ''}")
        return " ".join(parts)
    
    hours = minutes // 60
    remaining_minutes = minutes % 60
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h" if short else f"{hours} hour{'s' if hours != 1 else ''}")
    if remaining_minutes > 0:
        parts.append(f"{remaining_minutes}m" if short else f"{remaining_minutes} minute{'s' if remaining_minutes != 1 else ''}")
    if remaining_seconds > 0 and not short:
        parts.append(f"{remaining_seconds} second{'s' if remaining_seconds != 1 else ''}")
    
    return " ".join(parts)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Currency
    "format_currency",
    "get_currency_symbol",
    "format_price",
    
    # Number
    "format_number",
    "format_compact_number",
    "format_ordinal",
    
    # Percentage
    "format_percentage",
    "format_change_percentage",
    
    # Date/Time
    "format_date",
    "format_datetime",
    "format_relative_time",
    
    # Text
    "truncate_text",
    "slugify",
    "title_case",
    
    # Phone
    "format_phone_number",
    
    # File
    "format_file_size",
    
    # Duration
    "format_duration",
]
