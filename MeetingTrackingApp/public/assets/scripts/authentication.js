function ready(fn) {
    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  ready(function () {

   

    $('#loginButton').on('click', function () {
        
        var username = $("#username").val();
        var password = $("#password").val();
        
        var data = {       
            username:username,
            password:password
           };
    
        $.ajax({
            url: "http://10.90.252.98:8080/authentication",
            type: "GET",
            dataType: 'json',
            contentType: 'application/json',        
            data: data,
            success: function(e) {
               if(e == "TRUE"){
                    window.location.href = "http://10.90.252.98:8080/dashboard";
                }
               
            },        
            error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            }
        });

      });

  })