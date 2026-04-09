(function () {
  'use strict';

  /* ── Popup DOM (created once, reused) ── */
  function createPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'form-popup-overlay';
    overlay.innerHTML =
      '<div class="form-popup-card" id="form-popup-card">' +
        '<div class="form-popup-icon" id="form-popup-icon"></div>' +
        '<h4 class="form-popup-title" id="form-popup-title"></h4>' +
        '<p class="form-popup-msg" id="form-popup-msg"></p>' +
        '<button class="theme-btn1 form-popup-close" id="form-popup-close">' +
          'Close <span><i class="fa-solid fa-xmark"></i></span>' +
        '</button>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('form-popup-close').addEventListener('click', hidePopup);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { hidePopup(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hidePopup(); }
    });
  }

  function showPopup(type, title, message) {
    var overlay  = document.getElementById('form-popup-overlay');
    var card     = document.getElementById('form-popup-card');
    var icon     = document.getElementById('form-popup-icon');
    var titleEl  = document.getElementById('form-popup-title');
    var msgEl    = document.getElementById('form-popup-msg');

    card.className = 'form-popup-card form-popup-' + type;
    icon.innerHTML = type === 'ok'
      ? '<i class="fa-solid fa-circle-check"></i>'
      : '<i class="fa-solid fa-circle-xmark"></i>';
    titleEl.textContent = title;
    msgEl.textContent   = message;
    overlay.classList.add('active');

    if (type === 'ok') {
      setTimeout(hidePopup, 5000);
    }
  }

  function hidePopup() {
    var overlay = document.getElementById('form-popup-overlay');
    if (overlay) { overlay.classList.remove('active'); }
  }

  /* ── Form handler ── */
  document.addEventListener('DOMContentLoaded', function () {
    createPopup();

    /* File upload label — show filename and highlight border when a file is chosen */
    var fileInput   = document.getElementById('cv-upload');
    var fileLabel   = document.getElementById('cv-filename');
    var uploadLabel = document.querySelector('.cv-upload-label');

    if (fileInput && fileLabel) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) {
          fileLabel.textContent = fileInput.files[0].name;
          if (uploadLabel) { uploadLabel.classList.add('has-file'); }
        } else {
          fileLabel.textContent = 'No file chosen';
          if (uploadLabel) { uploadLabel.classList.remove('has-file'); }
        }
      });
    }

    /* Matches forms inside .contact1-form (index careers/work-with-us) or .contact-page (contact page) */
    var form = document.querySelector('.contact1-form form, .contact-page form');
    if (!form) { return; }

    var isMultipart = !!form.querySelector('input[type="file"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var action    = form.getAttribute('action');
      var submitBtn = form.querySelector('[type="submit"]');
      var origHTML  = submitBtn.innerHTML;

      submitBtn.disabled  = true;
      submitBtn.innerHTML = 'Sending\u2026 <span><i class="fa-solid fa-spinner fa-spin"></i></span>';

      var fetchOptions;
      if (isMultipart) {
        /* Careers form — send as multipart/form-data so the CV file is included */
        fetchOptions = { method: 'POST', body: new FormData(form) };
      } else {
        /* Contact form — send as JSON */
        fetchOptions = {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:    (form.querySelector('[name="name"]')    || {}).value || '',
            email:   (form.querySelector('[name="email"]')   || {}).value || '',
            phone:   (form.querySelector('[name="phone"]')   || {}).value || '',
            message: (form.querySelector('[name="message"]') || {}).value || ''
          })
        };
      }

      fetch(action, fetchOptions)
        .then(function (res) {
          if (!res.ok && res.status !== 200) {
            return { status: 'fail', error: 'Server returned ' + res.status };
          }
          return res.json();
        })
        .then(function (json) {
          if (json.status === 'ok') {
            var msg = isMultipart
              ? 'Thanks for your interest \u2014 we\u2019ll be in touch if there\u2019s a good fit.'
              : 'Thanks for reaching out \u2014 we\u2019ll get back to you shortly.';
            var title = isMultipart ? 'Application sent!' : 'Message sent!';
            showPopup('ok', title, msg);
            form.reset();
            if (fileLabel) { fileLabel.textContent = 'No file chosen'; }
            if (uploadLabel) { uploadLabel.classList.remove('has-file'); }
          } else {
            showPopup('fail', 'Something went wrong', json.error || 'Please try again or email us directly at info@nodex.es.');
          }
        })
        .catch(function () {
          showPopup('fail', 'Connection error', 'Could not reach the server. Please try again or email us directly at info@nodex.es.');
        })
        .finally(function () {
          submitBtn.disabled  = false;
          submitBtn.innerHTML = origHTML;
        });
    });
  });
})();
