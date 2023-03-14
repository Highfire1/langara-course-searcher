'use strict'

class Calendar {
    constructor() {
        this.FCalendar = null
        this.ghostCourse = null
        this.courses_filtered = []
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

        this.filterCoursesBySearch(document.getElementById("courseSearchBar").value)
        this.reloadCourseList()
    }
    
    
    // Toggles visibility of course in calendar
    toggleFCalendar(crn) {

        for (const c of this.courses) {
            if (c.crn == crn) {
                c.toggleFShown(this.FCalendar)
                return
            }
        }
    }

    // Toggles ghost visibility of course in calendar
    toggleGhostFCalendar(crn) {
        if (this.ghostCourse != null) {
            if (this.ghostCourse.crn === crn)
                return
            if (this.ghostCourse.crn != crn)
                if (this.ghostCourse.ghost) {
                    this.ghostCourse.hideFCalendar(this.FCalendar)
                    this.ghostCourse.ghost = false
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

    // Toggles all courses
    toggleAllFCalendar(show) {
        let i = 0
        for (const c of this.courses_filtered) {
            if (show)  {
                console.log(`${++i}/${this.courses_filtered.length} courses rendered.`)
                c.showFCalendar(this.FCalendar)
            } else {
                c.hideFCalendar(this.FCalendar)
            }
        }

        if (show)
            document.getElementById("showAllCheckboxLabel").innerText = "Hide all courses in list."
        else
            document.getElementById("showAllCheckboxLabel").innerText = "Show all courses in list."

    }

    courselistUpdate() {
        let search = document.getElementById("courseSearchBar").value
        let conflicts = document.getElementById("conflictCheckbox").value

        this.filterCoursesBySearch(search)
        this.reloadCourseList()
    }

    filterCoursesBySearch(search) {
        this.courses_hidden = []
        this.courses_filtered = [...this.courses] 

        search = search.trim()
        if (search == "")
            return

        this.courses_hidden = [...this.courses]
        this.courses_filtered = []

        const ext = this.dateExtractor(search)
        search = ext[0]
        let specified_days = ext[2]

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

        // filter courselist with day specification
        // runs only if day parameter found
        if (ext[1]) {
            for (const c of this.courses_filtered) {
                let day_is_ok = false
                loop:
                for (const sch of c.schedule) {
                    for (const day in specified_days) {
                        console.log(day, specified_days)
                        if (sch.days[day-1] != "-" && specified_days[day]) {
                            day_is_ok = true
                            break loop
                        }
                    }
                }
                console.log("OK?", day_is_ok)
                if (!day_is_ok) {
                    let remove = this.courses_filtered.indexOf(c)
                    this.courses_filtered.splice(remove, 1)
                    this.courses_hidden.push(c)
                    console.log("HIDE")
                }
            }

            console.log(this.courses_filtered)
        }
    }

    hideCourse(c) {
        let remove = this.courses_filtered.indexOf(c)
        this.courses_filtered.splice(remove, 1)
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

        console.log("AAAAAA", [out, days_out])
        return [out, day_param_found, days_out]
    }

    reloadCourseList() {
        let doc = document.getElementById("courselist")

        document.getElementById("searchResults").innerText = `${this.courses_filtered.length} courses shown.`
        

        for(const c of this.courses_filtered.reverse()) {
            c.courseListHTML.classList.remove("hidden")
            doc.removeChild(c.courseListHTML)
            doc.prepend(c.courseListHTML)
        }

        for(const c of this.courses_hidden) {
            c.courseListHTML.classList.add("hidden")
        }
    }




}