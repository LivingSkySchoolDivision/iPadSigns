// Mappings of HTML containers to resource IDs, so we can have multiple resources on the same page
var booking_api_resource_to_container_map = new Map();

// Mapping of a given resource's active events (as an array)
var booking_api_resource_active_events = new Map();

// Mapping of a given resouce's upcoming events (as an array)
var booking_api_resource_upcoming_events = new Map();

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

        // Initialize the arrays of known active and upcoming events for this resource
        if (!booking_api_resource_active_events.has(RESOURCEID)) {
            booking_api_resource_active_events.set(RESOURCEID, []);
        } else {
            console.error("ERROR: Initializing a RESOURCEID that has already been initialized - this will cause undesirable problems!")
            return;
        }

        if (!booking_api_resource_upcoming_events.has(RESOURCEID)) {
            booking_api_resource_upcoming_events.set(RESOURCEID, []);
        } else {
            console.error("ERROR: Initializing a RESOURCEID that has already been initialized - this will cause undesirable problems!")
            return;
        }

        // Insert the template HTML for this resource
        var template_html = "";
        template_html += "<div id=\"booking-"+RESOURCEID+"-resource-name\" class=\"resource_name\"></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-no-events-today-message\" class=\"no_bookings_today hidden\"><div><div class=\"no_bookings_today_text\">No bookings currently</div><br/><div class=\"no_bookings_today_subtext\">Create a booking at bookings.lskysd.ca</div><img src=\"img/qr-bookings.svg\"></div></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-current-bookings\" class=\"current_booking_content\"><div class=\"current_booking_label\">Right now:</div><div id=\"booking-"+RESOURCEID+"-current-bookings-container\"></div></div>";
        template_html += "<div id=\"booking-"+RESOURCEID+"-upcoming-bookings\" class=\"coming_up_container\"><div class=\"coming_up_label\">Later today:</div><div id=\"booking-"+RESOURCEID+"-upcoming-events-container\"></div></div>";
        $('#' + CONTAINER).html(template_html);
    }
}

function remove_from_array(array, item) {
    var working = [];

    array.forEach(x => {
        if (String(x) === String(item)) {
        } else {
            working.push(item);
        }
    });

    return working;
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

        // Get the events for this resource
        $.getJSON(this_resource_bookings_url, function(data) {
            var currentBookingsCount = 0;
            var upcomingBookingsCount = 0;
            var nextEventStart = new Date(8640000000000000);

            // Track active events seen this run
            var booking_this_run_active_events = [];

            // track upcoming events seen this run
            var booking_this_run_upcoming_events = [];

            // Loop through all events for this resource (for the specified day)
            $.each(data, function(list, obj) {
                // "Z" at the end signifies it's UTC.
                // This should convert to local time at wherever the browser is running
                var localStartTime = new Date(obj.startTimeUTC + "Z");
                var localEndTime = new Date(obj.endTimeUTC + "Z");
                var now = new Date();

                // If the event is currently active
                if ((now >= localStartTime) && (now <= localEndTime)) {
                    currentBookingsCount++;

                    //console.log("Found active event for resource " + RESOURCEID);

                    // Check if we've seen this event before, and if not, register it
                    var this_resource_events = booking_api_resource_active_events.get(RESOURCEID);
                    //console.log(this_resource_events);

                    // Register this event if we've never seen it before
                    if (is_in_array(this_resource_events, obj.id)) {
                        //console.log("Have seen this event " + obj.id + " before");
                    } else {
                        console.log("Prepping newly discovered active event with id " + obj.id);
                        this_resource_events.push(obj.id);
                    }

                    // Track that we've seen this event in this run
                    if (!is_in_array(booking_this_run_active_events, obj.id)) {
                        booking_this_run_active_events.push(obj.id);
                    }

                    if (!$('#' + "booking-active-"+RESOURCEID+"-" + obj.id).length) {
                        // We only want to do this once, if we've never seen this before
                        // Create an event div for this event and put it in the correct container
                        // Check if there was an "upcoming" div already created for this event, and if there was, destroy it
                        // These go in booking-"+RESOURCEID+"-current-bookings-container
                        var event_html = "";
                        event_html += "<div id=\"booking-active-"+RESOURCEID+"-" + obj.id + "\">";
                        event_html += "<div id=\"booking-"+RESOURCEID+"-current-booking-title\" class=\"booking_title\">" + obj.shortDescription + "</div>";
                        event_html += "<div id=\"booking-"+RESOURCEID+"-current-booking-time\" class=\"booking_time\">";
                        event_html += localStartTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + " - " + localEndTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                        event_html += "</div>";
                        event_html += "</div>";
                        $("#booking-"+RESOURCEID+"-current-bookings-container").append(event_html);
                    }

                // If the event is not active yet, but is upcoming
                } else if (now <= localStartTime) {
                    upcomingBookingsCount++;

                    var this_resource_upcoming_events = booking_api_resource_upcoming_events.get(RESOURCEID);
                    console.log(this_resource_upcoming_events);
                    //console.log("Found upcoming event for resource " + RESOURCEID);

                    // Check if we've seen this event before, and if not, register it
                    if (is_in_array(this_resource_upcoming_events, obj.id)) {
                        //console.log("Have seen this upcoming event " + obj.id + " before");
                    } else {
                        console.log("Prepping newly discovered upcoming event with id " + obj.id);
                        this_resource_upcoming_events.push(obj.id);
                    }

                    // Track that we've seen this event in this run
                    if (!is_in_array(booking_this_run_upcoming_events, obj.id)) {
                        booking_this_run_upcoming_events.push(obj.id);
                    }

                    if (!$('#' + "booking-upcoming-"+RESOURCEID+"-" + obj.id).length) {
                        // We only want to do this once, if we've never seen this before
                        // Create an event div for this event and put it in the correct container
                        // Check if there was an "upcoming" div already created for this event, and if there was, destroy it
                        // These go in booking-"+RESOURCEID+"-upcoming-bookings
                        var event_html = "";
                        event_html += "<div id=\"booking-upcoming-"+RESOURCEID+"-" + obj.id + "\" class=\"next_booking\">";
                        event_html += "<div id=\"booking-"+RESOURCEID+"-upcoming-booking-title\" class=\"next_booking_name\">" + obj.shortDescription + "</div>";
                        event_html += "<div id=\"booking-"+RESOURCEID+"-upcoming-booking-time\" class=\"next_booking_label\">";
                        event_html += localStartTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + " - " + localEndTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                        event_html += "</div>";
                        event_html += "</div>";
                        $("#booking-"+RESOURCEID+"-upcoming-bookings").append(event_html);
                    }

                    // Find the next upcoming time
                    if ((localStartTime > now) && (localStartTime < nextEventStart)) {
                        nextEventStart = localStartTime;
                    }
                }
            });

            // Remove active events that no longer exist
            // Find events from the main known events list that are not present in the "this run" list
            var this_resource_events = booking_api_resource_active_events.get(RESOURCEID);
            var this_resource_upcoming_events = booking_api_resource_upcoming_events.get(RESOURCEID);

            var remove_from_current = [];
            this_resource_events.forEach(x => {
                if (!is_in_array(booking_this_run_active_events, x)) {
                    // active event no longer exists, so destroy it
                    $("#booking-active-" + RESOURCEID + "-" + x).remove();

                    // remove from the main discovery list
                    // We probably can't modify the array we are looping through so remove in the next step
                    remove_from_current.push(x);
                }
            });

            remove_from_current.forEach(x => {
                this_resource_events = remove_from_array(this_resource_events, x);
            });
            
            var remove_from_upcoming = [];
            this_resource_upcoming_events.forEach(x => {
                if (!is_in_array(booking_this_run_upcoming_events, x)) {
                    // upcoming event no longer exists, so destroy it
                    $("#booking-upcoming-" + RESOURCEID + "-" + x).remove();

                    // remove from the main discovery list
                    // We probably can't modify the array we are looping through so remove in the next step
                    remove_from_upcoming.push(x);
                }
            });

            remove_from_upcoming.forEach(x => {
                this_resource_upcoming_events = remove_from_array(this_resource_upcoming_events, x);
            });

            // Hide current events container if there are zero events
            if (this_resource_events.length < 1) {
                $("#booking-"+RESOURCEID+"-current-bookings").addClass("hidden");
                $("#booking-"+RESOURCEID+"-no-events-today-message").removeClass("hidden");
            } else {
                $("#booking-"+RESOURCEID+"-current-bookings").removeClass("hidden");
                $("#booking-"+RESOURCEID+"-no-events-today-message").addClass("hidden");
            }

            // Hide upcoming events container if there are zero events
            if (this_resource_upcoming_events.length < 1) {
                $("#booking-"+RESOURCEID+"-upcoming-bookings").addClass("hidden");
            } else {
                $("#booking-"+RESOURCEID+"-upcoming-bookings").removeClass("hidden");
            }

            // Hide or unhide parts as needed
            console.log(`ResourceID: ${RESOURCEID} Active: ${currentBookingsCount} Upcoming: ${upcomingBookingsCount}`);

        });
    }
}