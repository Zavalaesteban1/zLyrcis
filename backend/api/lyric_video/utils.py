"""
Utility functions for the lyric video generator.
"""
import os
import logging
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

def create_temp_dir():
    """Create a temporary directory for processing files."""
    return tempfile.TemporaryDirectory()

def ensure_directory_exists(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory_path (str): Path to the directory
        
    Returns:
        Path: Path object for the directory
    """
    path = Path(directory_path)
    path.mkdir(parents=True, exist_ok=True)
    return path

def clean_filename(filename):
    """
    Remove invalid characters from filenames.
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Cleaned filename
    """
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '')
    return filename.strip()

def save_debug_info(temp_dir, data, filename="debug_info.json"):
    """
    Save debug information to a file.
    
    Args:
        temp_dir (str): Path to temporary directory
        data (dict): Data to save
        filename (str): Filename to save to
    """
    import json
    try:
        path = os.path.join(temp_dir, filename)
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Debug info saved to {path}")
    except Exception as e:
        logger.warning(f"Could not save debug info: {e}")
