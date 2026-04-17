// ── Mobile menu toggle ──
var toggle = document.getElementById("nav-toggle");
var menu = document.getElementById("mobile-menu");

toggle.addEventListener("click", function () {
  toggle.classList.toggle("active");
  menu.classList.toggle("open");
});

menu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    toggle.classList.remove("active");
    menu.classList.remove("open");
  });
});

// ── Accordion ──
document.querySelectorAll(".essential-item").forEach(function (item) {
  item.addEventListener("click", function () {
    var isOpen = this.classList.contains("open");
    var detail = this.querySelector(".essential-detail");

    // Close all others
    document.querySelectorAll(".essential-item").forEach(function (other) {
      other.classList.remove("open");
      other.querySelector(".essential-detail").style.maxHeight = null;
    });

    if (!isOpen) {
      this.classList.add("open");
      var text = this.getAttribute("data-detail");
      if (!detail.querySelector("p")) {
        var p = document.createElement("p");
        p.textContent = text;
        detail.appendChild(p);
      }
      detail.style.maxHeight = detail.scrollHeight + "px";
    }
  });
});

// ── Scroll reveal ──
var revealElements = document.querySelectorAll(".feature, .place");

function reveal() {
  revealElements.forEach(function (el) {
    var top = el.getBoundingClientRect().top;
    var windowHeight = window.innerHeight;
    if (top < windowHeight - 60) {
      el.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", reveal);
reveal();

// ── External links open in a new tab ──
document.querySelectorAll('a[href]').forEach(function (link) {
  if (link.hasAttribute("target")) {
    return;
  }

  var href = link.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return;
  }

  try {
    var url = new URL(href, window.location.href);
    var isHttp = url.protocol === "http:" || url.protocol === "https:";
    var isExternal = url.origin !== window.location.origin;

    if (isHttp && isExternal) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  } catch (error) {
    // Ignore malformed or non-standard href values.
  }
});

// ── Guide TOC (desktop sidebar) ──
(function () {
  var tocList = document.querySelector(".guide-toc-list");
  var content = document.querySelector(".guide-content");
  var wrap = document.querySelector(".guide-toc-wrap");
  if (!tocList || !content || !wrap) return;

  var items = [];
  content.querySelectorAll("h2").forEach(function (h) {
    if (!h.id) return;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    tocList.appendChild(li);
    items.push({ link: a, heading: h });
  });

  if (items.length < 2) {
    wrap.style.display = "none";
    return;
  }

  function updateActive() {
    var marker = window.scrollY + window.innerHeight * 0.2;
    var current = null;
    for (var i = 0; i < items.length; i++) {
      var top = items[i].heading.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) {
        current = items[i];
      } else {
        break;
      }
    }
    items.forEach(function (it) {
      it.link.classList.remove("active");
      it.link.removeAttribute("aria-current");
    });
    if (current) {
      current.link.classList.add("active");
      current.link.setAttribute("aria-current", "location");
    }
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();
})();
