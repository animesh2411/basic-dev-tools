document.addEventListener("DOMContentLoaded", () => {
  const tiles = document.querySelectorAll(".tile:not(.disabled)");

  tiles.forEach(tile => {
    tile.addEventListener("mouseenter", () => {
      tile.style.transform = "translateY(-5px)";
      tile.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
    });

    tile.addEventListener("mouseleave", () => {
      tile.style.transform = "translateY(0)";
      tile.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
    });
  });
});
