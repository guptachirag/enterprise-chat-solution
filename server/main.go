package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type User struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	AvatarURL string          `json:"avatar_url"`
	Conn      *websocket.Conn `json:"-"`
}

func NewUser(id, name, avatarURL string) *User {
	return &User{
		ID:        id,
		Name:      name,
		AvatarURL: avatarURL,
	}
}

func main() {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	buildDir := "../client/build/"
	users := make(map[string]*User)

	r := mux.NewRouter()

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "../client/build/index.html")
	})

	r.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		// store image in static avatars directory
		file, handler, err := r.FormFile("avatar")
		if err != nil {
			log.Println(err)
			return
		}
		filePath := "static/avatars/" + handler.Filename
		defer file.Close()
		f, err := os.OpenFile(buildDir+filePath, os.O_WRONLY|os.O_CREATE, 0666)
		if err != nil {
			log.Println(err)
			return
		}
		defer f.Close()
		io.Copy(f, file)

		avatarURL := r.Host + filePath
		name := r.FormValue("name")
		id := strings.Replace(name, " ", "_", -1) + "_" + strconv.FormatInt(time.Now().UnixNano(), 10)
		users[id] = NewUser(id, name, avatarURL)
		response, err := json.Marshal(map[string]string{
			"id": id,
		})
		if err != nil {
			log.Println(err)
			return
		}
		w.Write(response)
	})

	r.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		users["1"] = NewUser("1", "chirag", "false")
		usersJSON, err := json.Marshal(users)
		if err != nil {
			w.Write([]byte(err.Error()))
		} else {
			w.Write(usersJSON)
		}
	})

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}

		userId := r.FormValue("id")
		users[userId].Conn = conn
	})

	r.PathPrefix("/").Handler(http.FileServer(http.Dir(buildDir)))

	http.ListenAndServe(":3001", r)
}
