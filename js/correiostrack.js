function getById(id) { return document.getElementById(id); }
init();

$('document').ready(function(){

	$('#bt-track-code').on('click', function(){
		var code = getById('search-code').value;
		
		if( code.length==13 ){
			if( $('#progress-bar').is(':hidden') ){
				toggleProgress();
			}

			trackCode(code);
		}else{
			utils.status.show('O código deve ter 13 caracteres');
		}
	});

	$('#bt-save-code').on('click', function(){
		var code = $('#search-code').val();
		
		idb.insert(
			code, 
			function(code){
				addCodeToList(code);
				utils.status.show('Código <b>'+code+'</b> foi adicionado', 3000);
			},
			
			//Error
			function(e){
				var msg;
				if( e.name == 'ConstraintError'){
					msg = "Este código já esta em sua lista";
				}else{
					msg = e.message;
				}
				
				utils.status.show(msg, 5000);
			}
		);
	});
	
	$('#bt-delete-code').on('click', function(){
		var code = $('#search-code').val();
	});

	$('#codes-list').on('click', '.track-code', function(){		
		$('#search-code').val( $(this).text() );
		$('#track-response').html('');
	});
});

function init(){
	idb.addTable('code', 'id', true, [
		{'name':'id', 'field': 'id', 'options':{'unique': true} },
		{'name':'code', 'field': 'code', 'options':{'unique': true} }
	]);
	
	idb.setTable( idb.schema[0].name);
	idb.open(function(){		
		idb.all(function(result){
			if( result!=null ){
				for (var i = 0; i < result.length; i++) {
					row = result[i];					
					addCodeToList(row.code);
				};
			}			
		});
	});
}

function showError(message){
	var $notification = $('#notification h2');
	
	$notification.fadeOut('fast', function(){
		$notification.html(message);
		$notification.fadeIn('slow');
	});
}

function toggleProgress(){
	$('#progress-bar').toggle();
}

function addCodeToList(code){
	$('#codes-list').append( $('<li><a href="#content" class="track-code">'+code+'</a></li>') );
}

function trackCode(code){
	//RB949609468CN
	$('#track-response').html('');
	var post = {
		'P_ITEMCODE': '',
		'P_LINGUA' 	: '001',
		'P_TESTE' 	: '',
		'P_TIPO' 	: '001',
		'P_COD_UNI' : code,
		'Z_ACTION' 	: 'Pesquisar',
	}
	
	//jQuery('#main-content').text(code);
	externalRequest.callbackError = function(xhr){
		toggleProgress();
		utils.status.show('Por favor verifique sua conexão', 3000);
	};
	
	externalRequest.request('POST', 'http://websro.correios.com.br/sro_bin/txect01$.QueryList', post, function(){
		toggleProgress();
		
		if( this.status == 200 ){
			var resp = this.responseText;
			var $html = $(resp);
			var $trs = $html.find('table tbody > tr');
			
			$trs.each( function(i){
				if( i>0 ){
					$tds = $(this).find('td');
					
					if( $tds.length>1 ){						
						date = $tds.eq(0).text();
						place = $tds.eq(1).text();
						status = $tds.eq(2).text();
						
						h1 = '<h1>'+status+'</h1>';
						h2 = '<h2>'+date+' '+place+'<h2>';
						$('#track-response').append( $(h1+h2) );
					}
				}
			});
		}
	});
}