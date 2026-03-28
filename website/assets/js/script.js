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
