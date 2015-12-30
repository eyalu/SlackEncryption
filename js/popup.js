// popup.js

var keyInputSelector = ".key";

console.log("ran popup.js");

chrome.storage.sync.get("credentials", function(response){
	console.log("got credentials: " + JSON.stringify(response));
	if (response && response.credentials && response.credentials.password){
		$(keyInputSelector).val(response.credentials.password);
		$('#encryptMessagesCheckbox').removeAttr("disabled");
	}
});

$("input.key").on('input', function(){
	$(".key-form-group").removeClass("has-error");
	$(".key-form-group .form-control-feedback").addClass("hidden");

	if ($("input.key").val() == ""){
		$('#encryptMessagesCheckbox').attr("disabled", "");
	}
	else {
		$('#encryptMessagesCheckbox').removeAttr("disabled");	
	}
});

chrome.storage.sync.get("encryptMessages", function(response){
	console.log("Fetched encrpytMessages: " + JSON.stringify(response));

	if (response && response.encryptMessages){
		// if the setting is on, then check the box
		$('#encryptMessagesCheckbox').get(0).checked = true
	}

	// show check box once we have loaded data
	$(".encryptMessagesContainer").removeClass("hidden");

	// need to persist this value when opened, so check for it
	$('#encryptMessagesCheckbox').change(function() {
	    // store the whether or not to encypt messages
	    chrome.storage.sync.set({ "encryptMessages" : this.checked }, function(){
	    	console.log("Saved encrpytMessages: " + this.checked);  
	    });   
	});
}); 

$(".saveBtn").click(function(){
	var password = $(keyInputSelector).val();
	if (password.length == 0){
		console.log("error cannot save empty password");
		$(".key-form-group").addClass("has-error");
		$(".key-form-group .form-control-feedback").removeClass("hidden");
		return;
	}

	var key = CryptoJS.MD5(password).toString();
	var credentials = {
		"key" : key,
		"password" : password
	};

	chrome.storage.sync.set({ "credentials" : credentials }, function(){
		console.log("Key saved: " + credentials.key);

		// force reload the page so that the new key takes effect
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
	    });

		window.close();
	});
});