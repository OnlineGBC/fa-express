const socket = io.connect();

let table;
let timeZones;
const logsTable = $("#status-box").DataTable({
  responsive: true,
  paginate: true,
  rowId: "id",
  order: [[0, "desc"]],
  lengthMenu: [
    [10, 25, 50, -1],
    [10, 25, 50, /* 100, */ "All"]
  ],
  columns: [
    { data: "id" },
    { data: "HostName" },
    { data: "IFN" },
    { data: "CFN" },
    { data: "SID" },
    { data: "CustName" },
    { data: "DateGenerated" },
    { data: "DateScheduled" },
    { data: "SID" }
  ],
  columnDefs: [
    {
      targets: 0,
      visible: false
    },
    {
      targets: 6,
      width: 140,
      render(data, type, row) {
        if (type === "display") {
          data = `${data} ${row.TimeGenerated}`;
        }
        return data;
      }
    },
    {
      targets: 7,
      width: 140,
      render(data, type, row) {
        if (!data) {
          return "-";
        }
        if (type === "display") {
          data = `${data} ${row.TimeScheduled}`;
        }
        return `<span style="font-weight: bold;">${data}</span>`;
      }
    },
    {
      targets: 8,
      width: 100,
      render(data, type, row) {
        if (type === "display") {
          data = `<a href="/logs/${row.id}" class="_show-log" target="_blank">Scheduled</a>`;
        }
        return data;
      }
    }
  ]
});

$("#action-buttons .dropdown-item").click(function () {
  const targetModalId = $(this).data("target");
  console.log(targetmodalId);
  $(targetModalId).modal("show");
});

$(() => {
  $("#time").inputmask("hh:mm", {
    placeholder: "hh:mm",
    clearMaskOnLostFocus: false,
    showMaskOnHover: false,
    hourFormat: 12
  });

  $("#promptEmail").click(e => {
    e.preventDefault();
    $(".main-form").hide();
    $(".email-confirm").show();
    return false;
  });

  let userData = [];
  const $upload_modal = $("#upload-modal");

  // File Upload handler
  $("#file").change(function () {
    const fd = new FormData();

    fd.append("file", this.files[0]);
    console.log(fd);
    $.ajax({
      url: "/api/upload",
      type: "POST",
      data: fd,
      success: res => {
        console.log(res);
        const uColumns = res.columns;
        userData = res.data;
        let $u_options = "";
        uColumns.forEach(value => {
          console.log(value);
          $u_options += `<option value="${value}">${value}</option>`;
        });

        $.each($("#upload-form select"), (i, elem) => {
          console.log(elem);
          $(elem).append($u_options);
          $(elem)
            .find("option")
            .get(i)
            .setAttribute("selected", true);
        });
        $("#num").html(userData.length);
        $("#upload-file-modal").modal("hide");
        $upload_modal.modal("show");
      },
      contentType: false,
      processData: false,
      cache: false
    });
  });

  $("#upload-form").submit(function (e) {
    e.preventDefault();
    const $form = $(this);
    // Create data with new keyMap
    const u_data = [];
    let u_data_obj = {};
    const keyMap = $form.serializeArray();

    userData.forEach(value => {
      keyMap.forEach(key => {
        const old_key = key.value;
        u_data_obj[key.name] = value[old_key];
      });

      u_data.push(u_data_obj);
      u_data_obj = {};
    });

    console.log("u_data", u_data);
    // Check if all records are valid
    validateAndUploadRecords($form, u_data, 0);
  });

  function uploadRecords(u_data, i) {
    if (i >= u_data.length) {
      $upload_modal.modal("hide");
      return;
    }
    data = u_data[i];

    $.ajax({
      url: "/api/automation",
      method: "POST",
      data
    })
      .then(res => {
        table.row.add(res).draw(false);
        selectModifiedRow(res.id);

        index = i + 1;
        uploadRecords(u_data, index);
        // console.log(res)
      })
      .fail(err => {
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
      url: "/api/automation/validate",
      method: "POST",
      data,
      success: res => {
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
        alert("Problem submitting form, please try again");
        return false;
      }
    });
  }

  /**
   * Server side  validation callback for forms
   * @param $form
   * @param errors
   */
  function handleImportErrors($form, errors) {
    errors.forEach(({ param, msg }) => {
      const $input = $form.find(`[name='${param}']`).addClass("is-invalid");
      $input.next(".invalid-feedback").text("Malformed records in column");
    });
  }

  // Populate timezones
  $.ajax({
    url: "/api/timezones",
    method: "GET"
  }).then(zones => {
    timeZones = zones;
    for (const item of zones) {
      $("#zone").append(
        $(`<option value="${item.hours}">${item.text}</option>`)
      );
    }
  });

  // Datepicker to scheduler modal
  $("#date").datepicker();

  // Populate LoginIds in modal
  $.ajax({
    url: "/api/automation/ids",
    method: "GET"
  }).then(res => {
    res.data.forEach(item => {
      let str = item.Type;
      str = str.replace("enum(", "");
      str = str.replace(")", "");
      str = str.replace(/'/g, "");
      const loginIds = str.split(",");
      loginIds.forEach(id => {
        const output = `<option value="${id}">${id}</option>`;
        if (item.Field === "LoginID") {
          $("#LoginID").append(output);
        } else if (item.Field === "OSType") {
          $("#OSType").append(output);
        } else if (item.Field === "DBTYPE") {
          $("#DBTYPE").append(output);
        } else if (item.Field === "AppType") {
          $("#AppType").append(output);
        } else if (item.Field === "HOST_TYPE") {
          $("#TYPE").append(output);
        }
      });
    });
  });

  const $autoModal = $("#automation-crud-modal");
  const $autoForm = $("#automation-form");
  const $table = $("#automation");
  const $schedulerForm = $("#scheduler-form");
  const $schedulerModal = $("#scheduler_modal");

  $schedulerModal.on("shown.bs.modal", () => {
    $("#time,#date").val("");
  });

  $table
    .find("thead th:first")
    .append(
      '<div class="checkbox"><input type="checkbox" id="select-all" class="dt-checkboxes"><label></label></div>'
    );

  table = $table.DataTable({
    responsive: true,
    // "pageLength" : 25,
    paginate: true,
    // 'scrollX': true,
    // 'scrollY': 600,
    initComplete: tableInitCallback,
    dom:
      "<'row'<'col-sm-6 col-md-2'l><'col-sm-6 col-md-1'B><'col-sm-6 col-md-2'<'#upload-container'>><'col-sm-6 col-md-3'<'#actions-container'>><'col-sm-6 col-md-2'<'#add-row-container'>><'col-sm-6 col-md-2'f>><'row'<'col-sm-6 col-md-12't>><'row'<'col-md-5 col-sm-6 col-md-2'i><'col-md-7 col-sm-6 col-md-2'p>>",
    rowId: "id",
    buttons: [
      {
        extend: "csv",
        text: "Download CSV",
        className: "btn btn-primary",
        filename: "Robotics Process Automation Data",
        exportOptions: {
          columns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        }
      }
    ],
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, /* 100, */ "All"]
    ],
    ajax: "/api/automation",
    columns: [
      { data: "id" },
      { data: "HostName" },
      { data: "LoginID" },
      { data: "CMD_PREFIX" },
      { data: "IFN" },
      { data: "CFN" },
      { data: "OSType" },
      { data: "SID" },
      { data: "DBTYPE" },
      { data: "AppType" },
      { data: "CUSTNAME" },
      { data: "LOCATION" },
      { data: "HOST_TYPE" }
    ],
    columnDefs: [
      {
        targets: 0,
        orderable: false,
        render(data, type) {
          // console.log(data, type, row, meta);
          if (type === "display") {
            data =
              '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>';
          }
          return data;
        }
      },
      {
        targets: 13,
        render: () => `<a href="#" class="edit"><i class="fa fa-pencil"></i></a>
<a href="#" class="delete"><i class="fa fa-trash"></i></a>`
      }
    ],
    select: "multi",
    order: [[1, "asc"]]
  });

  $("#automation").on("click", ".delete", function (e) {
    e.preventDefault();

    const $row = $(this).closest("tr");
    const data = table.row($row).data();

    deSelectRows();

    $row
      .find(".dt-checkboxes")
      .prop("checked", true)
      .change();

    $.confirm({
      title: "Delete Row?",
      content: "Action can not be undone!",
      buttons: {
        delete() {
          $.ajax({
            url: `/api/automation/${data.id}`,
            method: "DELETE"
          })
            .then(() =>
              table
                .row($row[0])
                .remove()
                .draw()
            )
            .fail(() => {
              $.alert({
                type: "red",
                title: "Ooops",
                content: "Delete row failed at server. Please try again"
              });
            });
        },
        cancel() { }
      }
    });
  });

  $("#select-all").change(function () {
    $table
      .find(".dt-checkboxes")
      .not(this)
      .prop("checked", this.checked)
      .prop("indeterminate", false)
      .closest("tr")
      .toggleClass("selected", this.checked);
    $("#action-buttons").trigger("checkbox-change");
    table.rows({ page: "current" }).select(this.checked);
  });

  $("#action-buttons").on("checkbox-change", function () {
    isChecked = $(".dt-checkboxes:checked").length > 0;
    if (isChecked) {
      $(this).css('visibility', 'visible');
    }
    else {
      //$(this).css('visibility', 'hidden');
    }
  });

  $table.on("change", "tbody .dt-checkboxes", function (e) {
    const $row = $(this).closest("tr");
    if (!this.checked) {
      // $('#select-all').prop('indeterminate', true);
    } else if (
      $row
        .siblings()
        .get()
        .every(el => $(el).find(":checked").length)
    ) {
      $("#select-all")
        .prop("indeterminate", false)
        .prop("checked", true);
    }
    $row.toggleClass("selected", this.checked);
    $("#action-buttons").trigger("checkbox-change");
  });

  $table.on("click", "tbody tr", function (e) {
    const $tgt = $(e.target);
    if (!$tgt.closest(".dt-checkboxes").length && !$tgt.closest("a").length) {
      const $checkBox = $(this).find(".dt-checkboxes");
      $checkBox.prop("checked", !$checkBox.prop("checked")).change();
    }
  });

  $("#automation").on("click", ".edit", function (e) {
    e.preventDefault();

    deSelectRows();

    $autoForm.data("mode", "edit");
    const $row = $(this).closest("tr");
    const $modal = $("#automation-crud-modal");
    const $form = $("#automation-form");
    const data = table.row($row).data();

    $row
      .find(".dt-checkboxes")
      .prop("checked", true)
      .change();

    $form.validate({
      errorClass: "is-invalid",
      errorPlacement(error, element) {
        error.appendTo(element.next());
      },
      rules: {
        IFN: {
          required: true,
          ipAddress: true
        },
        CFN: {
          required: true,
          ipAddress: true
        }
      }
    });

    setModalTitle($modal, "Edit Item");
    $("#id").val(data.id);
    $("#HostName").val(data.HostName);
    $("#LoginID").val(data.LoginID);
    $("#CMD_PREFIX").val(data.CMD_PREFIX);
    $("#IFN").val(data.IFN);
    $("#CFN").val(data.CFN);
    $("#OSType").val(data.OSType);
    $("#SID").val(data.SID);
    $("#DBTYPE").val(data.DBTYPE);
    $("#AppType").val(data.AppType);
    $("#CDIR").val(data.CDIR);
    $("#Order").val(data.Order_Exec);
    $("#CUSTNAME").val(data.CUSTNAME);
    $("#LOCATION").val(data.LOCATION);
    $("#TYPE").val(data.HOST_TYPE);
    $modal.data("selected", $row).modal("show");
    // $modal.modal('show');
  });

  /**
   * Reset form whenever form modal is closed
   */
  $autoModal.on("hidden.bs.modal", e => {
    const $form = $autoForm;
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".invalid-feedback").empty();

    if ($form.data("validator")) {
      $form.data("validator").destroy();
    }
    $form[0].reset();
  });

  $("#create-auto-row").click(() => {
    $autoForm.data("mode", "create");
    setModalTitle($autoModal, "Create Item");
    $autoModal.modal("show");
  });

  /* Scheduler handles */

  $schedulerForm.submit(e => {
    e.preventDefault();
    const isImmediate = $("#schedule").val() === "immediate";

    const dateValue = $("#date").val();

    const isValidDate = !!Date.parse(dateValue);
    const isValidTime = $("#time")[0].inputmask.isValid();

    const isValid = isImmediate || (isValidDate && isValidTime);

    const machineIds = $("#automation tbody .selected")
      .toArray()
      .map(element => table.row(element).data().id);

    const timezoneHours = $("#zone").val() || "";
    const selectedTimezoneText = $("#zone option:selected").text();
    const timezone = timezoneHours
      ? timeZones.find(({ text }) => text === selectedTimezoneText).timezone
      : "";

    let scheduleAt;
    if (!isImmediate) {
      scheduleAt = new Date(
        `${dateValue} ${$("#time").val()} ${$(
          "#format"
        ).val()} GMT${timezoneHours}`
      ).getTime();
    }

    if (!isValid || scheduleAt < Date.now()) {
      $schedulerForm
        .find(".error-message")
        .text("Please select a valid date, time and time zone in the future");
      return;
    }

    const scriptName = $schedulerModal.data("scriptName");
    const folderKey = $schedulerModal.data("folderKey") || "";
    const emailAddress = $("#email")
      .val()
      .trim();

    const sendMail = !!+$schedulerForm
      .find('[name="send-email"]:checked')
      .val();

    if (sendMail && !emailAddress) {
      $schedulerForm
        .find(".error-message")
        .text("Please enter the email address");
      return;
    }

    $schedulerModal.modal("hide");
    $.alert({
      type: "info",
      title: "Please wait",
      content: "Please, wait while the job is processing!"
    });

    if ($("#seq-state").val() == '1') {
      //Submit form for sequential processing
      $("#seq-state").val("0");
      // Include scriptName and folderKey in each row
      var theData = [];
      selected.forEach(function (row, i) {
        var scriptName = row.scriptName;
        var folderKey = row.folderKey;
        row.forEach(function (item) {
          // Creating copy of object to prevent overriding
          var tempObj = Object.assign({}, item);
          tempObj.scriptName = scriptName;
          tempObj.folderKey = folderKey;
          tempObj.Order_Exec = i + 1;
          theData.push(tempObj);
        })
      });
      continueOnErrors = ($("#ignoreError").val() == '1') ? true : false;

      return $.ajax({
        url: "/api/automation/seqActions",
        method: "POST",
        data: JSON.stringify({
          rows: theData,
          emailAddress: sendMail ? emailAddress : "",
          isImmediate,
          scheduleAt,
          timezone,
          continueOnErrors
        }),
        dataType: "json",
        contentType: "application/json"
      }).then(res => {
        if (res.status == 'success') {
          showReturnCodeModal(true);
        }
        else {
          showReturnCodeModal(false);
        }
      })
        .fail(err => {
          console.log('Failed miserably');
          showReturnCodeModal(false);
        });;
    }
    else {
      return $.ajax({
        url: "/api/automation/actions",
        method: "POST",
        data: JSON.stringify({
          emailAddress: sendMail ? emailAddress : "",
          scriptName,
          machineIds,
          isImmediate,
          scheduleAt,
          timezone,
          folder: folderKey
        }),
        dataType: "json",
        contentType: "application/json"
      });
    }

  });

  /**
   * Form submit event handler
   */
  $autoForm.submit(function (e) {
    e.preventDefault();

    const mode = $autoForm.data("mode");
    const $form = $(this);

    if (!$form.valid()) {
      return;
    }

    $.ajax({
      url: "/api/automation",
      method: mode === "edit" ? "PUT" : "POST",
      data: $(this).serialize()
    })
      .then(res => {
        if (mode === "edit") {
          const $row = $autoModal.data("selected");

          table
            .row($row)
            .data(res)
            .draw();
        } else {
          table.row.add(res).draw(false);
        }
        $autoModal.modal("hide");
        selectModifiedRow(res.id);
        // console.log(res)
      })
      .fail(err => {
        // console.error('Err::', err);
        if (err.status === 422 && err.responseJSON.errors) {
          handleServerErrors($form, err.responseJSON.errors);
        } else {
          alert("Problem submitting form, please try again");
        }
      });
  });

  socket.on("log", log => {
    updateLog = false;
    var indexes = logsTable
      .rows()
      .indexes()
      .filter(function (value, index) {
        return log.id === logsTable.row(value).data().id;
      });
    if (indexes.length > 0) {
      console.log(log);
      var rowIndex = indexes[0];
      if (log.status == "processing") {
        updatedText = `<a href="/logs/${log.id}" class="_show-log text-primary" target="_blank">Processing</a>`;
      }
      else if (log.status == "fileError") {
        updatedText = `<a href="/logs/${log.id}" class="_show-log text-danger" target="_blank">${log.errorMsg}</a>`;
      }
      else if (log.status == "completed") {
        updatedText = `<a href="/logs/${log.id}" class="_show-log text-success" target="_blank">Completed</a>`;
      }
      else if (log.status == 'error') {
        updatedText = `<span style="color:red">Not Executed</span>`;
      }
      else {
        updatedText = `<a href="/logs/${log.id}" class="_show-log text-danger" target="_blank">[View Log Warning/Error]</a>`;
      }
      logsTable.cell({ row: rowIndex, column: 8 }).node().innerHTML = updatedText;
    }
    else {
      logsTable.row.add(log).draw(false);
    }
  });
});

/**
 * Uncheck checked rows in table
 */
function deSelectRows() {
  $("#automation tbody tr.selected .dt-checkboxes")
    .prop("checked", false)
    .change();
}

function selectModifiedRow(id) {
  const rIdx = table
    .column(0)
    .data()
    .indexOf(id);

  const currPage = table.page();
  const page_to_display = Math.floor(rIdx / table.page.len());
  console.log("page_to_display", page_to_display);
  if (page_to_display !== currPage) {
    table.page(page_to_display).draw("page");
  }
  // let table render before finding checkboxes
  setTimeout(() => {
    const $row = $(`tr#${id}`)
      .find(":checkbox")
      .prop("checked", true)
      .change();
  }, 500);
}

function tableInitCallback() {
  // after table plugin renders it's main controls, move action buttons into sme location

  /* const $tableControls = $('#automation_wrapper .row > div');
	$tableControls.removeClass('col-sm-12 col-md-6').addClass('col-sm-6 col-md-2'); */

  $("#add-row-container").append($("#create-auto-row"));
  $("#actions-container")
    .append($("#action-buttons"));
  $("#actions-container").append($("#advanced-btn"));
  $("#advanced-btn").show();
  $("#action-buttons").show();
  $("#upload-container").css("display", "flex");
  $("#actions-container").css("display", "flex");
  $("#upload-container").append($("#upload-btn"));
  $("#upload-btn").show();
  $("#upload-container").append($("#logs-btn"));
  $("#logs-btn").show();
}

/**
 * Server side  validation callback for forms
 * @param $form
 * @param errors
 */
function handleServerErrors($form, errors) {
  errors.forEach(({ param, msg }) => {
    const $input = $form.find(`[name='${param}']`).addClass("is-invalid");
    $input.next(".invalid-feedback").text(msg);
  });
}

/**
 * Add extra rule for IP addresses to form validation plugin
 */
jQuery.validator.addMethod(
  "ipAddress",
  function (value, element) {
    return this.optional(element) || ipMatch(value);
  },
  "Invalid IP Format"
);

function ipMatch(value) {
  const reg = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
  return value.match(reg);
}

function setModalTitle($modal, title) {
  $modal.find(".modal-title").text(title);
}

$(document).ready(() => {

  $('[data-toggle="tooltip"]').tooltip();

  // $("#DateGenerated").val(moment.utc($("#DateGenerated").val()).local().format("YYYY-MM-DD HH:mm"));
  if ($("#schedule").length && $("#schedule").val() != "immediate") {
    $(".hidden_fields").show();
  }

  $("#log-table").css("width", "100%");
  $("#log-table").DataTable({
    responsive: true,
    paginate: true,
    rowId: "id",
    order: [[0, "desc"]],

    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, /* 100, */ "All"]
    ],
    ajax: "/api/logs/",
    columns: [
      { data: "id" },
      { data: "HostName" },
      { data: "IFN" },
      { data: "CFN" },
      { data: "SID" },
      { data: "CustName" },
      { data: "content" },
      { data: "DateGenerated" },
      { data: "DateScheduled" },
      { data: "SID" }
    ],
    columnDefs: [
      {
        targets: 6,
        //width: 400,
        render(data) {
          if (data === null) {
            return "";
          }
          const bytesView = new Uint8Array(data.data);
          return '<div class="cell-scroll">' + unescape(new TextDecoder().decode(bytesView)) + '</div>';
        }
      },
      {
        targets: 7,
        width: 140,
        render(data, type, row) {
          if (type === "display") {
            data = `${data} ${row.TimeGenerated}`;
          }
          return data;
        }
      },
      {
        targets: 8,
        width: 140,
        render(data, type, row) {
          if (!data) {
            return "-";
          }
          if (type === "display") {
            data = `${data} ${row.TimeScheduled}`;
          }
          return `<span style="font-weight: bold;">${data}</span>`;
        }
      },
      {
        targets: 9,
        orderable: false,
        width: 120,
        render(data, type, row) {
          if (type === "display") {
            data = `<a href="/logs/${row.id}" class="_show-log" target="_blank">[Detailed Log]</a>`;
          }
          return data;
        }
      }
    ]
  });
});

$(".log-container").on("click", ".show-log", function (e) {
  e.preventDefault();

  const $row = $(this).closest("tr");
  const $modal = $("#log-form-modal");
  const $form = $("#log-form");
  const data = logsTable.row($row).data();
  console.log(data, "---");
  $form.validate({
    errorClass: "is-invalid",
    errorPlacement(error, element) {
      error.appendTo(element.next());
    },
    rules: {
      IFN: {
        required: true,
        ipAddress: true
      },
      CFN: {
        required: true,
        ipAddress: true
      }
    }
  });

  setModalTitle($modal, "Log Item");
  $("#log-form [name=id]").val(data.id);
  $("#log-form [name=HostName]").val(data.HostName);
  $("#log-form [name=IFN]").val(data.IFN);
  $("#log-form [name=CFN]").val(data.CFN);
  $("#log-form [name=SID]").val(data.SID);
  $("#log-form [name=CustName]").val(data.CustName);
  $("#log-form [name=DateGenerated]").val(
    `${data.DateGenerated} ${data.TimeGenerated}`
  );
  $("#log-form [name=DateScheduled]").val(
    `${data.DateScheduled} ${data.TimeScheduled}`
  );
  if (!data.DateScheduled) {
    $("#log-form [name=DateScheduled]")
      .closest(".form-group")
      .addClass("d-none");
  } else {
    $("#log-form [name=DateScheduled]")
      .closest(".form-group")
      .removeClass("d-none");
  }

  const bytesView = new Uint8Array(data.content.data);
  const str = new TextDecoder().decode(bytesView);
  $("#log-form [name=Content]").val(unescape(str));

  $modal.data("selected", $row).modal("show");
  // $modal.modal('show');
});

// Confirm Modal for sequential processing
const seqModal = $.confirm({
  alignMiddle: true,
  lazyOpen: true,
  columnClass: 'col-md-6',
  theme: 'my-theme',
  title: "Begin HA/Sequential Processing",
  content: "<p style='line-height:20px'>Please select all servers that should be processed next and choose the Action;  press Completed when done or Cancel to Exit</p>",
  buttons: {
    cancel: {
      text: 'Cancel',
      action: function () {
        $("#seq-state").val("0");
      }
    },
    proceed: {
      text: 'Proceed',
      btnClass: 'btn-green',
      action: function () {
        $("#seq-state").val("1");
        handleErrorModal.open();
      }
    }
  }
});


// Sequential processing steps after advanced has been clicked
$('#advanced-btn').on('click', function () {

  const seqState = $("#seq-state").val();
  saveFileOpen = false;
  if (seqState == 0) {
    $.confirm({
      backgroundDismiss: true,
      alignMiddle: true,
      columnClass: 'col-md-6',
      theme: 'my-theme',
      title: "Begin HA/Sequential Processing",
      content: "<div style='line-height:20px'><p>1. Please ensure that required rows have been set up in the main list of servers</p><p>2. Please select all servers that should be processed next and choose the Action</p></div>",
      buttons: {
        cancel: {
          text: 'Cancel',
          btnClass: 'btn-danger btn-custom',
          action: function () {
            // Clear the selected rows
            selected = [];
            $("#seq-state").val('0');
          }
        },
        proceedWithCancel: {
          text: 'Proceed but Cancel on Warning/Errors',
          btnClass: 'btn-warning btn-custom',
          action: function () {
            $("#seq-state").val("1");
            $("#ignoreError").val('0');
            // Clear the selected rows
            selected = [];
            seqModalShow();

          }
        },
        proceedWithIgnore: {
          text: 'Proceed and Ignore Warnings/Errors',
          btnClass: 'btn-green btn-custom',
          action: function () {
            $("#seq-state").val("1");
            $("#ignoreError").val('1');
            // Clear the selected rows
            selected = [];
            seqModalShow();
          }
        }
      }
    });
  }
  else {
    //$("#seq-state").val("0");
  }
});


// Confirmation modal 2 for sequential processing
const seqModal2 = $.confirm({
  alignMiddle: true,
  lazyOpen: true,
  columnClass: 'col-md-6',
  theme: 'my-theme',
  title: "Begin HA/Sequential Processing",
  content: "<p style='line-height:20px'>Please select all servers that should be processed next and choose the Action;  press Completed when done or Cancel to Exit</p>",
  buttons: {
    complete: {
      text: 'Completed',
      btnclass: 'btn-yellow',
      action: function () {
        // Remove selected rows from table
        updateTable();
        selRowsModal.open();
      }
    },
    proceed: {
      text: 'Proceed',
      btnClass: 'btn-green',
      action: function () {
        $("#seq-state").val("1");
        // Remove selected rows from table
        updateTable();
      }
    }
  }
});

function showReturnCodeModal(status) {

  $.alert({
    backgroundDismiss: true,
    alignMiddle: true,
    columnClass: 'col-md-6',
    theme: 'my-theme',
    title: "Sequential Processing Completed",
    content: function () {
      if (status) {
        return "Tasks completed. Please check the Job logs.";
      }
      else {
        return "Errors found. Please check the Job logs.";
      }
    }
  });
}


// Error handling modal
const handleErrorModal = $.confirm({
  backgroundDismiss: true,
  alignMiddle: true,
  lazyOpen: true,
  columnClass: 'col-md-6',
  theme: 'my-theme',
  title: "Begin HA/Sequential Processing",
  content: "<p style='line-height:20px'>Should we Cancel on Warning/Error or Ignore Warnings/Errors and Proceed?</p>",
  buttons: {
    cancel: {
      text: 'Cancel on Warning/Error',
      action: function () {
        $("#ignoreError").val('0');
      }
    },
    proceed: {
      text: 'Ignore Warnings/Errors and Proceed',
      action: function () {
        $("#ignoreError").val('1');
      }
    }
  }
});

// Selected Rows Modal
const selRowsModal = $.confirm({
  alignMiddle: true,
  lazyOpen: true,
  columnClass: 'col-md-12',
  theme: 'my-theme',
  title: "Confirm your selection",
  buttons: {
    proceed: {
      text: 'Proceed',
      btnClass: 'btn-green',
      action: function () {
        $("#scheduler_modal").modal('show');
        //refreshTable();
      }
    },
    cancel: {
      text: 'Cancel',
      btnClass: 'btn-warning',
      action: function () {
        $("#seq-state").val("0");
        selected[0].forEach(function (row) {
          console.log(row)
        })
        //refreshTable();
      }
    },
    edit: {
      text: 'Edit',
      btnClass: 'btn-primary seqButton',
      action: function () {
        return false;
        // Add code for edit
      }
    },
    save: {
      text: 'Save',
      btnClass: 'btn-primary seqButton',
      action: async function () {
        if (saveFileOpen) {
          fileName = globalSaveFileName;
          menuTitle = globalSaveFileMenu;
          const data = {};
          var rowData = [];
          selected.forEach(function (row, i) {
            var scriptName = row.scriptName;
            var folderKey = row.folderKey;
            row.forEach(function (item) {
              // Creating copy of object to prevent overriding
              var tempObj = Object.assign({}, item);
              tempObj.scriptName = scriptName;
              tempObj.folderKey = folderKey;
              tempObj.Order_Exec = i;
              rowData.push(tempObj);
            })
          });

          data.contents = JSON.stringify(rowData);
          //$customActionModal.modal("hide");
          await saveNewSequence(fileName, menuTitle, data);
          updateActions();
          $("#seq-state").val("0");
        }
        else {
          saveDialog();
        }
      }
    },
    saveas: {
      text: 'SaveAs',
      btnClass: 'btn-primary seqButton',
      action: function () {
        saveDialog();
        // Add code for edit
      }
    }
  }
});

function updateTable() {
  var selects = table.rows({ selected: true }).nodes();
  $(selects).find("input[type=checkbox]").prop('checked', false);
  table
    .rows('.selected').deselect();
}

function refreshTable() {
  selected.forEach(function (rowGroup) {
    rowGroup.forEach(function (row) {
      table.row.add(row);
    });
  })
  table.draw();
}
let selected = [];
let globalSaveFileMenu = '';
let globalSaveFileName = '';
let saveFileOpen = false;

// Sequential processing steps after action has been clicked
$('#appActionsDropdown').on('click', '.sub-actions', function (e) {

  // Check for sequential saved step selection
  filePath = e.target.title
  if (filePath.indexOf('.json') > 0) {
    $.ajax({
      url: "/api/action/getfilecontent",
      type: "POST",
      data: {
        filePath
      },
      success: function (data) {
        sortedRows = JSON.parse(data);
        let orderArray = Array();
        let orderSet = Array();
        let start = 0;
        let scriptName = "";
        let folderKey = "";
        for (let i = 0; i < sortedRows.length; i++) {
          if (sortedRows[i].Order_Exec > start) {
            if (start > 0) {
              Object.assign(orderSet, { scriptName, folderKey });
              orderArray.push(orderSet);
            }
            // Reset the array when order number changes
            orderSet = Array();
            start = sortedRows[i].Order_Exec;
          }
          orderSet.push(sortedRows[i]);
          scriptName = sortedRows[i].scriptName;
          folderKey = sortedRows[i].folderKey;
          if (i == sortedRows.length - 1) {
            Object.assign(orderSet, { scriptName, folderKey });
            orderArray.push(orderSet);
          }
        }

        selected = orderArray;
        saveFileOpen = true;
        seqModalComplete();
        $(".seqButton").hide();
      }
    })
    $("#seq-state").val(1);
    return;
  }
  if ($("#seq-state").val() == 0) {
    return;
  }


  // Add selected rows to an object
  var selected_rows = table.rows({ selected: true }).data().toArray();
  var selected_actions = $("#scheduler_modal").data();
  Object.assign(selected_rows, selected_actions);
  selected.push(selected_rows);
  updateTable();

  console.log(selected);

  //seqModal2.open();
});

function seqModalCancel() {
  $("#seqModal").hide();
}
function seqModalComplete() {
  updateTable();
  tableContent = '<hr>';
  tableContent += "<div class='padded-content'>";
  selected.forEach(function (row) {
    var scriptName = row.scriptName;
    var folderKey = row.folderKey;
    tableContent += '<p class="action_title">Associated action: ' + scriptName + '</p>';
    tableContent += '<table class="table-custom"><thead>';
    tableContent += '<th>HostName</th>';
    tableContent += '<th>LoginID</th>';
    tableContent += '<th>IFN</th>';
    tableContent += '<th>CFN</th>';
    tableContent += '<th>OSType</th>';
    tableContent += '<th>SID</th>';
    tableContent += '<th>DBTYPE</th>';
    tableContent += '<th>AppType</th>';
    tableContent += '<th>HOST_TYPE</th>';
    tableContent += '</thead>';
    tableContent += '<tbody>';
    row.forEach(function (item) {
      tableContent += '<tr>';
      tableContent += '<td>' + item['HostName'] + '</td>';
      tableContent += '<td>' + item['LoginID'] + '</td>';
      tableContent += '<td>' + item['IFN'] + '</td>';
      tableContent += '<td>' + item['CFN'] + '</td>';
      tableContent += '<td>' + item['OSType'] + '</td>';
      tableContent += '<td>' + item['SID'] + '</td>';
      tableContent += '<td>' + item['DBTYPE'] + '</td>';
      tableContent += '<td>' + item['AppType'] + '</td>';
      tableContent += '<td>' + item['HOST_TYPE'] + '</td>';
      tableContent += '</tr>';
    })
    tableContent += '</tbody></table>';
    tableContent += '<hr>';
  })
  tableContent += '</div>';
  selRowsModal.content = tableContent;
  selRowsModal.open();
  $("#seqModal").hide();
}

function saveDialog() {
  $.confirm({
    alignMiddle: true,
    backgroundDismiss: true,
    columnClass: 'col-md-6',
    theme: 'my-theme',
    title: "",
    content: "<div class='form-group'><label for='seqFilename'>File Name</label><input id='seqFilename' class='form-control' value='' placeholder='Enter File Name'/></div><div class='form-group'><label for='seqMenuname'>Menu Title</label><input id='seqMenuname' class='form-control' value='' placeholder='Enter Menu Name'/></div>",
    buttons: {
      save: {
        text: 'Save',
        btnClass: 'btn-green',
        action: async function () {
          const fileName = $("#seqFilename").val();
          const menuTitle = $("#seqMenuname").val();
          if (!fileName) {
            return false;
          }
          const data = {};
          var rowData = [];
          selected.forEach(function (row, i) {
            var scriptName = row.scriptName;
            var folderKey = row.folderKey;
            row.forEach(function (item) {
              // Creating copy of object to prevent overriding
              var tempObj = Object.assign({}, item);
              tempObj.scriptName = scriptName;
              tempObj.folderKey = folderKey;
              tempObj.Order_Exec = i;
              rowData.push(tempObj);
            })
          });

          data.contents = JSON.stringify(rowData);
          //$customActionModal.modal("hide");
          await saveNewSequence(fileName, menuTitle, data);
          updateActions();
          $("#seq-state").val("0");

        }
      }
    }
  });
}

function seqModalProceed() {
  $("#seq-state").val("1");
  // Remove selected rows from table
  updateTable();
}
function seqModalShow() {
  $("#seqModal").show();
}


function saveNewSequence(
  fileName,
  menuTitle,
  { contents }
) {
  const formData = new FormData();
  formData.append("fileName", fileName);
  formData.append("extension", "json");
  formData.append("folder", "Saved-Sequence");
  formData.append("menuTitle", menuTitle);
  formData.append("fileContents", contents);


  return new Promise((resolve, reject) => {
    $.ajax({
      url: "/api/action/sequence",
      type: "POST",
      data: formData,
      success: res => {
        alert("File saved successfully.");
        resolve(res);
      },
      error: (xhr, ajaxOptions, thrownError) => {
        alert("Error occured while saving file.");
        reject(thrownError);
      },
      contentType: false,
      processData: false,
      cache: false
    });
  });
}