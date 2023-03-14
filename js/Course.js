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

    generateCourseListHTML(){
        let scheduleHTML = ""

        for(const sch of this.schedule) {
            scheduleHTML += `<p>${sch.type} ${sch.days} ${sch.time} ${sch.room} ${sch.instructor}</p>`
        }

        if (!(this.notes === null)) {
            scheduleHTML += `<p>${this.notes}</p>`
        }
        
        let html = `
            <h3>${this.subject} ${this.course} ${this.section} : ${this.title} </h3>
            ${scheduleHTML}
        `
        let temp = document.createElement('div');
        temp.innerHTML = html
        temp.id = this.crn
        temp.className = "courselistcourse"

        return temp
    }

    toggleFShown(FCalendar) {
        if (this.ghost) {
            this.hideFCalendar(FCalendar)
            this.showFCalendar(FCalendar)
            this.ghost = false
        } else if (this.shown) 
            this.hideFCalendar(FCalendar)
        else
            this.showFCalendar(FCalendar)


    }

    hideFCalendar(FCalendar) {
        let rem = FCalendar.getEvents()
        
        for (const e of rem) {
            if (e.id == this.crn) {
                e.remove() 
            }
        }
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
                endRecur: new Date(sch["end"]),
                daysOfWeek: days,
                startTime: s_time,
                endTime: e_time,
                backgroundColor: color,
                classNames: ["calendartxt"],
                overlap: false,
              }
            
            FCalendar.addEvent(f)
        }

        this.shown = true
        document.getElementById(this.crn).style.backgroundColor = color
    }   


}