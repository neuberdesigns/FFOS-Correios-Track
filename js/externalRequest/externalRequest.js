var externalRequest = {
	callbackError: null,
	
	xhrSuccess: function() {
		this.callback.apply(this, arguments); 
	},

	xhrError: function() {
		externalRequest.callbackError.apply(this, [this]); 
	},

	request: function(method, url, data, callback) {
		var params = '';
		var oReq = new XMLHttpRequest({mozSystem: true});
		
		if( typeof(method)=='undefined' || method==null )
			method = 'GET';
		
		if( typeof(data)!='undefined' ){
			for (var property in data) {
				param = data[property];
				params += property+'='+param+'&';
			};
			params = params.substr(0, params.length-1);
		}
		
		method = method.toLowerCase();
		
		oReq.dataType = 'text';
		oReq.callback = callback;
		oReq.arguments = Array.prototype.slice.call(arguments, 4);
		oReq.onload = externalRequest.xhrSuccess;
		oReq.onerror = externalRequest.xhrError;
		
		if( method == 'get' ){
			oReq.open(method, url+'?'+params, true);
		}else{
			oReq.open(method, url, true);
		}
		
		if( method == 'get' )
			oReq.send(null);
		else
			oReq.send(params);
	}, 
}
