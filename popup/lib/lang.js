var langs = ['en', 'es'];
var langCode = 'en';
var langJS = null;
var actualLang;

var translate = function (jsdata){
	actualLang = jsdata;
	$("[tkey]").each (function (index)
	{
		
		var strTr = jsdata [$(this).attr ('tkey')];
	    $(this).html (strTr);
	});
}

var translateKey = function (key){
	if (actualLang) {
		return actualLang[key];
	}
	return "";
}

var translateDinamic = function (){
	if (actualLang) {
		$("[tkey]").each (function (index)
		{
			var strTr = actualLang[$(this).attr('tkey')];
		    $(this).html (strTr);
		});
	}
}


langCode = navigator.language.substr (0, 2);

if (langs.indexOf(langCode) != -1) {
	$.getJSON('../popup/lib/lang/'+langCode+'.json', translate);
}
else {
	$.getJSON('../popup/lib/lang/en.json', translate);
}
