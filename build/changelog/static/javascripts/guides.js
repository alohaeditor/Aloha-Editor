function guideMenu(){
  if (document.getElementById('guides').style.display == "none") {
    document.getElementById('guides').style.display = "block";
    document.getElementById('guidesArrow').innerHTML = "&#9662;";
  } else {
    document.getElementById('guides').style.display = "none";
    document.getElementById('guidesArrow').innerHTML = "&#9656;";
  }
}
