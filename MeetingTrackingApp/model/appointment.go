package appointment

import (
	"database/sql"
)

// Create an exported global variable to hold the database connection pool.
var DB *sql.DB

type AppointmentRequest struct {
	ID                 int
	REQUESTER_NAME     string `json:"REQUESTER_NAME"`
	REQUESTER_MAIL     string `json:"REQUESTER_MAIL"`
	MEETING_ROOM       string `json:"MEETING_ROOM"`
	ARRANGE_TIME_START string `json:"ARRANGE_TIME_START"`
	ARRANGE_TIME_END   string `json:"ARRANGE_TIME_END"`
	APPROVMENT_STATUS  int    `json:"APPROVMENT_STATUS"`
	DESCRIPTION        string `json:"DESCRIPTION"`
	TITLE              string `json:"TITLE"`
}
