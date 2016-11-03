$(document).ready(function(){
	//Initialize
	updateFiltersList();
	
	$(".tabs-selected").click(function() {
		updateFiltersList();
	});
	
	$("#add-filter").click(function(event) {
		event.preventDefault();
		var filter = $("#text-filter").val().replace(/\s/g, "");
		if(!filter){
			return toast(translateKey("toptions-toast-error-fields"));
		}
		$("#text-filter").val("");
		addFilter(filter, function(err){
			if(err[0]){
				return toast(translateKey("toptions-toast-error"));
			}
			$("#list-filter").append('<option value="'+filter+'">'+filter+'</option>');
			toast(translateKey("toptions-toast-insert"));
		});
	});

	$("#delete-filter").click(function(event) {
		event.preventDefault();
		$( "#list-filter option:selected" ).each(function() {
			removeFilter($( this ).val());
    	});
    	toast(translateKey("toptions-toast-item-deleted"));
    	updateFiltersList();
	});

	$("#add-domain").click(function(event) {
		event.preventDefault();
		var domain = $("#text-domain").val().replace(/\s/g, "");
		if(!domain){
			return toast(translateKey("toptions-toast-error-fields"));
		}
		$("#text-domain").val("");
		var filterText = "@@||" + domain + "^$document";
		addFilter(filterText, function(err){
			if(err[0]){
				return toast(translateKey("toptions-toast-error"));
			}
			$("#list-domain").append('<option value="'+domain+'">'+domain+'</option>');
			toast(translateKey("toptions-toast-insert"));
            chrome.extension.sendRequest({
                'action': 'change_status',
                'value': false,
                'domain': domain
            }, function(){});
		});
	});

	$("#delete-domain").click(function(event) {
		event.preventDefault();
		$( "#list-domain option:selected" ).each(function() {
			var domain = $( this ).val();
			var domainFilter = "@@||" + domain + "^$document";
			removeFilter(domainFilter);
	        chrome.extension.sendRequest({
	            'action': 'change_status',
	            'value': true,
	            'domain': domain
	        }, function(){});
    	});
    	toast(translateKey("toptions-toast-item-deleted"));
    	updateFiltersList();
	});
});


function updateFiltersList(){
	$("#list-domain").html("");
	$("#list-filter").html("");
	getSubscriptions(false, true, function(subscriptions){
		for (var i = 0; i < subscriptions.length; i++)
		  convertSpecialSubscription(subscriptions[i]);
	});
	}

function convertSpecialSubscription(subscription){
  	getFilters(subscription.url, function(filters){
    	for (var j = 0; j < filters.length; j++){
      		var filter = filters[j].text;
      		if (whitelistedDomainRegexp.test(filter)){
      			filter = filter.replace("@@||","").replace("^$document","");
      			$("#list-domain").append('<option value="'+filter+'">'+filter+'</option>');
      		}
      		else
      			$("#list-filter").append('<option value="'+filter+'">'+filter+'</option>');
    	}
  	});
}