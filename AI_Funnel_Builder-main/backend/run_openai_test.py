# run_openai_test.py
"""
Modern OpenAI Chat Completions Client
Compatible with OpenAI v1.0+ API
"""

import os
from openai import OpenAI
import asyncio

# Global client instance
client = None

def init_client(api_key: str = None):
    """
    Initialize OpenAI client with API key.
    
    Args:
        api_key: OpenAI API key (optional - uses env var if not provided)
    """
    global client
    
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
    
    # Create client
    client = OpenAI()
    
    # Test connection
    try:
        asyncio.run(test_connection())
        print("✅ OpenAI client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ OpenAI connection failed: {e}")
        return False

async def test_connection():
    """Test OpenAI connection."""
    global client
    if not client:
        raise ValueError("Client not initialized. Call init_client() first.")
    
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say 'API works!'"}],
        max_tokens=10
    )
    
    content = response.choices[0].message.content.strip()
    if "works" not in content.lower():
        raise ValueError(f"Unexpected response: {content}")
    
    print("API KEY LOADED? True")

async def ChatCompletion_create(
    model: str = "gpt-4o-mini",
    messages: list = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    **kwargs
) -> dict:
    """
    Async wrapper for OpenAI Chat Completions API.
    
    Args:
        model: GPT model (gpt-4o-mini, gpt-4o, gpt-4-turbo)
        messages: List of message dicts
        temperature: Creativity (0-2)
        max_tokens: Max output tokens
        **kwargs: Additional params
    
    Returns:
        OpenAI response object
    """
    global client
    if not client:
        raise ValueError("Client not initialized. Call init_client() first.")
    
    # Default messages if none provided
    if messages is None:
        messages = [{"role": "user", "content": "Hello!"}]
    
    try:
        # Run sync call in thread pool for async compatibility
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        return response
    except Exception as e:
        raise Exception(f"OpenAI API Error: {str(e)}")

# Legacy compatibility (for your existing code)
ChatCompletion = ChatCompletion_create

# Synchronous version for testing
def sync_chat_completion(
    model: str = "gpt-4o-mini",
    messages: list = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    **kwargs
):
    """Synchronous chat completion for testing."""
    global client
    if not client:
        raise ValueError("Client not initialized.")
    
    if messages is None:
        messages = [{"role": "user", "content": "Hello!"}]
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs
    )
    return response

# Test the client
if __name__ == "__main__":
    # Test with env var or hardcoded key
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        init_client(api_key)
    else:
        print("Set OPENAI_API_KEY environment variable")
