document.addEventListener("DOMContentLoaded", changeActive);

function changeActive() {
  let menuItems = document.querySelectorAll(".menu-item > a");
  menuItems.forEach((menuItem) => {
    menuItem.addEventListener("click", (event) => {
      document.querySelectorAll(".active").forEach((activeItem) => {
        activeItem.classList.remove("active");
      });
      menuItem.classList.toggle("active");
      event.preventDefault();
    });
  });
  menuItems.forEach((menuItem) => {
    menuItem.addEventListener("click", () => {
      console.log(menuItem.id);
    });
  });
}
