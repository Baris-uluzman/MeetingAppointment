// Package main starts the simple server on port and serves HTML,
// CSS, and JavaScript to clients.
package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/securecookie"

	models "github.com/mtapp/MeetingTrackingApp/model"
	serverFunctionality "github.com/mtapp/MeetingTrackingApp/server"
)

//var encryptionKey = "EUAS_ICC_APPOINTMENT_TRACKING_SECRET_KEY"
var cookieHandler = securecookie.New(
	securecookie.GenerateRandomKey(64),
	securecookie.GenerateRandomKey(32))

// templates parses the specified templates and caches the parsed results
// to help speed up response times.
var templates = template.Must(template.ParseFiles("./templates/base.html", "./templates/body.html"))
var dashboard_templates = template.Must(template.ParseFiles("./templates/base.html", "./templates/dashboard.html"))
var login_templates = template.Must(template.ParseFiles("./templates/base.html", "./templates/login.html"))

// logging is middleware for wrapping any handler we want to track response
// times for and to see what resources are requested.
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req := fmt.Sprintf("%s %s", r.Method, r.URL)
		log.Println(req)
		next.ServeHTTP(w, r)
		log.Println(req, "completed in", time.Now())
	})
}

// index is the handler responsible for rending the index page for the site.
func index() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b := struct {
			Title        template.HTML
			BusinessName string
			Slogan       string
		}{
			Title:        template.HTML("Meeting Appointment Application"),
			BusinessName: ",",
			Slogan:       "",
		}
		err := templates.ExecuteTemplate(w, "base", &b)
		if err != nil {
			http.Error(w, fmt.Sprintf("index: couldn't parse template: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
}

// index is the handler responsible for rending the index page for the site.
func dashboardHandle() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b := struct {
			Title        template.HTML
			BusinessName string
			Slogan       string
		}{
			Title:        template.HTML("Meeting Appointment Application"),
			BusinessName: ",",
			Slogan:       "",
		}
		yourName := getSession(r)
		if yourName != "" {
			errHttp := dashboard_templates.ExecuteTemplate(w, "base", &b)

			if errHttp != nil {
				http.Error(w, fmt.Sprintf("index: couldn't parse template: %v", errHttp), http.StatusInternalServerError)
				return
			}
		} else {
			http.Redirect(w, r, "/login", http.StatusFound)
		}

		w.WriteHeader(http.StatusOK)
	})
}

// index is the handler responsible for rending the index page for the site.
func login() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b := struct {
			Title        template.HTML
			BusinessName string
			Slogan       string
		}{
			Title:        template.HTML("Meeting Appointment Application"),
			BusinessName: ",",
			Slogan:       "",
		}
		err := login_templates.ExecuteTemplate(w, "base", &b)
		if err != nil {
			http.Error(w, fmt.Sprintf("index: couldn't parse template: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
}

// public serves static assets such as CSS and JavaScript to clients.
func public() http.Handler {
	return http.StripPrefix("/public/", http.FileServer(http.Dir("./public")))
}

func main() {

	serverFunctionality.ConnectDb()
	//serverFunctionality.SelectVersion()
	http.HandleFunc("/getAllAppointment", getAllAppointment)
	http.HandleFunc("/addAppointment", addAppointment)
	http.HandleFunc("/updateAppointmentStatus", updateAppointmentStatus)
	http.HandleFunc("/authentication", authentication)
	http.HandleFunc("/logout", logout)

	http.Handle("/public/", logging(public()))
	http.Handle("/", logging(index()))

	http.Handle("/dashboard", logging(dashboardHandle()))
	http.Handle("/login", logging(login()))

	http.ListenAndServe(":8080", nil)

}

// HTTP response listing all appointment records.
func getAllAppointment(w http.ResponseWriter, r *http.Request) {

	resultArray, err := serverFunctionality.GetAllMeetingAppoinmentRecords()
	if err != nil {
		log.Fatal("Error reading Employees: ", err.Error())
		resultArray = nil
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resultArray)

}

// HTTP response listing all appointment records.
func addAppointment(w http.ResponseWriter, r *http.Request) {

	fmt.Println("Endpoint Hit: Insert Appointment")

	requestBody, _ := ioutil.ReadAll(r.Body)
	var item models.AppointmentRequest
	json.Unmarshal(requestBody, &item)

	lastInsertId, err := serverFunctionality.InsertAppointment(item)

	if err != nil {
		fmt.Println("Error inserting new record: " + err.Error())
	} else {
		json.NewEncoder(w).Encode(lastInsertId)
	}
}

// HTTP response listing all appointment records.
func updateAppointmentStatus(w http.ResponseWriter, r *http.Request) {

	fmt.Println("Endpoint Hit: Update Appointment")

	if r.Method != http.MethodGet {
		return
	}
	params := r.URL.Query()
	if len(params) < 1 {
		return
	}
	appointmentStatus, _ := strconv.ParseInt(params.Get("app_status"), 10, 64)
	appointmentId, _ := strconv.ParseInt(params.Get("appointmentId"), 10, 64)

	if appointmentStatus == 1 || appointmentStatus == 2 || appointmentStatus == 3 {

		res, err := models.DB.Exec(`UPDATE APPOINTMENT_REQUEST	SET APPROVMENT_STATUS = @p1 WHERE ID = @p2;`, appointmentStatus, appointmentId)
		if err != nil {
			json.NewEncoder(w).Encode(err)
			panic(err)
		}
		count, err := res.RowsAffected()
		if err != nil {
			panic(err)
		}
		if count == 1 {
			json.NewEncoder(w).Encode("SUCCESS")
		}

	} else {
		json.NewEncoder(w).Encode("ERROR")
	}

}

func authentication(w http.ResponseWriter, r *http.Request) {
	//	fmt.Println("1")
	//	clearSession(w)
	if r.Method != http.MethodGet {
		return
	}
	params := r.URL.Query()
	if len(params) < 1 {
		return
	}
	username := params.Get("username")
	password := params.Get("password")

	//redirectTarget := "/"
	if username == "admin" && password == "EuasAdmin.123!" {
		setSession("acceptedUser", w)
		json.NewEncoder(w).Encode("TRUE")
	} else {
		json.NewEncoder(w).Encode("FALSE")
	}
}

func logout(w http.ResponseWriter, r *http.Request) {
	clearSession(w)
	json.NewEncoder(w).Encode("TRUE")
}

func getSession(request *http.Request) (yourName string) {
	if cookie, err := request.Cookie("tokenAuth"); err == nil {
		cookieValue := make(map[string]string)
		if err = cookieHandler.Decode("tokenAuth", cookie.Value, &cookieValue); err == nil {
			yourName = cookieValue["tokenAuth"]
		}
	}
	return yourName
}
func setSession(yourName string, response http.ResponseWriter) {
	value := map[string]string{
		"tokenAuth": yourName,
	}
	if encoded, err := cookieHandler.Encode("tokenAuth", value); err == nil {
		cookie := &http.Cookie{
			Name:   "tokenAuth",
			Value:  encoded,
			Path:   "/",
			MaxAge: 3600,
		}
		http.SetCookie(response, cookie)
	}
}

func clearSession(response http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:   "tokenAuth",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	}
	http.SetCookie(response, cookie)
}

func setSessionHandler(response http.ResponseWriter, request *http.Request) {
	name := request.FormValue("name")
	redirectTarget := "/"
	if name != "" {
		setSession(name, response)
		redirectTarget = "/page1"
	}
	http.Redirect(response, request, redirectTarget, 302)
}

func clearSessionHandler(response http.ResponseWriter, request *http.Request) {
	clearSession(response)
	http.Redirect(response, request, "/", 302)
}
