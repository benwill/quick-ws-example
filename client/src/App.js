import React, { Component } from "react";
import WebSocket from "isomorphic-ws";

const getMsg = (userName, date, msg) => {
  return `${new Date(date).toString()} - ${userName} : ${msg}`;
};

const userList = ["ben", "carl", "david", "greg", "sam"];
var randomUser = userList[Math.floor(Math.random() * userList.length)];

let ws = undefined;

class App extends Component {
  state = {
    text: "",
    messages: [],
    users: []
  };

  componentDidMount() {
    ws = new WebSocket(`ws://localhost:8080?user=${randomUser}`);
    ws.onopen = function open() {
      console.log("connected");
    };

    ws.onmessage = function incoming(message) {
      const response = JSON.parse(message.data);

      if (response.type === "CHAT_UPDATE") {
        this.setState({
          messages: [
            ...this.state.messages,
            getMsg(response.submittedByName, response.time, response.data)
          ]
        });
      } else if (response.type === "USERS_LIST") {
        this.setState({
          users: [...response.data]
        });
      }
    }.bind(this);
  }

  componentWillUnmount() {
    ws.onclose = function close() {
      console.log("disconnected");
    };
  }

  onChangeValue(e) {
    this.setState({
      text: e.target.value
    });
  }

  onSubmitMessage() {
    const message = this.state.text;
    if (!message.trim().length > 0) return;

    const msg = {
      type: "CHAT_SUBMIT",
      message
    };

    ws.send(JSON.stringify(msg));

    this.setState({
      messages: [...this.state.messages, getMsg("ME", new Date(), message)],
      text: ""
    });
  }

  render() {
    const { text, messages, users } = this.state;

    return (
      <div className="App">
        <h2>You are {randomUser}</h2>

        <ul>
          {messages.map((m, idx) => (
            <li key={idx}>{m}</li>
          ))}
        </ul>

        <hr />

        <input value={text} onChange={this.onChangeValue.bind(this)} />
        <button text="Submit" onClick={this.onSubmitMessage.bind(this)}>
          Submit message
        </button>

        <hr />

        <ul>
          {users.map((m, idx) => (
            <li key={idx}>{m}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default App;
