/**
 * A very simple file-based storage of JSON
 */

//TODO:
// * Switch to full async-ready file access
// * Index (on-demand) different object properties
// * Provides random access in-place record updates and append-only mode updates (rather than fully rewriting the file)
var Memory = require("./memory").Memory,
	JSONExt = require("commonjs-utils/json-ext"),
	AutoTransaction = require("../transaction").AutoTransaction,
	print = require("promised-io/process").print,
	fs = require("promised-io/fs");
exports.JSFile = function(options){
	if (!options) options = {};
	var lastMod = 0;
	var store = Memory();
	store.transaction= function(){
		try{
			var stat = fs.statSync(options.filename);
		}catch(e){
		}
		if(stat && stat.mtime){
			var fileTime = stat.mtime.getTime();
			if(fileTime > lastMod){
				lastMod = fileTime;
				var contents = fs.read(options.filename);
				if(contents){
					var data = JSONExt.parse(contents);
					store.setIndex(data);
				}
			}
		}

		return {
			commit: function(){
				fs.writeFileSync(options.filename, JSONExt.stringify(store.index));
			},
			abort: function(){
			}
		};
	};
	store.getLastModified = function(){
		try{
			var stat = fs.statSync(options.filename);
		}catch(e){
			print(e);
		}
		if(stat && stat.mtime){
			return stat.mtime;
		}
	};
	store.getETag = function(){
		var lastModified = store.getLastModified();
		return lastModified && lastModified.getTime();
	};
	return AutoTransaction(store);
};
