/*
 * jsBrewCalc
 */
/*global console:true*/

var BREWCALC = {
	settings: {
		eff: 0.75,
		colorEff: 0.66,
		defaultAtt: 0.73
	}
};



(function($, b) {
	'use strict';

	/*
	 * Number reading: needs much improvement
	 */

	function toDecimal(v) {
		var d;
		var s = v.replace(/^([0-9.\/]+).*/, '$1');

		if (s.match(/\//)) {
			var a = s.split('/');
			d = parseFloat(a[0], 10) / parseFloat(a[1], 10);
		} else {
			d = parseFloat(s, 10);
		}

		return d;
	}

	//http://realbeer.com/hops/research.html#table
	var tinseth = function(og, time, amount, aa, vol) {
		var ibu = 0;

		console.log('og: ' + og);
		console.log('time: ' + time);
		console.log('amount: ' + amount);
		console.log('aa: ' + aa);
		console.log('vol: ' + vol);


		//FIXME: assume preboil
		var preboil = og * 0.98;

		amount = toDecimal(amount);

		var bignessFactor = 1.65 * Math.pow(0.000125, (preboil - 1));



		var timeFactor = (1 - Math.pow(Math.E, (-0.04 * time))) / 4.15;

		var aaFactor = ( (aa/100) * amount * 7490 )/vol;

		//console.log(ibu);

		ibu += aaFactor * bignessFactor * timeFactor;


		console.log('Time Factor: ' + timeFactor);
		console.log('Big Factor: ' + bignessFactor);
		console.log('aaFactor: ' + aaFactor);
		console.log('ibu: ' + ibu);
		console.log(ibu);
		

		return ibu;
	};


	function toPlato(g) {
		return (-463.37) + (668.72 * g) - (205.35 * Math.pow(g,2)) ;
	}


	b.compute = function(recipe) {

		var volume = parseFloat(recipe.size, 10);
		if (!volume) {
			throw new Error('recipe.size is required');
		}



		var gu = 0,
			lbs = 0,
			srmu = 0;


		/*
		 *  gravity
		 */
		$.each(recipe.grain, function(i, grain) {
			if (grain.unit !== 'lb') {
				console.log('ignore grain unit not "lb"');
				return;
			}
			var amount = parseFloat(grain.amount, 10);
			gu += amount * grain.ppg;
			lbs += amount;
			srmu += grain.color * amount;
		});


		var gut = (gu / volume) * b.settings.eff;

		//TODO: need pre boil gravity
		var og = 1 + (gut / 1000);
		var fg = 1 + (gut * (1 - b.settings.defaultAtt)) / 1000;

		/*
		 * hops
		 */

		var ibu = 0;
		var bignessFactor = 1.65 * Math.pow(0.000125, (og - 1));
		$.each(recipe.hops, function(i, hop) {
			ibu += tinseth(og, hop.min, hop.amount, hop.aa, volume);
		});

		//TODO: use an average of og and og pre-boil


		var buog =  ibu / gut;

		var abv = ((1.05*(og-fg))/fg)/0.79*100;
		var abw = (0.79 * abv) / fg;


		var realExtract = (0.1808 * toPlato(og)) + (0.8192 * toPlato(fg));
		var cal12oz = ((6.9 * abw) + 4.0 * (realExtract - 0.10)) * fg * 3.55;


		/*
		 * Color
		 * may darken 2-3 due to oxidation and caramelization
		 */

		var srm = b.settings.colorEff * srmu / volume;


		return {
			og: og.toFixed(3),
			fg: fg.toFixed(3),
			lbs: lbs,
			ibu: ibu,
			abv: abv,
			abw: abw,
			srm: Math.round(srm),
			buog: buog,
			cal12oz: cal12oz
		};

	};



}(jQuery, BREWCALC));