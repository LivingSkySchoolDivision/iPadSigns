var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);
  
    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();


/* ******************************************** */
/* * Document onLoad stuff                    * */
/* ******************************************** */
$(document).ready(function(){      

    booking_initial_settings("https://booking-api.lskysd.ca");
    
    var resourceId_tl = urlParams['tl'];
    var resourceId_tr = urlParams['tr'];
    var resourceId_bl = urlParams['bl'];
    var resourceId_br = urlParams['br'];

    if (resourceId_tl != null) {
        if (resourceId_tl.length == 36) {                        
            booking_init_resource_display("resource_container_tl", resourceId_tl);
        }
    }

    if (resourceId_tr != null) {
        if (resourceId_tr.length == 36) {                        
            booking_init_resource_display("resource_container_tr", resourceId_tr);
        }
    }

    if (resourceId_bl != null) {
        if (resourceId_bl.length == 36) {
            booking_init_resource_display("resource_container_bl", resourceId_bl);
        }
    }

    if (resourceId_br != null) {
        if (resourceId_br.length == 36) {                        
            booking_init_resource_display("resource_container_br", resourceId_br);
        }
    }

    booking_update();
});


/* ******************************************** */
/* * Interval stuff                           * */
/* ******************************************** */

/*
 1000     1 second
 10000     10 seconds
 60000     1 minute
 300000     5 minutes
 600000     10 minutes
 1800000     30 mins
 3600000     1 hour
 */

setInterval(function() {
    booking_update();
}, 10000); // 10 seconds

// Don't refresh the page for now, it will mess with it's full-screen-ness