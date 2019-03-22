var accessControlRequestHeaders;
var exposedHeaders;
var variables = {
	wallet: null,
	daemon: null,
	wallet_status: 0,
	daemon_status: 0
};

var requestListener = function(details){
	
	// console.log(details.url, variables.wallet, details.url.indexOf(variables.wallet));
	
	if(
		!(details.url.indexOf(variables.wallet) != -1 || details.url.indexOf(variables.daemon) != -1)
	){
		
		return {};
		
	}else{
		
		//chrome.extension.getBackgroundPage().console.log(details);
		console.log('request intercepted', details);
		
		var flag = false,
		rule = {
			name: "Origin",
			value: "http://plrs.pro/truesight"
		};
		var i;

		for (i = 0; i < details.requestHeaders.length; ++i) {
			if (details.requestHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
				flag = true;
				details.requestHeaders[i].value = rule.value;
				break;
			}
		}
		if(!flag) details.requestHeaders.push(rule);
		
		for (i = 0; i < details.requestHeaders.length; ++i) {
			if (details.requestHeaders[i].name.toLowerCase() === "access-control-request-headers") {
				accessControlRequestHeaders = details.requestHeaders[i].value	
			}
		}	
		
		return {requestHeaders: details.requestHeaders, redirectUrl: details.url};
		
	}
};

var responseListener = function(details){

	if(
		!(details.url.indexOf(variables.wallet) != -1 || details.url.indexOf(variables.daemon) != -1)
	){
		
		return {};
		
	}else{
	
		//chrome.extension.getBackgroundPage().console.log(details);
		console.log('response intercepted', details);
		
		var flag = false,
		rule = {
			"name": "Access-Control-Allow-Origin",
			"value": "*"
		};

		for (var i = 0; i < details.responseHeaders.length; ++i) {
			if (details.responseHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
				flag = true;
				details.responseHeaders[i].value = rule.value;
				break;
			}
		}
		if(!flag) details.responseHeaders.push(rule);

		if (accessControlRequestHeaders) {
			// details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": accessControlRequestHeaders});
		}

		details.responseHeaders.push({"name": "Access-Control-Allow-Credentials", "value": "false"});
		details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": "Content-Type,Date,Content-Length"});
		details.responseHeaders.push({"name": "Access-Control-Allow-Methods", "value": "GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH"});
		details.responseHeaders.push({"name": "Access-Control-Allow-Origin", "value": "*"});
		details.responseHeaders.push({"name": "Access-Control-Expose-Headers", "value": "Content-Type, Date, Content-Length"});
		details.responseHeaders.push({"name": "Content-Type", "value": "application/json; charset=utf-8"});
		details.responseHeaders.push({"name": "X-Content-Type-Options", "value": "nosniff"});

		return {responseHeaders: details.responseHeaders};
		
	}
};

/*On install*/
chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.set({'wallet': 'http://127.0.0.1:30309'});
	chrome.storage.local.set({'daemon': 'http://127.0.0.1:30306'});
	// chrome.storage.local.set({'active': true});
	installListeners();
});

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(message.action=="getStatus"){
		sendResponse(variables);
	}
});
/*
chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab){
    setInterval(()=>{       
        chrome.tabs.sendMessage(id, variables);
    },5000);
});
*/
function setVar(cvar, cval){
	console.log(cvar, cval);
	variables[cvar] = cval;
};

function getVar(cvar){
	console.log(cvar, variables[cvar]);
	return variables[cvar];
};

function setListeners() {
	/*Add Listeners*/
	chrome.webRequest.onHeadersReceived.addListener(responseListener, {
		urls: ["<all_urls>"],
		types: ["xmlhttprequest"]
	},["blocking", "responseHeaders", "extraHeaders"]);

	chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
		urls: ["<all_urls>"],
		types: ["xmlhttprequest"]
	},["blocking", "requestHeaders", "extraHeaders"]);
}

function resetListeners() {
	/*Remove Listeners*/
	chrome.webRequest.onHeadersReceived.removeListener(responseListener);
	chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);
}

/*Reload settings*/
function installListeners() {
	
	console.log('installListeners');

	resetListeners();
	setListeners();
	
	chrome.webRequest.onBeforeRequest.addListener(function(details) {
		if(
			(details.url.indexOf(variables.wallet) != -1 || details.url.indexOf(variables.daemon) != -1)
		){
			try{
				
				var data = JSON.parse(decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))));
				console.log(data);
				if(
					details.url.indexOf(variables.wallet) != -1 &&
					data.method != "getbalance" &&
					data.method != "getaddress" &&
					data.method != "transfer_split"
				){ return {cancel: true}; }

				if(
					data.method == "transfer_split"
				){
					message = "";
					message += "\nContract: " + data.params.sc_tx.scid;
					message += "\nMethod: " + data.params.sc_tx.entrypoint;
					message += "\nAmount: " + (data.params.sc_tx.value || 0 )/1000000000000 + " DERO";
					message += "\nParams: " + JSON.stringify(data.params.sc_tx.params);
					var allow = confirm("Are you sure you want to execute folowing transaction ?\n" + " " + message);
					if(allow){
						return {};
					}else{
						return {cancel: true};
					}
				}
			}catch(err){
				console.log(err);
				//return {cancel: true};
			}

		}
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestBody"]);
	

}