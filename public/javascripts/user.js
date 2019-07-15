var table
var socket = io.connect('http://localhost:3000');

$(function () {


	//Get Logs from server
	socket.on('log',function(data){
		//$('.logs').show();
		log = data.stdout;
		index = data.index;
		console.log(index);
		$(".logs").append('<p class="log-data" id="log-'+index+'">'+log+'</p>');
	})

	const actionBtns = `
	<a href="#" class="edit"><i class="fa fa-pencil"></i></a>
	<a href="#" class="delete"><i class="fa fa-trash"></i></a>
	`;

	const $autoModal = $('#automation-crud-modal'),
	$autoForm = $('#automation-form'),
	$table = $('#automation')

	$table.find('thead th:first').append('<div class="checkbox"><input type="checkbox" id="select-all" class="dt-checkboxes"><label></label></div>');

	table = $table.DataTable({
		'responsive' : true,
		//"pageLength" : 25,
		'paginate' : true,
		// 'scrollX': true,
		// 'scrollY': 600,
		"initComplete": tableInitCallback,
		rowId: 'id',
		"lengthMenu" : [
		[10, 25, 50, -1],
		[10, 25, 50, /*100,*/ "All"]
		],
		ajax : '/api/automation',
		columns : [
		{data : 'id'},
		{data : 'HostName'},
		{data : 'LoginID'},
		{data : 'CMD_PREFIX'},
		{data : 'IFN'},
		{data : 'CFN'},
		{data : 'OSType'},
		{data : 'SID'},
		{data : 'DBTYPE'},
		{data : 'AppType'},
		{data : 'CDIR'},
		{data : 'CUSTNAME'},
		{data : 'LOCATION'},
		{data : null}

		],
		'columnDefs' : [
		{
			'targets' : 0,
			"orderable" : false,
			'render' : function (data, type, row, meta) {
					//console.log(data, type, row, meta);
					if (type === 'display') {
						data = '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>';
					}
					return data;
				}
			},

			{
				targets : 13,
				render : ()=>actionBtns
			}
			],
			'select' : 'multi',
			'order' : [[1, 'asc']]
		});

	$('#automation').on('click', '.delete', function (e) {
		e.preventDefault();

		const $row = $(this).closest('tr');
		const data = table.row($row).data();


		deSelectRows();

		$row.find('.dt-checkboxes').prop('checked', true).change();

		$.confirm({
			title : 'Delete Row?',
			content : 'Action can not be undone!',
			buttons : {
				delete : function () {

					$.ajax({
						url : `/api/automation/` + data.id,
						method : 'DELETE'
					}).then(()=>table.row($row[0]).remove().draw())
					.catch(function () {

						$.alert({
							type : 'red',
							title : "Ooops",
							content : "Delete row failed at server. Please try again"
						})
					})

				},
				cancel : function () {
				}
			}
		})
	});

	$('#select-all').change(function () {
		$table.find('.dt-checkboxes').not(this)
		.prop('checked', this.checked).prop('indeterminate', false)
		.closest('tr').toggleClass('selected', this.checked);
		$('#action-buttons').trigger('checkbox-change')

	});

	$('#action-buttons').on('checkbox-change', function () {
		$(this).toggle($('.dt-checkboxes:checked').length > 0)
	})

	$table.on('change', 'tbody .dt-checkboxes', function (e) {
		const $row = $(this).closest('tr')
		if (!this.checked) {
			$('#select-all').prop('indeterminate', true);

		} else {
			if ($row.siblings().get().every(el=>$(el).find(':checked').length)) {
				$('#select-all').prop('indeterminate', false).prop('checked', true);
			}
		}
		$row.toggleClass('selected', this.checked);
		$('#action-buttons').trigger('checkbox-change')
	});

	/**
	 * Handle sending all checked items to server
	 * when an action button is clicked
	 */

	 $('#action-buttons .dropdown-item').click(function (e) {
	 	e.preventDefault();
	 	const action = $(this).data('action');
	 	const items = $('#automation tbody .selected').map(function () {
	 		return table.row(this).data();
			// /return this;
		}).get();

	 	if (items.length) {
			// array of request promises
			const promises = items.map((item,index)=>{
				const filename = Math.random().toString(36).substring(7)+".txt";
				item.filename = filename;
				item.index = index;
				console.log(filename+'  '+item.IFN);
				const postData = JSON.stringify({action, item});
				return	$.ajax({
					url : '/api/automation/actions',
					method : 'POST',
					data : postData,
					contentType : 'application/json'

				}).then(res=> {
					const itemCopy = Object.assign({}, item);
					itemCopy.status = 'success';
					return itemCopy;
				})
			});

			Promise.all(promises).then(res=>{
				// TODO: More robust visual print out of items succeeded/failed
				const total = res.length;
				console.log(res);
				output = '';
				res.forEach(function(value,index){
					output += '<tr>';
					output += '<td>'+value.SID+'</td>';
					output += '<td>'+value.HostName+'</td>';
					output += '<td>'+value.OSType+'</td>';
					output += '<td>'+value.IFN+'</td>';
					output += '<td><a href="/logs/'+value.filename+'" class="status">'+value.status+'</a></td>';
					output += '<tr>';
				});
				$('.status-box tbody').append(output);
				$('.status').click(function(e){
					e.preventDefault();
					$('#logs').show();
					$('.log-data').hide();
					index = $('.status').index(this);
					$('#log-'+index).show();
				});
				const counts = res.reduce((a,c)=>{
					a[c.status]++;
					return a;
				},{success:0, fail:0});

				/*$.alert({
					title : `Action ${action} Completed`,
					content : `Total: ${total}, Success: ${counts.success}, Failed:   ${counts.fail}.`
				});*/
			})
			//const postData = JSON.stringify({action, items});
			//$.ajax({
			//	url : '/api/automation/actions',
			//	method : 'POST',
			//	data : postData,
			//	contentType : 'application/json'
			//
			//}).then(res=> {
			//		$.alert({
			//			title : 'Action Completed',
			//			content : `Updated ${items.length} items.`
			//		});
			//	}
			//).catch(err=> {
			//	$.alert({
			//		type : 'red',
			//		title : 'Action Failed!',
			//		content : `One or more items did not succeed.`
			//	});
			//});
		}
	});

	 $table.on('click', 'tbody tr', function (e) {
	 	const $tgt = $(e.target);
	 	if (!$tgt.closest('.checkbox').length && !$tgt.closest('a').length) {
	 		const $checkBox = $(this).find('.dt-checkboxes');
	 		$checkBox.prop('checked', !$checkBox.prop('checked')).change()
	 	}
	 });

	 $('#automation').on('click', '.edit', function (e) {
	 	e.preventDefault();

	 	deSelectRows();


	 	$autoForm.data('mode', 'edit')
	 	const $row = $(this).closest('tr'),
	 	$modal = $('#automation-crud-modal'),
	 	$form = $('#automation-form'),
			noMatch = [];// debugging only
			let data = table.row($row).data();


			$row.find('.dt-checkboxes').prop('checked', true).change();

			$form.validate({
				errorClass : "is-invalid",
				errorPlacement : function (error, element) {
					error.appendTo(element.next());
				},
				rules : {
					IFN : {
						required : true,
						ipAddress : true
					},
					CFN : {
						required : true,
						ipAddress : true
					}
				}
			});
		// debugging form only
		//Object.keys(data).forEach(key=> {
		//	const $input = $form.find(`[name=${key}]`).val(data[key]);
		//	// debugging only
		//	if (!$input.length) {
		//		noMatch.push(key)
		//	}
		//
		//});
		//console.log('No Matches', noMatch);

		setModalTitle($modal, 'Edit Item');
		$modal.data('selected', $row).modal('show');

	});
	/**
	 * Reset form whenever form modal is closed
	 */
	 $autoModal.on('hidden.bs.modal', function (e) {
	 	const $form = $autoForm
	 	$form.find('.is-invalid').removeClass('is-invalid');
	 	$form.find('.invalid-feedback').empty();

	 	if ($form.data('validator')) {
	 		$form.data('validator').destroy()
	 	}
	 	$form[0].reset();

	 });

	 $('#create-auto-row').click(function () {
	 	$autoForm.data('mode', 'create');
	 	setModalTitle($autoModal, 'Create Item');
	 	$autoModal.modal('show')
	 });
	/**
	 * Form submit event handler
	 */
	 $autoForm.submit(function (e) {
	 	e.preventDefault();

	 	const mode = $autoForm.data('mode');
	 	const $form = $(this);

	 	if (!$form.valid()) {
	 		return
	 	}

	 	$.ajax({
	 		url : '/api/automation',
	 		method : mode === 'edit' ? 'PUT' : 'POST',
	 		data : $(this).serialize()
	 	}).then(res=> {
	 		if (mode === 'edit') {
	 			var $row = $autoModal.data('selected');

	 			table
	 			.row($row)
	 			.data(res)
	 			.draw();


	 		} else {
	 			table.row.add(res).draw(false);
	 		}
	 		$autoModal.modal('hide');
	 		selectModifiedRow(res.id);
			//console.log(res)
		}).catch(err=> {
			//console.error('Err::', err);
			if (err.status === 422 && err.responseJSON.errors) {
				handleServerErrors($form, err.responseJSON.errors);

			} else {
				alert('Problem submitting form, please try again')
			}

		})
	});


	});

/**
 * Uncheck checked rows in table
 */
 function deSelectRows(){
 	$('#automation tbody tr.selected .dt-checkboxes').prop('checked', false).change()
 }

 function selectModifiedRow(id) {
 	const rIdx = table
 	.column(0)
 	.data()
 	.indexOf(id);

 	const currPage = table.page()
 	const page_to_display = Math.floor(rIdx / table.page.len());
 	console.log('page_to_display', page_to_display)
 	if (page_to_display !== currPage) {
 		table.page(page_to_display).draw('page');

 	}
	// let table render before finding checkboxes
	setTimeout(()=> {
		const $row = $('tr#' + id).find(':checkbox').prop('checked', true).change();


	}, 500)

}

function doAlert(title, content, color) {
	const opts = {title, content};
	if (color) {
		opts.type = color
	}

	$.alert(opts)
}

function tableInitCallback(){
	// after table plugin renders it's main controls, move action buttons into sme location

	const $tableControls = $('#automation_wrapper .row > div');
	$tableControls.removeClass('col-sm-12 col-md-6').addClass('col-sm-6 col-md-2');

	const $createControl = $('<div class="col-sm-6 col-md-2">').append($('#create-auto-row'));
	$tableControls.first().after($createControl);
	$actionsControls = $('<div class="col-sm-6 col-md-5">').append($('#action-buttons')).css('text-align', 'center');
	$tableControls.first().after($actionsControls);
}

/**
 * Server side  validation callback for forms
 * @param $form
 * @param errors
 */
 function handleServerErrors($form, errors) {
 	errors.forEach(({param, msg})=> {
 		var $input = $form.find(`[name='${param}']`).addClass('is-invalid');
 		$input.next('.invalid-feedback').text(msg)

 	});
 }

/**
 * Add extra rule for IP addresses to form validation plugin
 */
 jQuery.validator.addMethod('ipAddress', function (value, element) {
 	return this.optional(element) || ipMatch(value);
 }, 'Invalid IP Format')

 function ipMatch(value) {
 	const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
 	return value.match(reg)
 }
 function setModalTitle($modal, title) {
 	$modal.find('.modal-title').text(title)
 }
