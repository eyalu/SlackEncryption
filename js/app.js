// THIS SOFTWARE IS LICENSED UNDER GPLv3
// ALL RIGHTS RESERVED FOR EASY AS PIE LTD
// NO WARRANTY OR LIABILITY - USE IT YOUR OWN RISK, YOU ARE ENCOURAGED TO REVIEW THE CODE
console.log("Welcome to Slack Encryptor");

var executeInPageContext = function(code){
  var script = document.createElement('script');
  script.textContent = code;
  (document.head||document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
};

var encryptMessages = false;

chrome.storage.sync.get("encryptMessages", function(response){
	//console.log("Fetched encrpytMessages: " + JSON.stringify(response));

	encryptMessages = false;
	if (response && response.encryptMessages){
		// if the setting is on, then check the box
		encryptMessages = true;
	}

	executeInPageContext("encryptMessages = " + encryptMessages);
}); 

chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          if (key == "encryptMessages"){
          	// set encryptMessages accordingly
          	// inject script into page to set encrypted message accordingly
          	executeInPageContext("encryptMessages = " + storageChange.newValue);
/*
          	console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
					  */
          }
	}
});

// add AES script on the page
$("html").append($('<script type="text/javascript" src="https://raw.githubusercontent.com/ricmoo/aes-js/master/index.js"></script>'));

chrome.storage.sync.get("credentials", function(response){
	if (response && response.credentials && response.credentials.key){
		//console.log("Retrieved key: " + response.credentials.key);

		var storedEncryptionKey = response.credentials.key;

		var interval = setInterval(function(){
			if ($("#message-form").length > 0){
				clearInterval(interval);
				
				var code = '' + 

				 'replaceWithEncryptedMessage = function(){\n'+
				 	'if (typeof encryptMessages !== "undefined" && !encryptMessages){\n' +
				 		'console.log("Not encryping messages becase it is turned off.");\n' +
				 		'return;\n' +
				 	'}\n' +

					'var inputSelector = "#message-input";\n'+
					'var message = $(inputSelector).val();\n'+

					'var key = aesjs.util.convertStringToBytes("' + storedEncryptionKey + '");\n' +
					'var textBytes = aesjs.util.convertStringToBytes(message);\n' +

					'// The counter is optional, and if omitted will begin at 0\n' + 
					'var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));\n' +
					'var encryptedBytes = aesCtr.encrypt(textBytes);\n' +
					
					'$(inputSelector).val("protected:" + btoa(encryptedBytes));\n'+
				'};\n'+

				'temp_submit = TS.view.submit\n' +
				'TS.view.submit = function(){ replaceWithEncryptedMessage(); temp_submit(); return true}';

				executeInPageContext(code);
			}
		}, 500);

		// decrypt shown messages
		var decryptInterval = setInterval(function(){
			if ($(".message_body").length > 0){
				//clearInterval(decryptInterval);
				
				$(".message_body").each(function(i,e){
					if (!$(e).hasClass("decrypted")){
						if ($(e).text().indexOf("protected:") == 0){
							$(e).addClass("decrypted")

							var key = aesjs.util.convertStringToBytes(storedEncryptionKey);
							
							// The counter mode of operation maintains internal state, so to
							// decrypt a new instance must be instantiated.
							var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));

							var encryptedStrBytes;
							try {
								encryptedStrBytes = atob($(e).text().split("protected:")[1]).split(",");
							}
							catch(err) {
								//console.log("Failed to decrypt message: " + $(e).text() + ". Must have been encrypted with a different key.");

								// equivalent to continue
								return;
							}

							var encryptedBytes = [];
							for (var i=0;i<encryptedStrBytes.length;i++){
								encryptedBytes[i] = Number(encryptedStrBytes[i]);
							}

							// console.log("encrypted bytes: " + encryptedBytes)
							var decryptedBytes = aesCtr.decrypt(encryptedBytes);
							var decryptedMessage = aesjs.util.convertBytesToString(decryptedBytes);
							// console.log("decrypted message:" + decryptedMessage);

							var inputSelector = "#message-input";
							$(e).text(decryptedMessage);
						}
					}
				});
			}
		}, 100)



	}
});