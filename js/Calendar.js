'use strict'

class Calendar {
    constructor() {
        this.FCalendar = null
        this.ghostCourse = null
        this.courses_filtered = []

        this.courses_oncalendar = []
    }

    async fetchData(yearSemester) {
        this.ghostCourse = null
        // Load data
        let data = await fetch('json/' + yearSemester + '.json')
        data = await data.json()

        this.datetime_retrieved = data["datetime_retrieved"]
        this.year = data["year"]
        this.semester = data["semester"]
        this.courses_first_day = data["courses_first_day"]
        this.courses_last_day = data["courses_last_day"]
        
        
        this.courses = []
        for (const c of data["courses"]) {
            this.courses.push(new Course(c))
        }

        // generate course list 
        var courselist = document.getElementById("courselist")
        courselist.innerHTML = ""
        
        for (const c of this.courses) {
          courselist.appendChild(c.courseListHTML)
        }
    }

    generateResources() {
        let unique_locations = []

        for (const c of this.courses) {
            for (const sch of c.schedule) {
                if (!(sch.room in unique_locations)) {
                    unique_locations.push(sch.room)
                }
            }
        }

        unique_locations.sort()

        let resources = []
        for (const location of unique_locations) {
            if (location == "TBSCH") {
                resources.push({
                    id: "TBSCH",
                    groupId: "?"
                })
            } else if (!["A", "B", "C", "G", "L", "T", "O", "W"].includes(location.slice(0, 1))) {
                console.log("Unknown location found: " + location)
                resources.push({
                    id: location,
                    groupId: "?"
                })
            } else {
                resources.push({
                    id: location,
                    groupId: location.slice(0, 1)
                })
            }
        }
        console.log(resources)
        return resources
    }
    
    
    // Toggles visibility of course in calendar
    toggleFCalendar(crn) {

        for (const c of this.courses) {
            if (c.crn == crn) {
                let status = c.toggleFShown(this.FCalendar)
                this.ghostCourse = null
                c.ghost = false



                if (status) {
                    this.courses_oncalendar.push(c)
                } else {
                    this.courses_oncalendar.splice(this.courses_oncalendar.indexOf(c))
                    this.setGhostFCalendar(crn)
                }
                return
            }
        }
    }

    // Sets the current ghost in FullCalendar
    setGhostFCalendar(crn) {
        //console.log(crn, this.ghostCourse, this.ghostCourse === null ? "" : this.ghostCourse.ghost)
        // if nothing is ghosted don't try to delete previous ghost
        if (this.ghostCourse != null) {
            // if its the same course do nothing
            if (this.ghostCourse.crn === crn)
                return

            // if its a different course then we need to delete the current ghost
            if (this.ghostCourse.crn != crn)
                if (this.ghostCourse.ghost) {
                    this.ghostCourse.hideFCalendar(this.FCalendar)
                    this.ghostCourse.ghost = false
                    this.ghostCourse = null
                }
        }

        if (crn === null) {
            this.ghostCourse = null
            return
        }

        for (const c of this.courses) {
            if (c.crn == crn) {
                // don't do ghost stuff if its shown
                if (c.shown)
                    return
                    
                c.showFCalendar(this.FCalendar, "gray")
                this.ghostCourse = c
                this.ghostCourse.ghost = true
                return
            }
        }
    }

    showCourseInfo(crn) {
        let c = null
        for (const course of this.courses) {
            if (course.crn == crn) {
                c = course
                break
            }
        }
        let new_window = window.open("", "_blank", "toolbar=no,width=800,height=700")
        new_window.document.body.innerHTML = c.generateCourseInfoHTML()
    }

    // Toggles all courses
    toggleAllFCalendar(show) {
        for (const c of this.courses_filtered) {
            if (show)  {
                c.showFCalendar(this.FCalendar)
            } else {
                c.hideFCalendar(this.FCalendar)
            }
        }
    }

    // called whenever we need to update the courselist
    // ie new search entered, different option set
    courselistUpdate() {
        let search = document.getElementById("courseSearchBar").value

        this.filterCoursesBySearch(search)
        this.reloadCourseList()
    }

    // filters courselists internally into courses_hidden and courses_filtered
    filterCoursesBySearch(search) {
        this.courses_hidden = []
        this.courses_filtered = [...this.courses] 

        const ext = this.dateExtractor(search)
        search = ext[0]
        let specified_days = ext[2]

        // don't run fuzzy search if there's nothing to search for
        search = search.trim()
        if (search != "") {
            this.courses_hidden = [...this.courses]
            this.courses_filtered = []

            // fuzzy search is hard
            // we'll come back to this
            let thresh = 0.2  
            if (search.length >= 9) 
                thresh = 0.09
                    
            const fuse_options = {
                includeScore: true,
                shouldSort: false,
                threshold: thresh,
                //useExtendedSearch: true,
                ignoreLocation: true,
                keys: [
                    "fuzzySearch"
                ]
            }

            const fuse = new Fuse(this.courses, fuse_options)
            let search_results = fuse.search(search)
            //console.log(search_results)

            // filter courselist with fuzzy search
            for(const search_result of search_results) {
                const c = search_result.item

                // add to filtered list
                this.courses_filtered.push(c)

                // remove from hidden list
                let remove = this.courses_hidden.indexOf(c)
                this.courses_hidden.splice(remove, 1)
            }
        }

        // overrides 
        // ie online -> show online only courses only
        // TP:R -> restricted courses
        // schedule:lab -> courses with lab
        // TODO: implement this (possibly make this a seperate menu??)

        // TODO: CHANGE THIS TO A DROP DOWN MENU BECAUSE TEXT DOES NOT WORK FOR THIS
        // filter courselist with day specification
        // runs only if day parameter found
        if (ext[1]) {
            for (const c of this.courses_filtered) {
                let day_is_ok = false
                loop:
                for (const sch of c.schedule) {
                    for (const day in specified_days) {
                        if (sch.days[day-1] != "-" && specified_days[day]) {
                            day_is_ok = true
                            break loop
                        }
                    }
                }

                if (!day_is_ok) {
                    let remove = this.courses_filtered.indexOf(c)
                    this.courses_filtered.splice(remove, 1)
                    this.courses_hidden.push(c)
                }
            }
        }
        
        // hide courses that conflict by schedule
        // this approach doesn't support outside events ie gcal but that is too much hassle to setup anyways
        let conflicts = document.getElementById("conflictCheckbox").checked
        if (conflicts) {            
            // this horrible reversing is because when we remove elements the list decrements by one causing us to miss some courses
            for (const potential_course of [...this.courses_filtered].reverse()) {
                for (const shown_course of this.courses_oncalendar) {
                    if (potential_course == shown_course) {
                        continue
                    }
                    let conflict = this.findTimeConflict(potential_course, shown_course)
                    //console.log(conflict, potential_course, shown_course)

                    if (conflict) {
                        this.hideCourse(potential_course)
                    }
                }
            }

        }
    }

    // takes 2 Course's and determines if they conflict.
    // returns true if conflict found, false if there is no conflict
    findTimeConflict(course1, course2) {
        // divide time into 7 days of 10 minute chunks (7 * (24 * 60)/10 = 1008)
        // bad long term solution, but it is performant for now
        // THIS WILL BREAK IF 12 HOUR TIME IS USED
        let time = new Array(1008)
        time.fill(false)

        let schedules = course1.schedule.concat(course2.schedule)

        for (const sch of schedules) {

            for (let i=0; i<7;i++) {
                if (sch.days[i] != '-') {

                    let starthour = +sch.time.slice(0, 2)
                    let startmin = +sch.time.slice(2, 4)
                    let endhour = +sch.time.slice(5, 7)
                    let endmin = +sch.time.slice(7, 10)
                    let breakout = 0
                    
                    // turn :25 -> :20
                    startmin = Math.round((startmin-1 ) / 10) * 10
                    
                    // turn :25 -> :30
                    endmin = Math.round((endmin+1 ) / 10) * 10

                    //console.log("SAVING TIMES FOR SCH:", sch)
                    
                    while (starthour != endhour || startmin < ((endmin+10)%60)) {
                        let offset = 144 * i // 10 minute increment in days
                        offset += (starthour * 60) / 10
                        offset += startmin / 10 
                        
                        //console.log(offset, starthour, startmin, endhour, endmin)

                        if (time[offset]) {
                            return true
                        }
                        time[offset] = true

                        startmin += 10
                        if (startmin == 60) {
                            startmin = 0
                            starthour += 1
                        }
                        breakout += 1
                        if (breakout > 100) {
                            alert("BREAKOUT FAILSAFE ACTIVATED. If you are seeing this something went wrong contact Highfire1 with what happened\n", offset, starthour, startmin, endhour, endmin)
                            console.log("BREAKOUT", offset, starthour, startmin, endhour, endmin)
                            break
                        }
                    }
                }
            }

        }

        return false
    }



    hideCourse(c) {
        this.courses_hidden.push(c)
        this.courses_filtered.splice(this.courses_filtered.indexOf(c), 1)
    }



    // extracts dates from a search query (ie given "CPSC Sun Saturday", returns ["CPSC", 6, 7])
    dateExtractor(string) {

        const lookup = {
            "mo" : 1,
            "mon" : 1,
            "monday" : 1,
            "tu" : 2,
            "tue" : 2,
            "tuesday" : 2,
            "we" : 3,
            "wed" : 3,
            "wednesday" : 3,
            "th" : 4,
            "thu" : 4,
            "thursday" : 4,
            "fr" : 5,
            "fri" : 5,
            "friday" : 5,
            "sa" : 6,
            "sat" : 6,
            "saturday" : 6,
            "su" : 7,
            "sun" : 7,
            "sunday" : 7,
        }

        const split = string.split(" ")

        let out = ""
        let days = []
        let days_out = {
            1 : false,
            2 : false,
            3 : false,
            4 : false,
            5 : false,
            6 : false,
            7 : false,
        }
        let day_param_found = false

        for (const term of split) {
            if (term.toLowerCase() in lookup) {
                days_out[lookup[term]] = true
                day_param_found = true
            } else 
                out += term + " "
        }

        if (!day_param_found) {
            for (const i in days_out) 
                days_out[i] = true
        }

        return [out, day_param_found, days_out]
    }

    reloadCourseList() {
        const count = this.courses_filtered.length
        if (count == 0) 
            document.getElementById("searchResults").innerText = "No courses found. Try a different search query!"
        else 
            document.getElementById("searchResults").innerText = `${count} courses shown.`

        

        for(const c of this.courses_filtered.reverse()) {
            c.courseListHTML.classList.remove("hidden")
        }

        // keep selected courses on list
        // might be better to just make a second bar for this
        for(const c of this.courses_hidden) {
            if (!this.courses_oncalendar.includes(c)) {
                c.courseListHTML.classList.add("hidden")
            }
        }
    }

}