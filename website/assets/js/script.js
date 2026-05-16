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

// ── Guide TOC (inline block at top, sticky sidebar after scroll) ──
(function () {
  var tocList = document.querySelector(".guide-toc-list");
  var content = document.querySelector(".guide-content");
  var wrap = document.querySelector(".guide-toc-wrap");
  var inlineToc = document.querySelector(".guide-inline-toc");
  var inlineList = document.querySelector(".guide-inline-toc-list");
  if (!tocList || !content || !wrap) return;

  var sections = [];
  var allItems = [];
  var current = null;
  var currentInline = null;
  content.querySelectorAll("h2, h3").forEach(function (h) {
    if (!h.id) return;
    if (h.tagName === "H2") {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      var subList = document.createElement("ul");
      subList.className = "guide-toc-sublist";
      li.appendChild(subList);
      tocList.appendChild(li);
      current = { link: a, heading: h, li: li, subList: subList, subs: [] };
      sections.push(current);
      allItems.push(current);

      if (inlineList) {
        var iLi = document.createElement("li");
        var iA = document.createElement("a");
        iA.href = "#" + h.id;
        iA.textContent = h.textContent;
        iLi.appendChild(iA);
        var iSub = document.createElement("ul");
        iSub.className = "guide-inline-toc-sublist";
        iLi.appendChild(iSub);
        inlineList.appendChild(iLi);
        currentInline = iSub;
      }
    } else if (current) {
      var subLi = document.createElement("li");
      var subA = document.createElement("a");
      subA.href = "#" + h.id;
      subA.textContent = h.textContent;
      subLi.appendChild(subA);
      current.subList.appendChild(subLi);
      var subItem = { link: subA, heading: h, parent: current };
      current.subs.push(subItem);
      allItems.push(subItem);

      if (currentInline) {
        var iSubLi = document.createElement("li");
        var iSubA = document.createElement("a");
        iSubA.href = "#" + h.id;
        iSubA.textContent = h.textContent;
        iSubLi.appendChild(iSubA);
        currentInline.appendChild(iSubLi);
      }
    }
  });

  if (sections.length < 2) {
    wrap.style.display = "none";
    if (inlineToc) inlineToc.style.display = "none";
    return;
  }

  // Split the inline TOC into two independent <ul>s so the two-column layout
  // can use grid (with align-items: start). CSS multicol's column-fill
  // balancing was producing tiny first-row misalignments; two siblings inside
  // a grid container are pinned to the same y by construction.
  if (inlineList && inlineList.children.length > 1) {
    var inlineCols = inlineList.parentNode;
    var topItems = Array.prototype.slice.call(inlineList.children);
    var mid = Math.ceil(topItems.length / 2);
    var secondList = document.createElement("ul");
    secondList.className = "guide-inline-toc-list";
    for (var k = mid; k < topItems.length; k++) {
      secondList.appendChild(topItems[k]);
    }
    inlineCols.appendChild(secondList);
  }

  function updateActive() {
    var marker = window.scrollY + window.innerHeight * 0.2;
    var currentItem = null;
    for (var i = 0; i < allItems.length; i++) {
      var top = allItems[i].heading.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) {
        currentItem = allItems[i];
      } else {
        break;
      }
    }
    allItems.forEach(function (it) {
      it.link.classList.remove("active");
      it.link.removeAttribute("aria-current");
    });
    sections.forEach(function (s) {
      s.li.classList.remove("expanded");
    });
    if (currentItem) {
      currentItem.link.classList.add("active");
      currentItem.link.setAttribute("aria-current", "location");
      var activeSection = currentItem.parent || currentItem;
      activeSection.li.classList.add("expanded");
    }
  }

  function updateTocMode() {
    if (!inlineToc) {
      document.body.classList.add("guide-toc-active");
      return;
    }
    var rect = inlineToc.getBoundingClientRect();
    // Activate sidebar once the inline block has fully scrolled out of view
    // above the viewport. Adds hysteresis so the swap feels stable.
    var pastInline = rect.bottom <= 0;
    document.body.classList.toggle("guide-toc-active", pastInline);
  }

  function onScroll() {
    updateActive();
    updateTocMode();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
