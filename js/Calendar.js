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

        if (search == "")
            return

        let strictsearch = true
        if (search.split(" ") > 2) {
            strictsearch = false
        } 

        let ext = this.dateExtractor(search)
        search = ext[0]
        let specified_days = ext.slice(1) // remove first element



        this.courses_hidden = [...this.courses]
        this.courses_filtered = []

        const options = {
            // isCaseSensitive: false,
            includeScore: true,
            // shouldSort: true,
            //includeMatches: true,
            //findAllMatches: false,
            //minMatchCharLength: 1,
            // location: 0,
            threshold: 0.1,
            distance: 200,
            useExtendedSearch: strictsearch,
            //ignoreLocation: true,
            // ignoreFieldNorm: false,
            // fieldNormWeight: 1,
            keys: [
                "subjectCourse",
                "scheduleSearch",
                "title",
                "section",
                "crn", 
                "notes",
              ]
              
        }

        const fuse = new Fuse(this.courses, options)
        let s = fuse.search(search)
        console.log(s)



        for(const c of s) {

            // if user applies specified days, don't show courses on unsearched for days
            // by god this code is horrible
            // maybe i should try to use fuse here instead
            console.log(c.item)
            if (specified_days.length > 0) {
                
                let pass = false
                out:
                for (const sch of c.item.schedule) {
                    for (const day of specified_days) {
                        if (sch.days[day-1] != "-") {
                            console.log("AAA", sch.days[day-1], day)
                            pass = true
                            break out 
                        }
                    }
                }

                if (!pass) 
                    continue
            }
            // add to filtered list
            this.courses_filtered.push(c.item)

            // remove from hidden list
            let remove = this.courses_hidden.indexOf(c.item)
            this.courses_hidden.splice(remove, 1)
        }

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

        for (const term of split) {
            if (term.toLowerCase() in lookup) {
                if (!days.includes(lookup[term]))
                    days.push(lookup[term])
            } else 
                out += term + " "
        }

        days.sort()

        console.log([out, ...days])
        return [out, ...days]
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