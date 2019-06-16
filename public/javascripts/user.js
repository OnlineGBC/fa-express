$(document).ready(function(){
  var table = $('#automation').DataTable({
    'responsive': true,
    // 'paginate': true,
    // 'scrollX': true,
    // 'scrollY': 600,
    "lengthMenu": [
      [10, 25, 50, -1],
      [10, 25, 50, "All"]
    ],
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
          // 'selectAllPages': false,
          'selectAllRender': '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>'
        }
      },
    ],
    'select': 'multi',
    'order': [[1, 'asc']]
  });
})
