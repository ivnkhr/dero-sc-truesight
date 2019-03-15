var _background = chrome.extension.getBackgroundPage();

$(document).ready(function(){
	
	$('body').append('<div class="loading"><div class="entitlement">loading</div></div>');
	$('.loading').hide();
	
	$('.info-page').hide();
	
	optionsOnload();
	setTimeout( () => {
		wallet_connection_status();
		daemon_connection_status();
	},100);

	$('.options-action').click(function(){
		if(chrome.runtime.openOptionsPage){
			chrome.runtime.openOptionsPage();
		}else{
			window.open(chrome.runtime.getURL('optionsView.html'));
		}
	});
	
	$('.refresh-action').click(function(){
		wallet_connection_status();
		daemon_connection_status();
	});

	$('.options-update-action').click(function(){
		chrome.storage.local.set({'wallet': $('[name="wallet"]').val()});
		chrome.storage.local.set({'daemon': $('[name="daemon"]').val()});
		_background.setVar('wallet', $('[name="wallet"]').val());
		_background.setVar('daemon', $('[name="daemon"]').val());
		wallet_connection_status();
		daemon_connection_status();
		//alert('New Endpoints Updated');
		//window.close();
	});
	
	$('.trigger-info-page').click(function(){
		$('.main-page').hide();
		$('.info-page').show();
	});

	$('.trigger-main-page').click(function(){
		$('.info-page').hide();
		$('.main-page').show();
	});

});

function updateUI(){
	
	//_background.installListeners();
	
	$('.wallet_status b').attr("class", _background.getVar('wallet_status')?'status_on':'status_off');
	$('.daemon_status b').attr("class", _background.getVar('daemon_status')?'status_on':'status_off');
	$('.wallet_balance b').text(_background.getVar('wallet_balance'));
	$('.wallet_balance_unlocked b').text(_background.getVar('wallet_balance_unlocked'));
	$('.daemon_net b').text(_background.getVar('net'));
	$('.daemon_height b').text(_background.getVar('height'));
	(_background.getVar('wallet_status'))?$('.wallet_box').show():$('.wallet_box').hide();
	(_background.getVar('daemon_status'))?$('.daemon_box').show():$('.daemon_box').hide();
	
	wallet_status = _background.getVar('wallet_status');
	daemon_status = _background.getVar('daemon_status');
	console.log('updateUI', wallet_status, daemon_status);
	
	if(wallet_status==0 && daemon_status==0){
		chrome.browserAction.setIcon({path:"../media/icons/off.png"});
	}else if(wallet_status==1 && daemon_status==1){
		chrome.browserAction.setIcon({path:"../media/icons/on.png"});
	}else{
		chrome.browserAction.setIcon({path:"../media/icons/pending.png"});
	}
	$('.loading').fadeOut();
}

function optionsOnload(){
	chrome.storage.local.get({'wallet': null, 'daemon': null}, function(result) {
		$(document).ready(function(){
			console.log(result.wallet, result.daemon);
			$('[name="wallet"]').val(result.wallet);
			$('[name="daemon"]').val(result.daemon);
			_background.setVar('wallet', result.wallet);
			_background.setVar('daemon', result.daemon);
			updateUI();
		});
	});
}

function wallet_connection_status(){
	
	//_background.resetListeners();
	//_background.setListeners();
	
	console.log('wallet_connection_status');
	$('.loading').show();
	
	var data = JSON.stringify ({ 'jsonrpc' : '2.0', 'id': 0, 'method': 'getbalance', 'params': {}});

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = false;

	xhr.addEventListener("readystatechange", function () {
		
		if (this.readyState === 4) {
			try{
				var json = JSON.parse(this.response);
				if( json.id == 0 ){
					_background.setVar('wallet_status', 1);
					_background.setVar('wallet_balance', (json.result.balance/1000000000000).toFixed(2));
					_background.setVar('wallet_balance_unlocked', (json.result.unlocked_balance/1000000000000).toFixed(2));
					updateUI();
				}
			}catch(err){
				_background.setVar('wallet_status', 0);
				updateUI();
			}
			//_background.resetListeners();
		}
		$('.loading').delay(0).fadeOut();
	});

	try{
		var url = _background.getVar('wallet') + "/json_rpc";
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(data);
	}catch(err){
		_background.setVar('wallet_status', 0);
		updateUI();
	}
}

function daemon_connection_status(){
	
	//_background.resetListeners();
	//_background.setListeners();
	
	console.log('daemon_connection_status');
	$('.loading').show();
	
	var data = JSON.stringify ({ 'jsonrpc' : '2.0', 'id': 0, 'method': 'get_info', 'params': {}});

	var xhr = new XMLHttpRequest();
	xhr.withCredentials = false;

	xhr.addEventListener("readystatechange", function () {
		
		if (this.readyState === 4) {
			try{
				var json = JSON.parse(this.response);
				console.log(json);
				if( json.id == 0 && json.result.status == 'OK' ){
					_background.setVar('daemon_status', 1);
					_background.setVar('height', json.result.stableheight);
					_background.setVar('net', (json.result.testnet)?'testnet':'mainnet');
					updateUI();
				}
			}catch(err){
				_background.setVar('daemon_status', 0);
				updateUI();
			}
			//_background.resetListeners();
		}
		$('.loading').delay(0).fadeOut();
	});

	try{
		var url = _background.getVar('daemon') + "/json_rpc";
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(data);
	}catch(err){
		_background.setVar('daemon_status', 0);
		updateUI();
	}

}