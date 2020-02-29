const socket = io.connect();

let table;
const stateTable = $('#status-box')
  .DataTable({
    responsive: true,
    paginate: true,
    rowId: 'id',
    order: [[0, 'desc']],
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, /* 100, */ 'All'],
    ],
    ajax: '/api/partial_logs/',
    columns: [
      { data: 'id' },
      { data: 'HostName' },
      { data: 'IFN' },
      { data: 'CFN' },
      { data: 'SID' },
      { data: 'CustName' },
      { data: 'DateGenerated' },
      { data: 'DateScheduled' },
      { data: 'SID' },
    ],
    columnDefs: [
      {
        targets: 0,
        visible: false,
      },
      {
        targets: 6,
        width: 140,
        render(data, type, row) {
          if (type === 'display') {
            data = `${data} ${row.TimeGenerated}`;
          }
          return data;
        },
      },
      {
        targets: 7,
        width: 140,
        render(data, type, row) {
          if (!data) {
            return '-';
          }
          if (type === 'display') {
            data = `${data} ${row.TimeScheduled} ${row.TZ}`;
          }
          return `<span style="font-weight: bold;">${data}</span>`;
        },
      },
      {
        targets: 8,
        width: 100,
        render(data, type, row) {
          if (type === 'display') {
            data = `<a href="/logs/${
              row.id
            }" class="_show-log" target="_blank">[View Log]</a>`;
          }
          return data;
        },
      },
    ],
  });


$(() => {
  setInterval(() => {
    if (stateTable) {
      stateTable.ajax.reload();
    }
  }, 5000);

  $('#time')
    .inputmask('hh:mm', {
      placeholder: 'hh:mm',
      clearMaskOnLostFocus: false,
      showMaskOnHover: false,
      hourFormat: 12,
    });

  $('#promptEmail')
    .click((e) => {
      e.preventDefault();
      $('.main-form')
        .hide();
      $('.email-confirm')
        .show();
      return false;
    });

  // Get Logs from server
  socket.on('log', (data) => {
    // $('.logs').show();
    // $('#logs').show();
    const log = data.stdout;
    const { index } = data;
    const logElement = $(`<pre class="log-data" id="log-${index}"></pre>`);
    logElement.text(log);
    $('.logs')
      .append(logElement);
  });

  const userData = [];
  const $upload_modal = $('#upload-modal');

  // File Upload handler
  $('#file')
    .change(function () {
      const fd = new FormData();

      fd.append('file', this.files[0]);
      console.log(fd);
      $.ajax({
        url: '/api/upload',
        type: 'POST',
        data: fd,
        success: (res) => {
          console.log(res);
          const uColumns = res.columns;
          const userData = res.data;
          let $u_options = '';
          uColumns.forEach((value) => {
            console.log(value);
            $u_options += `<option value="${value}">${value}</option>`;
          });

          $.each($('#upload-form select'), (i, elem) => {
            console.log(elem);
            $(elem)
              .append($u_options);
            $(elem)
              .find('option')
              .get(i)
              .setAttribute('selected', true);
          });
          $('#num')
            .html(userData.length);
          $('#upload-file-modal')
            .modal('hide');
          $upload_modal.modal('show');
        },
        contentType: false,
        processData: false,
        cache: false,
      });
    });

  $('#upload-form')
    .submit(function (e) {
      e.preventDefault();

      $form = $(this);
      // Create data with new keyMap
      const u_data = [];
      let u_data_obj = {};
      keyMap = $form.serializeArray();

      userData.forEach((value) => {
        keyMap.forEach((key) => {
          old_key = key.value;
          u_data_obj[key.name] = value[old_key];
        });

        u_data.push(u_data_obj);
        u_data_obj = {};
        console.log(u_data);
      });

      // Check if all records are valid
      const errors = false;
      validateAndUploadRecords($form, u_data, 0);
    });

  function uploadRecords(u_data, i) {
    if (i >= u_data.length) {
      $upload_modal.modal('hide');
      return;
    }
    data = u_data[i];

    $.ajax({
      url: '/api/automation',
      method: 'POST',
      data,
    })
      .then((res) => {
        table.row.add(res)
          .draw(false);
        selectModifiedRow(res.id);

        index = i + 1;
        uploadRecords(u_data, index);
        // console.log(res)
      })
      .fail((err) => {
        alert(err.responseJSON.err);
      });
  }

  function validateAndUploadRecords($form, u_data, i) {
    if (i >= u_data.length) {
      uploadRecords(u_data, 0);
      return;
    }
    data = u_data[i];
    $.ajax({
      url: '/api/automation/validate',
      method: 'POST',
      data,
      success: (res) => {
        index = i + 1;
        validateAndUploadRecords($form, u_data, index);

        // table.row.add(res).draw(false);

        // $autoModal.modal('hide');
        // selectModifiedRow(res.id);
        // console.log(res)
      },
      error(err) {
        // console.error('Err::', err);
        if (err.status === 422 && err.responseJSON.errors) {
          handleImportErrors($form, err.responseJSON.errors);
          return false;
        }
        alert('Problem submitting form, please try again');
        return false;
      },
    });
  }

  /**
   * Server side  validation callback for forms
   * @param $form
   * @param errors
   */
  function handleImportErrors($form, errors) {
    errors.forEach(({ param, msg }) => {
      const $input = $form.find(`[name='${param}']`)
        .addClass('is-invalid');
      $input.next('.invalid-feedback')
        .text('Malformed records in column');
    });
  }

  // Populate timezones
  $.ajax({
    url: '/api/timezones',
    method: 'GET',
  })
    .then((timezones) => {
      for (const item of timezones) {
        $('#zone')
          .append($(`<option value="${item.hours}">${item.text}</option>`));
      }
    });

  // Datepicker to scheduler modal
  $('#date')
    .datepicker();

  // Populate LoginIds in modal
  $.ajax({
    url: '/api/automation/ids',
    method: 'GET',
  })
    .then((res) => {
      res.data.forEach((item) => {
        let str = item.Type;
        str = str.replace('enum(', '');
        str = str.replace(')', '');
        str = str.replace(/'/g, '');
        const loginIds = str.split(',');
        loginIds.forEach((id) => {
          const output = `<option value="${id}">${id}</option>`;
          if (item.Field === 'LoginID') {
            $('#LoginID')
              .append(output);
          } else if (item.Field === 'OSType') {
            $('#OSType')
              .append(output);
          } else if (item.Field === 'DBTYPE') {
            $('#DBTYPE')
              .append(output);
          } else if (item.Field === 'AppType') {
            $('#AppType')
              .append(output);
          } else if (item.Field === 'HOST_TYPE') {
            $('#TYPE')
              .append(output);
          }
        });
      });
    });

  const $autoModal = $('#automation-crud-modal');
  const $autoForm = $('#automation-form');
  const $table = $('#automation');
  const $schedulerForm = $('#scheduler-form');
  const $schedulerModal = $('#scheduler_modal');

  $table
    .find('thead th:first')
    .append(
      '<div class="checkbox"><input type="checkbox" id="select-all" class="dt-checkboxes"><label></label></div>',
    );

  table = $table.DataTable({
    responsive: true,
    // "pageLength" : 25,
    paginate: true,
    // 'scrollX': true,
    // 'scrollY': 600,
    initComplete: tableInitCallback,
    dom:
      '<\'row\'<\'col-sm-6 col-md-2\'l><\'col-sm-6 col-md-1\'B><\'col-sm-6 col-md-1\'<\'#upload-container\'>><\'col-sm-6 col-md-4\'<\'#actions-container\'>><\'col-sm-6 col-md-2\'<\'#add-row-container\'>><\'col-sm-6 col-md-2\'f>><\'row\'<\'col-sm-6 col-md-12\'t>><\'row\'<\'col-md-5 col-sm-6 col-md-2\'i><\'col-md-7 col-sm-6 col-md-2\'p>>',
    rowId: 'id',
    buttons: [
      {
        extend: 'csv',
        text: 'Download CSV',
        className: 'btn btn-primary',
        filename: 'Robotics Process Automation Data',
        exportOptions: {
          columns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        },
      },
    ],
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, /* 100, */ 'All'],
    ],
    ajax: '/api/automation',
    columns: [
      { data: 'id' },
      { data: 'HostName' },
      { data: 'LoginID' },
      { data: 'CMD_PREFIX' },
      { data: 'IFN' },
      { data: 'CFN' },
      { data: 'OSType' },
      { data: 'SID' },
      { data: 'DBTYPE' },
      { data: 'AppType' },
      { data: 'Order_Exec' },
      { data: 'CUSTNAME' },
      { data: 'LOCATION' },
      { data: 'HOST_TYPE' },
    ],
    columnDefs: [
      {
        targets: 0,
        orderable: false,
        render(data, type) {
          // console.log(data, type, row, meta);
          if (type === 'display') {
            data = '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>';
          }
          return data;
        },
      },

      {
        targets: 10,
        name: 'Order',
      },
      {
        targets: 14,
        render: () => `<a href="#" class="edit"><i class="fa fa-pencil"></i></a>
<a href="#" class="delete"><i class="fa fa-trash"></i></a>`,
      },
    ],
    select: 'multi',
    order: [[1, 'asc']],
  });

  $('#automation')
    .on('click', '.delete', function (e) {
      e.preventDefault();

      const $row = $(this)
        .closest('tr');
      const data = table.row($row)
        .data();

      deSelectRows();

      $row
        .find('.dt-checkboxes')
        .prop('checked', true)
        .change();

      $.confirm({
        title: 'Delete Row?',
        content: 'Action can not be undone!',
        buttons: {
          delete() {
            $.ajax({
              url: `/api/automation/${data.id}`,
              method: 'DELETE',
            })
              .then(() => table
                .row($row[0])
                .remove()
                .draw())
              .fail(() => {
                $.alert({
                  type: 'red',
                  title: 'Ooops',
                  content: 'Delete row failed at server. Please try again',
                });
              });
          },
          cancel() {
          },
        },
      });
    });

  $('#select-all')
    .change(function () {
      $table
        .find('.dt-checkboxes')
        .not(this)
        .prop('checked', this.checked)
        .prop('indeterminate', false)
        .closest('tr')
        .toggleClass('selected', this.checked);
      $('#action-buttons')
        .trigger('checkbox-change');
      table.rows({ page: 'current' })
        .select(this.checked);
    });

  $('#action-buttons')
    .on('checkbox-change', function () {
      $(this)
        .toggle($('.dt-checkboxes:checked').length > 0);
    });

  $table.on('change', 'tbody .dt-checkboxes', function (e) {
    const $row = $(this)
      .closest('tr');
    if (!this.checked) {
      // $('#select-all').prop('indeterminate', true);
    } else if (
      $row
        .siblings()
        .get()
        .every((el) => $(el)
          .find(':checked').length)
    ) {
      $('#select-all')
        .prop('indeterminate', false)
        .prop('checked', true);
    }
    $row.toggleClass('selected', this.checked);
    $('#action-buttons')
      .trigger('checkbox-change');
  });

  $table.on('click', 'tbody tr', function (e) {
    const $tgt = $(e.target);
    if (!$tgt.closest('.dt-checkboxes').length && !$tgt.closest('a').length) {
      const $checkBox = $(this)
        .find('.dt-checkboxes');
      $checkBox.prop('checked', !$checkBox.prop('checked'))
        .change();
    }
  });

  $('#automation')
    .on('click', '.edit', function (e) {
      e.preventDefault();

      deSelectRows();

      $autoForm.data('mode', 'edit');
      const $row = $(this)
        .closest('tr');
      const $modal = $('#automation-crud-modal');
      const $form = $('#automation-form');
      const data = table.row($row)
        .data();

      $row
        .find('.dt-checkboxes')
        .prop('checked', true)
        .change();

      $form.validate({
        errorClass: 'is-invalid',
        errorPlacement(error, element) {
          error.appendTo(element.next());
        },
        rules: {
          IFN: {
            required: true,
            ipAddress: true,
          },
          CFN: {
            required: true,
            ipAddress: true,
          },
        },
      });

      setModalTitle($modal, 'Edit Item');
      $('#id')
        .val(data.id);
      $('#HostName')
        .val(data.HostName);
      $('#LoginID')
        .val(data.LoginID);
      $('#CMD_PREFIX')
        .val(data.CMD_PREFIX);
      $('#IFN')
        .val(data.IFN);
      $('#CFN')
        .val(data.CFN);
      $('#OSType')
        .val(data.OSType);
      $('#SID')
        .val(data.SID);
      $('#DBTYPE')
        .val(data.DBTYPE);
      $('#AppType')
        .val(data.AppType);
      $('#CDIR')
        .val(data.CDIR);
      $('#Order')
        .val(data.Order_Exec);
      $('#CUSTNAME')
        .val(data.CUSTNAME);
      $('#LOCATION')
        .val(data.LOCATION);
      $('#TYPE')
        .val(data.HOST_TYPE);
      $modal.data('selected', $row)
        .modal('show');
      // $modal.modal('show');
    });

  /**
   * Reset form whenever form modal is closed
   */
  $autoModal.on('hidden.bs.modal', (e) => {
    const $form = $autoForm;
    $form.find('.is-invalid')
      .removeClass('is-invalid');
    $form.find('.invalid-feedback')
      .empty();

    if ($form.data('validator')) {
      $form.data('validator')
        .destroy();
    }
    $form[0].reset();
  });

  $('#create-auto-row')
    .click(() => {
      $autoForm.data('mode', 'create');
      setModalTitle($autoModal, 'Create Item');
      $autoModal.modal('show');
    });

  /* Scheduler handles */

  $schedulerForm.submit((e) => {
    e.preventDefault();
    const isImmediate = $('#schedule')
      .val() === 'immediate';

    const dateValue = $('#date')
      .val();

    const isValidDate = !!Date.parse(dateValue);
    const isValidTime = $('#time')[0].inputmask.isValid();

    const isValid = isImmediate || (isValidDate && isValidTime);

    const machineIds = $('#automation tbody .selected')
      .toArray()
      .map((element) => table.row(element)
        .data().id);

    const timezone = $('#zone')
      .val() || '';
    console.log('machineIds', machineIds);

    let scheduleAt;
    if (!isImmediate) {
      scheduleAt = (new Date(`${dateValue} ${$('#time')
        .val()} ${$('#format')
        .val()} ${timezone}`)).getTime();
      console.log('scheduleAt', scheduleAt);
    }

    if (!isValid) {
      return;
    }

    const scriptName = $schedulerModal.data('scriptName');
    const emailAddress = $('#email')
      .val();

    $schedulerModal.modal('hide');

    return $.ajax({
      url: '/api/automation/actions',
      method: 'POST',
      data: JSON.stringify({
        emailAddress,
        scriptName,
        machineIds,
        isImmediate,
        scheduleAt,
      }),
      dataType: 'json',
      contentType: 'application/json',
    })
      .then(() => {
        if (stateTable) {
          stateTable.ajax.reload();
        }
      });
  });

  /**
   * Handle sending all checked items to server
   * when an action button is clicked
   */

  $('#action-buttons .dropdown-item')
    .click(function (e) {
      e.preventDefault();
      const action = $(this)
        .data('action');
      const items = $('#automation tbody .selected')
        .map(function () {
          return table.row(this)
            .data();
          // /return this;
        })
        .get();

      thisModal = $(this)
        .data('target');
      $(thisModal)
        .modal('show');

      $('#task_name')
        .val(action);

      /* 		if (items.length) {
            // array of request promises
            const promises = items.map((item, index) => {
              const filename = Math.random().toString(36).substring(7) + ".txt";
              item.filename = filename;
              item.index = index;
              console.log(filename + '  ' + item.IFN);
              const postData = JSON.stringify({ action, item });
              return $.ajax({
                url: '/api/automation/actions',
                method: 'POST',
                data: postData,
                contentType: 'application/json'

              }).then(res => {
                const itemCopy = Object.assign({}, item);
                itemCopy.status = 'success';
                return itemCopy;
              })
            });

            Promise.all(promises).then(res => {
              // TODO: More robust visual print out of items succeeded/failed
              const total = res.length;
              console.log(res);
              output = '';
              res.forEach(function (value, index) {
                output += '<tr>';
                output += '<td>' + value.SID + '</td>';
                output += '<td>' + value.HostName + '</td>';
                output += '<td>' + value.OSType + '</td>';
                output += '<td>' + value.IFN + '</td>';
                output += '<td><a href="/logs/' + value.filename + '" class="status">' + value.status + '</a></td>';
                output += '<tr>';
              });
              $('.status-box tbody').append(output);
              $('.status').click(function (e) {
                e.preventDefault();
                $('#logs').show();
                $('.log-data').hide();
                index = $('.status').index(this);
                $('#log-' + index).show();
              });
              const counts = res.reduce((a, c) => {
                a[c.status]++;
                return a;
              }, { success: 0, fail: 0 });

            })
          } */
    });

  /**
   * Form submit event handler
   */
  $autoForm.submit(function (e) {
    e.preventDefault();

    const mode = $autoForm.data('mode');
    const $form = $(this);

    if (!$form.valid()) {
      return;
    }

    $.ajax({
      url: '/api/automation',
      method: mode === 'edit' ? 'PUT' : 'POST',
      data: $(this)
        .serialize(),
    })
      .then((res) => {
        if (mode === 'edit') {
          const $row = $autoModal.data('selected');

          table
            .row($row)
            .data(res)
            .draw();
        } else {
          table.row.add(res)
            .draw(false);
        }
        $autoModal.modal('hide');
        selectModifiedRow(res.id);
        // console.log(res)
      })
      .fail((err) => {
        // console.error('Err::', err);
        if (err.status === 422 && err.responseJSON.errors) {
          handleServerErrors($form, err.responseJSON.errors);
        } else {
          alert('Problem submitting form, please try again');
        }
      });
  });
});

/**
 * Uncheck checked rows in table
 */
function deSelectRows() {
  $('#automation tbody tr.selected .dt-checkboxes')
    .prop('checked', false)
    .change();
}

function selectModifiedRow(id) {
  const rIdx = table
    .column(0)
    .data()
    .indexOf(id);

  const currPage = table.page();
  const page_to_display = Math.floor(rIdx / table.page.len());
  console.log('page_to_display', page_to_display);
  if (page_to_display !== currPage) {
    table.page(page_to_display)
      .draw('page');
  }
  // let table render before finding checkboxes
  setTimeout(() => {
    const $row = $(`tr#${id}`)
      .find(':checkbox')
      .prop('checked', true)
      .change();
  }, 500);
}


function tableInitCallback() {
  // after table plugin renders it's main controls, move action buttons into sme location

  /* const $tableControls = $('#automation_wrapper .row > div');
	$tableControls.removeClass('col-sm-12 col-md-6').addClass('col-sm-6 col-md-2'); */

  $('#add-row-container')
    .append($('#create-auto-row'));
  $('#actions-container')
    .append($('#action-buttons'))
    .css('text-align', 'center');
  $('#upload-container')
    .css('display', 'flex');
  $('#upload-container')
    .append($('#upload-btn'));
  $('#upload-btn')
    .show();
  $('#upload-container')
    .append($('#logs-btn'));
  $('#logs-btn')
    .show();
}

/**
 * Server side  validation callback for forms
 * @param $form
 * @param errors
 */
function handleServerErrors($form, errors) {
  errors.forEach(({ param, msg }) => {
    const $input = $form.find(`[name='${param}']`)
      .addClass('is-invalid');
    $input.next('.invalid-feedback')
      .text(msg);
  });
}

/**
 * Add extra rule for IP addresses to form validation plugin
 */
jQuery.validator.addMethod(
  'ipAddress',
  function (value, element) {
    return this.optional(element) || ipMatch(value);
  },
  'Invalid IP Format',
);

function ipMatch(value) {
  const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
  return value.match(reg);
}

function setModalTitle($modal, title) {
  $modal.find('.modal-title')
    .text(title);
}

$(document)
  .ready(() => {
    // $("#DateGenerated").val(moment.utc($("#DateGenerated").val()).local().format("YYYY-MM-DD HH:mm"));
    if ($('#schedule').length && $('#schedule')
      .val() != 'immediate') {
      $('.hidden_fields')
        .show();
    }

    $('#log-table')
      .css('width', '100%');
    $('#log-table')
      .DataTable({
        responsive: true,
        paginate: true,
        rowId: 'id',
        order: [[0, 'desc']],

        lengthMenu: [
          [10, 25, 50, -1],
          [10, 25, 50, /* 100, */ 'All'],
        ],
        ajax: '/api/logs/',
        columns: [
          { data: 'id' },
          { data: 'HostName' },
          { data: 'IFN' },
          { data: 'CFN' },
          { data: 'SID' },
          { data: 'CustName' },
          { data: 'content' },
          { data: 'DateGenerated' },
          { data: 'DateScheduled' },
          { data: 'SID' },
        ],
        columnDefs: [
          {
            targets: 6,
            width: 400,
            render(data) {
              if (data === null) {
                return '';
              }
              const bytesView = new Uint8Array(data.data);
              return unescape(new TextDecoder().decode(bytesView));
            },
          },
          {
            targets: 7,
            width: 140,
            render(data, type, row) {
              if (type === 'display') {
                data = `${data} ${row.TimeGenerated}`;
              }
              return data;
            },
          },
          {
            targets: 8,
            width: 140,
            render(data, type, row) {
              if (!data) {
                return '-';
              }
              if (type === 'display') {
                data = `${data} ${row.TimeScheduled}`;
              }
              return `<span style="font-weight: bold;">${data}</span>`;
            },
          },
          {
            targets: 9,
            orderable: false,
            width: 120,
            render(data, type, row) {
              if (type === 'display') {
                data = `<a href="/logs/${
                  row.id
                }" class="_show-log" target="_blank">[View Log]</a>`;
              }
              return data;
            },
          },
        ],
      });
  });

$('.log-container')
  .on('click', '.show-log', function (e) {
    e.preventDefault();

    const $row = $(this)
      .closest('tr');
    const $modal = $('#log-form-modal');
    const $form = $('#log-form');
    const data = stateTable.row($row)
      .data();
    console.log(data, '---');
    $form.validate({
      errorClass: 'is-invalid',
      errorPlacement(error, element) {
        error.appendTo(element.next());
      },
      rules: {
        IFN: {
          required: true,
          ipAddress: true,
        },
        CFN: {
          required: true,
          ipAddress: true,
        },
      },
    });

    setModalTitle($modal, 'Log Item');
    $('#log-form [name=id]')
      .val(data.id);
    $('#log-form [name=HostName]')
      .val(data.HostName);
    $('#log-form [name=IFN]')
      .val(data.IFN);
    $('#log-form [name=CFN]')
      .val(data.CFN);
    $('#log-form [name=SID]')
      .val(data.SID);
    $('#log-form [name=CustName]')
      .val(data.CustName);
    $('#log-form [name=DateGenerated]')
      .val(
        `${data.DateGenerated} ${data.TimeGenerated}`,
      );
    $('#log-form [name=DateScheduled]')
      .val(
        `${data.DateScheduled} ${data.TimeScheduled}`,
      );
    if (!data.DateScheduled) {
      $('#log-form [name=DateScheduled]')
        .closest('.form-group')
        .addClass('d-none');
    } else {
      $('#log-form [name=DateScheduled]')
        .closest('.form-group')
        .removeClass('d-none');
    }

    const bytesView = new Uint8Array(data.content.data);
    const str = new TextDecoder().decode(bytesView);
    $('#log-form [name=Content]')
      .val(unescape(str));

    $modal.data('selected', $row)
      .modal('show');
    // $modal.modal('show');
  });
