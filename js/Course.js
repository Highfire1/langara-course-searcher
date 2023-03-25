class Course {
    constructor(data) {        
        this.RP = data["RP"]
        this.seats = data["seats"]
        this.waitlist = data["waitlist"]
        this.crn = data["crn"]
        this.subject = data["subject"]
        this.course = data["course"]
        this.section = data["section"]
        this.credits = data["credits"]
        this.title = data["title"]
        this.add_fees = data["add_fees"]
        this.rpt_limit = data["rpt_limit"]
        this.notes = data["notes"]
        this.schedule = data["schedule"]

        this.subjectCourse = this.subject + " " + this.course
        this.scheduleSearch = []
        for (const sch of this.schedule) {
            this.scheduleSearch.push(sch["type"])
            this.scheduleSearch.push(sch["time"])
            this.scheduleSearch.push(sch["room"])
            this.scheduleSearch.push(sch["instructor"])
        }
        this.scheduleSearch = [...new Set(this.scheduleSearch)] // remove duplicate values i know its not efficient to add then remove duplicates shush
        this.scheduleSearch = this.scheduleSearch.join(" ")
        
        this.fuzzySearch = `${this.subject} ${this.course} ${this.crn} ${this.title} ${this.scheduleSearch}`
        if (this.notes != null) 
            this.fuzzySearch += " " + this.notes


        this.shown = false
        this.ghost = false
        this.courseListHTML = this.generateCourseListHTML()
    }

    toString() {
        let out = `${this.RP} ${this.seats} ${this.waitlist} ${this.crn} ${this.subject} ${this.course} ${this.section} ${this.credits} ${this.title} ${this.add_fees}`

        for (const s of this.schedule) {
            out += "\n" + `\t${s.type} ${s.days} ${s.time} ${s.start} ${s.end} ${s.room} ${s.instructor}`
        }

        return out
    }

    // html in the courselist on the sidebar
    generateCourseListHTML(){
        let scheduleHTML = ""

        for(const sch of this.schedule) {
            scheduleHTML += `<p>${sch.type} ${sch.days} ${sch.time} ${sch.room} ${sch.instructor}</p>`
        }

        if (!(this.notes === null)) {
            scheduleHTML += `<p>${this.notes}</p>`
        }
        
        let html = `
            <h3 class="courselisttitle">${this.subject} ${this.course} ${this.section} : ${this.title} </h3>
            ${scheduleHTML}
        `
        let temp = document.createElement('div');
        temp.innerHTML = html
        temp.id = this.crn
        temp.className = "courselistcourse"

        return temp
    }

    // html for the course info that opens in a new window
    generateCourseInfoHTML(){
        let html = "<!DOCTYPE html>"
        html += `<style>
        h2 {margin-bottom: 2px;}
        .grid {max-width:90vw; display: grid; grid: auto auto/ fit-content(100%) fit-content(100%);}
        .sched {max-width:90vw; display: grid; grid: auto / repeat(7, fit-content(100%));}
        div > * {border: 1px solid #000; padding-right: 5px; padding-left: 5px; padding-top:2px; padding-bottom:2px; margin: 0;}
        iframe {width:90vw; height: 300px; padding: 10px;} 
        </style>`

        html += `<h2>${this.subject} ${this.course} ${this.section} ${this.crn}: ${this.title} </h2>`

        
        html += `<div class="sched">`
        html += `<p>Type</p><p>Day(s)</p><p>Time</p><p>Non Standard Start</p><p>Non Standard End</p><p>Room</p><p>Instructor(s)</p>`
        for (const sch of this.schedule) {
            html += `<p>${sch.type}</p><p>${sch.days}</p><p>${sch.time}</p><p>${sch.start}</p><p>${sch.end}</p><p>${sch.room}</p><p>${sch.instructor}</p>`
        }
        html += "</div>"

        html += "<h2>Section Information</h2>"
        html += `<div class="grid">`
        html += `<p>RP</p><p>${this.RP}</p>`
        html += `<p>Seats Available</p><p>${this.seats}</p>`
        html += `<p># On Waitlist</p><p>${this.waitlist}</p>`
        html += `<p>CRN</p><p>${this.crn}</p>`
        html += `<p>Subject</p><p>${this.subject}</p>`
        html += `<p>Course</p><p>${this.course}</p>`
        html += `<p>Section</p><p>${this.section}</p>`
        html += `<p>Credits</p><p>${this.credits}</p>`
        html += `<p>Title</p><p>${this.title}</p>`
        html += `<p>Additional Fees</p><p>${this.add_fees}</p>`
        html += `<p>Repeat Limit</p><p>${this.rpt_limit}</p>`
        html += `<p>Notes</p><p>${this.notes}</p>`
        html += "</div><br>"

        html += "<h2>Course Information</h2>"
        html += `<iframe src="https://swing.langara.bc.ca/prod/hzgkcald.P_DisplayCatalog?term_in=202320&subj=${this.subject}&crse=${this.course}"></iframe>`

        html += "<h2>Transferability</h2>"
        html += `
        <div class="sched">
            <p>Not yet implemented</p>
        </div>`
        

        return html
    }

    toggleFShown(FCalendar) {
        if (this.ghost) {
            this.hideFCalendar(FCalendar)
            this.showFCalendar(FCalendar)
            this.ghost = false
            return true
        } else if (this.shown) {
            this.hideFCalendar(FCalendar)
            return false
        } else {
            this.showFCalendar(FCalendar)
            return true
        }

    }

    hideFCalendar(FCalendar) {
        // getEventById only returns one event at a time
        // but getEvents doesn't get events that aren't currently shown so it doesn't work
        while (FCalendar.getEventById(this.crn) != null) 
            FCalendar.getEventById(this.crn).remove()
        
        this.shown = false
        document.getElementById(this.crn).style.backgroundColor = null
    }

    showFCalendar(FCalendar, color="#279AF1") {

        for (const sch of this.schedule) {

            if (sch.days === "-------"){
                continue // if there's no time slot then we don't need to render it
            }

            // convert M-W---- to [1, 3]
            let value = 1
            let days = []
            for (const c of sch.days) {
                if (!(c === '-')) {
                days.push(value)
                }
                value = (value + 1) % 7        
            }

            let times = sch.time.split("-")
            let s_time = times[0].slice(0, 2) + ":" + times[0].slice(2, 4)
            let e_time = times[1].slice(0, 2) + ":" + times[1].slice(2, 4)
            
            //console.log(new Date(sch["start"]), sch["end"])
            let f = {
                id: this.crn,
                title: `${this.subject} ${this.course} ${this.crn}`,
                description: `${this.subject} ${this.course} ${this.section} <br> ${sch.type} ${sch.room}`,
                startRecur: new Date(sch["start"]),
                endRecur: new Date(new Date(sch["end"]).getTime() + 86400000), // add 24 hours to the date to show 1 day events
                daysOfWeek: days,
                startTime: s_time,
                endTime: e_time,
                backgroundColor: color,
                classNames: ["calendartxt"],
                resourceId: sch.room,
                overlap: false,
                extendedProps: {
                    course : this
                },
                source: "json"
              }
            
            FCalendar.addEvent(f)

        }

        this.shown = true
        document.getElementById(this.crn).style.backgroundColor = color
    }   


}