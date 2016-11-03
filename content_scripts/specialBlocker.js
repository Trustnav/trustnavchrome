$(document).ready(function() {
	function blocker(){
		$( "a[class*='_5g-l']" ).parent().closest('div[id*="substream"]').html("");
	    $( "a[href*='_ref=ADS']" ).parent().closest('div[id*="hyperfeed"]').html("");
	    $( "a[href*='/campaign/landing.php']" ).parent().closest('div[class*="ego_column"]').html("");
	    
	}
	function blucle(){
		setTimeout(function () {
	        blocker();
	        blucle();
	    }, 500);
	}
	blucle();
});