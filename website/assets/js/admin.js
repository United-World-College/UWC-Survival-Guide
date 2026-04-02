(function () {
  // ── Firebase Init ──
  var firebaseConfig = {
    apiKey: "AIzaSyC2PkxnmMwJiD73ouo8Jxmk536_A2RkNy8",
    authDomain: "uwc-survival-guide.firebaseapp.com",
    projectId: "uwc-survival-guide",
    storageBucket: "uwc-survival-guide.firebasestorage.app",
    messagingSenderId: "239920982978",
    appId: "1:239920982978:web:5ddd10c09ba0153956045b",
    measurementId: "G-9NHVLYWGFV"
  };
  firebase.initializeApp(firebaseConfig);

  var auth = firebase.auth();
  var db = firebase.firestore();
  var storage = firebase.storage();
  var functions = firebase.functions();

  function makeSlug(text) {
    return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function makeAuthorSlug(text) {
    return (text || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ß]/g, 'ss')
      .replace(/[Ææ]/g, 'ae')
      .replace(/[Œœ]/g, 'oe')
      .replace(/[Øø]/g, 'o')
      .replace(/[ÐðĐđ]/g, 'd')
      .replace(/[Þþ]/g, 'th')
      .replace(/[Łł]/g, 'l')
      .replace(/[Ħħ]/g, 'h')
      .replace(/[ı]/g, 'i')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function hasLatinDisplayName(text) {
    return /[a-z]/.test(makeAuthorSlug(text));
  }

  function getAuthorSlugBase(user, preferredName) {
    var slug = makeAuthorSlug(preferredName || '');
    if (slug) return slug;
    var authSlug = makeAuthorSlug(user && user.displayName ? user.displayName : '');
    if (authSlug) return authSlug;
    var emailSeed = user && user.email ? makeAuthorSlug(user.email.split('@')[0]) : '';
    return emailSeed || (user && user.uid ? user.uid.toLowerCase() : '');
  }

  function ensureUniqueAuthorSlug(baseSlug, currentUid) {
    if (!baseSlug) return Promise.resolve(currentUid ? currentUid.toLowerCase() : '');
    return (function checkSlug(slug, attempt) {
      return db.collection('users').where('author_id', '==', slug).get().then(function (snap) {
        if (snap.empty || (snap.docs.length === 1 && snap.docs[0].id === currentUid)) {
          return slug;
        }
        return checkSlug(baseSlug + '-' + (attempt + 1), attempt + 1);
      });
    })(baseSlug, 1);
  }

  // ── View Management ──
  var views = ['view-signin', 'view-signup', 'view-forgot', 'view-dashboard'];

  function showView(id) {
    views.forEach(function (v) {
      document.getElementById(v).style.display = v === id ? '' : 'none';
    });
    if (id === 'view-dashboard') {
      document.getElementById(id).style.display = 'block';
    } else {
      document.getElementById(id).style.display = 'flex';
    }
  }

  function clearErrors() {
    var errors = document.querySelectorAll('.admin-error, .admin-success');
    errors.forEach(function (el) { el.style.display = 'none'; el.textContent = ''; });
  }

  function showError(elId, msg) {
    var el = document.getElementById(elId);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function showSuccess(elId, msg) {
    var el = document.getElementById(elId);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function friendlyError(code) {
    var map = {
      'auth/email-already-in-use': ADMIN_I18N.err_email_exists,
      'auth/invalid-email':        ADMIN_I18N.err_invalid_email,
      'auth/user-disabled':        ADMIN_I18N.err_user_disabled,
      'auth/user-not-found':       ADMIN_I18N.err_user_not_found,
      'auth/wrong-password':       ADMIN_I18N.err_wrong_password,
      'auth/weak-password':        ADMIN_I18N.err_weak_password,
      'auth/too-many-requests':    ADMIN_I18N.err_too_many_requests,
      'auth/invalid-credential':   ADMIN_I18N.err_invalid_credential,
      'auth/missing-password':     ADMIN_I18N.err_missing_password,
      'auth/network-request-failed': ADMIN_I18N.err_network
    };
    return map[code] || ADMIN_I18N.err_generic;
  }

  function getStatusLabel(status) {
    return ADMIN_I18N['status_' + status] || (status.charAt(0).toUpperCase() + status.slice(1));
  }

  function setLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = ADMIN_I18N.please_wait;
      btn.disabled = true;
      btn.style.opacity = '0.6';
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
      btn.style.opacity = '';
    }
  }

  // ── Navigation between auth views ──
  document.getElementById('goto-signup').addEventListener('click', function (e) {
    e.preventDefault(); clearErrors(); showView('view-signup');
  });
  document.getElementById('goto-forgot').addEventListener('click', function (e) {
    e.preventDefault(); clearErrors(); showView('view-forgot');
  });
  document.getElementById('goto-signin-from-signup').addEventListener('click', function (e) {
    e.preventDefault(); clearErrors(); showView('view-signin');
  });
  document.getElementById('goto-signin-from-forgot').addEventListener('click', function (e) {
    e.preventDefault(); clearErrors(); showView('view-signin');
  });

  // ── Sign In ──
  document.getElementById('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var email = document.getElementById('signin-email').value.trim();
    var password = document.getElementById('signin-password').value;
    setLoading('signin-btn', true);
    auth.signInWithEmailAndPassword(email, password)
      .then(function () { setLoading('signin-btn', false); })
      .catch(function (err) {
        setLoading('signin-btn', false);
        showError('signin-error', friendlyError(err.code));
      });
  });

  // ── Sign Up ──
  document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var displayName = document.getElementById('signup-name').value.trim();
    var baseSlug = makeAuthorSlug(displayName);
    var email = document.getElementById('signup-email').value.trim();
    var password = document.getElementById('signup-password').value;
    var confirm = document.getElementById('signup-confirm').value;
    if (!displayName) {
      document.getElementById('signup-name').focus();
      return;
    }
    if (!hasLatinDisplayName(displayName)) {
      document.getElementById('signup-name').focus();
      showError('signup-error', ADMIN_I18N.display_name_latin_required);
      return;
    }
    if (password !== confirm) {
      showError('signup-error', ADMIN_I18N.passwords_no_match);
      return;
    }
    setLoading('signup-btn', true);
    var authorSlug;
    auth.createUserWithEmailAndPassword(email, password)
      .then(function (cred) {
        authorSlug = baseSlug || getAuthorSlugBase(cred.user, displayName);
        return ensureUniqueAuthorSlug(authorSlug, cred.user.uid).then(function (uniqueSlug) {
          authorSlug = uniqueSlug;
          return cred.user.updateProfile({ displayName: displayName }).catch(function () {
            return null;
          }).then(function () {
            return db.collection('users').doc(cred.user.uid).set({
              displayName: displayName,
              photoURL: cred.user.photoURL || '',
              email: email,
              author_id: authorSlug,
              affiliation: '',
              cohort: '',
              summary: '',
              profileLinks: [],
              showEmail: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
        });
      })
      .then(function () { setLoading('signup-btn', false); })
      .catch(function (err) {
        setLoading('signup-btn', false);
        showError('signup-error', friendlyError(err.code));
      });
  });

  // ── Forgot Password ──
  document.getElementById('forgot-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var email = document.getElementById('forgot-email').value.trim();
    setLoading('forgot-btn', true);
    auth.sendPasswordResetEmail(email)
      .then(function () {
        setLoading('forgot-btn', false);
        showSuccess('forgot-success', ADMIN_I18N.reset_email_sent);
      })
      .catch(function (err) {
        setLoading('forgot-btn', false);
        showError('forgot-error', friendlyError(err.code));
      });
  });

  // ── Sign Out ──
  document.getElementById('signout-btn').addEventListener('click', function () {
    auth.signOut();
  });

  // ── Auth State Listener ──
  auth.onAuthStateChanged(function (user) {
    if (user) {
      showView('view-dashboard');
      loadProfile(user);
      loadSubmissions(user.uid);
      initFeaturedPanel(user.uid);
      checkAdmin();
    } else {
      showView('view-signin');
      isAdmin = false;
      document.getElementById('admin-review-panel').style.display = 'none';
    }
  });

  // ── Profile ──
  function getAuthorRole(authorId) {
    var isEIC = EIC_IDS.indexOf(authorId) !== -1;
    if (isEIC) return { label: ADMIN_I18N.role_eic, className: 'admin-role-badge admin-role-badge-eic' };
    var count = AUTHOR_ARTICLE_COUNTS[authorId] || 0;
    if (count >= 5) return { label: ADMIN_I18N.role_core_member, className: 'admin-role-badge admin-role-badge-core' };
    return { label: ADMIN_I18N.role_member, className: 'admin-role-badge' };
  }

  function buildDefaultProfile(user) {
    var displayName = (user.displayName || '').trim();
    return ensureUniqueAuthorSlug(getAuthorSlugBase(user, displayName), user.uid).then(function (authorId) {
      return {
        displayName: displayName,
        photoURL: user.photoURL || '',
        email: user.email,
        author_id: authorId,
        affiliation: '',
        cohort: '',
        summary: '',
        profileLinks: [],
        showEmail: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
    });
  }

  function renderProfileData(user, data) {
    var displayName = data.displayName || '';
    var authorId = data.author_id || '';
    document.getElementById('profile-name').value = displayName;
    document.getElementById('article-author').value = displayName;
    document.getElementById('profile-affiliation').value = data.affiliation || '';
    document.getElementById('profile-cohort').value = data.cohort || '';
    document.getElementById('profile-summary').value = data.summary || '';
    document.getElementById('profile-show-email').checked = !!data.showEmail;
    updateNameCount();
    updateSummaryCount();
    if (data.photoURL) {
      showAvatarImage(data.photoURL);
    } else {
      showAvatarPlaceholder(displayName || user.email);
    }
    loadProfileLinks(data.profileLinks || []);

    document.getElementById('profile-author-id').textContent = '';
    document.getElementById('profile-author-id-field').style.display = 'none';
    document.getElementById('profile-role-field').style.display = 'none';
    document.getElementById('published-articles-card').style.display = 'none';
    currentUserAuthor = null;

    if (!authorId) return;

    document.getElementById('profile-author-id').textContent = authorId;
    document.getElementById('profile-author-id-field').style.display = 'block';
    currentUserAuthor = { author_id: authorId, name: displayName || authorId, uid: user.uid };
    addSelfAsCoauthor();

    var role = getAuthorRole(authorId);
    var roleBadge = document.getElementById('profile-role-badge');
    roleBadge.textContent = role.label;
    roleBadge.className = role.className;
    document.getElementById('profile-role-field').style.display = 'block';

    var card = document.getElementById('published-articles-card');
    card.style.display = 'block';
    var linkEl = document.getElementById('published-articles-link');
    if (typeof SITE_AUTHOR_IDS !== 'undefined' && SITE_AUTHOR_IDS.indexOf(authorId) !== -1) {
      var baseUrl = SITE_BASEURL;
      var authorPage = '/authors/' + authorId + '/';
      linkEl.innerHTML =
        '<a href="' + baseUrl + ADMIN_I18N.lang_prefix + authorPage + '" class="admin-btn" style="display:inline-block;text-decoration:none;text-align:center;margin-top:0.5rem;">' + ADMIN_I18N.view_published + '</a>';
    } else {
      linkEl.innerHTML = '<p style="font-size:0.88rem;color:var(--warm-gray);font-style:italic;margin-top:0.5rem;">' + escapeHtml(ADMIN_I18N.published_no_profile) + '</p>';
    }
  }

  function loadProfile(user) {
    document.getElementById('profile-email').value = user.email;
    db.collection('users').doc(user.uid).get().then(function (doc) {
      if (doc.exists) {
        renderProfileData(user, doc.data());
        return;
      }
      return buildDefaultProfile(user).then(function (profileData) {
        return db.collection('users').doc(user.uid).set(profileData).then(function () {
          renderProfileData(user, profileData);
        });
      });
    }).catch(function () {
      showAvatarPlaceholder(user.email);
    });
  }

  function showAvatarImage(url) {
    var img = document.getElementById('avatar-img');
    var placeholder = document.getElementById('avatar-placeholder');
    img.onerror = function () {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    };
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  function showAvatarPlaceholder(nameOrEmail) {
    var img = document.getElementById('avatar-img');
    var placeholder = document.getElementById('avatar-placeholder');
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    var initial = (nameOrEmail || '?').charAt(0).toUpperCase();
    placeholder.textContent = initial;
  }

  // Avatar upload
  document.getElementById('avatar-preview').addEventListener('click', function () {
    document.getElementById('avatar-input').click();
  });

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

    // Try createImageBitmap first (works for HEIC in Safari and recent Chrome)
    if (typeof createImageBitmap !== 'undefined') {
      return createImageBitmap(file).then(toJpegViaCanvas).catch(function () {
        // Fallback to heic2any if bitmap decode fails
        if (isHeic && typeof heic2any !== 'undefined') {
          return heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }).then(function (result) {
            var blob = Array.isArray(result) ? result[0] : result;
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          }).catch(function () { return Promise.reject(new Error(HEIC_ERR)); });
        }
        return Promise.reject(new Error(isHeic ? HEIC_ERR : 'Cannot convert this image format. Please convert to JPG or PNG before uploading.'));
      });
    }

    // No createImageBitmap — try heic2any directly
    if (isHeic && typeof heic2any !== 'undefined') {
      return heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }).then(function (result) {
        var blob = Array.isArray(result) ? result[0] : result;
        return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      }).catch(function () { return Promise.reject(new Error(HEIC_ERR)); });
    }

    return Promise.reject(new Error(isHeic ? HEIC_ERR : 'Cannot convert this image format. Please convert to JPG or PNG before uploading.'));
  }

  document.getElementById('avatar-input').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      showError('profile-error', ADMIN_I18N.image_file_only);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('profile-error', ADMIN_I18N.image_too_large);
      return;
    }
    var user = auth.currentUser;
    if (!user) return;
    clearErrors();
    showSuccess('profile-success', ADMIN_I18N.uploading_photo);

    convertToJpeg(file).then(function (readyFile) {
      var ref = storage.ref('avatars/' + user.uid);
      return ref.put(readyFile).then(function (snapshot) {
        return snapshot.ref.getDownloadURL();
      });
    }).then(function (url) {
      return db.collection('users').doc(user.uid).update({ photoURL: url }).then(function () {
        showAvatarImage(url);
        document.getElementById('profile-success').style.display = 'none';
      });
    }).catch(function (err) {
      document.getElementById('profile-success').style.display = 'none';
      showError('profile-error', (err && err.message) || ADMIN_I18N.photo_failed);
    });
  });

  // ── Profile Links ──
  function createLinkRow(label, url) {
    var row = document.createElement('div');
    row.className = 'admin-link-row';
    row.innerHTML = '<input type="text" class="admin-input admin-link-label" placeholder="' + escapeHtml(ADMIN_I18N.link_label_ph) + '" value="' + escapeHtml(label || '') + '" />' +
      '<input type="url" class="admin-input admin-link-url" placeholder="https://..." value="' + escapeHtml(url || '') + '" />' +
      '<button type="button" class="admin-link-remove">&times;</button>';
    row.querySelector('.admin-link-remove').addEventListener('click', function () {
      row.remove();
      updateAddLinkBtn();
    });
    return row;
  }

  var MAX_LINKS = 3;
  var NAME_LIMIT = 40;
  var SUMMARY_LIMIT = 120;

  // Character counters
  function updateNameCount() {
    var input = document.getElementById('profile-name');
    var counter = document.getElementById('profile-name-count');
    var remaining = NAME_LIMIT - input.value.length;
    counter.textContent = remaining + '/' + NAME_LIMIT;
    counter.style.color = remaining <= 8 ? '#b94a48' : 'var(--warm-gray)';
  }
  function updateSummaryCount() {
    var input = document.getElementById('profile-summary');
    var counter = document.getElementById('profile-summary-count');
    var remaining = SUMMARY_LIMIT - input.value.length;
    counter.textContent = remaining + '/' + SUMMARY_LIMIT;
    counter.style.color = remaining <= 8 ? '#b94a48' : 'var(--warm-gray)';
  }
  document.getElementById('profile-name').addEventListener('input', updateNameCount);
  document.getElementById('profile-summary').addEventListener('input', updateSummaryCount);
  updateNameCount();
  updateSummaryCount();

  function updateAddLinkBtn() {
    var count = document.querySelectorAll('.admin-link-row').length;
    var btn = document.getElementById('add-link-btn');
    var note = document.getElementById('links-limit-note');
    if (count >= MAX_LINKS) {
      btn.style.display = 'none';
      note.style.display = 'block';
    } else {
      btn.style.display = '';
      note.style.display = 'none';
    }
  }

  document.getElementById('add-link-btn').addEventListener('click', function () {
    if (document.querySelectorAll('.admin-link-row').length >= MAX_LINKS) return;
    document.getElementById('profile-links-list').appendChild(createLinkRow('', ''));
    updateAddLinkBtn();
  });

  function loadProfileLinks(links) {
    var container = document.getElementById('profile-links-list');
    container.innerHTML = '';
    if (links && links.length > 0) {
      links.forEach(function (link) {
        container.appendChild(createLinkRow(link.label, link.url));
      });
    }
    updateAddLinkBtn();
  }

  function getProfileLinks() {
    var rows = document.querySelectorAll('.admin-link-row');
    var links = [];
    rows.forEach(function (row) {
      var label = row.querySelector('.admin-link-label').value.trim();
      var url = row.querySelector('.admin-link-url').value.trim();
      if (label && url) links.push({ label: label, url: url });
    });
    return links;
  }

  // Save profile
  document.getElementById('save-profile-btn').addEventListener('click', function () {
    var user = auth.currentUser;
    if (!user) return;
    clearErrors();
    var name = document.getElementById('profile-name').value.trim();
    var affiliation = document.getElementById('profile-affiliation').value.trim();
    var cohort = document.getElementById('profile-cohort').value.trim();
    var summary = document.getElementById('profile-summary').value.trim();
    if (!cohort) {
      document.getElementById('profile-cohort').focus();
      showError('profile-error', ADMIN_I18N.err_fill_all);
      return;
    }
    if (name && !hasLatinDisplayName(name)) {
      document.getElementById('profile-name').focus();
      showError('profile-error', ADMIN_I18N.display_name_latin_required);
      return;
    }
    var links = getProfileLinks();
    var showEmail = document.getElementById('profile-show-email').checked;
    setLoading('save-profile-btn', true);
    // Check if author_id already exists before saving
    var existingData = {};
    var profileData = null;
    db.collection('users').doc(user.uid).get().then(function (doc) {
      existingData = doc.exists ? doc.data() : {};
      profileData = {
        displayName: name,
        email: user.email,
        affiliation: affiliation,
        cohort: cohort,
        summary: summary,
        profileLinks: links,
        showEmail: showEmail
      };
      if (existingData.author_id) {
        return db.collection('users').doc(user.uid).set(profileData, { merge: true });
      }
      var baseId = makeAuthorSlug(name);
      if (!baseId) baseId = getAuthorSlugBase(user, existingData.displayName || '');
      return ensureUniqueAuthorSlug(baseId, user.uid).then(function (slug) {
        profileData.author_id = slug;
        return db.collection('users').doc(user.uid).set(profileData, { merge: true });
      });
    }).then(function () {
      setLoading('save-profile-btn', false);
      renderProfileData(user, Object.assign({}, existingData, profileData || {}));
      showSuccess('profile-success', ADMIN_I18N.profile_saved);
      setTimeout(function () {
        document.getElementById('profile-success').style.display = 'none';
      }, 3000);
    }).catch(function (err) {
      console.error('Save profile error:', err.code, err.message);
      setLoading('save-profile-btn', false);
      showError('profile-error', 'Error: ' + err.message);
    });
  });

  // ── Co-Authors ──
  var MAX_COAUTHORS = 10;
  var pendingCoauthor = null; // { author_id, name }
  var currentUserAuthor = null; // { author_id, name }

  function hasAuthorProfile(authorId) {
    return typeof SITE_AUTHOR_IDS !== 'undefined' && SITE_AUTHOR_IDS.indexOf(authorId) !== -1;
  }

  function coauthorSearchLookup() {
    var input = document.getElementById('coauthor-search-input');
    var resultEl = document.getElementById('coauthor-search-result');
    var searchId = input.value.trim();
    pendingCoauthor = null;
    if (!searchId) { resultEl.style.display = 'none'; return; }

    resultEl.style.display = '';
    resultEl.className = 'admin-coauthor-search-result admin-coauthor-searching';
    resultEl.innerHTML = '<span class="admin-coauthor-result-text">' + escapeHtml(ADMIN_I18N.coauthor_searching) + '</span>';

    db.collection('users').where('author_id', '==', searchId).get().then(function (snapshot) {
      if (snapshot.empty) {
        document.querySelector('.admin-coauthor-search').style.display = 'none';
        resultEl.className = 'admin-coauthor-search-result admin-coauthor-result-error';
        resultEl.innerHTML = '<span class="admin-coauthor-result-text">' + escapeHtml(ADMIN_I18N.coauthor_not_found) + '</span>' +
          '<button type="button" class="admin-coauthor-dismiss">&times;</button>';
        resultEl.querySelector('.admin-coauthor-dismiss').addEventListener('click', function () {
          resultEl.style.display = 'none';
          document.querySelector('.admin-coauthor-search').style.display = '';
          document.getElementById('coauthor-search-input').value = '';
          document.getElementById('coauthor-search-input').focus();
        });
        return;
      }
      var coauthorUid = snapshot.docs[0].id;
      var userData = snapshot.docs[0].data();
      var displayName = userData.displayName || searchId;
      var hasProfile = hasAuthorProfile(searchId);
      var baseUrl = SITE_BASEURL;
      var profileHref = baseUrl + ADMIN_I18N.lang_prefix + '/authors/' + searchId + '/';

      // Check if already added
      var existing = document.querySelectorAll('.admin-coauthor-row');
      var alreadyAdded = false;
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].getAttribute('data-author-id') === searchId) { alreadyAdded = true; break; }
      }
      var atLimit = existing.length >= MAX_COAUTHORS;

      resultEl.className = 'admin-coauthor-search-result admin-coauthor-result-success';

      // Build left side: name (always shown as link-style, tooltip if no profile)
      var nameHtml = hasProfile
        ? '<a href="' + escapeHtml(profileHref) + '" target="_blank" rel="noopener noreferrer" class="admin-coauthor-result-name">' + escapeHtml(displayName) + '</a>'
        : '<span class="admin-coauthor-result-name admin-coauthor-result-name-no-profile" tabindex="0">' + escapeHtml(displayName) + '</span>';
      var profileTag = '';

      // Build right side: action
      var actionHtml = '';
      if (alreadyAdded) {
        actionHtml = '<span class="admin-coauthor-result-note">' + escapeHtml(ADMIN_I18N.coauthor_already_added) + '</span>';
        pendingCoauthor = null;
      } else if (atLimit) {
        actionHtml = '<span class="admin-coauthor-result-note">' + escapeHtml(ADMIN_I18N.coauthors_max) + '</span>';
        pendingCoauthor = null;
      } else {
        pendingCoauthor = { author_id: searchId, name: displayName, uid: coauthorUid };
        actionHtml = '<button type="button" class="admin-btn admin-coauthor-add-btn" id="coauthor-add-found">' + escapeHtml(ADMIN_I18N.coauthor_add_btn) + '</button>';
      }

      // Hide search bar when showing result
      document.querySelector('.admin-coauthor-search').style.display = 'none';
      var dismissHtml = '<button type="button" class="admin-coauthor-dismiss" id="coauthor-result-dismiss">&times;</button>';
      resultEl.innerHTML = '<div class="admin-coauthor-result-info">' + nameHtml + profileTag + '</div>' + actionHtml + dismissHtml;
      document.getElementById('coauthor-result-dismiss').addEventListener('click', function () {
        resultEl.style.display = 'none';
        document.querySelector('.admin-coauthor-search').style.display = '';
        document.getElementById('coauthor-search-input').value = '';
        document.getElementById('coauthor-search-input').focus();
      });
      var addBtn = document.getElementById('coauthor-add-found');
      if (addBtn) addBtn.addEventListener('click', addPendingCoauthor);
      var noProfileName = resultEl.querySelector('.admin-coauthor-result-name-no-profile');
      if (noProfileName) {
        noProfileName.addEventListener('click', function () {
          var existing = resultEl.querySelector('.admin-coauthor-no-profile');
          if (existing) { existing.remove(); return; }
          var tip = document.createElement('div');
          tip.className = 'admin-coauthor-no-profile';
          tip.textContent = ADMIN_I18N.coauthor_no_profile;
          resultEl.appendChild(tip);
        });
      }
    }).catch(function () {
      document.querySelector('.admin-coauthor-search').style.display = 'none';
      resultEl.className = 'admin-coauthor-search-result admin-coauthor-result-error';
      resultEl.innerHTML = '<span class="admin-coauthor-result-text">' + escapeHtml(ADMIN_I18N.coauthor_lookup_error) + '</span>' +
        '<button type="button" class="admin-coauthor-dismiss">&times;</button>';
      resultEl.querySelector('.admin-coauthor-dismiss').addEventListener('click', function () {
        resultEl.style.display = 'none';
        document.querySelector('.admin-coauthor-search').style.display = '';
        document.getElementById('coauthor-search-input').value = '';
        document.getElementById('coauthor-search-input').focus();
      });
    });
  }

  function addPendingCoauthor() {
    if (!pendingCoauthor) return;
    if (document.querySelectorAll('.admin-coauthor-row').length >= MAX_COAUTHORS) return;
    document.getElementById('coauthors-list').appendChild(createCoauthorRow(pendingCoauthor.author_id, pendingCoauthor.name, false, pendingCoauthor.uid));
    updateCoauthorNumbers();
    updateLimitNote();
    // Reset search and collapse panel
    pendingCoauthor = null;
    document.getElementById('coauthor-search-input').value = '';
    document.getElementById('coauthor-search-result').style.display = 'none';
    document.querySelector('.admin-coauthor-search').style.display = '';
    document.getElementById('coauthor-search-panel').style.display = 'none';
    document.getElementById('coauthor-toggle-btn').style.display = '';
  }

  // Section-level toggle: show the entire co-authors section
  document.getElementById('coauthor-section-toggle').addEventListener('click', function () {
    document.getElementById('coauthor-section').style.display = '';
    this.style.display = 'none';
  });

  // Close the co-authors section and reset everything
  document.getElementById('coauthor-section-close').addEventListener('click', function () {
    pendingCoauthor = null;
    // Remove all added coauthors except self
    var rows = document.querySelectorAll('.admin-coauthor-row');
    var selfId = currentUserAuthor ? currentUserAuthor.author_id : null;
    rows.forEach(function (row) {
      if (row.getAttribute('data-author-id') !== selfId) row.remove();
    });
    // Re-add self if missing
    addSelfAsCoauthor();
    updateCoauthorNumbers();
    updateLimitNote();
    // Reset search UI
    document.getElementById('coauthor-search-input').value = '';
    document.getElementById('coauthor-search-result').style.display = 'none';
    document.querySelector('.admin-coauthor-search').style.display = '';
    document.getElementById('coauthor-search-panel').style.display = 'none';
    document.getElementById('coauthor-toggle-btn').style.display = '';
    // Collapse section
    document.getElementById('coauthor-section').style.display = 'none';
    document.getElementById('coauthor-section-toggle').style.display = '';
  });

  document.getElementById('coauthor-toggle-btn').addEventListener('click', function () {
    var panel = document.getElementById('coauthor-search-panel');
    var btn = document.getElementById('coauthor-toggle-btn');
    if (panel.style.display === 'none') {
      panel.style.display = '';
      btn.style.display = 'none';
      document.getElementById('coauthor-search-input').focus();
    }
  });

  document.getElementById('coauthor-search-btn').addEventListener('click', coauthorSearchLookup);
  document.getElementById('coauthor-search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); coauthorSearchLookup(); }
  });

  function addSelfAsCoauthor() {
    if (!currentUserAuthor) return;
    var list = document.getElementById('coauthors-list');
    // Skip if already present
    var existing = list.querySelectorAll('.admin-coauthor-row');
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].getAttribute('data-author-id') === currentUserAuthor.author_id) return;
    }
    list.appendChild(createCoauthorRow(currentUserAuthor.author_id, currentUserAuthor.name, true, currentUserAuthor.uid));
    updateCoauthorNumbers();
    updateLimitNote();
  }

  function createCoauthorRow(authorId, name, isSelf, uid) {
    var row = document.createElement('div');
    row.className = 'admin-coauthor-row';
    row.setAttribute('data-author-id', authorId);
    row.setAttribute('data-author-name', name);
    if (uid) row.setAttribute('data-uid', uid);
    var baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '' : '/UWC-Survival-Guide';
    var profileHref = baseUrl + ADMIN_I18N.lang_prefix + '/authors/' + authorId + '/';
    var hasProfile = hasAuthorProfile(authorId);
    var nameEl = hasProfile
      ? '<a href="' + escapeHtml(profileHref) + '" target="_blank" rel="noopener noreferrer" class="admin-coauthor-profile-link admin-coauthor-name-display">' + escapeHtml(name) + '</a>'
      : '<span class="admin-coauthor-name-display admin-coauthor-name-no-profile">' + escapeHtml(name) + '</span>';
    row.innerHTML = '<span class="admin-coauthor-order"></span>' +
      nameEl +
      '<span class="admin-coauthor-id-display">' + escapeHtml(authorId) + '</span>' +
      '<button type="button" class="admin-coauthor-move" data-dir="up" title="Move up">&uarr;</button>' +
      '<button type="button" class="admin-coauthor-move" data-dir="down" title="Move down">&darr;</button>' +
      (isSelf ? '<span class="admin-link-remove" style="visibility:hidden">&times;</span>' : '<button type="button" class="admin-link-remove">&times;</button>');
    if (!hasProfile) {
      var nameSpan = row.querySelector('.admin-coauthor-name-no-profile');
      nameSpan.addEventListener('click', function () {
        var existing = row.querySelector('.admin-coauthor-no-profile-tip');
        if (existing) { existing.remove(); return; }
        var tip = document.createElement('div');
        tip.className = 'admin-coauthor-no-profile-tip';
        tip.textContent = ADMIN_I18N.coauthor_no_profile;
        row.appendChild(tip);
      });
    }
    var removeBtn = row.querySelector('.admin-link-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        row.remove();
        updateCoauthorNumbers();
        updateLimitNote();
      });
    }
    row.querySelectorAll('.admin-coauthor-move').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var list = document.getElementById('coauthors-list');
        var dir = this.getAttribute('data-dir');
        if (dir === 'up' && row.previousElementSibling) {
          list.insertBefore(row, row.previousElementSibling);
        } else if (dir === 'down' && row.nextElementSibling) {
          list.insertBefore(row.nextElementSibling, row);
        }
        updateCoauthorNumbers();
      });
    });
    return row;
  }

  function updateCoauthorNumbers() {
    var rows = document.querySelectorAll('.admin-coauthor-row');
    rows.forEach(function (row, i) {
      row.querySelector('.admin-coauthor-order').textContent = (i + 1);
      row.querySelector('[data-dir="up"]').disabled = i === 0;
      row.querySelector('[data-dir="down"]').disabled = i === rows.length - 1;
    });
  }

  function updateLimitNote() {
    var count = document.querySelectorAll('.admin-coauthor-row').length;
    var note = document.getElementById('coauthors-limit-note');
    var atMax = count >= MAX_COAUTHORS;
    note.style.display = atMax ? 'block' : 'none';
    document.getElementById('coauthor-toggle-btn').style.display = atMax ? 'none' : '';
  }

  function getAuthorIdentity(author) {
    if (!author) return '';
    if (author.uid) return 'uid:' + author.uid;
    if (author.author_id) return 'author:' + author.author_id;
    var name = (author.name || '').trim().toLowerCase();
    return name ? 'name:' + name : '';
  }

  function normalizeAuthors(authors) {
    var seen = {};
    var normalized = [];
    (authors || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    }).forEach(function (author, index) {
      if (!author) return;
      var normalizedAuthor = {
        author_id: author.author_id || '',
        name: (author.name || '').trim(),
        order: author.order || index + 1
      };
      if (author.uid) normalizedAuthor.uid = author.uid;
      if (!normalizedAuthor.name) return;
      var key = getAuthorIdentity(normalizedAuthor);
      if (!key || seen[key]) return;
      seen[key] = true;
      normalizedAuthor.order = normalized.length + 1;
      normalized.push(normalizedAuthor);
    });
    return normalized;
  }

  function getCoauthors() {
    var rows = document.querySelectorAll('.admin-coauthor-row');
    var coauthors = [];
    rows.forEach(function (row, i) {
      var authorId = row.getAttribute('data-author-id');
      var name = row.getAttribute('data-author-name');
      if (authorId && name) {
        var obj = { author_id: authorId, name: name, order: i + 1 };
        var uid = row.getAttribute('data-uid');
        if (uid) obj.uid = uid;
        coauthors.push(obj);
      }
    });
    return normalizeAuthors(coauthors);
  }

  function getCurrentSubmissionAuthors(userUid, authorName) {
    var authors = getCoauthors();
    if (authors.length > 0) return authors;
    if (!authorName) return [];
    var fallback = {
      author_id: currentUserAuthor && currentUserAuthor.author_id ? currentUserAuthor.author_id : '',
      name: authorName,
      order: 1
    };
    if (userUid || (currentUserAuthor && currentUserAuthor.uid)) {
      fallback.uid = userUid || currentUserAuthor.uid;
    }
    return normalizeAuthors([fallback]);
  }

  function getSubmissionAuthors(d) {
    return normalizeAuthors(d && d.coAuthors ? d.coAuthors : []);
  }

  function getAuthorNames(authors) {
    return (authors || []).map(function (author) { return author.name; }).join(', ');
  }

  // ── Submit Article ──
  document.getElementById('article-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var user = auth.currentUser;
    if (!user) return;
    clearErrors();

    var title = document.getElementById('article-title').value.trim();
    var category = document.getElementById('article-category').value;
    var language = document.getElementById('article-language').value;
    var authorName = document.getElementById('article-author').value.trim();
    var coAuthors = getCurrentSubmissionAuthors(user.uid, authorName);
    var description = document.getElementById('article-description').value.trim();
    var content = document.getElementById('article-content').value;

    if (!title || !category || !language || !authorName || !description || !content) {
      showError('article-error', ADMIN_I18N.err_fill_all);
      return;
    }

    setLoading('submit-article-btn', true);

    var submitFn = functions.httpsCallable('submitArticle');
    submitFn({
      title: title,
      category: category,
      language: language,
      description: description,
      content: content,
      authorName: authorName,
      coAuthors: coAuthors
    }).then(function () {
      setLoading('submit-article-btn', false);
      showSuccess('article-success', ADMIN_I18N.article_submitted);
      document.getElementById('article-form').reset();
      document.getElementById('article-author').value = authorName;
      document.getElementById('coauthors-list').innerHTML = '';
      document.getElementById('coauthor-search-panel').style.display = 'none';
      document.getElementById('coauthor-toggle-btn').style.display = '';
      document.getElementById('coauthor-section').style.display = 'none';
      document.getElementById('coauthor-section-toggle').style.display = '';
      addSelfAsCoauthor();
      updateLimitNote();
      loadSubmissions(user.uid);
      setTimeout(function () {
        document.getElementById('article-success').style.display = 'none';
      }, 5000);
    }).catch(function () {
      setLoading('submit-article-btn', false);
      showError('article-error', ADMIN_I18N.article_failed);
    });
  });

  // ── Article Preview ──
  document.getElementById('tab-open-newtab').addEventListener('click', openPreviewTab);

  function getArticleFields() {
    var authorName = document.getElementById('article-author').value.trim() || '';
    var authors = getCurrentSubmissionAuthors(currentUserAuthor ? currentUserAuthor.uid : '', authorName);
    return {
      title: document.getElementById('article-title').value.trim() || 'Untitled Article',
      category: document.getElementById('article-category').value || '',
      author: getAuthorNames(authors),
      description: document.getElementById('article-description').value.trim() || '',
      content: document.getElementById('article-content').value || ''
    };
  }

  function openPreviewTab() {
    var f = getArticleFields();
    var stylesheetHref = (document.querySelector('link[rel="stylesheet"]') || {}).href || '';
    var rawHtml = typeof marked !== 'undefined' ? marked.parse(f.content) : escapeHtml(f.content);
    var renderedContent = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : escapeHtml(f.content);
    var win = window.open('', '_blank');
    if (!win) return;
    win.document.write('<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>PREVIEW \u2014 ' + escapeHtml(f.title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">' +
      (stylesheetHref ? '<link rel="stylesheet" href="' + stylesheetHref + '">' : '') +
      '<style>body{font-family:"Inter",-apple-system,Helvetica,Arial,sans-serif;}' +
      '.preview-banner{position:sticky;top:0;z-index:999;background:#2c2a26;color:#f6f4f0;text-align:center;' +
      'padding:0.55rem 1rem;font-size:0.75rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;}' +
      '</style>' +
      '</head><body>' +
      '<div class="preview-banner">' + escapeHtml(ADMIN_I18N.preview_banner) + '</div>' +
      '<header class="guide-hero"><div class="guide-hero-content">' +
      '<p class="hero-label">' + escapeHtml(f.category) + '</p>' +
      '<h1>' + escapeHtml(f.title) + '</h1>' +
      (f.author ? '<p class="guide-byline">' + escapeHtml(ADMIN_I18N.preview_by) + escapeHtml(f.author) + '</p>' : '') +
      (f.description ? '<p class="hero-subtitle">' + escapeHtml(f.description) + '</p>' : '') +
      '</div></header>' +
      '<div class="divider"></div>' +
      '<article class="guide-content">' + renderedContent + '</article>' +
      '</body></html>');
    win.document.close();
    win.focus();
  }

  // ── Featured Articles ──
  var currentFeaturedIds = [];

  function initFeaturedPanel(uid) {
    loadFeaturedPanel(uid);
  }

  function loadFeaturedPanel(uid) {
    // Read user doc for featuredGuideIds (user preference)
    var userPromise = db.collection('users').doc(uid).get();
    // Query approved submissions where user is primary author or coauthor
    var ownQuery = db.collection('submissions')
      .where('status', '==', 'approved')
      .where('uid', '==', uid)
      .get();
    var coauthorQuery = db.collection('submissions')
      .where('status', '==', 'approved')
      .where('coauthorUids', 'array-contains', uid)
      .get();

    Promise.all([userPromise, ownQuery, coauthorQuery]).then(function (results) {
      var userDoc = results[0];
      if (!userDoc.exists) return;
      var userData = userDoc.data();
      if (!userData.author_id) return;

      currentFeaturedIds = userData.featuredGuideIds || [];
      document.getElementById('featured-articles-card').style.display = 'block';

      // Merge and deduplicate submissions by guide_id
      var seen = {};
      var articles = [];
      [results[1], results[2]].forEach(function (snapshot) {
        snapshot.forEach(function (doc) {
          var d = doc.data();
          if (d.guide_id && !seen[d.guide_id]) {
            seen[d.guide_id] = true;
            articles.push({ guide_id: d.guide_id, title: d.title, category: d.category });
          }
        });
      });
      renderFeaturedList(uid, articles);
    }).catch(function () {
      document.getElementById('featured-articles-list').innerHTML =
        '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.load_articles_failed) + '</p>';
    });
  }

  function renderFeaturedList(uid, articles) {
    var list = document.getElementById('featured-articles-list');
    if (!articles.length) {
      list.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.no_articles) + '</p>';
      return;
    }
    var html = '<div class="admin-submissions">';
    articles.forEach(function (article) {
      var guideId = article.guide_id || '';
      var siteGuide = (typeof SITE_GUIDES !== 'undefined') ? SITE_GUIDES.filter(function (g) { return g.guide_id === guideId; })[0] : null;
      var displayTitle = siteGuide ? siteGuide.title : (article.title || guideId);
      var displayCategory = siteGuide ? siteGuide.category : (article.category || '');
      var isFeatured = currentFeaturedIds.indexOf(guideId) !== -1;
      html += '<div class="admin-submission-item">';
      var displayUrl = siteGuide ? siteGuide.url : null;
      html += '<div class="admin-submission-main">';
      html += '<h3 class="admin-submission-title">';
      if (displayUrl) {
        html += '<a href="' + escapeHtml(displayUrl) + '" target="_blank" rel="noopener">' + escapeHtml(displayTitle) + '</a>';
      } else {
        html += escapeHtml(displayTitle);
      }
      html += '</h3>';
      var translatedCategory = (ADMIN_I18N.categories && ADMIN_I18N.categories[displayCategory]) || displayCategory;
      if (displayCategory) html += '<div class="admin-submission-meta"><span>' + escapeHtml(translatedCategory) + '</span></div>';
      html += '</div>';
      html += '<button type="button" class="admin-featured-star' + (isFeatured ? ' is-active' : '') + '" data-guide-id="' + escapeHtml(guideId) + '" title="' + (isFeatured ? escapeHtml(ADMIN_I18N.remove_featured) : escapeHtml(ADMIN_I18N.add_featured)) + '">';
      html += isFeatured ? '&#9733;' : '&#9734;';
      html += '</button>';
      html += '</div>';
    });
    html += '</div>';
    list.innerHTML = html;
    list.querySelectorAll('.admin-featured-star').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleFeatured(uid, this.getAttribute('data-guide-id'), this);
      });
    });
  }

  function toggleFeatured(uid, guideId, btn) {
    if (!guideId) return;
    var idx = currentFeaturedIds.indexOf(guideId);
    if (idx === -1) {
      if (currentFeaturedIds.length >= 3) {
        showSuccess('featured-success', ADMIN_I18N.featured_max);
        return;
      }
      currentFeaturedIds.push(guideId);
    } else {
      currentFeaturedIds.splice(idx, 1);
    }
    var isFeatured = currentFeaturedIds.indexOf(guideId) !== -1;
    btn.innerHTML = isFeatured ? '&#9733;' : '&#9734;';
    btn.classList.toggle('is-active', isFeatured);
    btn.title = isFeatured ? ADMIN_I18N.remove_featured : ADMIN_I18N.add_featured;
    db.collection('users').doc(uid).update({ featuredGuideIds: currentFeaturedIds })
      .then(function () {
        showSuccess('featured-success', ADMIN_I18N.featured_updated);
        setTimeout(function () { document.getElementById('featured-success').style.display = 'none'; }, 2500);
      })
      .catch(function () {
        if (isFeatured) {
          var i = currentFeaturedIds.indexOf(guideId);
          if (i !== -1) currentFeaturedIds.splice(i, 1);
        } else {
          currentFeaturedIds.push(guideId);
        }
        isFeatured = currentFeaturedIds.indexOf(guideId) !== -1;
        btn.innerHTML = isFeatured ? '&#9733;' : '&#9734;';
        btn.classList.toggle('is-active', isFeatured);
      });
  }

  // ── Character counters ──
  function updateCharCounter(textareaId, counterId, max) {
    var ta = document.getElementById(textareaId);
    var counter = document.getElementById(counterId);
    if (!ta || !counter) return;
    var len = ta.value.length;
    counter.textContent = len + ' / ' + max;
    counter.className = 'admin-char-counter';
    if (len >= max) {
      counter.classList.add('admin-char-at-limit');
    } else if (len >= max * 0.85) {
      counter.classList.add('admin-char-near-limit');
    }
  }

  document.getElementById('modal-rnr-comments').addEventListener('input', function () {
    updateCharCounter('modal-rnr-comments', 'modal-rnr-comments-counter', 1000);
  });
  document.getElementById('modal-reject-comments').addEventListener('input', function () {
    updateCharCounter('modal-reject-comments', 'modal-reject-comments-counter', 1000);
  });
  document.getElementById('modal-approve-comments').addEventListener('input', function () {
    updateCharCounter('modal-approve-comments', 'modal-approve-comments-counter', 500);
  });

  // ── Resubmit — open in new tab ──
  function resubmitArticle(docId) {
    var win = window.open('', '_blank');
    if (!win) return;
    var stylesheetHref = (document.querySelector('link[rel="stylesheet"]') || {}).href || '';
    var labels = {
      resubmit_btn:            ADMIN_I18N.resubmit_btn,
      resubmitting:            ADMIN_I18N.resubmitting,
      resubmit_success:        ADMIN_I18N.resubmit_success,
      article_failed:          ADMIN_I18N.article_failed,
      err_fill_all:            ADMIN_I18N.err_fill_all,
      revision_feedback_label: ADMIN_I18N.revision_feedback_label,
      author_message_label:    ADMIN_I18N.author_message_label,
      author_message_placeholder: ADMIN_I18N.author_message_placeholder,
      author_message_to_reviewer: ADMIN_I18N.author_message_to_reviewer,
      preview_btn:             ADMIN_I18N.preview_btn,
      preview_banner:          ADMIN_I18N.preview_banner,
      preview_by:              ADMIN_I18N.preview_by,
      close_tab:               ADMIN_I18N.close_tab,
      round_label:             'Round',
      coauthors_label:         ADMIN_I18N.coauthors_label
    };
    win.document.write('<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escapeHtml(labels.resubmit_btn) + '<\/title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">' +
      (stylesheetHref ? '<link rel="stylesheet" href="' + stylesheetHref + '">' : '') +
      '<style>body{margin:0;padding:0;}<\/style>' +
      '<\/head><body>' +
      '<div class="admin-wrapper">' +
      '<div class="admin-hero"><div class="admin-hero-content">' +
      '<h1 class="admin-hero-title" id="rs-hero-title">' + escapeHtml(labels.resubmit_btn) + '<\/h1>' +
      '<\/div><\/div>' +
      '<div class="admin-section"><div class="admin-panel">' +
      '<div class="admin-card" id="rs-app"><p class="admin-empty-state">Loading...<\/p><\/div>' +
      '<\/div><\/div><\/div>' +
      '<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"><\/script>' +
      '<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"><\/script>' +
      '<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"><\/script>' +
      '<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"><\/script>' +
      '<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"><\/script>' +
      '<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-functions-compat.js"><\/script>' +
      '<script>' +
      '(function(){' +
      'var DOC_ID=' + JSON.stringify(docId) + ';' +
      'var L=' + JSON.stringify(labels) + ';' +
      'var STYLESHEET=' + JSON.stringify(stylesheetHref) + ';' +
      'firebase.initializeApp({apiKey:"AIzaSyC2PkxnmMwJiD73ouo8Jxmk536_A2RkNy8",authDomain:"uwc-survival-guide.firebaseapp.com",' +
        'projectId:"uwc-survival-guide",storageBucket:"uwc-survival-guide.firebasestorage.app",' +
        'messagingSenderId:"239920982978",appId:"1:239920982978:web:5ddd10c09ba0153956045b"});' +
      'var auth=firebase.auth();var db=firebase.firestore();' +
      'auth.onAuthStateChanged(function(user){' +
        'if(!user){document.getElementById("rs-app").innerHTML="<p>Please sign in first.<\/p>";return;}' +
        'db.collection("submissions").doc(DOC_ID).get().then(function(doc){' +
          'if(!doc.exists){document.getElementById("rs-app").innerHTML="<p>Submission not found.<\/p>";return;}' +
          'render(doc.data());' +
        '}).catch(function(){document.getElementById("rs-app").innerHTML="<p>Could not load submission.<\/p>";});' +
      '});' +
      'function esc(s){var d=document.createElement("div");d.appendChild(document.createTextNode(s||""));return d.innerHTML;}' +
      'function fmtDate(s){if(!s)return"";try{var dt=new Date(s);return dt.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})+" "+dt.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"});}catch(e){return s;}}' +
      'function counter(ta,el,max){var n=ta.value.length;el.textContent=n+" / "+max;el.className="admin-char-counter";' +
        'if(n>=max)el.classList.add("admin-char-at-limit");else if(n>=max*0.85)el.classList.add("admin-char-near-limit");}' +
      'function authorKey(a){if(!a)return"";if(a.uid)return"uid:"+a.uid;if(a.author_id)return"author:"+a.author_id;var name=(a.name||"").trim().toLowerCase();return name?"name:"+name:"";}' +
      'function orderedAuthors(d){var seen={};var authors=(d&&d.coAuthors?d.coAuthors:[]).slice().sort(function(a,b){return(a.order||0)-(b.order||0);});return authors.filter(function(a){if(!a||!a.name)return false;var key=authorKey(a);if(!key||seen[key])return false;seen[key]=true;return true;});}' +
      'function authorNames(d){return orderedAuthors(d).map(function(a){return a.name;}).join(", ");}' +
      'function openPreview(title,category,author,desc,content){' +
        'var rawHtml=typeof marked!=="undefined"?marked.parse(content):esc(content);' +
        'var rendered=typeof DOMPurify!=="undefined"?DOMPurify.sanitize(rawHtml):esc(content);' +
        'var pw=window.open("","_blank");if(!pw)return;' +
        'pw.document.write("<!DOCTYPE html><html><head><meta charset=UTF-8><meta name=viewport content=\\"width=device-width,initial-scale=1\\">' +
          '<title>PREVIEW \\u2014 "+esc(title)+"<\\/title>' +
          '<link rel=preconnect href=https://fonts.googleapis.com><link rel=preconnect href=https://fonts.gstatic.com crossorigin>' +
          '<link href=\\"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap\\" rel=stylesheet>"' +
          '+(STYLESHEET?"<link rel=stylesheet href=\\""+STYLESHEET+"\\">":"")' +
          '+"<style>body{font-family:Inter,-apple-system,Helvetica,Arial,sans-serif;}.preview-banner{position:sticky;top:0;z-index:999;background:#2c2a26;color:#f6f4f0;text-align:center;padding:0.55rem 1rem;font-size:0.75rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;}<\\/style>' +
          '<\\/head><body><div class=preview-banner>"+esc(L.preview_banner)+"<\\/div>' +
          '<header class=guide-hero><div class=guide-hero-content><p class=hero-label>"+esc(category)+"<\\/p><h1>"+esc(title)+"<\\/h1>"' +
          '+(author?"<p class=guide-byline>"+esc(L.preview_by)+esc(author)+"<\\/p>":"")' +
          '+(desc?"<p class=hero-subtitle>"+esc(desc)+"<\\/p>":"")' +
          '+"<\\/div><\\/header><div class=divider><\\/div><article class=guide-content>"+rendered+"<\\/article><\\/body><\\/html>");' +
        'pw.document.close();pw.focus();}' +
      'function render(d){' +
        'var history=d.revisionHistory||(d.reviewerComments?[{round:1,reviewerComments:d.reviewerComments,' +
          'reviewedAt:null,authorMessage:d.authorMessage||null,resubmittedAt:null}]:[]);' +
        'document.getElementById("rs-hero-title").textContent=L.resubmit_btn+(d.title?" \\u2014 "+d.title:"");' +
        'var h="<h2 class=\\"admin-card-title\\">"+esc(L.resubmit_btn)+"<\/h2>";' +
        /* revision thread */
        'if(history.length){' +
          'h+="<div class=\\"admin-revision-thread\\">";' +
          'history.forEach(function(e,i){' +
            'h+="<div class=\\"admin-revision-entry\\">";' +
            'h+="<p class=\\"admin-revision-round-label\\">"+esc(L.round_label)+" "+e.round+"<\/p>";' +
            'if(e.reviewerComments){' +
              'h+="<div class=\\"admin-rnr-feedback\\">";' +
              'h+="<p class=\\"admin-rnr-feedback-label\\">"+esc(L.revision_feedback_label)+"<\/p>";' +
              'h+="<p class=\\"admin-rnr-feedback-body\\">"+esc(e.reviewerComments)+"<\/p>";' +
              'if(e.reviewedAt)h+="<p class=\\"admin-revision-timestamp\\">"+fmtDate(e.reviewedAt)+"<\/p>";' +
              'if(e.contentSnapshot)h+="<button class=\\"admin-editor-tab admin-editor-tab-newtab rs-view-ver\\" data-round=\\""+i+"\\">"+esc(L.preview_btn)+" (v"+e.round+")<\/button>";' +
              'h+="<\/div>";' +
            '}' +
            'if(e.authorMessage){' +
              'h+="<div class=\\"admin-rnr-feedback\\">";' +
              'h+="<p class=\\"admin-rnr-feedback-label\\">"+esc(L.author_message_to_reviewer)+"<\/p>";' +
              'h+="<p class=\\"admin-rnr-feedback-body\\">"+esc(e.authorMessage)+"<\/p>";' +
              'if(e.resubmittedAt)h+="<p class=\\"admin-revision-timestamp\\">"+fmtDate(e.resubmittedAt)+"<\/p>";' +
              'h+="<\/div>";' +
            '}' +
            'h+="<\/div>";' +
          '});' +
          'h+="<\/div>";' +
        '}' +
        /* co-authors (read-only) */
        'if(orderedAuthors(d).length){' +
          'h+="<div class=\\"admin-field\\" style=\\"margin-bottom:1.5rem;\\"><label class=\\"admin-label\\">"+esc(L.coauthors_label)+"<\/label>";' +
          'h+="<p style=\\"font-size:0.9rem;color:var(--text-primary,#2c2a26);\\">"+esc(authorNames(d))+"<\/p><\/div>";' +
        '}' +
        /* form */
        'h+="<form id=\\"rs-form\\" class=\\"admin-form\\">";' +
        'h+="<div class=\\"admin-field\\"><label class=\\"admin-label\\">Title<\/label><input id=\\"rs-title\\" class=\\"admin-input\\" required><\/div>";' +
        'h+="<div class=\\"admin-field\\"><label class=\\"admin-label\\">Category<\/label>";' +
        'h+="<select id=\\"rs-cat\\" class=\\"admin-input admin-select\\" required>";' +
        'h+="<option value=\\"\\" disabled>Select...<\/option>";' +
        'h+="<option value=\\"College Application\\">College Application<\/option>";' +
        'h+="<option value=\\"Life Reflections\\">人生杂谈 / Life Reflections<\/option>";' +
        'h+="<option value=\\"Academics\\">Academics<\/option>";' +
        'h+="<\/select><\/div>";' +
        'h+="<div class=\\"admin-field\\"><label class=\\"admin-label\\">Language<\/label>";' +
        'h+="<select id=\\"rs-lang\\" class=\\"admin-input admin-select\\" required>";' +
        'h+="<option value=\\"\\" disabled>Select...<\/option>";' +
        'h+="<option value=\\"en\\">English<\/option>";' +
        'h+="<option value=\\"zh-CN\\">简体中文<\/option>";' +
        'h+="<option value=\\"zh-TW\\">台灣繁體<\/option>";' +
        'h+="<\/select><\/div>";' +
        'h+="<div class=\\"admin-field\\"><label class=\\"admin-label\\">Description<\/label><input id=\\"rs-desc\\" class=\\"admin-input\\" required><\/div>";' +
        'h+="<div class=\\"admin-field\\"><div class=\\"admin-editor-header\\"><label class=\\"admin-label\\">Content<\/label>";' +
        'h+="<button type=\\"button\\" class=\\"admin-editor-tab admin-editor-tab-newtab\\" id=\\"rs-preview\\">"+esc(L.preview_btn)+"<\/button><\/div>";' +
        'h+="<textarea id=\\"rs-content\\" class=\\"admin-input admin-textarea\\" rows=\\"14\\" required><\/textarea><\/div>";' +
        'h+="<div class=\\"admin-field\\"><label class=\\"admin-label\\">"+esc(L.author_message_label)+"<\/label>";' +
        'h+="<textarea id=\\"rs-msg\\" class=\\"admin-input admin-textarea\\" rows=\\"3\\" placeholder=\\""+esc(L.author_message_placeholder)+"\\" maxlength=\\"500\\"><\/textarea>";' +
        'h+="<p class=\\"admin-char-counter\\" id=\\"rs-counter\\">0 / 500<\/p><\/div>";' +
        'h+="<button type=\\"submit\\" class=\\"admin-btn\\" id=\\"rs-submit\\">"+esc(L.resubmit_btn)+"<\/button>";' +
        'h+="<\/form>";' +
        'h+="<p id=\\"rs-error\\" class=\\"admin-error\\" style=\\"display:none;margin-top:1rem;\\"><\/p>";' +
        'document.getElementById("rs-app").innerHTML=h;' +
        /* populate fields */
        'var tTitle=document.getElementById("rs-title");' +
        'tTitle.value=d.title||"";' +
        'document.getElementById("rs-cat").value=d.category||"";' +
        'document.getElementById("rs-lang").value=d.language||"";' +
        'document.getElementById("rs-desc").value=d.description||"";' +
        'document.getElementById("rs-content").value=d.content||"";' +
        /* preview button */
        'var rsAuthorStr=authorNames(d);' +
        'document.getElementById("rs-preview").addEventListener("click",function(){' +
          'openPreview(document.getElementById("rs-title").value.trim()||"Untitled",' +
            'document.getElementById("rs-cat").value,' +
            'rsAuthorStr,' +
            'document.getElementById("rs-desc").value.trim(),' +
            'document.getElementById("rs-content").value);' +
        '});' +
        /* view version buttons */
        'document.querySelectorAll(".rs-view-ver").forEach(function(btn){' +
          'btn.addEventListener("click",function(){' +
            'var idx=parseInt(this.getAttribute("data-round"));' +
            'var snap=history[idx].contentSnapshot;' +
            'if(snap)openPreview(snap.title||d.title,snap.category||d.category,authorNames(d),snap.description||d.description,snap.content||"");' +
          '});' +
        '});' +
        /* char counter */
        'var msgTa=document.getElementById("rs-msg");' +
        'var ctr=document.getElementById("rs-counter");' +
        'msgTa.addEventListener("input",function(){counter(msgTa,ctr,500);});' +
        /* submit handler */
        'document.getElementById("rs-form").addEventListener("submit",function(ev){' +
          'ev.preventDefault();' +
          'var title=tTitle.value.trim();' +
          'var cat=document.getElementById("rs-cat").value;' +
          'var lang=document.getElementById("rs-lang").value;' +
          'var desc=document.getElementById("rs-desc").value.trim();' +
          'var content=document.getElementById("rs-content").value;' +
          'var msg=msgTa.value.trim();' +
          'if(!title||!cat||!lang||!desc||!content){' +
            'var err=document.getElementById("rs-error");' +
            'err.textContent=L.err_fill_all;err.style.display="block";return;}' +
          'var btn=document.getElementById("rs-submit");' +
          'btn.textContent=L.resubmitting;btn.disabled=true;' +
          'var resubmit=firebase.functions().httpsCallable("resubmitArticle");' +
          'resubmit({docId:DOC_ID,title:title,category:cat,language:lang,description:desc,content:content,authorMessage:msg||""}).then(function(){' +
            'document.getElementById("rs-form").style.display="none";' +
            'document.getElementById("rs-error").style.display="none";' +
            'var sc=document.createElement("div");sc.className="admin-success";sc.style.cssText="margin-top:1.5rem;padding:1.2rem;text-align:center;";' +
            'sc.innerHTML="<p style=\\"margin:0 0 1rem;font-size:1.05rem;\\">"+esc(L.resubmit_success)+"<\/p>"' +
              '+"<button class=\\"admin-btn\\" id=\\"rs-close-tab\\">"+esc(L.close_tab)+"<\/button>";' +
            'document.getElementById("rs-app").appendChild(sc);' +
            'document.getElementById("rs-close-tab").addEventListener("click",function(){window.close();});' +
            'if(window.opener&&!window.opener.closed){' +
              'try{window.opener.location.reload();}catch(e){}' +
            '}' +
          '}).catch(function(e){' +
            'console.error(e);btn.textContent=L.resubmit_btn;btn.disabled=false;' +
            'var err=document.getElementById("rs-error");err.textContent=L.article_failed;err.style.display="block";' +
          '});' +
        '});' +
      '}' +
      '})();' +
      '<\/script><\/body><\/html>');
    win.document.close();
    win.focus();
  }

  // ── My Submissions ──
  function openSubmissionPreview(docId) {
    db.collection('submissions').doc(docId).get().then(function (doc) {
      if (!doc.exists) return;
      var d = doc.data();
      openContentPreview(d.title, d.category, getAuthorNames(getSubmissionAuthors(d)), d.description, d.content);
    });
  }

  function formatTimelineDate(value) {
    if (!value) return '';
    try {
      var dt = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value);
      if (!dt || isNaN(dt.getTime())) return String(value);
      return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
        dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });
    } catch (e) {
      return String(value);
    }
  }

  function getSubmissionRevisionHistory(d) {
    var history = Array.isArray(d.revisionHistory) ? d.revisionHistory : [];
    if (history.length) return history;
    if (d.reviewerComments) {
      return [{
        round: 1,
        reviewerComments: d.reviewerComments,
        reviewedAt: d.reviewedAt || null,
        authorMessage: d.authorMessage || null,
        resubmittedAt: null
      }];
    }
    return [];
  }

  function renderSubmissionDecisionFeedback(d) {
    if (!d || (d.status !== 'approved' && d.status !== 'rejected')) return '';
    var isApproved = d.status === 'approved';
    var message = isApproved ? d.approveMessage : d.rejectionReason;
    if (!message) return '';
    var status = isApproved ? 'approved' : 'rejected';
    var html = '<div class="admin-rnr-feedback admin-rnr-feedback-' + status + '">';
    html += '<p class="admin-rnr-feedback-label">' + escapeHtml(getStatusLabel(status)) + '</p>';
    html += '<p class="admin-rnr-feedback-body">' + escapeHtml(message) + '</p>';
    if (d.reviewedAt) html += '<p class="admin-revision-timestamp">' + formatTimelineDate(d.reviewedAt) + '</p>';
    html += '</div>';
    return html;
  }

  function renderSubmissionThread(d) {
    var history = getSubmissionRevisionHistory(d);
    var decisionHtml = renderSubmissionDecisionFeedback(d);
    if (!history.length && !decisionHtml) return '';
    var threadContent = '';
    history.forEach(function (entry, idx) {
      var roundLabel = entry.round || (idx + 1);
      threadContent += '<div class="admin-revision-entry">';
      threadContent += '<p class="admin-revision-round-label">Round ' + roundLabel + '</p>';
      if (entry.reviewerComments) {
        threadContent += '<div class="admin-rnr-feedback">';
        threadContent += '<p class="admin-rnr-feedback-label">' + escapeHtml(ADMIN_I18N.revision_feedback_label) + '</p>';
        threadContent += '<p class="admin-rnr-feedback-body">' + escapeHtml(entry.reviewerComments) + '</p>';
        if (entry.reviewedAt) threadContent += '<p class="admin-revision-timestamp">' + formatTimelineDate(entry.reviewedAt) + '</p>';
        threadContent += '</div>';
      }
      if (entry.authorMessage) {
        threadContent += '<div class="admin-rnr-feedback">';
        threadContent += '<p class="admin-rnr-feedback-label">' + escapeHtml(ADMIN_I18N.author_message_to_reviewer) + '</p>';
        threadContent += '<p class="admin-rnr-feedback-body">' + escapeHtml(entry.authorMessage) + '</p>';
        if (entry.resubmittedAt) threadContent += '<p class="admin-revision-timestamp">' + formatTimelineDate(entry.resubmittedAt) + '</p>';
        threadContent += '</div>';
      }
      threadContent += '</div>';
    });
    if (decisionHtml) {
      threadContent += '<div class="admin-revision-entry admin-revision-entry-decision">' + decisionHtml + '</div>';
    }
    var html = '<details class="admin-revision-thread">';
    html += '<summary class="admin-thread-toggle">' + escapeHtml(ADMIN_I18N.show_review_thread || 'Show review history') + '</summary>';
    html += threadContent;
    html += '</details>';
    return html;
  }

  function loadSubmissions(uid) {
    var container = document.getElementById('submissions-list');
    container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.loading_submissions) + '</p>';

    // Query both own submissions and coauthored submissions without relying on
    // composite indexes; merged results are sorted client-side below.
    var ownQuery = db.collection('submissions').where('uid', '==', uid).get();
    var coauthorQuery = db.collection('submissions').where('coauthorUids', 'array-contains', uid).get();

    Promise.allSettled([ownQuery, coauthorQuery]).then(function (results) {
      var fulfilled = results.filter(function (result) {
        return result.status === 'fulfilled';
      }).map(function (result) {
        return result.value;
      });

      if (fulfilled.length === 0) {
        throw new Error('Could not load submissions.');
      }

      // Merge and deduplicate
      var seen = {};
      var allDocs = [];
      fulfilled.forEach(function (snapshot) {
        snapshot.forEach(function (doc) {
          if (!seen[doc.id]) {
            seen[doc.id] = true;
            allDocs.push(doc);
          }
        });
      });
      // Sort by createdAt descending
      allDocs.sort(function (a, b) {
        var ta = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
        var tb = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
        return tb - ta;
      });

      if (allDocs.length === 0) {
          container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.no_submissions) + '</p>';
          return;
        }
        var html = '<div class="admin-submissions">';
        allDocs.forEach(function (doc) {
          var d = doc.data();
          var authors = getSubmissionAuthors(d);
          var date = d.createdAt ? (function(dt){ return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }); })(d.createdAt.toDate()) : ADMIN_I18N.just_now;
          var status = d.status || 'pending';
          var statusClass = 'admin-status-' + status;
          var isRnR = status === 'revise_resubmit';
          html += '<div class="admin-submission-item">';
          html += '<div class="admin-submission-main">';
          if (status === 'approved' && d.guide_id) {
            html += '<h3 class="admin-submission-title"><a href="' + guideUrl(d.guide_id, d.language) + '" target="_blank" rel="noopener">' + escapeHtml(d.title) + '</a></h3>';
          } else {
            html += '<h3 class="admin-submission-title">' + escapeHtml(d.title) + '</h3>';
          }
          html += '<div class="admin-submission-meta">';
          if (authors.length > 0) {
            html += '<span class="admin-submission-authors" data-doc-id="' + doc.id + '"></span>';
          }
          html += '<span>' + escapeHtml(d.category) + '</span>';
          html += '<span><span class="admin-date-label">' + escapeHtml(ADMIN_I18N.submitted_label) + '</span> ' + date + '</span>';
          if (status === 'approved' && d.reviewedAt) {
            var approvedDate = (function(dt){ return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }); })(d.reviewedAt.toDate());
            html += '<span><span class="admin-date-label">' + escapeHtml(ADMIN_I18N.approved_label) + '</span> ' + approvedDate + '</span>';
          }
          html += '</div>';
          html += renderSubmissionThread(d);
          if (isRnR) {
            html += '<button class="admin-btn admin-btn-small" style="margin-top:0.75rem;" data-resubmit="' + doc.id + '">' + escapeHtml(ADMIN_I18N.resubmit_btn) + '</button>';
          }
          html += '</div>';
          html += '<div class="admin-submission-side">';
          html += '<span class="admin-status ' + statusClass + '">' + escapeHtml(getStatusLabel(status)) + '</span>';
          html += '<button class="admin-editor-tab admin-editor-tab-newtab" data-preview="' + doc.id + '">' + escapeHtml(ADMIN_I18N.preview_btn) + '</button>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.admin-submission-authors[data-doc-id]').forEach(function (el) {
          var docId = el.getAttribute('data-doc-id');
          var match = allDocs.find(function (d) { return d.id === docId; });
          if (match) {
            renderSubmissionAuthorLinks(el, getSubmissionAuthors(match.data()), '');
          }
        });

        container.querySelectorAll('[data-resubmit]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            resubmitArticle(this.getAttribute('data-resubmit'));
          });
        });
        container.querySelectorAll('[data-preview]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openSubmissionPreview(this.getAttribute('data-preview'));
          });
        });
      })
      .catch(function () {
        container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.load_submissions_failed) + '</p>';
      });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  var ADMIN_LANG_MAP = {
    'en':    { folder: 'default', suffix: '' },
    'zh-CN': { folder: 'chinese', suffix: '-CN' },
    'zh-TW': { folder: 'chinese', suffix: '-TW' }
  };
  function guideUrl(guideId, lang) {
    var info = ADMIN_LANG_MAP[lang] || ADMIN_LANG_MAP['en'];
    return SITE_BASEURL + '/guides/' + info.folder + '/' + guideId + info.suffix + '/';
  }

  function resolveAuthorIdForDisplay(author) {
    if (!author) return Promise.resolve(null);
    if (author.author_id) return Promise.resolve(author.author_id);
    if (!author.uid) return Promise.resolve(null);
    return db.collection('users').doc(author.uid).get().then(function (doc) {
      return doc.exists && doc.data().author_id ? doc.data().author_id : null;
    }).catch(function () {
      return null;
    });
  }

  function renderSubmissionAuthorLinks(targetEl, authors, prefix) {
    if (!targetEl) return;
    if (!authors || !authors.length) {
      targetEl.textContent = (prefix || '') + ADMIN_I18N.author_unknown;
      return;
    }
    targetEl.textContent = (prefix || '') + getAuthorNames(authors);
    Promise.all(authors.map(resolveAuthorIdForDisplay)).then(function (authorIds) {
      var baseUrl = SITE_BASEURL;
      var parts = authors.map(function (author, index) {
        var resolvedId = authorIds[index];
        if (resolvedId) {
          var href = baseUrl + ADMIN_I18N.lang_prefix + '/authors/' + resolvedId + '/';
          return '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" class="admin-author-link">' + escapeHtml(author.name) + '</a>';
        }
        return escapeHtml(author.name);
      });
      targetEl.innerHTML = escapeHtml(prefix || '') + parts.join(', ');
      targetEl.querySelectorAll('a.admin-author-link').forEach(function (link) {
        link.addEventListener('click', function (e) { e.stopPropagation(); });
      });
    }).catch(function () {});
  }

  // ══════════════════════════════════════
  // ── Admin Review Panel ──
  // ══════════════════════════════════════

  var isAdmin = false;
  var currentFilter = 'pending';
  var currentModalDocId = null;
  var currentModalData = null;

  function checkAdmin() {
    var user = auth.currentUser;
    if (!user) return;
    // Force token refresh so server-side emailVerified changes take effect
    user.getIdToken(true).then(function () {
      var checkAdminStatus = functions.httpsCallable('checkAdminStatus');
      return checkAdminStatus();
    }).then(function (result) {
      if (result.data && result.data.isAdmin) {
        isAdmin = true;
        document.getElementById('admin-review-panel').style.display = 'block';
        loadReviewList('pending');
        initReviewTabs();
      }
    }).catch(function () {
      isAdmin = false;
    });
  }

  function initReviewTabs() {
    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        loadReviewList(currentFilter);
      });
    });
  }

  function loadReviewList(filter) {
    var container = document.getElementById('review-list');
    container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.loading) + '</p>';

    db.collection('submissions').get().then(function (snapshot) {
      var docs = [];
      snapshot.forEach(function (doc) { docs.push({ id: doc.id, data: doc.data() }); });
      if (filter !== 'all') {
        docs = docs.filter(function (d) { return d.data.status === filter; });
      }
      docs.sort(function (a, b) {
        var ta = a.data.createdAt ? a.data.createdAt.toMillis() : 0;
        var tb = b.data.createdAt ? b.data.createdAt.toMillis() : 0;
        return tb - ta;
      });
      if (docs.length === 0) {
        var filterLabel = ADMIN_I18N['filter_' + filter] || filter;
        var msg = ADMIN_I18N.no_filter_prefix + ADMIN_I18N.no_filter_sep + filterLabel + ADMIN_I18N.no_filter_sep + ADMIN_I18N.no_filter_suffix;
        container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(msg) + '</p>';
        return;
      }
      var html = '<div class="admin-submissions">';
      docs.forEach(function (item) {
        var doc = { id: item.id };
        var d = item.data;
        var authors = getSubmissionAuthors(d);
        var date = d.createdAt ? (function(dt){ return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }); })(d.createdAt.toDate()) : ADMIN_I18N.just_now;
        var statusClass = 'admin-status-' + (d.status || 'pending');
        html += '<div class="admin-submission-item admin-review-item" data-id="' + doc.id + '">';
        html += '<div class="admin-submission-main">';
        html += '<h3 class="admin-submission-title">' + escapeHtml(d.title) + '</h3>';
        html += '<div class="admin-submission-meta">';
        var authorDisplay = getAuthorNames(authors) || ADMIN_I18N.author_unknown;
        html += '<span class="admin-author-name">' + escapeHtml(authorDisplay) + '</span>';
        html += '<span>' + escapeHtml(d.category) + '</span>';
        html += '<span>' + escapeHtml(ADMIN_I18N.submitted_label) + ' ' + date + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<span class="admin-status ' + statusClass + '">' + escapeHtml(getStatusLabel(d.status || 'pending')) + '</span>';
        html += '</div>';
      });
      html += '</div>';
      container.innerHTML = html;

      container.querySelectorAll('.admin-review-item').forEach(function (item) {
        var docId = item.getAttribute('data-id');
        var match = null;
        docs.forEach(function (entry) {
          if (!match && entry.id === docId) match = entry;
        });
        if (match) {
          var authorEl = item.querySelector('.admin-author-name');
          renderSubmissionAuthorLinks(authorEl, getSubmissionAuthors(match.data), '');
        }
        item.addEventListener('click', function () {
          openReviewModal(this.getAttribute('data-id'));
        });
      });
    }).catch(function (err) {
      console.error('Review load error:', err);
      container.innerHTML = '<p class="admin-empty-state">' + escapeHtml(ADMIN_I18N.load_review_failed) + '</p>';
    });
  }

  function openContentPreview(title, category, author, description, content) {
    var rawHtml = typeof marked !== 'undefined' ? marked.parse(content || '') : escapeHtml(content || '');
    var renderedContent = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : escapeHtml(content || '');
    var stylesheetHref = (document.querySelector('link[rel="stylesheet"]') || {}).href || '';
    var win = window.open('', '_blank');
    if (!win) return;
    win.document.write('<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>PREVIEW \u2014 ' + escapeHtml(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">' +
      (stylesheetHref ? '<link rel="stylesheet" href="' + stylesheetHref + '">' : '') +
      '<style>body{font-family:"Inter",-apple-system,Helvetica,Arial,sans-serif;}' +
      '.preview-banner{position:sticky;top:0;z-index:999;background:#2c2a26;color:#f6f4f0;text-align:center;' +
      'padding:0.55rem 1rem;font-size:0.75rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;}</style>' +
      '</head><body>' +
      '<div class="preview-banner">' + escapeHtml(ADMIN_I18N.preview_banner) + '</div>' +
      '<header class="guide-hero"><div class="guide-hero-content">' +
      '<p class="hero-label">' + escapeHtml(category) + '</p>' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      (author ? '<p class="guide-byline">' + escapeHtml(ADMIN_I18N.preview_by) + escapeHtml(author) + '</p>' : '') +
      (description ? '<p class="hero-subtitle">' + escapeHtml(description) + '</p>' : '') +
      '</div></header>' +
      '<div class="divider"></div>' +
      '<article class="guide-content">' + renderedContent + '</article>' +
      '</body></html>');
    win.document.close();
    win.focus();
  }

  function renderRevisionThread(d) {
    var threadEl = document.getElementById('modal-revision-thread');
    var history = getSubmissionRevisionHistory(d);
    var decisionHtml = renderSubmissionDecisionFeedback(d);
    if (!history.length && !decisionHtml) {
      threadEl.style.display = 'none';
      return;
    }

    var html = '';
    history.forEach(function (entry, idx) {
      var roundLabel = entry.round || (idx + 1);
      html += '<div class="admin-revision-entry">';
      html += '<p class="admin-revision-round-label">Round ' + roundLabel + '</p>';
      if (entry.reviewerComments) {
        html += '<div class="admin-rnr-feedback">';
        html += '<p class="admin-rnr-feedback-label">' + escapeHtml(ADMIN_I18N.revision_feedback_label) + '</p>';
        html += '<p class="admin-rnr-feedback-body">' + escapeHtml(entry.reviewerComments) + '</p>';
        if (entry.reviewedAt) html += '<p class="admin-revision-timestamp">' + formatTimelineDate(entry.reviewedAt) + '</p>';
        if (entry.contentSnapshot) {
          html += '<button class="admin-editor-tab admin-editor-tab-newtab modal-view-ver" data-ver-idx="' + idx + '">' + escapeHtml(ADMIN_I18N.preview_btn) + ' (v' + roundLabel + ')</button>';
        }
        html += '</div>';
      }
      if (entry.authorMessage) {
        html += '<div class="admin-rnr-feedback">';
        html += '<p class="admin-rnr-feedback-label">' + escapeHtml(ADMIN_I18N.author_message_to_reviewer) + '</p>';
        html += '<p class="admin-rnr-feedback-body">' + escapeHtml(entry.authorMessage) + '</p>';
        if (entry.resubmittedAt) html += '<p class="admin-revision-timestamp">' + formatTimelineDate(entry.resubmittedAt) + '</p>';
        html += '</div>';
      }
      html += '</div>';
    });
    if (decisionHtml) {
      html += '<div class="admin-revision-entry admin-revision-entry-decision">' + decisionHtml + '</div>';
    }
    threadEl.innerHTML = html;
    threadEl.style.display = 'block';

    // Wire up version preview buttons
    threadEl.querySelectorAll('.modal-view-ver').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-ver-idx'));
        var snap = history[idx].contentSnapshot;
        if (snap) {
          openContentPreview(snap.title || d.title, snap.category || d.category, getAuthorNames(getSubmissionAuthors(d)), snap.description || d.description, snap.content || '');
        }
      });
    });
  }

  function openReviewModal(docId) {
    currentModalDocId = docId;
    var modal = document.getElementById('review-modal');
    var mdOutput = document.getElementById('modal-md-output');
    mdOutput.style.display = 'none';

    db.collection('submissions').doc(docId).get().then(function (doc) {
      if (!doc.exists) return;
      var d = doc.data();
      var authors = getSubmissionAuthors(d);
      currentModalData = d;
      var date = d.createdAt ? (function(dt){ return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }); })(d.createdAt.toDate()) : ADMIN_I18N.author_unknown;

      document.getElementById('modal-title').textContent = d.title;
      var modalAuthorEl = document.getElementById('modal-author');
      var coAuthorsEl = document.getElementById('modal-coauthors');
      coAuthorsEl.textContent = '';
      coAuthorsEl.style.display = 'none';
      renderSubmissionAuthorLinks(modalAuthorEl, authors, ADMIN_I18N.by_prefix);
      document.getElementById('modal-category').textContent = d.category;
      document.getElementById('modal-date').textContent = ADMIN_I18N.submitted_label + ' ' + date;
      document.getElementById('modal-description').textContent = d.description;
      document.getElementById('modal-content').textContent = d.content;

      var badge = document.getElementById('modal-status-badge');
      badge.textContent = getStatusLabel(d.status || 'pending');
      badge.className = 'admin-status admin-status-' + (d.status || 'pending');

      renderRevisionThread(d);

      document.getElementById('modal-rnr-form').style.display = 'none';
      document.getElementById('modal-rnr-comments').value = '';
      updateCharCounter('modal-rnr-comments', 'modal-rnr-comments-counter', 1000);

      var actions = document.getElementById('modal-actions');
      var approvedActions = document.getElementById('modal-approved-actions');
      var isReviewable = d.status === 'pending' || d.status === 'revise_resubmit';
      var isApproved = d.status === 'approved';
      // Pending/revise_resubmit: show full action bar; approved: show compact secondary bar
      actions.style.display = isReviewable ? 'flex' : 'none';
      approvedActions.style.display = isApproved ? 'flex' : 'none';

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  function closeReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    document.getElementById('modal-rnr-form').style.display = 'none';
    document.getElementById('modal-rnr-comments').value = '';
    document.getElementById('modal-reject-form').style.display = 'none';
    document.getElementById('modal-reject-comments').value = '';
    document.getElementById('modal-approve-form').style.display = 'none';
    document.getElementById('modal-approve-comments').value = '';
    document.getElementById('modal-delete-form').style.display = 'none';
    document.getElementById('modal-approved-actions').style.display = 'none';
    document.getElementById('modal-revision-thread').style.display = 'none';
    document.getElementById('modal-revision-thread').innerHTML = '';
    updateCharCounter('modal-rnr-comments', 'modal-rnr-comments-counter', 1000);
    updateCharCounter('modal-reject-comments', 'modal-reject-comments-counter', 1000);
    updateCharCounter('modal-approve-comments', 'modal-approve-comments-counter', 500);
    document.body.style.overflow = '';
    currentModalDocId = null;
    currentModalData = null;
  }

  document.getElementById('modal-preview-btn').addEventListener('click', function () {
    if (!currentModalData) return;
    var d = currentModalData;
    openContentPreview(d.title, d.category, getAuthorNames(getSubmissionAuthors(d)), d.description, d.content);
  });

  document.getElementById('modal-close').addEventListener('click', closeReviewModal);
  document.querySelector('.admin-modal-backdrop').addEventListener('click', closeReviewModal);

  // Approve — toggle form
  document.getElementById('modal-approve').addEventListener('click', function () {
    var form = document.getElementById('modal-approve-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('modal-reject-form').style.display = 'none';
    document.getElementById('modal-rnr-form').style.display = 'none';
    document.getElementById('modal-delete-form').style.display = 'none';
    if (form.style.display === 'block') form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('modal-approve-cancel').addEventListener('click', function () {
    document.getElementById('modal-approve-form').style.display = 'none';
    document.getElementById('modal-approve-comments').value = '';
    updateCharCounter('modal-approve-comments', 'modal-approve-comments-counter', 500);
  });

  document.getElementById('modal-approve-submit').addEventListener('click', function () {
    if (!currentModalDocId) return;
    var btn = this;
    var approveMsg = document.getElementById('modal-approve-comments').value.trim();
    btn.textContent = ADMIN_I18N.approving;
    btn.disabled = true;

    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    btn.textContent = ADMIN_I18N.approving;

    var approve = functions.httpsCallable('approveSubmission');
    approve({ docId: currentModalDocId, approveMessage: approveMsg }).then(function (result) {
      var r = result.data;

      document.getElementById('modal-actions').style.display = 'none';
      document.getElementById('modal-approve-form').style.display = 'none';
      var badge = document.getElementById('modal-status-badge');

      if (r.published) {
        badge.textContent = 'Approved & Published';
        badge.className = 'admin-status admin-status-approved';
        document.getElementById('modal-md-content').textContent = 'Published to GitHub successfully!\n\nFile: ' + r.filePath + '\nThe site will rebuild automatically.';
        document.getElementById('modal-md-output').style.display = 'block';
        document.getElementById('modal-copy-md').style.display = 'none';
      } else if (isLocal && r.markdown) {
        btn.textContent = 'Saving locally...';
        fetch('http://127.0.0.1:4001/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: r.folder, filename: r.fileName, content: r.markdown })
        }).then(function (res) {
          if (!res.ok) throw new Error('Local save failed');
          badge.textContent = 'Approved (Local)';
          badge.className = 'admin-status admin-status-approved';

          // Create author pages locally if needed
          return fetch('http://127.0.0.1:4001/read-about').then(function (resp) {
            if (!resp.ok) return null;
            return resp.json();
          }).then(function (aboutData) {
            if (!aboutData || !aboutData.content) return;
            var authors = r.authors && r.authors.length ? r.authors : [{ author_id: r.authorSlug, name: r.authorName }];
            var updated = aboutData.content;
            var changed = false;

            authors.forEach(function (author) {
              if (!author || !author.author_id || !author.name) return;
              if (updated.indexOf('id: ' + author.author_id) !== -1) return;

              changed = true;
              var escapedAuthor = author.name.replace(/"/g, '\\"');
              var tKey = 'author-' + author.author_id;
              var authorFiles = [
                { folder: 'default', filename: author.author_id + '.md', content: '---\ntitle: "' + escapedAuthor + '"\nauthor_id: ' + author.author_id + '\npermalink: /authors/' + author.author_id + '/\ntranslation_key: ' + tKey + '\nlanguage_code: en\nlanguage_name: English\nlanguage_sort: 1\n---\n' },
                { folder: 'chinese', filename: author.author_id + '-cn.md', content: '---\ntitle: "' + escapedAuthor + '"\nauthor_id: ' + author.author_id + '\npermalink: /zh-cn/authors/' + author.author_id + '/\ntranslation_key: ' + tKey + '\nlanguage_code: zh-CN\nlanguage_name: "\u7B80\u4F53\u4E2D\u6587"\nlanguage_sort: 2\n---\n' },
                { folder: 'chinese', filename: author.author_id + '-tw.md', content: '---\ntitle: "' + escapedAuthor + '"\nauthor_id: ' + author.author_id + '\npermalink: /zh-tw/authors/' + author.author_id + '/\ntranslation_key: ' + tKey + '\nlanguage_code: zh-TW\nlanguage_name: "\u7E41\u9AD4\u4E2D\u6587"\nlanguage_sort: 3\n---\n' }
              ];
              authorFiles.forEach(function (f) {
                fetch('http://127.0.0.1:4001/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ folder: '../_authors/' + f.folder, filename: f.filename, content: f.content })
                }).catch(function () {});
              });

              var newEntry = '\n  - id: ' + author.author_id + '\n';
              newEntry += '    name: "' + author.name + '"\n';
              newEntry += '    affiliation:\n    cohort:\n    profile_label:\n    profile_url:\n';
              newEntry += '    contacts: []\n    photo:\n';
              newEntry += '    summary: "Contributor."\n';
              var withEntry = updated.replace('contributors: []', 'contributors:' + newEntry);
              updated = withEntry === updated ? updated.trimEnd() + newEntry : withEntry;
            });

            if (!changed) return;
            return fetch('http://127.0.0.1:4001/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folder: '../_data', filename: 'about.yml', content: updated })
            });
          }).catch(function () {});

          document.getElementById('modal-md-content').textContent = 'Approved and saved locally.\nJekyll will auto-rebuild. Commit and push when ready.';
          document.getElementById('modal-md-output').style.display = 'block';
          document.getElementById('modal-copy-md').style.display = 'none';
        }).catch(function (err) {
          console.error('Local save error:', err);
          badge.textContent = 'Approved (Firestore only)';
          badge.className = 'admin-status admin-status-approved';
        });
      } else {
        // Not published and not local — show markdown for manual copy
        badge.textContent = 'Approved';
        badge.className = 'admin-status admin-status-approved';
        if (r.markdown) {
          document.getElementById('modal-md-content').textContent = r.markdown;
          document.getElementById('modal-md-output').style.display = 'block';
          document.getElementById('modal-copy-md').style.display = 'inline-block';
        }
      }
      if (currentModalData) {
        currentModalData = Object.assign({}, currentModalData, {
          status: 'approved',
          approveMessage: approveMsg || null,
          rejectionReason: null,
          reviewedAt: new Date().toISOString()
        });
        renderRevisionThread(currentModalData);
      }

      btn.textContent = ADMIN_I18N.approve_btn;
      btn.disabled = false;
      loadReviewList(currentFilter);
      var user = auth.currentUser;
      if (user) loadSubmissions(user.uid);
    }).catch(function (err) {
      console.error('Approve error:', err);
      btn.textContent = ADMIN_I18N.approve_btn;
      btn.disabled = false;
      alert(ADMIN_I18N.github_error + (err.message || ''));
    });
  });

  // Reject — toggle form
  document.getElementById('modal-reject').addEventListener('click', function () {
    var form = document.getElementById('modal-reject-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('modal-approve-form').style.display = 'none';
    document.getElementById('modal-rnr-form').style.display = 'none';
    document.getElementById('modal-delete-form').style.display = 'none';
    if (form.style.display === 'block') form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('modal-reject-cancel').addEventListener('click', function () {
    document.getElementById('modal-reject-form').style.display = 'none';
    document.getElementById('modal-reject-comments').value = '';
    updateCharCounter('modal-reject-comments', 'modal-reject-comments-counter', 1000);
  });

  document.getElementById('modal-reject-submit').addEventListener('click', function () {
    if (!currentModalDocId) return;
    var reason = document.getElementById('modal-reject-comments').value.trim();
    if (!reason) { document.getElementById('modal-reject-comments').focus(); return; }

    var btn = this;
    btn.textContent = ADMIN_I18N.rejecting;
    btn.disabled = true;

    var reject = functions.httpsCallable('rejectSubmission');
    reject({ docId: currentModalDocId, reason: reason }).then(function () {
      var badge = document.getElementById('modal-status-badge');
      badge.textContent = getStatusLabel('rejected');
      badge.className = 'admin-status admin-status-rejected';
      document.getElementById('modal-actions').style.display = 'none';
      document.getElementById('modal-reject-form').style.display = 'none';
      if (currentModalData) {
        currentModalData = Object.assign({}, currentModalData, {
          status: 'rejected',
          rejectionReason: reason,
          approveMessage: null,
          reviewedAt: new Date().toISOString()
        });
        renderRevisionThread(currentModalData);
      }

      btn.textContent = ADMIN_I18N.reject_btn;
      btn.disabled = false;

      loadReviewList(currentFilter);
      var user = auth.currentUser;
      if (user) loadSubmissions(user.uid);
    }).catch(function (err) {
      console.error('Reject error:', err);
      btn.textContent = ADMIN_I18N.reject_btn;
      btn.disabled = false;
    });
  });

  // Delete submission — toggle confirmation
  document.getElementById('modal-delete').addEventListener('click', function () {
    var form = document.getElementById('modal-delete-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('modal-approve-form').style.display = 'none';
    document.getElementById('modal-reject-form').style.display = 'none';
    document.getElementById('modal-rnr-form').style.display = 'none';
    if (form.style.display === 'block') form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('modal-delete-cancel').addEventListener('click', function () {
    document.getElementById('modal-delete-form').style.display = 'none';
  });

  document.getElementById('modal-delete-submit').addEventListener('click', function () {
    if (!currentModalDocId) return;
    var btn = this;
    btn.textContent = ADMIN_I18N.deleting;
    btn.disabled = true;
    var d = currentModalData;
    var docId = currentModalDocId;

    var deleteFn = functions.httpsCallable('deleteSubmission');
    deleteFn({ docId: docId }).then(function (result) {
      var r = result.data;
      // If approved guide was deleted and we're on localhost, also remove local file
      if (r.wasApproved && r.guideId) {
        var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
          var langMap = { 'en': { folder: 'default', suffix: '' }, 'zh-CN': { folder: 'chinese', suffix: '-CN' }, 'zh-TW': { folder: 'chinese', suffix: '-TW' } };
          var langInfo = langMap[r.language] || langMap['en'];
          var filePath = 'website/_guides/' + langInfo.folder + '/' + r.guideId + langInfo.suffix + '.md';
          fetch('http://127.0.0.1:4001/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath })
          }).catch(function () {});
        }
      }
      closeReviewModal();
      loadReviewList(currentFilter);
      var user = auth.currentUser;
      if (user) loadSubmissions(user.uid);
    }).catch(function (err) {
      console.error('Delete error:', err);
      btn.textContent = ADMIN_I18N.delete_btn;
      btn.disabled = false;
    });
  });

  // Revise & Resubmit — toggle feedback form
  function toggleReviseForm() {
    var form = document.getElementById('modal-rnr-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('modal-approve-form').style.display = 'none';
    document.getElementById('modal-reject-form').style.display = 'none';
    document.getElementById('modal-delete-form').style.display = 'none';
    if (form.style.display === 'block') form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  document.getElementById('modal-revise').addEventListener('click', toggleReviseForm);
  document.getElementById('modal-revise-approved').addEventListener('click', toggleReviseForm);

  document.getElementById('modal-rnr-cancel').addEventListener('click', function () {
    document.getElementById('modal-rnr-form').style.display = 'none';
    document.getElementById('modal-rnr-comments').value = '';
    updateCharCounter('modal-rnr-comments', 'modal-rnr-comments-counter', 1000);
  });

  document.getElementById('modal-rnr-submit').addEventListener('click', function () {
    if (!currentModalDocId) return;
    var comments = document.getElementById('modal-rnr-comments').value.trim();
    if (!comments) { document.getElementById('modal-rnr-comments').focus(); return; }

    var btn = this;
    btn.textContent = ADMIN_I18N.revising;
    btn.disabled = true;
    var now = new Date().toISOString();

    var reviseFn = functions.httpsCallable('requestRevision');
    reviseFn({ docId: currentModalDocId, comments: comments }).then(function (result) {
      var badge = document.getElementById('modal-status-badge');
      badge.textContent = getStatusLabel('revise_resubmit');
      badge.className = 'admin-status admin-status-revise_resubmit';
      document.getElementById('modal-actions').style.display = 'none';
      document.getElementById('modal-rnr-form').style.display = 'none';
      currentModalData = Object.assign({}, currentModalData || {}, {
        status: 'revise_resubmit',
        reviewerComments: comments,
        revisionHistory: result.data.revisionHistory,
        approveMessage: null,
        rejectionReason: null,
        reviewedAt: new Date().toISOString()
      });
      renderRevisionThread(currentModalData);

      btn.textContent = ADMIN_I18N.rnr_submit;
      btn.disabled = false;

      loadReviewList(currentFilter);
      var user = auth.currentUser;
      if (user) loadSubmissions(user.uid);
    }).catch(function (err) {
      console.error('R&R error:', err);
      btn.textContent = ADMIN_I18N.rnr_submit;
      btn.disabled = false;
    });
  });

  // Copy MD
  document.getElementById('modal-copy-md').addEventListener('click', function () {
    var content = document.getElementById('modal-md-content').textContent;
    navigator.clipboard.writeText(content).then(function () {
      var btn = document.getElementById('modal-copy-md');
      btn.textContent = ADMIN_I18N.copied;
      setTimeout(function () { btn.textContent = ADMIN_I18N.copy_md_btn; }, 2000);
    });
  });

})();
