/**
 * Shared markdown-editor helpers for the contributor submission form
 * and the resubmit popup window. Exposes window.AdminEditor.
 *
 * The resubmit form is generated as a string-built child window with its
 * own Firebase init and DOM, so editor logic lives here (loaded as a
 * static <script src>) instead of inside admin.js's IIFE.
 */
(function () {
  var IMG_MAX_BYTES = 5 * 1024 * 1024;
  var IMG_ALLOWED_FINAL_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  var IMG_PRE_CONVERT_LIMIT = 25 * 1024 * 1024;
  var MAX_IMAGES_PER_SUBMISSION = 20;
  var UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  function uuidv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('read failed')); };
      reader.readAsDataURL(file);
    });
  }

  function dataUrlToBase64(dataUrl) {
    var i = dataUrl.indexOf(',');
    return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  }

  function escapeForRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Format conversion (HEIC/HEIF/webp/bmp/tiff → JPEG via canvas, with
  //    heic2any fallback for HEIC on browsers that can't decode it natively).
  function convertToJpeg(file) {
    var isHeic = /^image\/(heic|heif)$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    var needsConversion = isHeic || /^image\/(webp|bmp|tiff)$/i.test(file.type);
    if (!needsConversion) return Promise.resolve(file);

    function toJpegViaCanvas(bitmap) {
      var canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          else reject(new Error('Conversion failed'));
        }, 'image/jpeg', 0.9);
      });
    }

    var HEIC_ERR = 'HEIC/HEIF format is not supported by your browser. Please convert to JPG or PNG before uploading.';

    if (typeof createImageBitmap !== 'undefined') {
      return createImageBitmap(file).then(toJpegViaCanvas).catch(function () {
        if (isHeic && typeof heic2any !== 'undefined') {
          return heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }).then(function (result) {
            var blob = Array.isArray(result) ? result[0] : result;
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          }).catch(function () { return Promise.reject(new Error(HEIC_ERR)); });
        }
        return Promise.reject(new Error(isHeic ? HEIC_ERR : 'Cannot convert this image format. Please convert to JPG or PNG before uploading.'));
      });
    }

    if (isHeic && typeof heic2any !== 'undefined') {
      return heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }).then(function (result) {
        var blob = Array.isArray(result) ? result[0] : result;
        return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      }).catch(function () { return Promise.reject(new Error(HEIC_ERR)); });
    }

    return Promise.reject(new Error(isHeic ? HEIC_ERR : 'Cannot convert this image format. Please convert to JPG or PNG before uploading.'));
  }

  // ── Cursor / selection insertion
  function insertAtCursor(ta, text) {
    ta.focus();
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    var pos = start + text.length;
    ta.setSelectionRange(pos, pos);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── Toolbar formatting engine: wraps the current selection or inserts
  //    a placeholder, then re-selects so the user can type over it.
  function applyMd(ta, op, opts, i18n) {
    opts = opts || {};
    i18n = i18n || {};
    ta.focus();
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var value = ta.value;
    var before = value.slice(0, start);
    var sel = value.slice(start, end);
    var after = value.slice(end);
    var insert; var caretStart; var caretEnd;

    function commit() {
      ta.value = before + insert + after;
      ta.setSelectionRange(caretStart, caretEnd);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function wrap(left, right, placeholder) {
      var inner = sel || placeholder || '';
      insert = left + inner + right;
      caretStart = start + left.length;
      caretEnd = caretStart + inner.length;
    }

    function linePrefix(prefix) {
      var lineStart = before.lastIndexOf('\n') + 1;
      var head = value.slice(lineStart, start);
      before = value.slice(0, lineStart);
      var block = head + sel;
      var lines = block.split('\n');
      var out = lines.map(function (ln) { return prefix + ln; }).join('\n');
      insert = out;
      caretStart = lineStart + out.length;
      caretEnd = caretStart;
    }

    switch (op) {
      case 'heading': {
        var level = Math.max(1, Math.min(6, opts.level || 2));
        linePrefix(new Array(level + 1).join('#') + ' ');
        break;
      }
      case 'bold':   wrap('**', '**', i18n.tb_ph_bold || 'bold text'); break;
      case 'italic': wrap('*',  '*',  i18n.tb_ph_italic || 'italic text'); break;
      case 'strike': wrap('~~', '~~', i18n.tb_ph_strike || 'text'); break;
      case 'code':   wrap('`',  '`',  i18n.tb_ph_code || 'code'); break;
      case 'codeblock': {
        var lead = (before === '' || before.charAt(before.length - 1) === '\n') ? '' : '\n';
        var trail = (after === '' || after.charAt(0) === '\n') ? '' : '\n';
        var body = sel || (i18n.tb_ph_code || 'code');
        insert = lead + '```\n' + body + '\n```' + trail;
        caretStart = start + lead.length + 4;
        caretEnd = caretStart + body.length;
        break;
      }
      case 'quote': linePrefix('> '); break;
      case 'ul':    linePrefix('- '); break;
      case 'ol': {
        var lineStart2 = before.lastIndexOf('\n') + 1;
        var head2 = value.slice(lineStart2, start);
        before = value.slice(0, lineStart2);
        var lines2 = (head2 + sel).split('\n');
        var out2 = lines2.map(function (ln, i) { return (i + 1) + '. ' + ln; }).join('\n');
        insert = out2;
        caretStart = lineStart2 + out2.length;
        caretEnd = caretStart;
        break;
      }
      case 'link': {
        var url = window.prompt(i18n.tb_link_prompt || 'Enter URL:', 'https://');
        if (url == null) return;
        var label = sel || (i18n.tb_ph_link || 'link text');
        insert = '[' + label + '](' + url + ')';
        caretStart = start + 1;
        caretEnd = caretStart + label.length;
        break;
      }
      case 'hr': {
        var endsWithBlankLine = /\n\n$/.test(before) || before === '';
        var startsWithBlankLine = /^\n\n/.test(after) || after === '';
        var endsWithNewline = before === '' || before.charAt(before.length - 1) === '\n';
        var startsWithNewline = after === '' || after.charAt(0) === '\n';
        var lead2 = endsWithBlankLine ? '' : (endsWithNewline ? '\n' : '\n\n');
        var trail2 = startsWithBlankLine ? '' : (startsWithNewline ? '\n' : '\n\n');
        insert = lead2 + '---' + trail2;
        caretStart = start + insert.length;
        caretEnd = caretStart;
        break;
      }
      case 'table': {
        var h1 = i18n.tb_table_h1 || 'Header 1';
        var h2 = i18n.tb_table_h2 || 'Header 2';
        var c1 = i18n.tb_table_c1 || 'Cell';
        var c2 = i18n.tb_table_c2 || 'Cell';
        var snippet = '| ' + h1 + ' | ' + h2 + ' |\n| --- | --- |\n| ' + c1 + ' | ' + c2 + ' |\n';
        var lead3 = (before === '' || before.charAt(before.length - 1) === '\n') ? '' : '\n';
        insert = lead3 + snippet;
        caretStart = start + insert.length;
        caretEnd = caretStart;
        break;
      }
      case 'align': {
        // Markdown has no alignment syntax. Wrap the selected lines in a
        // div: kramdown reads markdown="1" + the blank lines to parse the
        // inner content as markdown; marked.js (CommonMark type-6 HTML
        // block) closes the <div> at the blank line and re-parses the
        // inner content too — so alignment renders in both the live build
        // and the preview tab.
        var dir = opts.dir || 'center';
        var aLineStart = before.lastIndexOf('\n') + 1;
        var aHead = value.slice(aLineStart, start);
        before = value.slice(0, aLineStart);
        var aInner = (aHead + sel) || (i18n.tb_ph_align || 'aligned text');
        var aLead = (before === '' || /\n\n$/.test(before)) ? '' : '\n';
        var aTrail = (after === '' || /^\n\n/.test(after)) ? '' : '\n';
        var openTag = '<div style="text-align: ' + dir + '" markdown="1">';
        insert = aLead + openTag + '\n\n' + aInner + '\n\n</div>' + aTrail;
        caretStart = before.length + aLead.length + openTag.length + 2;
        caretEnd = caretStart + aInner.length;
        break;
      }
      default:
        return;
    }
    commit();
  }

  // ── Gallery rendering
  function refreshGallery(galleryEl, pendingImages, i18n, onRemove) {
    if (!galleryEl) return;
    galleryEl.innerHTML = '';
    var uuids = Object.keys(pendingImages);
    if (!uuids.length) {
      galleryEl.style.display = 'none';
      return;
    }
    galleryEl.style.display = '';
    uuids.forEach(function (uuid) {
      var entry = pendingImages[uuid];
      var card = document.createElement('div');
      card.className = 'admin-md-thumb admin-md-thumb-' + (entry.status || 'pending');
      card.title = (entry.file && entry.file.name) || entry.fileName || '';

      var img = document.createElement('img');
      img.alt = '';
      img.src = entry.dataUrl || entry.url || '';
      card.appendChild(img);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'admin-md-thumb-remove';
      rm.title = i18n.tb_remove_image || 'Remove image';
      rm.setAttribute('aria-label', i18n.tb_remove_image || 'Remove image');
      rm.textContent = '×';
      rm.addEventListener('click', function () { onRemove(uuid); });
      card.appendChild(rm);

      if (entry.status === 'uploading') {
        var spin = document.createElement('span');
        spin.className = 'admin-md-thumb-spin';
        spin.setAttribute('aria-hidden', 'true');
        card.appendChild(spin);
      }
      if (entry.status === 'failed') {
        var err = document.createElement('span');
        err.className = 'admin-md-thumb-err';
        err.textContent = '!';
        err.title = entry.error || i18n.tb_upload_failed || 'Upload failed';
        card.appendChild(err);
      }
      galleryEl.appendChild(card);
    });
  }

  function removePendingImage(uuid, ta, pendingImages) {
    if (!pendingImages[uuid]) return;
    var token = 'image:' + uuid;
    ta.value = ta.value.replace(new RegExp('!\\[[^\\]]*\\]\\(' + escapeForRegExp(token) + '\\)', 'g'), '');
    delete pendingImages[uuid];
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── File ingestion (file picker, paste, drag-drop all funnel here)
  function ingestFiles(files, ta, pendingImages, onChange, i18n) {
    if (!files || !files.length) return Promise.resolve();
    var fileList = Array.prototype.slice.call(files);

    function reject(msg) {
      window.alert(msg || (i18n && i18n.tb_image_failed) || 'Image processing failed');
    }

    var queue = Promise.resolve();
    fileList.forEach(function (raw) {
      if (!raw) return;
      if (raw.size > IMG_PRE_CONVERT_LIMIT) {
        reject((i18n && i18n.tb_image_too_large) || 'Image too large');
        return;
      }
      if (Object.keys(pendingImages).length >= MAX_IMAGES_PER_SUBMISSION) {
        reject((i18n && i18n.tb_image_count_max) || 'Too many images');
        return;
      }
      queue = queue.then(function () {
        return convertToJpeg(raw).then(function (file) {
          if (IMG_ALLOWED_FINAL_TYPES.indexOf(file.type) === -1) {
            throw new Error((i18n && i18n.tb_image_unsupported) || 'Unsupported image format');
          }
          if (file.size > IMG_MAX_BYTES) {
            throw new Error((i18n && i18n.tb_image_too_large) || 'Image too large');
          }
          return fileToDataUrl(file).then(function (dataUrl) {
            var uuid = uuidv4();
            pendingImages[uuid] = {
              file: file,
              fileName: file.name,
              contentType: file.type,
              dataUrl: dataUrl,
              status: 'pending',
            };
            var altText = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]()]/g, '');
            insertAtCursor(ta, '![' + altText + '](image:' + uuid + ')');
            if (onChange) onChange();
          });
        }).catch(function (err) {
          reject((err && err.message) || ((i18n && i18n.tb_image_failed) || 'Image processing failed'));
        });
      });
    });
    return queue;
  }

  // ── Substitute placeholders with in-memory data URLs for preview rendering
  function substituteImagePlaceholders(content, pendingImages) {
    if (!content) return content;
    return content.replace(/image:([0-9a-f-]{36})/gi, function (full, uuid) {
      var p = pendingImages && pendingImages[uuid];
      return (p && p.dataUrl) ? p.dataUrl : full;
    });
  }

  // ── Collect UUIDs that are still referenced in the textarea
  function findReferencedUuids(content) {
    var seen = Object.create(null);
    var out = [];
    var re = /!\[[^\]]*\]\(image:([0-9a-f-]{36})\)/gi;
    var m;
    while ((m = re.exec(content)) !== null) {
      var uuid = m[1].toLowerCase();
      if (!seen[uuid]) {
        seen[uuid] = true;
        out.push(uuid);
      }
    }
    return out;
  }

  // ── Wire toolbar + file input + paste + drag/drop on a given set of IDs.
  // Returns the pendingImages map (caller-owned if passed in opts).
  function attachEditorBindings(opts) {
    var toolbar = document.getElementById(opts.toolbarId);
    var ta = document.getElementById(opts.textareaId);
    var fileInput = document.getElementById(opts.fileInputId);
    var gallery = document.getElementById(opts.galleryId);
    var i18n = opts.i18n || {};
    var pendingImages = opts.pendingImages || Object.create(null);

    function redraw() {
      refreshGallery(gallery, pendingImages, i18n, function (uuid) {
        removePendingImage(uuid, ta, pendingImages);
        redraw();
      });
    }

    if (toolbar) {
      // Collapse any open heading dropdown within this toolbar.
      var closeDropdowns = function () {
        var open = toolbar.querySelectorAll('.admin-md-dropdown-open');
        for (var i = 0; i < open.length; i++) {
          open[i].classList.remove('admin-md-dropdown-open');
          var tg = open[i].querySelector('[data-md-dropdown]');
          if (tg) tg.setAttribute('aria-expanded', 'false');
        }
      };

      // Preserve textarea selection on mousedown (Safari otherwise blurs first).
      toolbar.addEventListener('mousedown', function (e) {
        if (e.target.closest && e.target.closest('[data-md], [data-md-dropdown]')) {
          e.preventDefault();
        }
      });
      toolbar.addEventListener('click', function (e) {
        if (!e.target.closest) return;
        // Heading dropdown toggle: expand/collapse the menu, apply nothing.
        var toggle = e.target.closest('[data-md-dropdown]');
        if (toggle) {
          var dd = toggle.closest('.admin-md-dropdown');
          var wasOpen = dd && dd.classList.contains('admin-md-dropdown-open');
          closeDropdowns();
          if (dd && !wasOpen) {
            dd.classList.add('admin-md-dropdown-open');
            toggle.setAttribute('aria-expanded', 'true');
          }
          return;
        }
        var btn = e.target.closest('[data-md]');
        if (!btn) return;
        closeDropdowns();
        var op = btn.getAttribute('data-md');
        if (op === 'image') {
          if (fileInput) fileInput.click();
          return;
        }
        var level = parseInt(btn.getAttribute('data-level') || '0', 10);
        var dir = btn.getAttribute('data-dir') || '';
        applyMd(ta, op, { level: level, dir: dir }, i18n);
      });
      // Collapse the dropdown on outside click or Escape.
      document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('#' + opts.toolbarId)) return;
        closeDropdowns();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDropdowns();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        var files = e.target.files;
        ingestFiles(files, ta, pendingImages, redraw, i18n);
        e.target.value = '';
      });
    }

    if (ta) {
      ta.addEventListener('paste', function (e) {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        var files = [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            var f = items[i].getAsFile();
            if (f) files.push(f);
          }
        }
        if (files.length) {
          e.preventDefault();
          ingestFiles(files, ta, pendingImages, redraw, i18n);
        }
      });

      var dragOver = function (e) {
        if (!e.dataTransfer) return;
        var types = e.dataTransfer.types || [];
        var hasFiles = false;
        for (var i = 0; i < types.length; i++) {
          if (types[i] === 'Files') { hasFiles = true; break; }
        }
        if (!hasFiles) return;
        e.preventDefault();
        e.stopPropagation();
        ta.classList.add('admin-textarea-drop');
      };
      ta.addEventListener('dragenter', dragOver);
      ta.addEventListener('dragover', dragOver);
      ta.addEventListener('dragleave', function () { ta.classList.remove('admin-textarea-drop'); });
      ta.addEventListener('drop', function (e) {
        ta.classList.remove('admin-textarea-drop');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          e.preventDefault();
          ingestFiles(e.dataTransfer.files, ta, pendingImages, redraw, i18n);
        }
      });
    }

    redraw();
    return { pendingImages: pendingImages, redraw: redraw };
  }

  window.AdminEditor = {
    applyMd: applyMd,
    insertAtCursor: insertAtCursor,
    convertToJpeg: convertToJpeg,
    uuidv4: uuidv4,
    fileToDataUrl: fileToDataUrl,
    dataUrlToBase64: dataUrlToBase64,
    ingestFiles: ingestFiles,
    refreshGallery: refreshGallery,
    removePendingImage: removePendingImage,
    attachEditorBindings: attachEditorBindings,
    substituteImagePlaceholders: substituteImagePlaceholders,
    findReferencedUuids: findReferencedUuids,
    IMG_MAX_BYTES: IMG_MAX_BYTES,
    IMG_ALLOWED_FINAL_TYPES: IMG_ALLOWED_FINAL_TYPES,
    MAX_IMAGES_PER_SUBMISSION: MAX_IMAGES_PER_SUBMISSION,
    UUID_RE: UUID_RE,
  };
})();
