import os

path = r'c:\Users\LENOVO\Documents\GOUTH\GOUTH\Trainings and programs.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

toast_block = '''<style>
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
    </style>
    <script>
      function showToast(type, message) {
        var container = document.getElementById('toast-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'toast-container';
          container.className = 'toast-container';
          document.body.appendChild(container);
        }
        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        var iconHtml = type === 'success' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
        var safeMsg = (message || '').replace(/[&<>\"\\']/g, function(c) {
          var map = {'&':'&amp;','<':'<','>':'>','\"':'"',"\'":"&#039;"};
          return map[c] || c;
        });
        toast.innerHTML = '<div class="toast__icon">' + iconHtml + '</div><div class="toast__body"><div class="toast__message">' + safeMsg + '</div><button class="toast__close" onclick="var t=this.closest(\'.toast\');t.classList.add(\'removing\');setTimeout(function(){if(t.parentNode)t.remove()},300)"><i class="fas fa-times"></i></button>';
        container.appendChild(toast);
        setTimeout(function() {
          if (toast.parentNode) { toast.classList.add('removing'); setTimeout(function(){if(toast.parentNode)toast.remove()},300); }
        }, 4500);
        toast.addEventListener('mouseenter', function() { clearTimeout(this._auto); });
        toast.addEventListener('mouseleave', function() {
          if (!toast.classList.contains('removing')) {
            toast._auto = setTimeout(function() {
              if (toast.parentNode && !toast.classList.contains('removing')) {
                toast.classList.add('removing'); setTimeout(function(){if(toast.parentNode)toast.remove()},300);
              }
            }, 4500);
          }
        });
      }
    </script>'''

content = content.replace('<script src="assets/js/vendor/jquery-3.7.1.min.js"></script>', toast_block + '\n    <script src="assets/js/vendor/jquery-3.7.1.min.js"></script>')

old_success = '''if (result.success) {
                messageBox.className = "alert alert-success";
                messageBox.textContent =
                  "Application submitted successfully. We will contact you shortly.";
                form.reset();
              } else {
                messageBox.className = "alert alert-danger";
                messageBox.textContent =
                  result.message || "Submission failed. Please try again.";
              }
              messageBox.classList.remove("d-none");'''

new_success = '''if (result.success) {
                showToast("success", "Application submitted successfully. We will contact you shortly.");
                form.reset();
              } else {
                showToast("error", result.message || "Submission failed. Please try again.");
              }'''

content = content.replace(old_success, new_success)

old_error = '''messageBox.className = "alert alert-danger";
              messageBox.textContent = "Submission failed. Please try again.";
              messageBox.classList.remove("d-none");'''

new_error = '''showToast("error", "Submission failed. Please try again.");'''

content = content.replace(old_error, new_error)

content = content.replace('<div class="alert d-none" id="formMessage"></div>', '')

old_reset = '''// Reset form message
            if (messageBox) {
              messageBox.classList.add("d-none");
              messageBox.textContent = "";
            }'''

content = content.replace(old_reset, '')

content = content.replace('const messageBox = document.getElementById("formMessage");\n        const allProgramFields', 'const allProgramFields')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Trainings and programs.html done!')
