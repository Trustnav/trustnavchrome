$(document).ready(function(){
	//Initialize
	updateSubscriptionsList();

	$("#update-subscriptions").click(function() {	
		toast(translateKey("toptions-toast-update-easylist"));
		updateFilterLists();
	});

	$("#delete-subscription").click(function(event) {	
		$("#list-easylist p").each(function(){
			if($(this).children("input").prop("checked")){

				var url = $(this).children("a").prop("href");
				if(url==defaultSubscription){
					return;
				}
				if(url[url.length-1] == "/"){
					url = url.slice(0,-1);
				}

				removeSubscription(url);
				updateSubscriptionsList();
				toast(translateKey("toptions-toast-item-deleted") +" "+ $(this).children("a").html());
			}
		})
	});

	$("#new-subscription").click(function(event) {	
		event.preventDefault();
		$("#new-subscription-container").css("display","block");
		$("#new-subscription").css("display","none");
		$("#add-subscription").css("display","block");
		$("#cancel-subscription").css("display","block");
	});

	$("#add-subscription").click(function(event) {	
		event.preventDefault();
		validForm(function(out){
			var text;
			if(!out.title || !out.url){
				if(!out.title && !out.url){
					text = "fields";
				}else if(!out.title){
					text = "title";
				}else{
					text = "url";
				}
				toast(translateKey("toptions-toast-error-"+text));
				return;
			}

			addSubscription(out.url, out.title, out.url);
			cleanForm();
			updateSubscriptionsList();
			toast(translateKey("toptions-toast-subs-insert"));
		});
	});

	$("form").keypress(function(e) {
	    if(e.which == 13) {
	        $("#add-subscription").click();
	    }
	});
});

function updateSubscriptionsList(){
	$("#list-easylist").html("");
	getSubscriptions(true, false, function(subscriptions)
	{
		subscriptions.forEach(function(subscription){
			if(subscription && !subscription.disabled && subscription.homepage){
				var item;
				if(subscription.url === defaultSubscription)
					item = template.itemEasylistDisabled;
				else
					item = template.itemEasylist;

				Object.keys(subscription).forEach(function(key){
					item = item.replace("{{"+key+"}}",subscription[key])
				});
				$("#list-easylist").append(item);	
			}
		});
	});
}	

function validForm(cb){
	var out = {};
	$('form :input:visible[required="required"]').each(function()
	{
		out[this.dataset.elem] = this.validity.valid ? this.value : false;
	});	
	cb(out);
}

function cleanForm(){
	$('form :input:visible[required="required"]').each(function(){
		$(this).val("");
	});	
}

var template = {
	itemEasylist : `
        <p>
            <input class="w3-check" type="checkbox">
            <a target="_blank" href="{{url}}">{{title}}</a>
        </p>`,
	itemEasylistDisabled : `
        <p>
            <input disabled class="w3-check" type="checkbox">
            <a target="_blank" href="{{url}}">{{title}}</a>
        </p>`
};

var defaultSubscription = "http://server.trustnav.com:3250/easylist";