$(document).ready(function(){
	$(".tabs-selected").click(function() {
		var tabSelected = $(this).data("order");
		$(".tab-container").css("display","none");
		$("#tab-"+tabSelected).css("display","block");
//		$(".tabs-selected").css("opacity","1");
        $(".tabs-selected").removeClass("tab-active");

//		$(this).css("opacity","0.5");
        $(this).addClass("tab-active");
	});	
});

function toast(text) {
	$("#snackbar").html(text);
    var x = document.getElementById("snackbar")
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}