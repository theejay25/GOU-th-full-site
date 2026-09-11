import os

base = r'c:\Users\LENOVO\Documents\GOUTH\GOUTH'
pages = ['admin/login.html', 'admin/register.html', 'admin/create-blog.html', 'admin/edit-blog.html', 'admin/verify-email.html']

toast_css = '''
      /* Toast notification styles */
      .toast-container {
        position: fixed; top: 24px; right: 24px; z-index: 99999;
        display: flex; flex-direction: column; gap: 12px;
        pointer-events: none; max-width: 100%;
      }
      .toast {
        pointer-events: auto; display: flex; align-items: flex-start; gap: 14px;
        background: #1a1d23; border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; padding: 16px 20px; min-width: 320px; max-width: 440px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.35);
        animation: toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .toast.removing { opacity: 0; transform: translateX(60px); }
      .toast__icon { flex: 0 0 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; margin-top: 2px; }
      .toast--success .toast__icon { background: rgba(34,197,94,0.15); color: #22c55e; }
      .toast--error .toast__icon { background: rgba(239,68,68,0.15); color: #ef4444; }
      .toast__body { flex: 1; min-width: 0; }
      .toast__message { font-size: 14px; font-weight: 500; line-height: 1.5; color: #f1ead9; font-family: sans-serif; word-wrap: break-word; }
      .toast__close { flex: 0 0 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 16px; padding: 0; border-radius: 4px; }
      .toast__close:hover { color: #fff; }
      @keyframes toastSlideIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      @media (max-width: 520px) { .toast-container { top: 16px; right: 16px; left: 16px; } .toast { min-width: 0; max-width: 100%; padding: 14px 16px; } }
'''

for page in pages:
    path = os.path.join(base, page)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # First fix: if the page was corrupted by edit_file and has a dangling "}" or missing content
    # Check if toast styles already exist
    if '.toast-container' in content:
        print(f'{page}: already has toast CSS')
        continue
    
    # Insert toast CSS before the closing </style> tag
    # Find the last </style> before </head>
    head_end = content.find('</head>')
    style_end = content.rfind('</style>', 0, head_end)
    
    if style_end == -1:
        print(f'{page}: no <style> tag found, skipping')
        continue
    
    # Insert after </style>
    before = content[:style_end + len('</style>')]
    after = content[style_end + len('</style>'):]
    content = before + toast_css + after
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Fixed: {page}')

print('All admin pages updated with toast CSS!')
