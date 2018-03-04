import React, { Component } from 'react'
import axios, { post } from 'axios'
import '../node_modules/bootstrap/dist/css/bootstrap.css'
import './App.css'
import logo from './logo.svg'

var messages = {
    1: [
      {
        id: 1,
        text: "Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ? Hi, how are you ?",
        user_id: 1,
        time: "2018-02-20 23:53:47",
      },
      {
        id: 2,
        text: "Hi, how are you ?",
        user_id: 1,
        time: "2018-02-20 23:53:47",
      },
    ],
    2: [
      {
        id: 3,
        text: "Hi, how are you ?",
        user_id: 2,
        time: "2018-02-20 23:53:47",
      },
    ],
}

class MessageAPI {
  static getMessages(userId) {
    return messages[userId] || []
  }
}

class UserLayout extends Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  unreadBadge(cnt) {
    if (cnt > 0) {
      return <span className="badge badge-primary">{cnt}</span>
    } else {
      return ""
    }
  }

  getUserClass(userId, activeUserId) {
    var className = "wc-list-item-user"
    if (userId === activeUserId) {
      className = className + " wc-list-item-user-active"
    }
    return className;
  }

  handleClick(event) {
    var userId = event.target.closest('li').getAttribute('data-id')
    this.props.activateUser(parseInt(userId, 10))
  }

  render() {
    return (
      <ul className="wc-list">
      {
        this.props.users.map((user) => (
          <li key={user.id} className={this.getUserClass(user.id, this.props.activeUserId)} data-id={user.id} onClick={this.handleClick}>
              <img src={user.avatar} alt="avatar" className="wc-avatar img-thumbnail" />
              <span>{user.name}</span>
              {this.unreadBadge(user.unread_count)}
          </li>
        ))
      }
      </ul>
    )
  }
}

class MessageLayout extends Component {
  render() {
    if (this.props.messages.length === 0) {
      return <p className="wc-notice">No conversations found. Say Hi !!! </p>
    } else {
      return (
        <ul className="wc-list">
        {
          this.props.messages.map(function(message) {
            const user = UserAPI.getUser(message.user_id)
            return (
            <li key={message.id} className="wc-list-item-message">
              <div className="wc-message">
                <img src={user.avatar} alt="avatar" className="wc-message-user-avatar img-thumbnail" />
                <div class="wc-message-text">
                  <span className="wc-message-user-name">{user.name}</span>
                  <span className="wc-message-time">{message.time}</span><br />
                  <span>{message.text}</span>
                </div>
              </div>
            </li>
          )})
        }
        </ul>
      )
    }
  }
}

class HeaderLayout extends Component {
  render() {
    return (
      <header className="navbar navbar-dark bg-primary navbar-fixed-top">
        <a href="#!" className="navbar-brand"><b>WEBCHAT</b></a>
        <p className="navbar-nav wc-nav-item">Developed Using Golang, Websocket, React & Bootstrap</p>
      </header>
    )
  }
}

class LoginLayout extends Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit(event) {
    event.PreventDefault()
    const name = this.name.value
    const avatar = this.avatar.files[0]
    const url = "http://localhost:3000/login"
    const formData = new FormData()
    formData.append("avatar", avatar)
    formData.append("name", name)
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    }
    post(url, formData,config).then((response)=>{
      this.props.setLogin(response.data.id)
    })
  }

  render() {
    return (
      <div className="wc-login">
        <form onSubmit={this.handleSubmit}>
          <div className="form-group row">
            <label for="name" className="col-sm-2">Name</label>
            <input className="form-control col-sm-10" id="name" type="text" ref={input => {this.name = input}} />
          </div>
          <div className="row">
            <label for="avatar" className="col-sm-2">Avatar</label>
            <input className="col-sm-10 wc-file" id="avatar" type="file" ref={input => {this.avatar = input}} />
          </div>
          <div className="wc-login-button">
            <input className="btn btn-primary" type="submit" value="Login" />
          </div>
        </form>
      </div>
    )
  }
}

class ChatLayout extends Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
      activeUserId: "",
      message: "",
      messages: MessageAPI.getMessages(activeUserId),
    }
    this.ws = new WebSocket("ws://localhost:3000/ws?id="+props.login)
    this.activateUser = this.activateUser.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({message: event.target.value})
  }

  handleSubmit(event) {
    event.preventDefault()
    var message = this.state.message
    var receiverId = this.state.activeUserId
    this.ws.send(JSON.stringify({
      message: message,
      receiverId: receiverId,
    }))
  }

  handleMessage(event) {
    var messages = this.state.messages
    messages.push(event.data)
    this.setState({messages: messages})
  }

  componentDidMount() {
    this.ws.onmessage = this.handleMessage
  }

  activateUser(activeUserId) {
    this.setState({
      activeUserId: activeUserId,
      messages: MessageAPI.getMessages(activeUserId)
    });
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-4 col-md-3 col-lg-2 wc-users">
            <div className="wc-item-header">
              <h6>People</h6>
            </div>
            <UserLayout users={this.state.users} activeUserId={this.state.activeUserId} activateUser={this.activateUser} />
          </div>
          <div className="col-sm-8 col-md-9 col-lg-10 wc-conversations">
            <MessageLayout messages={this.state.messages} />
            <div className="wc-input-message">
              <form onSubmit={this.handleSubmit}>
                <input className="form-control" name="message" type="text" onChange={this.handleChange} />
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      login: "",
    }
    this.setLogin = this.setLogin.bind(this);
  }

  setLogin(userId) {
    this.setState({login: userId});
  }

  render() {
    if (this.state.login) {
      return (
        <div>
          <HeaderLayout />
          <ChatLayout login={this.state.login}/>
        </div>
      )
    } else {
      return (
        <div>
          <HeaderLayout />
          <LoginLayout setLogin={this.setLogin} />
        </div>
      )
    }
  }
}

export default App
