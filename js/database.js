window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
var idb = {
	DB_VERSION: 1,
	READ_WRITE: "readwrite",
	READ_ONLY: "readonly",
	databaseName: 'trackcode',
	tableName: null,
	database: null,
	request: null,
	schema: [],
	
	setTable: function(table){
		idb.tableName = table;
	},
	
	getTable: function(){
		return idb.tableName;
	},
	
	addTable: function(name, keyPath, ai, indexes){
		var table;
		var options = {};
		keyPath 	= idb.check(keyPath, null);
		ai 			= idb.check(ai, false);
		indexes 	= idb.check(indexes, []);
		
		if( keyPath!=null ){
			options.keyPath = keyPath;
		}
		
		if( ai ){
			options.autoIncrement = true;
		}
		
		table = {
			'name': name,
			'options': options,
			'indexes': indexes,
		}
		
		idb.schema.push(table);
	},
	
	open: function(callback){
		idb.request = window.indexedDB.open(idb.databaseName, idb.DB_VERSION);
		
		idb.request.onupgradeneeded = function(event) {
			console.log('Upgrading...');
			
			var database = idb.request.result;
			for (var i = 0; i < idb.schema.length; i++) {
				table = idb.schema[i];
				
				if( !database.objectStoreNames.contains( table.name ) ){	
					store = database.createObjectStore( table.name, table.options);
					
					for (var j = 0; j < table.indexes.length; j++) {
						index = table.indexes[j];
						
						if( !idb.isEmpty(index) ){
							store.createIndex(index.name, index.field, index.options);
						}
					}
					console.log('Database "'+table.name+'" created succesfully');
				}
				
			}
			
		}
		
		idb.request.onsuccess = function(event) {
			idb.database = idb.request.result;
			//idb.database = idb.request.result;
			
			console.log('Database is open');
			
			if( typeof(callback)=='function' ){
				callback.apply(this, []);
			}
		}
		
		idb.request.onerror = function(event) {
			console.log('Could not open database: '+event.target.errorCode);
		}
	},
	
	insert: function(code, callback, errorcb){
		var data = {
			'code': code,
			'created': 'new Date()',
		};
		
		var transaction = idb.database.transaction([idb.getTable()], idb.READ_WRITE);
		var store = transaction.objectStore(idb.getTable());
		
		insert = store.add(data);
				
		insert.onsuccess = function(event){
			console.log("Woot! Did it");
			idb.callCb(callback, code);
		}
		
		insert.onerror = function(e){
			idb.callCb(errorcb, e.target.error);
		}
	},
	
	find: function(id, callback, error){
		var result = null;
		var transaction = idb.database.transaction([idb.getTable()], idb.READ_ONLY);
		var store = transaction.objectStore( idb.getTable() );
		var request = store.get(id);
		
		request.onsuccess = function(event) {
			result = event.target.result;
			if( result==undefined ){
				result = null;
			}
			idb.callCb(callback, result, event);
		}
		
		request.onerror = error;
	},
	
	findByIndex: function(value, index, callback, error){
		var result = null;
		var transaction = idb.database.transaction([idb.getTable()], idb.READ_ONLY);
		var store = transaction.objectStore( idb.getTable() ).index(index);
		var request = store.get(value);
		
		request.onsuccess = function(event) {
			result = event.target.result;
			if( result==undefined ){
				result = null;
			}
			idb.callCb(callback, result, event);
		}
		
		request.onerror = error;
	},
	
	all: function(callback){
		var store = idb.database.transaction(idb.getTable(), idb.READ_ONLY).objectStore(idb.getTable());
		var rows = [];
		
		store.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			
			if (cursor) {
				rows.push(cursor.value);
				cursor.continue();
			}else{
				if( typeof(callback)=='function' ){
					if( rows.length==0 ){
						rows = null;
					}
					idb.callCb(callback, rows);
				}
			}
		};
	},
	
	delete: function(id, callback, error){
		var remove;
		var store = idb.database.transaction(idb.getTable(), idb.READ_WRITE).objectStore(idb.getTable());
		
		remove = store.delete(id);
		
		remove.onsuccess = function(event){
			idb.callCb(callback, event);
		}
		
		remove.onerror = error;
	},
	
	check: function(variable, defaultValue){
		var resp = variable;
		if( typeof(variable)=='undefined' ){
			resp = defaultValue;
		}
		
		return resp;
	},
	
	isEmpty: function(obj) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
		return true;
	},
	
	callCb: function(func){
		var args = Array.prototype.slice.call(arguments);
		
		if( typeof(func)=='function' ){
			func.apply(this, args.slice(1));
		}
	}
	
}