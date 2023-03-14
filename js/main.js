var calendarClass

// initialize the calendar
document.addEventListener('DOMContentLoaded', async function() {
    var calendarElement = document.getElementById('calendar');
    calendarClass = new Calendar()
    await calendarClass.fetchData(202320)

    var FCalendar = new FullCalendar.Calendar(calendarElement, {
      initialView: 'timeGridWeek',
      slotMinTime:"07:00",
      slotMaxTime:"22:00",
      displayEventTime: false,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      weekends: document.getElementById("weekendCheckbox").checked,
      initialDate: new Date(calendarClass.courses_first_day),
      slotEventOverlap:false,
      
      // fires when event is created, adds a second line of text to event because you can't by default ._.
      eventContent: function(info) {
        let p = document.createElement('p')
        p.innerHTML = info.event.extendedProps["description"]
        return { domNodes: [p] }
      }

    })

    FCalendar.render();

    calendarClass.FCalendar = FCalendar

    // event handlers
    this.getElementById("weekendCheckbox").addEventListener("input", function (event) {
        FCalendar.setOption('weekends', event.target.checked)
        FCalendar.render()
    })

    this.getElementById("courselist").addEventListener("click", function (event) {
      target = event.target
      if (target.nodeName != "DIV")
        target = event.target.parentElement
      
      if (target.className == "courselistcourse")
        calendarClass.toggleFCalendar(target.id)
    })

    // ghosting fucntionality
    this.getElementById("courselist").addEventListener("mouseover", function (event) {

      target = event.target
      if (target.nodeName != "DIV")
        target = event.target.parentElement
      
      if (target.className == "courselistcourse")
        calendarClass.toggleGhostFCalendar(target.id)
    })

    this.getElementById("courselist").addEventListener("mouseleave", function (event) {
      calendarClass.toggleGhostFCalendar(null)
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
    this.getElementById("showAllCheckbox").checked = false
    this.getElementById("showAllCheckbox").addEventListener("input", function (event) {
      c = true
      if (event.target.checked && calendarClass.courses_filtered.length > 50)
        c = confirm(`Are you sure? This will render ${calendarClass.courses_filtered.length} classes to the calendar - it may take a few minutes.`)
      
      if (c)
        calendarClass.toggleAllFCalendar(event.target.checked)
      else
        event.target.checked = !event.target.checked
    })

    // populate termSelector and event handler
    let ts = this.getElementById("termSelector")
    for (let i=2023; i >= 2000; i--) {
      ts.innerHTML += `<option value="${i}30">${i} Fall</option>`
      ts.innerHTML += `<option value="${i}20">${i} Summer</option>`
      ts.innerHTML += `<option value="${i}10">${i} Spring</option>`
    }
    ts.children[0].remove() // remove 2023 fall as it doesn't exist yet
    

    ts.addEventListener("input", async function (event) {
      console.log(event.target.value)
      await calendarClass.fetchData(parseInt(event.target.value))
      calendarClass.FCalendar.gotoDate(new Date(calendarClass.courses_first_day))
    })

    
    //calendar.render();
    //calendarClass.generateCourseList()

    //this.getElementById("courseSearchBar").addEventListener('input', function() {refreshCourseList()}) // search bar event handler
    //this.getElementById("termSelector").addEventListener('change', function() {generateCourseList()})  

    //toggleDescriptionCheckbox()
  });
