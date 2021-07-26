function ready(fn) {
    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  ready(function () {
   
    fillDatatable();
    var tableAppointment = null;
    var control = true;
    function fillDatatable(){
        $.ajax({
            url: "http://10.90.252.98:8080/getAllAppointment",
            type: "GET",
            dataType: 'json',
            contentType: 'application/json',                
            success: function(data) {
                var mainArray = [];
                data.forEach(element => {
                    var subArray = [];
                    subArray.push(element["ID"]);
                    subArray.push(element["TITLE"]);
                    subArray.push(element["REQUESTER_NAME"]);
                    subArray.push(element["REQUESTER_MAIL"]);
                    subArray.push(element["MEETING_ROOM"]);
                    subArray.push(element["ARRANGE_TIME_START"]);
                    subArray.push(element["ARRANGE_TIME_END"]);
                    subArray.push(element["DESCRIPTION"]);
                    if(element["APPROVMENT_STATUS"] == 3)subArray.push("APPROVED");     
                    else if(element["APPROVMENT_STATUS"] == 2)subArray.push("PENDING");     
                    else if(element["APPROVMENT_STATUS"] == 1)subArray.push("REJECTED");     
                    
                    mainArray.push(subArray);                        
                });
                
                if ($.fn.dataTable.isDataTable('#example')) {                
                    tableAppointment.destroy();
                }
                    
                    tableAppointment = $('#example').DataTable( {
                        data: mainArray,
                        pageLength: 25,
                        columns: [
                            { title: "Id" },
                            { title: "Title" },
                            { title: "Requester Name" },
                            { title: "Requester Mail" },
                            { title: "Meeting Room" },
                            { title: "Start date" },
                            { title: "End Date" },
                            { title: "Description" },
                            { title: "Status" },
                            {
                                defaultContent: '<input type="button" class="approveButtonClass" value="Approve"/><input type="button" class="rejectButtonClass" value="Reject"/>'
                    
                            }
                        ],
                        createdRow: function ( row, data, index ) {
                            if ( data[8] == "APPROVED") {
                                $('td', row).eq(8).addClass('approvedAppointment');                        
                            }
                            else if ( data[8] == "PENDING") {
                                $('td', row).eq(8).addClass('pendingAppointment');
                            }
                            else if ( data[8] == "REJECTED") {
                                $('td', row).eq(8).addClass('rejectedAppointment');
                            }
                            
                        },
                        initComplete: function(settings, json) {
                            if(control){
                                $('#example tbody').on('click', '.approveButtonClass', function () {
                                    var row = $(this).closest('tr');                                                                        
                                    var approveStatus = tableAppointment.row( row ).data()[8];
                                    if(approveStatus == "APPROVED")alert("Onaylı olduğu için işlem gerçekleştirilemiyor.");
                                    else{                                        
                                        var itemId = tableAppointment.row( row ).data()[0];
                                        updateApprovementStatus(itemId,3,tableAppointment);                                        
                                    }                                    
                                  });
                                    
                                    
                                  $('#example tbody').on('click', '.rejectButtonClass', function () {
                                    var row = $(this).closest('tr');                                                                        
                                    var approveStatus = tableAppointment.row( row ).data()[8];
                                    if(approveStatus == "REJECTED")alert("İptal edildiği için işlem gerçekleştirilemiyor.");
                                    else{                                        
                                        var itemId = tableAppointment.row( row ).data()[0];
                                        updateApprovementStatus(itemId,1,tableAppointment);
                                        
                                    }


                                  });
                                  control = false;
                            }
                            
                        }
                    });
                   
            },        
            error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            }
        });
    }
 function updateApprovementStatus(appointmentId,app_status,datatable){

    var data = {       
        app_status:app_status,
        appointmentId:appointmentId
       };

    $.ajax({
        url: "http://10.90.252.98:8080/updateAppointmentStatus",
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',        
        data: data,
        success: function(e) {
           if(e == "SUCCESS"){
               alert("Güncelleme işlemi başarılı bir şekilde gerçekleşti.");
               fillDatatable();
            }
           else if(e == "ERROR")alert("İşlem başarısız tekrar deneyin veya sistem yöneticisine başvurun.");
        },        
        error: function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
        }
    });

 }
  
  $('#logoutButton').on('click', function () {    
    $.ajax({
        url: "http://10.90.252.98:8080/logout",
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',        
        data: {},
        success: function(e) {
           if(e == "TRUE"){
                window.location.href = "http://10.90.252.98:8080/login";
            }
           
        },        
        error: function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
        }
    });

  });
 
  
  });
  