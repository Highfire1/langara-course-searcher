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

    searchQueryEntered() {
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
        //console.log(s)

        for(const c of s) {
            this.courses_filtered.push(c.item)
            let remove = this.courses_hidden.indexOf(c.item)
            this.courses_hidden.splice(remove, 1)
        }

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