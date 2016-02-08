
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}


/* ******************************************** */
/* * Data updating functions                  * */
/* ******************************************** */


function UpdateDateAndTime() {
    var displayDate = new Date();
    $('#txtDate').html("Today is " + getDateString(displayDate));
}

/* ******************************************** */
/* * General non-JQuery functions             * */
/* ******************************************** */

var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
var dayNames= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
function getDateString(date) {
    return dayNames[date.getDay()] + ",&nbsp;" + monthNames[date.getMonth()] + ' ' + date.getDate() + ',&nbsp;' + date.getFullYear()    
}

function getTimeString(time) {
    ampm= 'AM';
    h= time.getHours();
    m= time.getMinutes();
    s= time.getSeconds();
    if(h>= 12){
        if(h>12)h-= 12;
        ampm= 'PM';
    }
    //if(h<10) h= '0'+h;
    if(m<10) m= '0'+m;
    if(s<10) s= '0'+s;
    return '<div id=\"txtTimeMain\">' + h + ':' + m + '</div> ' + ampm;
  }
/* ******************************************** */
/* * Document onLoad stuff                    * */
/* ******************************************** */
$(document).ready(function(){
	UpdateDateAndTime();

  // Hide the curtain if you touch the screen
  $( "#curtains" ).click(function() {
    $( this ).fadeOut('fast', function() {
      $( this ).addClass("hidden");
    });    
  });

  $( "#occupancy" ).click(function() {
    if (!$('#occupancy').hasClass("occupied"))
    {
      SetOccupancyOccupied();
    } else {
      SetOccupancyVacant();
    } 
  });
  


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

/* Scroll to the top of the events list every so often */
setInterval(function() {
  $("#event_container").animate({
    scrollTop: 0
  }, 'slow');

  $("html body").animate({
    scrollTop: 0
  }, 'slow');

 }, 17000);

function SetOccupancyOccupied() {
  $('#occupancy').fadeOut('fast', function() {
    $('#occupancy').addClass("occupied").removeClass("vacant").fadeIn();
    $('#occupancy').html("ROOM OCCUPIED");
  });
}

function SetOccupancyVacant() {
  $('#occupancy').fadeOut('fast', function() {
    $('#occupancy').addClass("vacant").removeClass("occupied").fadeIn();
    $('#occupancy').html("ROOM VACANT");
  });
}

/* Check if we should dim the display */
setInterval(function() {
  var CurrentHour = new Date().getHours();
  
  if ((CurrentHour > 17) && (CurrentHour < 6)) {
    // If it's night time, show the curtain
    if ($("#curtains").hasClass("hidden")) {
      $("#curtains").fadeOut('fast', function() {
        $("#curtains").removeClass("hidden");
        $("#curtains").fadeIn('slow');
      });

    }
  }  else {
    // If it's during the day, hide the curtain
    if (!$("#curtains").hasClass("hidden")) {
      $( "#curtains" ).fadeOut('fast', function() {
        $( "#curtains" ).addClass("hidden");
      }); 
    }
  }
 }, 300000);

/* Refresh date and time */
setInterval(function() {
	UpdateDateAndTime();
 }, 600000);

/* Refresh the page every so often (1:30 mins) */
setInterval(function() {
	location.reload();
 }, 5400000);

/*
Old code:

function createCalendarItem_Current(EventID, EventTitle, EventStartDate, EventStartTime, EventEndDate, EventEndTime, EventDescription) {
  return '<table class="event_bubble current_event" id="currentevent_' + EventID +'"><tr><td rowspan=2 class="current_indicator"><div class="current_indicator_text">RIGHT NOW</div></td><td class="event_title_cell" valign=""><div class="event_title">' + EventTitle + '</div></td><td class="event_time_cell"><div class="event_time">' + EventStartDate + '<br/>' + EventStartTime + ' to ' + EventEndTime + '</div></td></tr><tr><td colspan=2 class="event_description">' + EventDescription +'</td></tr></table>';
}
*/

function createCalendarItem_Current(EventID, EventTitle, EventStartDate, EventStartTime, EventEndDate, EventEndTime, EventDescription) {
  return '<div class="current_event_container"><div class="current_indicator_text">RIGHT NOW:</div><div class="current_event_title">' + EventTitle + '</div><br/><div class="current_event_time">' + EventStartDate + ', ' + EventStartTime + ' to ' + EventEndTime + '</div></div>';
}


function createCalendarItem(EventID, EventTitle, EventStartDate, EventStartTime, EventEndDate, EventEndTime, EventDescription) {
  // <div class="calendar_event"><div class="calendar_event_time">8:30a</div> <div class="calendar_event_title">Sea lion show</div></div>
  return '<table class="event_bubble" id="upcomingevent_' + EventID +'"><tr><td class="event_time_cell" rowspan=2><div class="event_time">' + EventStartDate + '<br/>' + EventStartTime + ' to ' + EventEndTime + '</div></td><td class="event_title_cell" valign=""><div class="event_title">' + EventTitle + '</div></td></tr></table>';
}

var KnownUpcomingEvents = new Array();
var KnownCurrentEvents = new Array();

function NewCalendarItem(EventID, EventTitle, EventStartDate, EventStartTime, EventEndDate, EventEndTime, EventDescription)
{
  this.ID = EventID;
  this.Title = EventTitle;
  this.StartDate = EventStartDate;
  this.StartTime = EventStartTime;
  this.EndTime = EventEndTime;
  this.EndDate = EventEndDate;
  this.Description = EventDescription;  
}

function UpdateCalendarItems(siteURL, calendarGUID)
{
    var XMLURL = "/LSKYDashboardDataCollector/Sharepoint2013/Calendar.aspx?url=" + siteURL + "&guid=" + calendarGUID;

    // Need to elegantly transition between events when the calendar updates itself, so that the flashing isn't obvious
    //  - Use JQuery's animation for this, but I will need to check if I even need to update the list at all
    //  - I've given each calendar item an ID based on a hash, so it should be easy to keep a list of known IDs, and only refresh if there is a new ID present

    var CurrentEvents = new Array();
    var UpcomingEvents = new Array();

    $.getJSON(XMLURL, function(data) {
        // ************************************************************************
        // Load data from JSON
        // ************************************************************************
        
        // Current
        $.each(data.rightnow, function(j, ce) {
            if (!ce.title.startsWith("Deleted")) 
            {
              //$('#tblCurrentEvents > tbody:last').append("<tr><td>" + createCalendarItem_Current(ce.title, ce.startdatefriendly, ce.starttime, ce.endtime, ce.description) + "</td></tr>");
              CurrentEvents[CurrentEvents.length] = new NewCalendarItem(ce.id, ce.title, ce.startdatefriendly, ce.starttime, ce.enddate, ce.endtime, ce.description);                        
            }
        });

        // upcoming
        $.each(data.upcoming, function(j, ce) {
            if (!ce.title.startsWith("Deleted")) 
            {
              UpcomingEvents[UpcomingEvents.length] = new NewCalendarItem(ce.id, ce.title, ce.startdatefriendly, ce.starttime, ce.enddate, ce.endtime, ce.description);
            }
        });

        // ************************************************************************
        // Handle "Occupied" or "Vacant" sign
        // ************************************************************************ 

        if (CurrentEvents.length > 0) {
            if (!$('#occupancy').hasClass("occupied"))
            {
              SetOccupancyOccupied();
            } 
        } else {            
            if (!$('#occupancy').hasClass("vacant"))
            {              
              SetOccupancyVacant();
            }          
        }

        // ************************************************************************
        // Handle Current Events
        // ************************************************************************         

        //$('#tblCurrentEvents').empty();
        //$('#tblCurrentEvents').append("<tbody></tbody>");

        var NeedCurrentUpdate = false;

        // Are there more or less events than we know about?
        if (KnownCurrentEvents.length != CurrentEvents.length)
          NeedCurrentUpdate = true;

        // Is there a new event that we don't know about?
        for(var x = 0; x < CurrentEvents.length; x++) {
          var UpcomingEvent = CurrentEvents[x];

          var foundEvent = false;          
          for (var y = 0; y < KnownCurrentEvents.length; y++) {
            var KnownUpcomingEvent = KnownCurrentEvents[y];
            if (KnownUpcomingEvent.ID == UpcomingEvent.ID) {
              foundEvent = true;
            }
          }          
          
          // This loaded event wasn't found in the list of known events          
          if (foundEvent == false) {
            NeedCurrentUpdate = true;
          }
        }

        // Is there an event in the known list that has dissapeared?
        for (var y = 0; y < KnownCurrentEvents.length; y++) {
          var KnownUpcomingEvent = KnownCurrentEvents[y];

          var foundEvent = false;
          for(var x = 0; x < CurrentEvents.length; x++) {
            var UpcomingEvent = CurrentEvents[x];
            if (KnownUpcomingEvent.ID == UpcomingEvent.ID) {
              foundEvent = true;
            }
          }

          // this known event wasn't found in the list of events that were loaded
          if (foundEvent == false) {
            NeedCurrentUpdate = true;
          }
        }

        if (NeedCurrentUpdate == true) {
          $('#tblCurrentEvents').fadeOut('fast', function() {
            $('#tblCurrentEvents').empty();
            $('#tblCurrentEvents').append("<tbody></tbody>");
            for(var x = 0; x < CurrentEvents.length; x++) {
                var ci = CurrentEvents[x];
                $('#tblCurrentEvents > tbody:last').append("<tr><td>" + createCalendarItem_Current(ci.ID, ci.Title, ci.StartDate, ci.StartTime, ci.EndDate, ci.EndTime, ci.Description) + "</td></tr>");
            }
            $('#tblCurrentEvents').fadeIn();
          });          
        }

        // ************************************************************************
        // Handle Upcoming Events
        // ************************************************************************
        
        var NeedUpcomingUpdate = false;

        // Are there more or less events than we know about?
        if (KnownUpcomingEvents.length != UpcomingEvents.length)
          NeedUpcomingUpdate = true;

        // Is there a new event that we don't know about?
        for(var x = 0; x < UpcomingEvents.length; x++) {
          var UpcomingEvent = UpcomingEvents[x];

          var foundEvent = false;          
          for (var y = 0; y < KnownUpcomingEvents.length; y++) {
            var KnownUpcomingEvent = KnownUpcomingEvents[y];
            if (KnownUpcomingEvent.ID == UpcomingEvent.ID) {
              foundEvent = true;
            }
          }          
          
          // This loaded event wasn't found in the list of known events          
          if (foundEvent == false) {
            NeedUpcomingUpdate = true;
          }
        }

        // Is there an event in the known list that has dissapeared?
        for (var y = 0; y < KnownUpcomingEvents.length; y++) {
          var KnownUpcomingEvent = KnownUpcomingEvents[y];

          var foundEvent = false;
          for(var x = 0; x < UpcomingEvents.length; x++) {
            var UpcomingEvent = UpcomingEvents[x];
            if (KnownUpcomingEvent.ID == UpcomingEvent.ID) {
              foundEvent = true;
            }
          }

          // this known event wasn't found in the list of events that were loaded
          if (foundEvent == false) {
            NeedUpcomingUpdate = true;
          }
        }

        if (NeedUpcomingUpdate == true) {
          $('#tblUpcomingEvents').fadeOut('fast', function() {
            $('#tblUpcomingEvents').empty();
            $('#tblUpcomingEvents').append("<tbody></tbody>");
            for(var x = 0; x < UpcomingEvents.length; x++) {
                var ci = UpcomingEvents[x];
                $('#tblUpcomingEvents > tbody:last').append("<tr><td>" + createCalendarItem(ci.ID, ci.Title, ci.StartDate, ci.StartTime, ci.EndDate, ci.EndTime, ci.Description) + "</td></tr>");
            }
            $('#tblUpcomingEvents').fadeIn();
          });          
        }

        // Update the list of known upcoming events
        KnownCurrentEvents = CurrentEvents;
        KnownUpcomingEvents = UpcomingEvents;
    });

}