import re
import os

def fix_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed: {filepath}")

# Fix each file
fix_file(
    r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\admin\register.html',
    [
        ('showStatus(statusEl, "success"', 'showToast("success"'),
        ('showStatus(statusEl, "error"', 'showToast("error"'),
    ]
)

fix_file(
    r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\admin\create-blog.html',
    [
        ('showStatus(statusEl, "success"', 'showToast("success"'),
        ('showStatus(statusEl, "error"', 'showToast("error"'),
    ]
)

fix_file(
    r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\admin\edit-blog.html',
    [
        ('showStatus(statusEl, "success"', 'showToast("success"'),
        ('showStatus(statusEl, "error"', 'showToast("error"'),
    ]
)

fix_file(
    r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\admin\login.html',
    [
        ('showStatus(statusEl, "success"', 'showToast("success"'),
        ('showStatus(statusEl, "error"', 'showToast("error"'),
    ]
)

fix_file(
    r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\admin\verify-email.html',
    [
        ('showStatus(statusEl, "success"', 'showToast("success"'),
        ('showStatus(statusEl, "error"', 'showToast("error"'),
        ('showStatus(manualStatus, "success"', 'showToast("success"'),
        ('showStatus(manualStatus, "error"', 'showToast("error"'),
    ]
)

print("\nAll admin pages updated with showToast!")
