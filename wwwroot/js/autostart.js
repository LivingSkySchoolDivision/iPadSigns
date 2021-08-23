/* ******************************************** */
/* * Document onLoad stuff                    * */
/* ******************************************** */
$(document).ready(function(){  
    booking_init("https://booking-api.lskysd.ca");
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

// Every second
setInterval(function() {
    booking_update();
}, 240000);

// Refresh the page periodically (2.5 hrs)
setInterval(function() {
    window.location.replace(window.location.href);
}, 9000000);