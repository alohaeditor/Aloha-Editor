$(function () {
	function colorcycle() {
		var colors = [
			'#54c8eb', // light blue
			'#4ea9de', // med blue
			'#4b97d2', // dark blue
			'#92cc8f', // light green
			'#41bb98', // mint green
			'#c9de83', // yellowish green
			'#dee569', // yellowisher green
			'#c891c0', // light purple
			'#9464a8', // med purple
			'#7755a1', // dark purple
			'#f069a1', // light pink
			'#f05884', // med pink
			'#e7457b', // dark pink
			'#ffd47e', // peach
			'#f69078' // salmon
		];
		var color = colors[parseInt(Math.random() * (colors.length - 1), 10)];
		$('.funky').css('background-color', color);
	}

	colorcycle();
	setInterval(colorcycle, 15000);
});