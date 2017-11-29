// Terminal.jsx
// Terminal is where a user enters gameplay commands on a turn by turn basis
// Terminal receives a commandArray (array) as a prop, as well as references to a commandInput string, handleCommands function and handleCommandChange function
// Terminal maps to the commandArray to render each command that has been entered by either user
// the other three props determine what has been typed into the field so it can be rendered and used later, as well as a submit listener
// Terminal is setup not to scroll with new messages if you are not scrolled to the bottom already
// This allows a user to read old commands
// componentWillReceiveProps (aka when a new message is coming in), the user's scroll position is determined
// It also determines if the new message banner should appear (only when the user isn't scrolled to the bottom)
// componentDidUpdate does the actual scrolling if it's been determined the div should scroll with the new message
// TextareaAutosize is a 3rd party component that's been configured and styled to look like an input field but expand in height as the user types
// Styles are not perfect, but for most cases it expands as wanted

import React, { Component } from 'react';
import css from '../styles.css';
import TextareaAutosize from "react-textarea-autosize";

export default class Terminal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.commandArray.length !== this.props.commandArray.length) {
      let commandLogContainer = document.getElementsByClassName(css.commandLogContainer)[0];
      if (commandLogContainer.clientHeight + commandLogContainer.scrollTop === commandLogContainer.scrollHeight) {
        // User is scrolled to the bottom of messages, so do autoscroll
        this.setState({
          shouldScroll: true,
          showNewMessageBanner: false
        });
      } else {
        // User is reading old messages above the scroll, so do NOT autoscroll
        this.setState({
          shouldScroll: false,
          showNewMessageBanner: true
        });
        setTimeout(function () {
          this.setState({ showNewMessageBanner: false });
        }.bind(this), 2000);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // check to see if there are new messages incoming
    // if there are new messages, and the user is at the bottom of the message log scroll
    // then scroll down to show the message
    if (prevProps.commandArray.length !== this.props.commandArray.length) {
      let commandLogContainer = document.getElementsByClassName(css.commandLogContainer)[0];
      if (this.state.shouldScroll) {
        commandLogContainer.scrollTop = commandLogContainer.scrollHeight;
      }
    }
  }

  render() {
    return (
      <div className={css.terminalContainer}>
        <div className={css.commandLogContainer}>
          {this.props.commandArray.map((command, i) => {
            return (
              <div key={i} className={css.commandInstance}>
                {command.command}
              </div>
            );
          })}
        </div>
        <TextareaAutosize className={css.commandInput} value={this.props.commandInput} onKeyDown={this.props.handleCommands} onChange={(e) => this.props.handleInputChange(e, 'commandInput')} />
      </div>
    );
  }
}
