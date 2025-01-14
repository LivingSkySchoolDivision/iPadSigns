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
    

    //https://booking-api.lskysd.ca/Bookings/bf43a92b-5929-4d44-8203-b4459e5ddf79/2024/01/25
    var resourceId = urlParams['id'];

    if (resourceId != null) {
        if (resourceId.length == 36) {            
            //booking_init("https://booking-api.lskysd.ca", resourceId);
            booking_init_resource_display("resource_container", resourceId);
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