'use strict';

/* eslint-disable */
/* eslint-env jquery */
/* global moment, tui, chance */
/* global findCalendar, CalendarList, ScheduleList, generateSchedule */

(function(window, Calendar) {
    var cal, resizeThrottled;
    var useCreationPopup = false;
    var useDetailPopup = false;
    var datePicker, selectedCalendar;
    var globalGuideCalender;
    cal = new Calendar('#calendar', {
		usageStatistics: false,		
        defaultView: 'week',      
        useCreationPopup: useCreationPopup,
        useDetailPopup: useDetailPopup,
        calendars: CalendarList,	
		taskView: false, 		
		scheduleView: ['time'],
        week : {
            hourStart: 6,
            hourEnd: 23
          },
        template: {          
            time: function(schedule) {
                return getTimeTemplate(schedule, false);
            }
        }
    });
	cal.setOptions({week: {startDayOfWeek: 1}}, true);
	cal.changeView(cal.getViewName(), true);
    // event handlers
    cal.on({
        'clickMore': function(e) {
            console.log('clickMore', e);
        },
        'clickSchedule': function(e) {
            console.log('clickSchedule', e);

            var d = document.getElementById('customPopup');
			d.style.position = "absolute";
			d.style.left = e.event.pageX+'px';
			d.style.top = e.event.pageY+'px';
            d.style.display = 'block';

            fillPopupElement(e.schedule.state);

            globalGuideCalender.clearGuideElement();
        },
        'clickDayname': function(date) {
            console.log('clickDayname', date);
        },
        'beforeCreateSchedule': function(e) {
            console.log('beforeCreateSchedule', e);
            
			var rect = e.guide.guideElement.getBoundingClientRect()
			//console.log(rect.top, rect.right, rect.bottom, rect.left);
			
			var d = document.getElementById('customPopup');
			d.style.position = "absolute";
			d.style.left = rect.left+220+'px';
			d.style.top = rect.top+'px';
            d.style.display = 'block';

            $("#startDateScheduled").val(e.start.toLocalTime().toDate());
            $("#endDateScheduled").val(e.end.toLocalTime().toDate());
            
            
            clearPopupElement();
            enableElements();
			globalGuideCalender = e.guide;
            
            //saveNewSchedule(e);
			//e.guide.clearGuideElement();
        },
        'beforeUpdateSchedule': function(e) {
            var schedule = e.schedule;
            var changes = e.changes;

            console.log('beforeUpdateSchedule', e);

            if (changes && !changes.isAllDay && schedule.category === 'allday') {
                changes.category = 'time';
            }

            cal.updateSchedule(schedule.id, schedule.calendarId, changes);
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': function(e) {
            console.log('beforeDeleteSchedule', e);
            cal.deleteSchedule(e.schedule.id, e.schedule.calendarId);
        },
        'afterRenderSchedule': function(e) {
            var schedule = e.schedule;
            // var element = cal.getElement(schedule.id, schedule.calendarId);
            // console.log('afterRenderSchedule', element);
        },
        'clickTimezonesCollapseBtn': function(timezonesCollapsed) {
            console.log('timezonesCollapsed', timezonesCollapsed);

            if (timezonesCollapsed) {
                cal.setTheme({
                    'week.daygridLeft.width': '77px',
                    'week.timegridLeft.width': '77px'
                });
            } else {
                cal.setTheme({
                    'week.daygridLeft.width': '60px',
                    'week.timegridLeft.width': '60px'
                });
            }

            return true;
        }
    });

    $("#addScheduleButton").click(function(){
        
        var selectedRoom = $(".roomCbBtn").attr("name");
        var requesterName = $("#requesterName").val();
        var requesterMail = $("#requesterMail").val();
        var startDateScheduled = $("#startDateScheduled").val();
        var endDateScheduled = $("#endDateScheduled").val();
        var meetingSubject = $("#meetingSubject").val();
        var description = $("#requesterDescription").val();

        console.log(requesterMail + " " + requesterName + "  " + selectedRoom);
        //alert(selectedRoom);

        var selectedCal = cal;
        CalendarList.forEach(function(calendar) {
            if(calendar.id == selectedRoom)selectedCal = calendar;            
        });

        cal.createSchedules([
            {
                id: String(chance.guid()),
                calendarId: selectedRoom,
                title: meetingSubject,
                body: description,
                category: 'time',
                dueDateClass: '',
                isVisible:true,
                start: new Date(startDateScheduled),
                end: new Date(endDateScheduled),
                isReadOnly: true,
                color:selectedCal.color,
                bgColor:selectedCal.bgColor,
                dragBgColor:selectedCal.dragBgColor,
                borderColor:selectedCal.borderColor,
                
            }
        ]);

        refreshScheduleVisibility();

        document.getElementById('customPopup').style.display = 'none';
        var data = {
            ID:"",   
            REQUESTER_NAME:requesterName,
            REQUESTER_MAIL:requesterMail,
            MEETING_ROOM:   $(".roomCbBtn").text(),
            ARRANGE_TIME_START: ISODateString(new Date(startDateScheduled)),
            ARRANGE_TIME_END:ISODateString(new Date(endDateScheduled)),
            APPROVMENT_STATUS: 2,
            DESCRIPTION:description,
            TITLE:meetingSubject
           };

        $.ajax({
            url: "http://10.90.252.98:8080/addAppointment",
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',        
            data: JSON.stringify(data),
            success: function(e) {
                alert("Toplantı odası talebiniz alınmıştır. Uygunluk durumu kontrol edilip, mail olarak en kısa sürede dönüş sağlanacaktır.");
            },        
            error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            }
        });

    });

    $('.dropdown-menu li').click(function(){
        //your code
        $(".roomCbBtn").text(this.textContent);     
        $(".roomCbBtn").attr('name', this.value);   
    });
    function ISODateString(d){
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
             + pad(d.getUTCMonth()+1)+'-'
             + pad(d.getUTCDate())+'T'
             + pad(d.getUTCHours()+3)+':'
             + pad(d.getUTCMinutes())+':'
             + pad(d.getUTCSeconds())+'Z'
    }
    function clearPopupElement(){
        
        $("#requesterName").val("");
        $("#requesterMail").val("");
        $("#meetingSubject").val("");
        $("#requesterDescription").val("");
        
    }

    function fillPopupElement(itemId){
        
        console.log(genericAppoinmentDataList);

        genericAppoinmentDataList.forEach(item => {

            if(item.ID == itemId){

                $("#requesterName").val(item.REQUESTER_NAME);
                $("#requesterMail").val(item.REQUESTER_MAIL);
                $("#meetingSubject").val(item.TITLE);
                $("#requesterDescription").val(item.DESCRIPTION);
                disableElements();
            }
        });  
    }

    function disableElements(){

        $("#requesterName").prop( "disabled", true );
        $("#requesterMail").prop( "disabled", true );
        $("#meetingSubject").prop( "disabled", true );
        $("#requesterDescription").prop( "disabled", true );
        $("#addScheduleButton").prop( "disabled", true );
        $(".roomCbBtn").prop( "disabled", true );
        
    }

    function enableElements(){

        $("#requesterName").prop( "disabled", false );
        $("#requesterMail").prop( "disabled", false );
        $("#meetingSubject").prop( "disabled", false );
        $("#requesterDescription").prop( "disabled", false );
        $("#addScheduleButton").prop( "disabled", false );
        $(".roomCbBtn").prop( "disabled", false );
    }

    /**
     * Get time template for time and all-day
     * @param {Schedule} schedule - schedule
     * @param {boolean} isAllDay - isAllDay or hasMultiDates
     * @returns {string}
     */
    function getTimeTemplate(schedule, isAllDay) {
        var html = [];
        var start = moment(schedule.start.toUTCString());
        if (!isAllDay) {
            html.push('<strong>' + start.format('HH:mm') + '</strong> ');
        }
        if (schedule.isPrivate) {
            html.push('<span class="calendar-font-icon ic-lock-b"></span>');
            html.push(' Private');
        } else {
            if (schedule.isReadOnly) {
                html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
            } else if (schedule.recurrenceRule) {
                html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
            } else if (schedule.attendees.length) {
                html.push('<span class="calendar-font-icon ic-user-b"></span>');
            } else if (schedule.location) {
                html.push('<span class="calendar-font-icon ic-location-b"></span>');
            }
            html.push(' ' + schedule.title);
        }

        return html.join('');
    }

    /**
     * A listener for click the menu
     * @param {Event} e - click event
     */
    function onClickMenu(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var action = getDataAction(target);
        var options = cal.getOptions();
        var viewName = '';

        console.log(target);
        console.log(action);
        switch (action) {
            case 'toggle-daily':
                viewName = 'day';
                break;
            case 'toggle-weekly':
                viewName = 'week';
                break;
            case 'toggle-monthly':
                options.month.visibleWeeksCount = 0;
                viewName = 'month';
                break;
            case 'toggle-weeks2':
                options.month.visibleWeeksCount = 2;
                viewName = 'month';
                break;
            case 'toggle-weeks3':
                options.month.visibleWeeksCount = 3;
                viewName = 'month';
                break;
            case 'toggle-narrow-weekend':
                options.month.narrowWeekend = !options.month.narrowWeekend;
                options.week.narrowWeekend = !options.week.narrowWeekend;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.narrowWeekend;
                break;
            case 'toggle-start-day-1':
                options.month.startDayOfWeek = options.month.startDayOfWeek ? 0 : 1;
                options.week.startDayOfWeek = options.week.startDayOfWeek ? 0 : 1;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.startDayOfWeek;
                break;
            case 'toggle-workweek':
                options.month.workweek = !options.month.workweek;
                options.week.workweek = !options.week.workweek;
                viewName = cal.getViewName();

                target.querySelector('input').checked = !options.month.workweek;
                break;
            default:
                break;
        }

        cal.setOptions(options, true);
        cal.changeView(viewName, true);

        setDropdownCalendarType();
        setRenderRangeText();
        setSchedules();
    }

    function onClickNavi(e) {
        var action = getDataAction(e.target);

        switch (action) {
            case 'move-prev':
                cal.prev();
                break;
            case 'move-next':
                cal.next();
                break;
            case 'move-today':
                cal.today();
                break;
            default:
                return;
        }

        setRenderRangeText();
        setSchedules();
    }

    function onNewSchedule() {
        var title = $('#new-schedule-title').val();
        var location = $('#new-schedule-location').val();
        var isAllDay = document.getElementById('new-schedule-allday').checked;
        var start = datePicker.getStartDate();
        var end = datePicker.getEndDate();
        var calendar = selectedCalendar ? selectedCalendar : CalendarList[0];

        if (!title) {
            return;
        }

        cal.createSchedules([{
            id: String(chance.guid()),
            calendarId: calendar.id,
            title: title,
            isAllDay: isAllDay,
            start: start,
            end: end,
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            raw: {
                location: location
            },
            state: 'Busy'
        }]);

        $('#modal-new-schedule').modal('hide');
    }

    function onChangeNewScheduleCalendar(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var calendarId = getDataAction(target);
        changeNewScheduleCalendar(calendarId);
    }

    function changeNewScheduleCalendar(calendarId) {
        var calendarNameElement = document.getElementById('calendarName');
        var calendar = findCalendar(calendarId);
        var html = [];

        html.push('<span class="calendar-bar" style="background-color: ' + calendar.bgColor + '; border-color:' + calendar.borderColor + ';"></span>');
        html.push('<span class="calendar-name">' + calendar.name + '</span>');

        calendarNameElement.innerHTML = html.join('');

        selectedCalendar = calendar;
    }

    function createNewSchedule(event) {
        var start = event.start ? new Date(event.start.getTime()) : new Date();
        var end = event.end ? new Date(event.end.getTime()) : moment().add(1, 'hours').toDate();

        if (useCreationPopup) {
            cal.openCreationPopup({
                start: start,
                end: end
            });
        }
    }
    function saveNewSchedule(scheduleData) {
        var calendar = scheduleData.calendar || findCalendar(scheduleData.calendarId);
        var schedule = {
            id: String(chance.guid()),
            title: 'Test',
            isAllDay: scheduleData.isAllDay,
            start: scheduleData.start,
            end: scheduleData.end,
            category: scheduleData.isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            //location: scheduleData.location,
            /*raw: {
                class: scheduleData.raw['class']
            },*/
            //state: scheduleData.state
        };
        if (calendar) {
            schedule.calendarId = calendar.id;
            schedule.color = calendar.color;
            schedule.bgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;
        }

        cal.createSchedules([schedule]);

        refreshScheduleVisibility();
    }

    function onChangeCalendars(e) {
        var calendarId = e.target.value;
        var checked = e.target.checked;
        var viewAll = document.querySelector('.lnb-calendars-item input');
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));
        var allCheckedCalendars = true;

        if (calendarId === 'all') {
            allCheckedCalendars = checked;

            calendarElements.forEach(function(input) {
                var span = input.parentNode;
                input.checked = checked;
                span.style.backgroundColor = checked ? span.style.borderColor : 'transparent';
            });

            CalendarList.forEach(function(calendar) {
                calendar.checked = checked;
            });
        } else {
            findCalendar(calendarId).checked = checked;

            allCheckedCalendars = calendarElements.every(function(input) {
                return input.checked;
            });

            if (allCheckedCalendars) {
                viewAll.checked = true;
            } else {
                viewAll.checked = false;
            }
        }

        refreshScheduleVisibility();
    }

    function refreshScheduleVisibility() {
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));

        CalendarList.forEach(function(calendar) {
            cal.toggleSchedules(calendar.id, !calendar.checked, false);
        });

        cal.render(true);

        calendarElements.forEach(function(input) {
            var span = input.nextElementSibling;
            span.style.backgroundColor = input.checked ? span.style.borderColor : 'transparent';
        });
    }

    function setDropdownCalendarType() {
        var calendarTypeName = document.getElementById('calendarTypeName');
        var calendarTypeIcon = document.getElementById('calendarTypeIcon');
        var options = cal.getOptions();
        var type = cal.getViewName();
        var iconClassName;

        if (type === 'day') {
            type = 'Daily';
            iconClassName = 'calendar-icon ic_view_day';
        } else if (type === 'week') {
            type = 'Weekly';
            iconClassName = 'calendar-icon ic_view_week';
        } else if (options.month.visibleWeeksCount === 2) {
            type = '2 weeks';
            iconClassName = 'calendar-icon ic_view_week';
        } else if (options.month.visibleWeeksCount === 3) {
            type = '3 weeks';
            iconClassName = 'calendar-icon ic_view_week';
        } else {
            type = 'Monthly';
            iconClassName = 'calendar-icon ic_view_month';
        }

        calendarTypeName.innerHTML = type;
        calendarTypeIcon.className = iconClassName;
    }

    function currentCalendarDate(format) {
      var currentDate = moment([cal.getDate().getFullYear(), cal.getDate().getMonth(), cal.getDate().getDate()]);

      return currentDate.format(format);
    }

    function setRenderRangeText() {
        var renderRange = document.getElementById('renderRange');
        var options = cal.getOptions();
        var viewName = cal.getViewName();

        var html = [];
        if (viewName === 'day') {
            html.push(currentCalendarDate('YYYY.MM.DD'));
        } else if (viewName === 'month' &&
            (!options.month.visibleWeeksCount || options.month.visibleWeeksCount > 4)) {
            html.push(currentCalendarDate('YYYY.MM'));
        } else {
            html.push(moment(cal.getDateRangeStart().getTime()).format('YYYY.MM.DD'));
            html.push(' ~ ');
            html.push(moment(cal.getDateRangeEnd().getTime()).format(' MM.DD'));
        }
        renderRange.innerHTML = html.join('');
    }
    var genericAppoinmentDataList = [];
    function setSchedules() {
        cal.clear();
        //generateSchedule(cal.getViewName(), cal.getDateRangeStart(), cal.getDateRangeEnd());
      //cal.createSchedules(ScheduleList);

      $.ajax({
        url: "http://10.90.252.98:8080/getAllAppointment",
        type: "GET",
        dataType: 'json',
        contentType: 'application/json',                
        success: function(data) {

            genericAppoinmentDataList = data;

            var list = [];
            data.forEach(element => {
     
                var selectedCal = cal;
                var selectedRoom = "1";
                if(element.MEETING_ROOM.toLowerCase().indexOf("farabi") != -1)selectedRoom = "2"
                
                CalendarList.forEach(function(calendar) {
                    if(calendar.id == selectedRoom)selectedCal = calendar;            
                });
                //Onaylanmış toplantı isteklerini gösterme koşulu - 3
                if(element.APPROVMENT_STATUS == 3){
                    list.push( {
                        id: chance.guid(),
                        calendarId: selectedRoom,
                        title: element.TITLE,
                        body: element.DESCRIPTION,
                        category: 'time',
                        dueDateClass: '',
                        start: new Date(element.ARRANGE_TIME_START),
                        end: new Date(element.ARRANGE_TIME_END),
                        isReadOnly: false,
                        state:element.ID
                    });
                }               
            });

            cal.createSchedules(list);
            refreshScheduleVisibility();

        },        
        error: function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
        }
    });
    }

    function setEventListener() {
        $('#menu-navi').on('click', onClickNavi);
        $('.dropdown-menu a[role="menuitem"]').on('click', onClickMenu);
        $('#lnb-calendars').on('change', onChangeCalendars);

        $('#btn-save-schedule').on('click', onNewSchedule);
        $('#btn-new-schedule').on('click', createNewSchedule);

        $('#dropdownMenu-calendars-list').on('click', onChangeNewScheduleCalendar);

        $('#closePopupButton').on('click', function(){
            document.getElementById('customPopup').style.display = 'none';
            clearPopupElement();
            globalGuideCalender.clearGuideElement();
        });
        
        window.addEventListener('resize', resizeThrottled);
    }

    function getDataAction(target) {
        return target.dataset ? target.dataset.action : target.getAttribute('data-action');
    }

    resizeThrottled = tui.util.throttle(function() {
        cal.render();
    }, 50);

    window.cal = cal;

    setDropdownCalendarType();
    setRenderRangeText();
    setSchedules();
    setEventListener();

})(window, tui.Calendar);

// set calendars
(function() {
    var calendarList = document.getElementById('calendarList');
    var html = [];
    CalendarList.forEach(function(calendar) {
        html.push('<div class="lnb-calendars-item"><label>' +
            '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
            '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
            '<span>' + calendar.name + '</span>' +
            '</label></div>'
        );
    });
    calendarList.innerHTML = html.join('\n');

    


})();




