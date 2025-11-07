#!/usr/bin/env python
"""
This script analyzes the original large tasks.py file and identifies functions 
that might need to be transferred to modular files.
"""

import re
import os
import argparse

def extract_functions(file_path):
    """Extract function definitions from a Python file."""
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Extract all function definitions
    pattern = r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*?\):'
    functions = re.findall(pattern, content, re.DOTALL)
    return functions

def get_module_functions(module_path):
    """Get functions already in a module."""
    if not os.path.exists(module_path):
        return []
    
    with open(module_path, 'r') as file:
        content = file.read()
    
    pattern = r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*?\):'
    functions = re.findall(pattern, content, re.DOTALL)
    return functions

def categorize_functions(functions):
    """Categorize functions by likely module."""
    categories = {
        'spotify': [],
        'lyrics': [],
        'audio': [],
        'synchronization': [],
        'video': [],
        'utils': [],
        'tasks': [],
        'unknown': []
    }
    
    for func in functions:
        func_lower = func.lower()
        
        if any(term in func_lower for term in ['spotify', 'track']):
            categories['spotify'].append(func)
        elif any(term in func_lower for term in ['lyric', 'genius']):
            categories['lyrics'].append(func)
        elif any(term in func_lower for term in ['audio', 'vocal', 'silence', 'download', 'ffmpeg']):
            categories['audio'].append(func)
        elif any(term in func_lower for term in ['sync', 'timing']):
            categories['synchronization'].append(func)
        elif any(term in func_lower for term in ['video', 'generate_video', 'subtitle']):
            categories['video'].append(func)
        elif any(term in func_lower for term in ['util', 'helper', 'clean', 'normalize']):
            categories['utils'].append(func)
        elif any(term in func_lower for term in ['task', 'job', 'generate_lyric_video']):
            categories['tasks'].append(func)
        else:
            categories['unknown'].append(func)
    
    return categories

def compare_functions(original_functions, module_functions, module_name):
    """Compare functions to identify missing ones."""
    original_set = set(original_functions[module_name])
    module_set = set(module_functions)
    
    missing = original_set - module_set
    return list(missing)

def analyze_original_file(original_file, module_dir):
    """Analyze the original file and identify functions that might need to be transferred."""
    original_functions = extract_functions(original_file)
    categorized = categorize_functions(original_functions)
    
    modules = {
        'spotify': os.path.join(module_dir, 'spotify.py'),
        'lyrics': os.path.join(module_dir, 'lyrics.py'),
        'audio': os.path.join(module_dir, 'audio.py'),
        'synchronization': os.path.join(module_dir, 'synchronization.py'),
        'video': os.path.join(module_dir, 'video.py'),
        'utils': os.path.join(module_dir, 'utils.py'),
        'tasks': os.path.join(module_dir, 'tasks.py')
    }
    
    results = {}
    
    for module_name, module_path in modules.items():
        module_functions = get_module_functions(module_path)
        missing = compare_functions(categorized, module_functions, module_name)
        results[module_name] = missing
    
    # Also report functions in the "unknown" category
    results['unknown'] = categorized['unknown']
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Analyze tasks.py and identify functions to transfer.')
    parser.add_argument('original_file', help='Path to the original tasks.py file')
    parser.add_argument('module_dir', help='Path to the module directory')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.original_file):
        print(f"Error: {args.original_file} does not exist.")
        return
    
    if not os.path.exists(args.module_dir):
        print(f"Error: {args.module_dir} does not exist.")
        return
    
    results = analyze_original_file(args.original_file, args.module_dir)
    
    print("=== Functions That May Need to be Transferred ===")
    
    for module, functions in results.items():
        if functions:
            print(f"\n== {module.capitalize()} Module: ")
            for func in functions:
                print(f"  - {func}")
    
    print("\nAnalysis complete. Review the listed functions to see if they need to be transferred.")

if __name__ == "__main__":
    main() 