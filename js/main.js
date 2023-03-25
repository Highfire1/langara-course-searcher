var calendarClass

// initialize the calendar
document.addEventListener('DOMContentLoaded', async function() {
    var calendarElement = document.getElementById('calendar');
    calendarClass = new Calendar()
    await calendarClass.fetchData(202320)

    //let resources = await (await fetch('json/resources.json')).json()
    //console.log(resources)
    
    var FCalendar = new FullCalendar.Calendar(calendarElement, {
      schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
      rerenderDelay: 10,
      resourceGroupField: 'groupId',
      resourceGroupLabelContent: function(arg) {return timelineLabelApplier(arg.groupValue)},
      resources: function(fetchInfo, successCallback, failureCallback) {successCallback(calendarClass.generateResources())},
      resourceAreaWidth: "120px",
      eventClick: function(eventClickInfo) {console.log(calendarClass.showCourseInfo(eventClickInfo.event.id))},
      timeZone: 'America/Vancouver',
      initialView: 'resourceTimelineDay', //'timeGridWeek',
      slotMinTime:"07:00",
      slotMaxTime:"22:00",
      displayEventTime: false,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'resourceTimelineDay,resourceTimelineWeek dayGridMonth,timeGridWeek,timeGridDay'
      },
      weekends: document.getElementById("weekendCheckbox").checked,
      initialDate: new Date(calendarClass.courses_first_day),
      slotEventOverlap:false,
      
      // fires when event is created, adds a second line of text to event because you can't by default ._.
      eventContent: function(info) {
        let p = document.createElement('p')
        p.innerHTML = info.event.extendedProps["description"]
        return { domNodes: [p] }
      },

    })

    FCalendar.render();

    calendarClass.FCalendar = FCalendar
    calendarClass.courselistUpdate()

    // event handlers
    this.getElementById("weekendCheckbox").addEventListener("input", function (event) {
        FCalendar.setOption('weekends', event.target.checked)
        FCalendar.render()
    })

    // show/hide courses on calendar when they are clicked on
    this.getElementById("courselist").addEventListener("click", function (event) {
      target = event.target

      // open info about course if title is clicked
      if (target.nodeName == "H3") {
        calendarClass.showCourseInfo(event.target.parentElement.id)
      
      // else put it on the calendar
      } else if (target.nodeName != "DIV") {
        target = event.target.parentElement
      
      } if (target.className == "courselistcourse") {
        calendarClass.toggleFCalendar(target.id)
        calendarClass.courselistUpdate()
      }
    })

    // ghosting functionality
    this.getElementById("courselist").addEventListener("mouseover", function (event) {

      target = event.target
      if (target.nodeName != "DIV")
        target = event.target.parentElement
      
      if (target.className == "courselistcourse")
      
      calendarClass.setGhostFCalendar(target.id)
    })

    this.getElementById("courselist").addEventListener("mouseleave", function (event) {
      calendarClass.setGhostFCalendar(null)
    })

    // search bar
    this.getElementById("courseSearchBar").addEventListener("input", function (event) {
      calendarClass.courselistUpdate()
    })

    // conflicting courses
    this.getElementById("conflictCheckbox").addEventListener("input", function (event) {
      calendarClass.courselistUpdate()
    })

    // toggle all
    let allCoursesShown = false
    this.getElementById("showAllButton").addEventListener("click", function (event) {
      console.log(event.target.value, event.target.value == "Show all courses in list.")

      if (!allCoursesShown) {
        let state = FCalendar.getOption('weekends')
        
        FCalendar.setOption('weekends', true) // must toggle weekends for them to render properly idk why
        calendarClass.toggleAllFCalendar(true)
        FCalendar.setOption('weekends', state)
        event.target.value = "Hide all courses in list."
        

      } else {
        calendarClass.toggleAllFCalendar(false)
        event.target.value = "Show all courses in list."
      }

      allCoursesShown = !allCoursesShown
    })

    // populate termSelector and event handler for changing terms
    let ts = this.getElementById("termSelector")
    for (let i=2023; i >= 2000; i--) {
      ts.innerHTML += `<option value="${i}30">${i} Fall</option>`
      ts.innerHTML += `<option value="${i}20">${i} Summer</option>`
      ts.innerHTML += `<option value="${i}10">${i} Spring</option>`
    }
    ts.children[0].remove() // remove 2023 fall as it doesn't exist yet
    
    ts.addEventListener("input", async function (event) {
      if (allCoursesShown)
        calendarClass.toggleAllFCalendar(false) // get rid of courses from previous term

      await calendarClass.fetchData(parseInt(event.target.value))
      calendarClass.FCalendar.gotoDate(new Date(calendarClass.courses_first_day))
      calendarClass.courselistUpdate()
      calendarClass.FCalendar.refetchResources()
      

      if (allCoursesShown)
        calendarClass.toggleAllFCalendar(true) // continue showing all courses
    })

    // copy courses to clipboard button
    let copyButton = this.getElementById("copyButton")
    copyButton.addEventListener("click", function () {
      if (calendarClass.courses_oncalendar.length == 0) {
        alert("Select at least one course first.")
        return
      }

      let text = ""

      for (const c of calendarClass.courses_oncalendar) {
        text += c.crn + "\t"
      }

      //text += "\n\nRP Seats Avail # on Waitlist Sel CRN Subj Crse Sec Cred Title Add'l Fees RptLimit"

      for (const c of calendarClass.courses_oncalendar) {
        text += "\n\n" + c.toString()
      }



      console.log(text)
      navigator.clipboard.writeText(text)
      let s = calendarClass.courses_oncalendar.length == 1 ? "" : "s"

      alert(`Saved ${calendarClass.courses_oncalendar.length} course${s} to clipboard.`)
    })



    
    //calendar.render();
    //calendarClass.generateCourseList()

    //this.getElementById("courseSearchBar").addEventListener('input', function() {refreshCourseList()}) // search bar event handler
    //this.getElementById("termSelector").addEventListener('change', function() {generateCourseList()})  

    //toggleDescriptionCheckbox()
});

function timelineLabelApplier(name) {
  let names = {
    "A" : "A Building",
    "B" : "B Building",
    "C" : "C Building",
    "G" : "Gymnasium",
    "L" : "Library",
    "T" : "T Building",
    "O" : "Off Campus",
    "W" : "WWW / Online",
    "?" : "Other",
  } 

  return names[name]
}
