if(!jQuery.fn.center) {
    jQuery.fn.center = function () {
        this.css("position","fixed");
        var heading = $("#content h1");
        if(heading.length){
            this.css("top", heading.offset().top + "px");
        } else {
            this.css("top", "45px");
        }
        this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
        return this;
    }
}
