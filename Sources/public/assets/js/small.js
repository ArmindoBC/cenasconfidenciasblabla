
// jQuery to collapse the navbar on scroll
function collapseNavbar() {
  if ($(".navbar").length > 0){
    if ($(".navbar").offset().top > 1) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
        if (! $(".navbar-fixed-top").hasClass( "top-nav-welcome" ))
          $(".navbar-fixed-top").addClass("top-nav-color");
    } else {
      if ($(".navbar").offset().top < 50) {
        if ($(".navbar-fixed-top").hasClass("top-nav-bar"))
          $(".navbar-fixed-top").removeClass("top-nav-color");
      }
    }
  }
}

$(window).scroll(collapseNavbar);
$(document).ready(function(){
    collapseNavbar();
});



// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
  if ($(this).attr('class') != 'dropdown-toggle active' && $(this).attr('class') != 'dropdown-toggle') {
    $('.navbar-toggle:visible').click();
  }
});
