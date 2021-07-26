package serverFunctionality

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	models "github.com/mtapp/MeetingTrackingApp/model"
)

// Replace with your own connection parameters
var server = "BWEBDB01" //"localhost"
var port = 1433
var user = "sa"
var password = "EUAS.2023!"
var database = "MeetingAppointment"

func CloseConnectionDb() {
	// Close the database connection pool after program executes
	defer models.DB.Close()
}
func ConnectDb() {
	//CloseConnectionDb()
	var err error
	log.Println("ServerFunctionalityt baris", nil)
	// Create connection string
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;port=%d;database=%s;",
		server, user, password, port, database)

	// Create connection pool
	models.DB, err = sql.Open("sqlserver", connString)
	if err != nil {
		log.Fatal("Error creating connection pool: " + err.Error())
	}
	log.Printf("Connected!\n")
}

// Gets and prints SQL Server version
func SelectVersion() {
	// Use background context
	ctx := context.Background()

	// Ping database to see if it's still alive.
	// Important for handling network issues and long queries.
	err := models.DB.PingContext(ctx)
	if err != nil {
		log.Fatal("Error pinging database: " + err.Error())
	}

	var result string

	// Run query and scan for result
	err = models.DB.QueryRowContext(ctx, "SELECT @@version").Scan(&result)
	if err != nil {
		log.Fatal("Scan failed:", err.Error())
	}
	fmt.Printf("%s\n", result)
	log.Printf("%s\n", result)
}
func GetAllMeetingAppoinmentRecords() ([]models.AppointmentRequest, error) {

	fmt.Println("Endpoint Hit: homePage")

	var allAppointmentItemArray []models.AppointmentRequest

	rows, err := models.DB.Query("SELECT * FROM APPOINTMENT_REQUEST")

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var item models.AppointmentRequest
		rows.Scan(&item.ID, &item.REQUESTER_NAME, &item.REQUESTER_MAIL, &item.MEETING_ROOM, &item.ARRANGE_TIME_START, &item.ARRANGE_TIME_END, &item.APPROVMENT_STATUS, &item.DESCRIPTION, &item.TITLE)
		allAppointmentItemArray = append(allAppointmentItemArray, item)
	}
	return allAppointmentItemArray, nil
}

// HTTP response listing all appointment records.
func InsertAppointment(item models.AppointmentRequest) (lastInsertedId int, errText error) {

	var lastInsertId int
	startDate, err1 := time.Parse(time.RFC3339, item.ARRANGE_TIME_START)
	endDate, err2 := time.Parse(time.RFC3339, item.ARRANGE_TIME_END)

	if err1 != nil || err2 != nil {
		fmt.Println("Error while parsing date :", err1)
		return 0, err1
	}

	err := models.DB.QueryRow(`
		INSERT INTO APPOINTMENT_REQUEST(REQUESTER_NAME, REQUESTER_MAIL, MEETING_ROOM, ARRANGE_TIME_START, ARRANGE_TIME_END, APPROVMENT_STATUS, DESCRIPTION, TITLE) 
		 VALUES(@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8) SELECT SCOPE_IDENTITY()`, item.REQUESTER_NAME, item.REQUESTER_MAIL, item.MEETING_ROOM, startDate, endDate, item.APPROVMENT_STATUS, item.DESCRIPTION, item.TITLE).Scan(&lastInsertId)

	if err != nil {
		return 0, err
	} else {
		return lastInsertId, nil
	}
}
