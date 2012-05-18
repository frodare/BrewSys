var http = require('http'),
	util = require('util'),
	fs = require('fs');

var client = http.createClient(80, 'www.brewtoad.com');


var start = 1;
var stop = 300;


req(start, 'yeasts');
req(start, 'hops');
req(start, 'fermentables');
req(start, 'styles');

//compileDir('/tmp/fermentables', '/tmp/ferementables2.json');

function compileDir(dir, outPath) {
	var out = fs.createWriteStream(outPath);
	fs.readdir(dir, function (err, files) {
		if(err){
			throw err;
		}
		concat(0, files, out, dir);
	});
}

function concat(index, files, out, dir) {
	console.log(files[index]);

	var s = fs.createReadStream(dir + '/' + files[index]);
	s.on('end', function () {
		index++;
		
		if(index === files.length){
			console.log('close');
			out.end();
		}else{
			out.write('\n');
			concat(index, files, out, dir);
		}
	});
	s.pipe(out, { end: false });
}


function req(i, type) {
	var request = client.request('GET', '/' + type + '/' + i + '.json');
	
	request.on('response', function(response) {
		console.log('requesting ' + type + i);
		response.setEncoding('utf-8');
		response.pipe(fs.createWriteStream('/tmp/toad/' + type + i + '.json'), {encoding: 'utf-8'});
		response.on('end', function() {
			if (i < stop) {
				req(i + 1, type);
			}
		});
	}).end();
}
