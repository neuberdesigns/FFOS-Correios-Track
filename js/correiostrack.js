function getById(id) { return document.getElementById(id); }
init();

$('document').ready(function(){

	$('#bt-track-code').on('click', function(){
		var code = getById('search-code').value;
		
		if( code.length==13 ){
			trackCode(code, true);
		}else{
			utils.status.show('O código deve ter 13 caracteres');
		}
	});

	$('#bt-save-code').on('click', function(){
		var code = $('#search-code').val().toUpperCase();
		var cache = $.trim( $('#track-response').html() );
		
		if( code.length==13 ){
			idb.insert(
				code,
				cache,
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
		}else{
			utils.status.show('O código deve ter 13 caracteres');
		}
	});
	
	$('#bt-delete-code').on('click', function(){
		var code = $('#search-code').val();
		idb.findByIndex(code, 'code', 
			function(r, e){
				console.log('found');
				if( r!= null ){
					idb.delete(r.id, function(ev){
						removeFromCodeList(code);
						utils.status.show('Código <b>'+code+'</b> foi removido', 3000);
					});
				}
			},
			
			function(ev){
				console.log(ev.message);
			}
		);
	});

	$('#codes-list').on('click', '.track-code', function(){	
		var code = $(this).text();
		$('#search-code').val( code );
		$('#track-response').html('');
		
		trackCode(code, false);
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

function toggleProgress(forceShow, forceHide){
	var $progress = $('#progress-bar');
	
	if( forceShow )
		$progress.show();
	else if( forceHide )
		$progress.hide();
	else
		$progress.toggle();
}

function addCodeToList(code){
	$('#codes-list').append( $('<li><a href="#content" class="track-code">'+code+'</a></li>') );
}

function removeFromCodeList(code){
	code = code.toLowerCase();
	$('#codes-list li').each(function(){
		if( $(this).text().toLowerCase()==code ){
			$(this).remove();
		}
	})
}

function showHistory(content){
	toggleProgress();
	$('#track-response').html( content );
}

function trackCode(code, update){
	toggleProgress(true);
	
	idb.findByIndex(code, 'code', function(r, ev){
		if( r!=null ){
			showHistory(r.cache);
			if( update ){
				toggleProgress(true);
				getFromWeb(code, function(response){
					showHistory(response);
					r.cache = response;
					
					idb.update(r, function(){
						utils.status.show('Rastreamento atualizado');
					});
				});
			}
		}else{
			getFromWeb(code, function(response){
				showHistory(response);
			});
		}
	});
	
}

function getFromWeb(code, cb){
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
		if( this.status == 200 ){
			var history = '';
			var entry = '';
			var resp = this.responseText;
			var $html = $(resp);
			var $trs = $html.find('table tbody > tr');
			
			if( $trs.length>0 ){		
				$trs.each( function(i){
					if( i>0 ){
						$tds = $(this).find('td');
						
						if( $tds.length>1 ){						
							date = $tds.eq(0).text();
							place = $tds.eq(1).text();
							status = $tds.eq(2).text();
							
							entry  = '<div class="history-item">';
							entry += '	<div class="history-title">'+status+'</div>';
							entry += '	<div class="history-content">'+date+' '+place+'</div>';
							entry += '	<hr />';
							entry += '</div>'
							
							history += entry;
						}
					}
				});				
				idb.callCb(cb, history);
				
			}else{
				toggleProgress();
				utils.status.show('O código não existe ou não esta disponível', 6000);
			}
			
		}
	});
}