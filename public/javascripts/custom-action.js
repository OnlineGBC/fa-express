function showScene(customActionModal, scene) {
  const scenes = customActionModal.find(".custom-action-scene");
  scenes.addClass("hidden");
  scenes.filter(`.${scene}`).removeClass("hidden");
}

function getActions() {
  return $.ajax({
    url: "/api/action",
    type: "GET"
  });
}

function submitNewAction(
  fileName,
  extension,
  menuTitle,
  { file, contents },
  folder
) {
  const formData = new FormData();
  formData.append("fileName", fileName);
  formData.append("extension", extension);
  formData.append("menuTitle", menuTitle);
  formData.append("folder", folder);
  if (file) {
    formData.append("file", file);
  } else {
    formData.append("fileContents", contents);
  }

  return new Promise((resolve, reject) => {
    $.ajax({
      url: "/api/action",
      type: "POST",
      data: formData,
      success: res => {
        resolve(res);
      },
      error: (xhr, ajaxOptions, thrownError) => {
        reject(thrownError);
      },
      contentType: false,
      processData: false,
      cache: false
    });
  });
}

submitCreateFolder = async (customFolderModal, folderName) => {
  const result = await new Promise((resolve, reject) => {
    $.ajax({
      url: "/api/action/createsubfolder",
      type: "POST",
      data: { name: folderName },
      success: res => {
        resolve(res);
      },
      error: (xhr, ajaxOptions, thrownError) => {
        reject(thrownError);
      }
    });
  });

  if (result.status == 1) {
    // console.log(result)
    // const newAction = $('<a class="test"></a>');
    // newAction.attr("href", "#");
    // newAction.addClass("dropdown-item custom-action").text(folderName);
    await updateActions();
  }
};

const draggable = {
  accept: "li",
  drop: function(event, ui) {
    console.log("first");
    console.log(
      $(this)
        .parent()
        .find("ul")
    );
    $(this)
      .find("li.app-custom-files")
      .before(ui.draggable);
    // updateActions()
  }
};

async function updateActions() {
  const actions = await getActions();
  console.log(actions);
  $("#appActionsDropdown .dropdown-item.custom-action").remove();
  ////////////////////////////
  /// /script folder actions
  actions.files.forEach(item => {
    const newAction = $(
      "<a data-toggle='tooltip' data-placement='right' title='" +
        item.filePath +
        "' class='sub-actions'></a>"
    );
    newAction.attr("href", "#");
    newAction
      .on("click", function() {
        $("#context-menu")
          .removeClass("show")
          .hide();
        if (
          $(this)
            .parent()
            .data("dragging")
        )
          return;
        const $schedulerModal = $("#scheduler_modal");
        $schedulerModal.data({
          scriptName: item.scriptName,
          folderKey: ""
        });
        console.log(item);
        if($("#seq-state").val() == "0" && item.scriptName.indexOf('.json') < 0){
          $schedulerModal.modal("show");
        }
      })
      .on("contextmenu", function(e) {

        if(!($("#automation-main").hasClass('admin'))){
          return;
        }
        $('#context-menu input[name="context-action"]').val(item.filePath);
        $('#context-menu input[name="context-type"]').val("file");
        $('#context-menu input[name="context-name"]').val(item.menuTitle);
        var top = e.pageY - 10;
        var left = e.pageX + 10;
        $("#context-menu")
          .css({
            display: "block",
            top: top,
            left: left
          })
          .addClass("show");
        return false; //blocks default Webbrowser right click menu
      });

    newAction.addClass("dropdown-item custom-action").text(item.menuTitle);
    const newItem = $("<li data-dragging=false></li>").append(newAction);
    // newItem.draggable({
    //   start: function (e, ui) {
    //     $("#context-menu")
    //       .removeClass("show")
    //       .hide();
    //     $(this).data('dragging', "true");
    //     e.dataTransfer = e.originalEvent.dataTransfer;
    //     // e.dataTransfer.setData('application/json', {scriptName: item.scriptName, folderKey: ""})
    //   },
    //   stop: function (event, ui) {
    //     setTimeout(function () {
    //       console.log("hi " + this);
    //       $(event.target).data('dragging', false);
    //     }, 10);

    //     $(this).hide()
    //   },
    //   revert: 'invalid',
    //   helper: 'clone',
    //   // handle: 'a'
    // })
    $("#appActionsDropdown .dropdown-menu li.app-custom-files").before(newItem);
  });
  ///////////////
  ////script/sub-folders actions

  Object.keys(actions.folders).forEach(key => {
    const newAction = $("<a class='test closed'></a>");
    newAction.attr("href", "#");
    newAction
      .on("contextmenu", function(e) {
        if(!($("#automation-main").hasClass('admin'))){
          return;
        }
        $('#context-menu input[name="context-action"]').val(key);
        $('#context-menu input[name="context-type"]').val("folder");
        $('#context-menu input[name="context-name"]').val("");
        var top = e.pageY - 10;
        var left = e.pageX + 10;
        $("#context-menu")
          .css({
            display: "block",
            top: top,
            left: left
          })
          .addClass("show");
        return false; //blocks default Webbrowser right click menu
      })
      .on("click", () => {
        $("#context-menu")
          .removeClass("show")
          .hide();
      });
    newAction.addClass("dropdown-item custom-action").text(key);
    newAction.append("<span class='fa fa-caret-right'></span>");
    const newUItem = $('<ul class="dropdown-menu drag-menu"></ul>');
    newUItem.droppable(draggable);
    actions.folders[key].forEach(item => {
      const newAction1 = $(
        "<a data-toggle='tooltip' data-placement='right' title='" +
          item.filePath +
          "' class='sub-actions'></a>"
      );
      newAction1.attr("href", "#");
      newAction1.click(() => {
        const $schedulerModal = $("#scheduler_modal");
        $schedulerModal.data({
          scriptName: item.scriptName,
          folderKey: key
        });

        if($("#seq-state").val() == 0 && item.scriptName.indexOf('.json') < 0){
          $schedulerModal.modal("show");
        }
        else if(item.scriptName.indexOf('.json') > 0){
          // variable referenced in user.js
          globalSaveFileMenu = item.menuTitle;
          globalSaveFileName = item.scriptName.replace(".json", "");
        }
      });
      newAction1
        .on("contextmenu", function(e) {
          if(!($("#automation-main").hasClass('admin'))){
            return;
          }
          $('#context-menu input[name="context-action"]').val(item.filePath);
          $('#context-menu input[name="context-type"]').val("file");
          $('#context-menu input[name="context-name"]').val(item.menuTitle);
          var top = e.pageY - 10;
          var left = e.pageX + 10;
          $("#context-menu")
            .css({
              display: "block",
              top: top,
              left: left
            })
            .addClass("show");
          return false; //blocks default Webbrowser right click menu
        })
        .on("click", () => {
          $("#context-menu")
            .removeClass("show")
            .hide();
        });
      newAction1.text(item.menuTitle);
      const newItem1 = $("<li></li>").append(newAction1);
      newUItem.append(newItem1);
    });
    const customAction = $("<li class='app-custom-files'></li>");
    const customActionButton = $(
      '<a tabindex="-1" href="#" data-action="app_stop" data-target="#customActionModal" class="dropdown-item">Custom Action</a>'
    );
    customActionButton.click(() => {
      $("#customActionModal input[name='custom-action-kind']").val(key);
      $("#customActionModal").modal("show");
    });
    customAction.append(customActionButton);
    newUItem.append(customAction);
    const newItem = $("<li class='dropdown-submenu'></li>")
      .append(newAction)
      .append(newUItem);

    $("li.app-custom-folders").before(newItem);
  });
}

showContextModal = (modal, scene) => {
  const scenes = modal.find(".custom-context-scene");
  scenes.addClass("hidden");
  scenes.filter(`.${scene}`).removeClass("hidden");
};

$(document).ready(() => {
  const $customActionModal = $("#customActionModal");
  const $customFolderModal = $("#customFolderModal");
  const $scriptFile = $customActionModal.find("#script-file");
  const $contextModal = $("#contextModal");

  $customActionModal.on("shown.bs.modal", () => {
    $customActionModal.find(".selected-file").text("");
    showScene($customActionModal, "default");
    $customActionModal.find('input[type="text"],textarea').val("");
    $scriptFile[0].value = null;
  });

  $(".drag-menu").droppable(draggable);

  $("#action-modal-show").on("click", () => {
    $("#customActionModal input[name='custom-action-kind']").val("");
    $customActionModal.modal("show");
  });

  $customFolderModal.on("shown.bs.modal", () => {
    $customFolderModal.find("#folder-name").val("");
  });

  $("#context-menu a").on("click", function() {
    $(this)
      .parent()
      .removeClass("show")
      .hide();
  });

  $(document).click(function() {
    $("#context-menu")
      .removeClass("show")
      .hide();
  });

  $scriptFile.change(() => {
    $customActionModal
      .find(".selected-file")
      .text("Selected file: " + $scriptFile[0].files[0].name);
  });

  $(".custom-action-scene.default button").click(e => {
    e.preventDefault();
    const selectedMethod = $customActionModal
      .find('input[name="custom-action-method"]:checked')
      .val();
    showScene($customActionModal, selectedMethod);
  });

  $('#file-name').on('change', function(e) {
    var file_name = $('#context-menu input[name="context-action"]').val();
    var menu_name = $contextModal.find('input[name="menu-name"]').val();
    if ($(this).val() != file_name && menuTitle_before != menu_name) {
      e.preventDefault()
      setBtnActive($contextModal, true)
    }else{
      setBtnActive($contextModal, false)
    }
  })

  $('#menu-name').on('change', function() {
    var file_name_before = $('#context-menu input[name="context-action"]').val();
    var file_name = $contextModal.find('input[name="file-name"]').val();
    if (file_name_before != file_name && menuTitle_before != $(this).val()) {
      // $contextModal.find('.default button.saveas').attr('disabled', false);
      setBtnActive($contextModal, true)
    }else{
      // $contextModal.find('.default button.saveas').attr('disabled', true);
      setBtnActive($contextModal, false)
    }
  })

  // $('#file-name').on('keydown', function() {
  //   var file_name = $('#context-menu input[name="context-action"]').val();
  //   var menu_name = $contextModal.find('input[name="menu-name"]').val();
  //   if ($(this).val() != file_name && menuTitle_before != menu_name) {
  //     setBtnActive($contextModal, true)
  //   }else{
  //     setBtnActive($contextModal, false)
  //   }
  // })

  // $('#menu-name').on('keydown', function() {
  //   var file_name_before = $('#context-menu input[name="context-action"]').val();
  //   var file_name = $contextModal.find('input[name="file-name"]').val();
  //   if (file_name_before != file_name && menuTitle_before != $(this).val()) {
  //     // $contextModal.find('.default button.saveas').attr('disabled', false);
  //     setBtnActive($contextModal, true)
  //   }else{
  //     // $contextModal.find('.default button.saveas').attr('disabled', true);
  //     setBtnActive($contextModal, false)
  //   }
  // })

  $(".custom-folder-scene.default button").click(async e => {
    e.preventDefault();
    const selectedMethod = $customFolderModal
      .find('input[name="folder-name"]')
      .val();
    await submitCreateFolder($customFolderModal, selectedMethod);
    $customFolderModal.modal("hide");
  });

  $(".custom-action-scene.upload.compose button").click(e => {
    e.preventDefault();
    const selectedMethod = $customActionModal
      .find('input[name="custom-action-method"]:checked')
      .val();
    if (selectedMethod === "upload") {
      const file = $customActionModal.find("#script-file")[0].files[0];
      if (!file) {
        return false;
      }
    } else {
      const scriptContents = $customActionModal.find("#script-contents").val();
      if (!scriptContents.trim()) {
        return false;
      }
    }
    showScene($customActionModal, "prompt");
  });

  $(".custom-action-scene.prompt button").click(async e => {
    e.preventDefault();
    const fileName = $customActionModal.find("#fileName").val();
    const extension = $customActionModal.find("#fileExtension").val();
    const folder = $customActionModal
      .find('input[name="custom-action-kind"]')
      .val();
    const menuTitle = $customActionModal
      .find("#menuTitle")
      .val()
      .trim();
    const selectedMethod = $customActionModal
      .find('input[name="custom-action-method"]:checked')
      .val();
    if (!fileName || !extension || !menuTitle.trim()) {
      return false;
    }
    const data = {};
    if (selectedMethod === "upload") {
      data.file = $customActionModal.find("#script-file")[0].files[0];
    } else {
      data.contents = $customActionModal.find("#script-contents").val();
    }
    $customActionModal.modal("hide");
    await submitNewAction(fileName, extension, menuTitle, data, folder);
    updateActions();
  });

  $("#fileName").inputmask({
    mask: "*{1,20}",
    placeholder: ""
  });

  $(".dropdown-submenu").on("click", "a.test.closed", function(e) {
    $(this)
      .parent()
      .parent()
      .find("li.dropdown-submenu")
      .each(index => {
        $(this)
          .parent()
          .parent()
          .find("li.dropdown-submenu")
          .eq(index)
          .find("ul")
          .eq(0)
          .hide();
        $("#context-menu")
          .removeClass("show")
          .hide();
        e.stopPropagation();
        e.preventDefault();
      });
  });

  $("#appActionButton").on("click", function() {
    $(this)
      .next("ul")
      .find("ul")
      .eq(0)
      .hide();
  });

  $(".dropdown-submenu").on("click", "a.test", function(e) {
    if ($(this).data("menu") == "sub-menu") {
      console.log("new sub");
      $(this)
        .next("ul")
        .find("ul")
        .hide();
    }
    $(this)
      .next("ul")
      .toggle();
    e.stopPropagation();
    e.preventDefault();
  });
  var menuTitle_before = ""
  $(".context-edit").on("click", e => {
    let filePath = $('#context-menu input[name="context-action"]').val();
    let type = $('#context-menu input[name="context-type"]').val();
    let name = $('#context-menu input[name="context-name"]').val();
    
    if (type == "file") {
      getFileContent(filePath, $contextModal);
      // showContextModal($contextModal, "default");
      menuTitle_before = name;
      $contextModal.find('input[name="file-name"]').val(filePath);
      $contextModal.find('input[name="menu-name"]').val(name);
    } else {
      showContextModal($contextModal, "folder-edit");
      $contextModal.find('input[name="folder-name"]').val(filePath);
    }

    $contextModal.modal("show");
  });

  $(".context-delete").on("click", e => {
    let type = $('#context-menu input[name="context-type"]').val();
    if (type == "file") {
      showContextModal($contextModal, "delete");
      $contextModal.modal("show");
    } else {
      showContextModal($contextModal, "f_delete");
      $contextModal.modal("show");
    }
  });

  $(".custom-context-scene .save").on("click", () => {
    makeUpdateFileName($contextModal, "save");
  });

  $(".custom-context-scene .saveas").on("click", () => {
    makeUpdateFileName($contextModal, "saveas");
  });

  $(".custom-context-scene .folder-save").on("click", () => {
    makeUpdateFolderName($contextModal);
  });

  $(".custom-context-scene.delete button").on("click", () => {
    let filePath = $('#context-menu input[name="context-action"]').val();
    $.ajax({
      url: "/api/action/deletefile",
      type: "DELETE",
      data: {
        filePath: filePath,
        type: "file"
      },
      success: res => {
        updateActions();
        $contextModal.modal("hide");
      }
    });
  });

  $(".custom-context-scene.f_delete button").on("click", () => {
    let filePath = $('#context-menu input[name="context-action"]').val();
    $.ajax({
      url: "/api/action/deletefile",
      type: "DELETE",
      data: {
        filePath: filePath,
        type: "folder"
      },
      success: res => {
        updateActions();
        $contextModal.modal("hide");
      }
    });
  });

  updateActions();
});

getFileContent = (filePath, $modal) => {
  $.ajax({
    url: "/api/action/getfilecontent",
    type:"POST",
    data: {
      filePath
    },
    success: function(data) {
      // console.log(data)
      // $modal.find('.default button.saveas').attr('disabled', true);
      setBtnActive($modal, false)
      $modal.find('#script-edit-contents').val(data);
      showContextModal($modal, "default");
    }
  })
}

makeUpdateFolderName = $modal => {
  let folderName = $('#context-menu input[name="context-action"]').val();
  // let data
  $.ajax({
    url: "/api/action/updatefoldename",
    type: "POST",
    data: {
      folderName,
      folder: $modal.find('input[name="folder-name"]').val()
    },
    success: res => {
      updateActions();
      $modal.modal("hide");
    }
  });
};

setBtnActive = ($contextModal, active) => {
  if(active) {
    $contextModal.find('.default button.saveas').css('background', '');
    $contextModal.find('.default button.saveas').css('opacity', '');
    $contextModal.find('.default button.saveas').addClass('btn-primary');
    $contextModal.find('.default button.saveas').attr('disabled', false);
  }else{
    $contextModal.find('.default button.saveas').css('background', 'rgba(234, 234, 234, 1.0)');
    $contextModal.find('.default button.saveas').css('opacity', '1.0');
    $contextModal.find('.default button.saveas').removeClass('btn-primary');
    $contextModal.find('.default button.saveas').attr('disabled', true);
  }
}

makeUpdateFileName = ($modal, type) => {
  let data = {
    filePath: $('#context-menu input[name="context-action"]').val(),
    fileName: $modal.find('input[name="file-name"]').val(),
    menuName: $modal.find('input[name="menu-name"]').val(),
    type,
    fileContents: $modal.find('#script-edit-contents').val()
  };

  $.ajax({
    url: "/api/action/updatename",
    type: "POST",
    data: data,
    success: res => {
      // console.log(res)
      updateActions();
      $modal.modal("hide");
    }
  });
};
