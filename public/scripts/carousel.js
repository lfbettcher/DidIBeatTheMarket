const IMAGES = [
  "images/445-800x450.jpg",
  "images/653-800x450.jpg",
  "images/691-800x450.jpg",
];
const NUM_OF_IMAGES = IMAGES.length;
let imgNum = 0;
let carouselImg;

document.addEventListener("DOMContentLoaded", bindButtons);

function bindButtons() {
  carouselImg = document.getElementById("carousel-img");
  document.getElementById("btn-left").addEventListener("click", leftBtnClick);
  document.getElementById("btn-right").addEventListener("click", rightBtnClick);
  let imgBtns = document.querySelectorAll(".select-img");
  imgBtns.forEach((btn) => {
    btn.addEventListener("click", selectImg(btn.id));
  });
  autoChange();
}

function leftBtnClick() {
  if (imgNum - 1 < 0) {
    imgNum = NUM_OF_IMAGES - 1;
  } else {
    imgNum--;
  }
  carouselImg.src = IMAGES[imgNum];
}

function rightBtnClick() {
  if (imgNum + 1 > NUM_OF_IMAGES - 1) {
    imgNum = 0;
  } else {
    imgNum++;
  }
  carouselImg.src = IMAGES[imgNum];
}

function autoChange() {
  rightBtnClick();
  setTimeout(autoChange, 3000);
}

function selectImg(btnId) {
  return function () {
    if (btnId == "img1") {
      carouselImg.src = IMAGES[0];
    } else if (btnId == "img2") {
      carouselImg.src = IMAGES[1];
    } else if (btnId == "img3") {
      carouselImg.src = IMAGES[2];
    }
  };
}
