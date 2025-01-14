/* ******************************************** */
/* * Document onLoad stuff                    * */
/* ******************************************** */
$(document).ready(function(){      
    booking_refresh_resource_list("https://booking-api.lskysd.ca");
    document.querySelector("body").requestFullscreen();
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

// Every 5 minutes
setInterval(function() {
    booking_refresh_resource_list("https://booking-api.lskysd.ca");
}, 300000);

// Don't refresh the page for now, it will mess with it's full-screen-ness