$.fn.dataTable.moment = function (format, locale) {
	var types = $.fn.dataTable.ext.type;

	// Add type detection
	types.detect.unshift(function (d) {

		/* if (!Number.isInteger(d)) {
			if ((d.indexOf('-') > 0) && (d.indexOf(':') > 0)) {
				console.log(d);

			}
		} */
		console.log(d);
		return moment(d, format, locale, true).isValid() ?
			'moment-' + format :
			null;
	});

	// Add sorting method - use an integer for the sorting
	types.order['moment-' + format + '-pre'] = function (d) {
		console.log('moment');
		return moment(d, format, locale, true).unix();
	};
};

$(document).ready(function(){
	$.fn.dataTable.moment('YYYY-MM-DD HH:mm zz');
})
