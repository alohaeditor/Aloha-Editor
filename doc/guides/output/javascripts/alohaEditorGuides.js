function guideMenu(e){
  if (document.getElementById('guides').style.display == "none") {
    document.getElementById('guides').style.display = "block";
    document.getElementById('guidesArrow').innerHTML = "&#9662;";
    $('body').click(function(e){ guideMenu(e); });
  } else {
    document.getElementById('guides').style.display = "none";
    document.getElementById('guidesArrow').innerHTML = "&#9656;";
    $('body').unbind('click');
  }
  return false;
}

$('#guidesMenu, .guidesMenu').click(guideMenu);