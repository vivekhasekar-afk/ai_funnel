"""
Monitoring utilities for Prometheus metrics.

This is a stub implementation to prevent import errors.
"""


class Counter:
    """Prometheus Counter stub."""
    
    def __init__(self, *args, **kwargs):
        pass
    
    def inc(self, *args, **kwargs):
        """Increment counter."""
        pass
    
    def labels(self, *args, **kwargs):
        """Return labeled counter."""
        return self


class Histogram:
    """Prometheus Histogram stub."""
    
    def __init__(self, *args, **kwargs):
        pass
    
    def observe(self, *args, **kwargs):
        """Record observation."""
        pass
    
    def labels(self, *args, **kwargs):
        """Return labeled histogram."""
        return self


class Gauge:
    """Prometheus Gauge stub."""
    
    def __init__(self, *args, **kwargs):
        pass
    
    def set(self, *args, **kwargs):
        """Set gauge value."""
        pass
    
    def inc(self, *args, **kwargs):
        """Increment gauge."""
        pass
    
    def dec(self, *args, **kwargs):
        """Decrement gauge."""
        pass
    
    def labels(self, *args, **kwargs):
        """Return labeled gauge."""
        return self


# Common metrics stubs
http_requests_total = Counter()
http_request_duration_seconds = Histogram()
active_requests = Gauge()
database_queries_total = Counter()
database_query_duration_seconds = Histogram()
