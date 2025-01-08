//var booking_api_selected_resource_id = ""; // This is now the URL of the exact calendar we need
var booking_api_resource_to_container_map = new Map();

var booking_api_base_url = "";
var booking_div_resource_list = "resource_list";
var booking_div_resource_name = "resource_name";
var booking_cookie_name = "lssd_booking_saved_resource_id";

// list  of active booking events that should be displayed
// We'll need to loop through these to check if any need to be added or removed periodically
var booking_active_upcoming_booking_ids = [''];

// Initialize the whole system (but not a resource yet)
function booking_initial_settings(BASEURL) 
{    
    booking_api_base_url = BASEURL;
    console.log("Booking API initial config { api_base_url: " + booking_api_base_url + " } ");
}

// Initialize a resource into a container
function booking_init_resource_display(CONTAINER, RESOURCEID) 
{
    if (!booking_api_base_url) {
        console.error("ERROR: Could not initialize resource " + RESOURCEID + " into container " + CONTAINER + " - Must run booking_initial_settings() first to set base URL");
        return;
    } else {
        console.log("Initializing resource " + RESOURCEID + " into container " + CONTAINER);

        // Register this resource with this container, so we can update it later
        booking_api_resource_to_container_map.set(CONTAINER, RESOURCEID);

        // Insert the template HTML for this resource
        var template_html = "";        
        template_html += "<div id=\"booking-"+RESOURCEID+"-resource-name\" class=\"resource_name\"></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-no-events-today\" class=\"no_bookings_today hidden\"><div><div class=\"no_bookings_today_text\">No bookings today</div><div class=\"no_bookings_today_subtext\">Create a booking at bookings.lskysd.ca</div><img src=\"img/qr-bookings.svg\"></div></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-current-booking\" class=\"current_booking_content hidden\"><div><div class=\"current_booking_label\">Right now:</div><div id=\"booking-"+RESOURCEID+"-current-booking-title\" class=\"booking_title\"></div><div id=\"booking-"+RESOURCEID+"-current-booking-time\" class=\"booking_time\"></div></div></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-coming-up\" class=\"coming_up_container hidden\"><div class=\"coming_up_label\">Later today:</div><div id=\"booking-"+RESOURCEID+"-upcoming-events-list\"></div></div>";
        $('#' + CONTAINER).html(template_html);
    }
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

function booking_refresh_resource_list(URL) {
    var resource_url = URL + "/Resources";

    $.getJSON(resource_url, function(data) {
        var html = "";
        $.each(data, function(list, obj) {
            html += "<div class=\"bookable_resource\"><a href=\"screen.html?id=" + obj.id + "\">" + obj.name + "</a></div>";
        });

        $('#' + booking_div_resource_list).html(html);
    });
}

function booking_init_resource_list() 
{
    // Display a list of all resources (for the main index page)

}

function booking_update() 
{
    // Get the current month and year
    var curDate = new Date();
    var curYear = curDate.getFullYear();
    var curMonth = curDate.getMonth() + 1;
    var curDay = curDate.getDate();


    for (let [HTMLCONTAINER, RESOURCEID] of booking_api_resource_to_container_map) 
    {
        console.log(`Updating ${HTMLCONTAINER} with resource ${RESOURCEID}`);
        var this_resource_url = booking_api_base_url + "/Resources/" + RESOURCEID;
        var this_resource_bookings_url = booking_api_base_url + "/Bookings/" + RESOURCEID + "/" + curYear + "/" + curMonth + "/" + curDay + "/";;

        // Get the resource details from the API
        $.getJSON(this_resource_url, function(data) {            
            // Check if we can update the resource name
            if ($('#' + "booking-"+RESOURCEID+"-resource-name").length) {
                $('#' + "booking-"+RESOURCEID+"-resource-name").html(data.name);
            }
        });


        // Get booking details for this resource from the API

        $.getJSON(this_resource_bookings_url, function(data) {
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

                    $("#booking-"+RESOURCEID+"-current-booking-title").html(obj.shortDescription);
                    $("#booking-"+RESOURCEID+"-current-booking-time").html(
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

                        $("#booking-"+RESOURCEID+"-upcoming-events-list").append(html);
                    }

                    if (is_in_array(booking_active_upcoming_booking_ids, obj.id) == false) {
                        booking_active_upcoming_booking_ids.push(obj.id);
                    }
                    found_upcoming_booking_ids.push(obj.id);

                    // Find the next upcoming time
                    if ((localStartTime > now) && (localStartTime < nextEventStart)) {
                        nextEventStart = localStartTime;
                    }
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

            // Hide or unhide parts as needed
            console.log(`Active: ${currentBookingsCount} Upcoming: ${upcomingBookingsCount}`);

            if (currentBookingsCount > 0) {
                $("#booking-"+RESOURCEID+"-current-booking").removeClass("hidden");
                console.log("Unhiding");
            } else {
                $("#booking-"+RESOURCEID+"-current-booking").addClass("hidden");
            }

            if (upcomingBookingsCount > 0) {
                $("#booking-"+RESOURCEID+"-coming-up").removeClass("hidden");
                console.log("Coming up..");
            } else {
                $("#booking-"+RESOURCEID+"-coming-up").addClass("hidden");
            }
            
            if ((currentBookingsCount == 0) && (upcomingBookingsCount == 0)) {
                $("#booking-"+RESOURCEID+"-no-events-today").removeClass("hidden");
                console.log("No bookings today");
            } else {
                $("#booking-"+RESOURCEID+"-no-events-today").addClass("hidden");
            }
        });
    }
}