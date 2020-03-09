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

async function updateActions() {
  const actions = await getActions();
  $("#appActionsDropdown .dropdown-item.custom-action").remove();
  actions.files.forEach(item => {
    const newAction = $("<a></a>");
    newAction.attr("href", "#");
    newAction.click(() => {
      const $schedulerModal = $("#scheduler_modal");
      $schedulerModal.data({
        scriptName: item.scriptName,
        folderKey: ""
      });
      $schedulerModal.modal("show");
    });
    newAction.addClass("dropdown-item custom-action").text(item.menuTitle);
    const newItem = $("<li></li>").append(newAction);
    $("#appActionsDropdown .dropdown-menu li.app-custom-files").before(newItem);
  });

  Object.keys(actions.folders).forEach(key => {
    const newAction = $("<a class='test closed'></a>");
    newAction.attr("href", "#");
    newAction.addClass("dropdown-item custom-action").text(key);
    newAction.append("<span class='fa fa-caret-right'></span>");
    const newUItem = $('<ul class="dropdown-menu"></ul>');
    actions.folders[key].forEach(item => {
      const newAction1 = $(
        "<a data-toggle='tooltip' data-placement='right' title='" +
          item.filePath +
          "'></a>"
      );
      newAction1.attr("href", "#");
      newAction1.click(() => {
        const $schedulerModal = $("#scheduler_modal");
        $schedulerModal.data({
          scriptName: item.scriptName,
          folderKey: key
        });
        $schedulerModal.modal("show");
      });
      newAction1
        .on("contextmenu", function(e) {
          $('#context-menu input[name="context-action"]').val(item.filePath);
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
    const customAction = $("<li></li>");
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
    $(this).next("ul").find("ul").eq(0).hide()
  });

  $(".dropdown-submenu").on("click", "a.test", function(e) {
    if($(this).data("menu") == "sub-menu") {
      console.log("new sub")
      $(this).next("ul").find("ul").hide()
    }
    $(this)
      .next("ul")
      .toggle();
    e.stopPropagation();
    e.preventDefault();
  });

  $(".context-edit").on("click", e => {
    let filePath = $('#context-menu input[name="context-action"]').val();
    showContextModal($contextModal, "default");
    filePath = filePath.split("\\");
    $contextModal
      .find('input[name="file-name"]')
      .val(filePath[filePath.length - 1]);
    $contextModal.modal("show");
  });

  $(".context-delete").on("click", e => {
    showContextModal($contextModal, "delete");
    $contextModal.modal("show");
  });

  $(".custom-context-scene .save").on("click", () => {
    makeUpdateFileName($contextModal, "save");
  });

  $(".custom-context-scene .saveas").on("click", () => {
    makeUpdateFileName($contextModal, "saveas");
  });

  $(".custom-context-scene.delete button").on("click", () => {
    let filePath = $('#context-menu input[name="context-action"]').val();
    $.ajax({
      url: "/api/action/deletefile",
      type: "DELETE",
      data: {
        filePath: filePath
      },
      success: res => {
        updateActions();
        $contextModal.modal("hide");
      }
    });
  });

  updateActions();
});

makeUpdateFileName = ($modal, type) => {
  let filePath = $('#context-menu input[name="context-action"]').val();
  filePath = filePath.split("\\");
  let fileName = $modal.find('input[name="file-name"]').val();
  let menuName = $modal.find('input[name="menu-name"]').val();
  if (filePath[filePath.length - 1] != fileName) {
    // filePath[filePath.length -1] = fileName;
    let data = {
      filePath: filePath.join("\\"),
      fileName,
      menuName,
      type
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
  }
};
