document.getElementById("explore-btn").addEventListener("click", function () {
  var cards = document.getElementById("cards");
  var isHidden = cards.classList.contains("hidden");

  if (isHidden) {
    cards.classList.remove("hidden");
    cards.classList.add("visible");
    this.textContent = "Hide Guide";
  } else {
    cards.classList.remove("visible");
    cards.classList.add("hidden");
    this.textContent = "Explore the Guide";
  }
});
