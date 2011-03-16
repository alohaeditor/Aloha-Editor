require(__dirname+'/dep.js');

var f = function(b){
	this.config = {}.extend(this.config);
	console.log(this.config);
	this.config.b = b;
	console.log(this.config);
}
f.prototype.config = {
	a: 'a',
	b: 'b'
};

var f1 = new f('bb');
var f2 = new f('bbb');

// logs
// { a: 'a', b: 'b' }
// { a: 'a', b: 'bb' }

// expected
// { a: 'a', b: 'b' }
// { a: 'a', b: 'b' }
