
var booking_api_url = "";
var booking_selected_resource_id = "";

var booking_div_resource_list = "resource_list";
var booking_div_resource_name = "resource_name";
var booking_cookie_name = "lssd_booking_saved_resource_id";
var local_time_zone = '';

var booking_active_upcoming_booking_ids = ['54bfb955-5e61-4bd0-824a-e79496fa2059'];


function booking_init(URL) {
    booking_api_url = URL;

    // Load resources into resource list
    booking_update_resources(booking_api_url);

    // Try to load saved resource guid from cookies
    booking_check_cookie();


    // Forform an initial update
    booking_update();

}

function is_in_array(haystack, needle) {
    var found = false;
    haystack.forEach(x => {
        if (String(x) === String(needle)) {
            found = true;
        }
    });
    return found;
}

function booking_update() {
    console.log("Updating bookings...");

    if (booking_selected_resource_id.length > 0) {

        // First update the resource details

        //resource_name
        var resource_url = booking_api_url + "/Resources/" + booking_selected_resource_id;
        console.log("> Loading resource info from " + resource_url);
        $.getJSON(resource_url, function(data) {        
            
            // Set resource name
            $('#' + booking_div_resource_name).html(data.name);  
        });


        // Now load the bookings for this resource for today

        // Get the current month and year
        var curDate = new Date();
        var curYear = curDate.getFullYear();
        var curMonth = curDate.getMonth() + 1;
        var curDay = curDate.getDate();

        var resource_bookings_url = booking_api_url + "/Bookings/" + booking_selected_resource_id + "/" + curYear + "/" + curMonth + "/" + curDay + "/";
        console.log("> Loading resource bookings from " + resource_bookings_url);

        $.getJSON(resource_bookings_url, function(data) {        
            var html = "";
            var currentBookingsCount = 0;
            var upcomingBookingsCount = 0;
            var found_upcoming_booking_ids = [];

            var nextEventStart = new Date(8640000000000000);

            $.each(data, function(list, obj) {
                // "Z" at the end signifies it's UTC.
                // This should convert to local time at wherever the browser is running
                var localStartTime = new Date(obj.startTimeUTC + "Z"); 
                var localEndTime = new Date(obj.endTimeUTC + "Z"); 
                var now = new Date();

                if ((now >= localStartTime) && (now <= localEndTime)) {
                    currentBookingsCount++;
                    
                    $('#current_booking_name').html(obj.shortDescription);
                    $('#current_booking_time').html(
                        localStartTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + 
                        " - " + 
                        localEndTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
                        );

                } else if (now <= localStartTime) {
                    upcomingBookingsCount++;

                    if (is_in_array(booking_active_upcoming_booking_ids, obj.id) == false) {
                        var html = "";
                        html += "<div class=\"next_booking\" id=\"upcoming-" + obj.id + "\">";
                        html += "<div class=\"next_booking_label\">" + 
                            localStartTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + 
                            " - " + 
                            localEndTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) +
                            "</div>";
                        html += "<div class=\"next_booking_name\">" + obj.shortDescription + "</div>";
                        html += "</div>";
                        
                        $('#coming_up_event_bucket').append(html);
                    }

                    if (is_in_array(booking_active_upcoming_booking_ids, obj.id) == false) {
                        booking_active_upcoming_booking_ids.push(obj.id);
                    }
                    found_upcoming_booking_ids.push(obj.id);

                    // Find the next upcoming time
                    if ((localStartTime > now) && (localStartTime < nextEventStart)) {
                        nextEventStart = localStartTime;
                    }

                    
                    $('#no_events_until_later_time').html(nextEventStart.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }));

                }
            });


            // Remove upcoming ids that no longer exist
            var new_active_ids = [];
            booking_active_upcoming_booking_ids.forEach(known_id => {
                if (is_in_array(found_upcoming_booking_ids, known_id) == false) {                    
                    $('#upcoming-' + known_id).remove();
                } else {
                    new_active_ids.push(known_id);
                }
            });
            booking_active_upcoming_booking_ids = new_active_ids;


            if (currentBookingsCount > 0) {
                $('#current_booking').removeClass("hidden");
            } else {
                $('#current_booking').addClass("hidden");
            }

            if (upcomingBookingsCount > 0) {
                $('#coming_up_container').removeClass("hidden");
            } else {
                $('#coming_up_container').addClass("hidden");
            }

            if ((currentBookingsCount == 0) && (upcomingBookingsCount == 0)) {
                $('#no_events_today').removeClass("hidden");
            } else {
                $('#no_events_today').addClass("hidden");
            }

            if ((currentBookingsCount == 0) && (upcomingBookingsCount > 0)) {
                $('#no_events_until_later').removeClass("hidden");
            } else {
                $('#no_events_until_later').addClass("hidden");
            }



        });
    } else {
        console.log("Tried to update but no resource GUID is set.");
    }
}


function booking_update_resources(URL) {
    var resource_url = URL + "/Resources";

    $.getJSON(resource_url, function(data) {        
        var html = "";
        $.each(data, function(list, obj) {
            html += "<div class=\"bookable_resource\" onclick=\"onClick_Booking_btnChangeResource('"+obj.id+"');\">" + obj.name + "</div>";
        });

        $('#' + booking_div_resource_list).html(html);        
    });
}


function booking_check_cookie() {
    var booking_saved_resource_id = Cookies.get(booking_cookie_name);

    if (booking_saved_resource_id != null) {
        console.log("Loaded resource guid from cookie: " + booking_saved_resource_id);
        booking_selected_resource_id = booking_saved_resource_id;

    } else {
        booking_show_resource_menu();
    }
}


function booking_set_resource(GUID) {
    // Save the resource guid in a cookie
    Cookies.set(booking_cookie_name, GUID, { secure: true, sameSite: 'strict' });

    booking_hide_resource_menu();
    booking_selected_resource_id = GUID;

    // Trigger an update
    booking_update();
}

/* ************************************************************** */
/* * Button handling logic                                      * */
/* ************************************************************** */

function onClick_Booking_btnChangeResource(GUID) {
    console.log("Changing resource to " + GUID);
    booking_set_resource(GUID);
}

function booking_show_resource_menu() {
	$("#" + booking_div_resource_list).slideDown();
	$("#" + booking_div_resource_list).removeClass("hidden");
}

function booking_hide_resource_menu() {
	$("#" + booking_div_resource_list).slideUp();
	$("#" + booking_div_resource_list).addClass("hidden");
}

function booking_toggle_resource_menu() {
	if ($("#" + booking_div_resource_list).hasClass("hidden")) {
		booking_show_resource_menu();
	} else {
		booking_hide_resource_menu();
	}
}