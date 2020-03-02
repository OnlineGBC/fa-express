function showScene(customActionModal, scene) {
  const scenes = customActionModal.find('.custom-action-scene');
  scenes.addClass('hidden');
  scenes.filter(`.${scene}`)
    .removeClass('hidden');
}

function getActions() {
  return $.ajax({
    url: '/api/action',
    type: 'GET',
  });
}

function submitNewAction(fileName, extension, menuTitle, { file, contents }) {
  const formData = new FormData();
  formData.append('fileName', fileName);
  formData.append('extension', extension);
  formData.append('menuTitle', menuTitle);
  if (file) {
    formData.append('file', file);
  } else {
    formData.append('fileContents', contents);
  }

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/api/action',
      type: 'POST',
      data: formData,
      success: (res) => {
        resolve(res);
      },
      error: (xhr, ajaxOptions, thrownError) => {
        reject(thrownError);
      },
      contentType: false,
      processData: false,
      cache: false,
    });
  });
}

async function updateActions() {
  const actions = await getActions();
  $('#appActionsDropdown .dropdown-item.custom-action')
    .remove();
  actions.forEach((item) => {
    const newAction = $('<a></a>');
    newAction.attr('href', '#');
    newAction.click(() => {
      const $schedulerModal = $('#scheduler_modal');
      $schedulerModal.data({
        scriptName: item.scriptName,
      });
      $schedulerModal
        .modal('show');
    });
    newAction.addClass('dropdown-item custom-action')
      .text(item.menuTitle);
    $('#appActionsDropdown .dropdown-menu a:last')
      .before(newAction);
  });
}

$(document)
  .ready(() => {
    const $customActionModal = $('#customActionModal');
    $customActionModal.on('shown.bs.modal', () => {
      showScene($customActionModal, 'default');
      $customActionModal.find('input[type="text"],textarea')
        .val('');
    });

    $('.custom-action-scene.default button')
      .click((e) => {
        e.preventDefault();
        const selectedMethod = $customActionModal.find('input[name="custom-action-method"]:checked')
          .val();
        showScene($customActionModal, selectedMethod);
      });

    $('.custom-action-scene.upload.compose button')
      .click((e) => {
        e.preventDefault();
        const selectedMethod = $customActionModal.find('input[name="custom-action-method"]:checked')
          .val();
        if (selectedMethod === 'upload') {
          const file = $customActionModal.find('#script-file')[0].files[0];
          if (!file) {
            return false;
          }
        } else {
          const scriptContents = $customActionModal.find('#script-contents')
            .val();
          if (!scriptContents.trim()) {
            return false;
          }
        }
        showScene($customActionModal, 'prompt');
      });

    $('.custom-action-scene.prompt button')
      .click(async (e) => {
        e.preventDefault();
        const fileName = $customActionModal.find('#fileName')
          .val();
        const extension = $customActionModal.find('#fileExtension')
          .val();
        const menuTitle = $customActionModal.find('#menuTitle')
          .val()
          .trim();
        const selectedMethod = $customActionModal.find('input[name="custom-action-method"]:checked')
          .val();
        if (!fileName || !extension || !menuTitle.trim()) {
          return false;
        }
        const data = {};
        if (selectedMethod === 'upload') {
          data.file = $customActionModal.find('#script-file')[0].files[0];
        } else {
          data.contents = $customActionModal.find('#script-contents')
            .val();
        }
        $customActionModal.modal('hide');
        await submitNewAction(fileName, extension, menuTitle, data);
        updateActions();
      });

    $('#fileName')
      .inputmask({
        mask: '*{1,20}',
        placeholder: '',
      });
    updateActions();
  });
