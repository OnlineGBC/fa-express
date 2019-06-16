$(document).ready(function(){
  $('table').dataTable({
    'responsive': true,
    'paginate': true,
    // 'scrollX': true,
    // 'scrollY': 600,
    'columnDefs': [
      {
        'targets': 0,
        'render': function(data, type, row, meta){
          // console.log(data, type, row, meta);
          if(type === 'display'){
            data = '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>';
          }
          return data;
        },
        'checkboxes': {
          'selectRow': true,
          'selectAllRender': '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>'
        }
      },
    ],
    'select': 'multi',
    'order': [[1, 'asc']]
  });
})
