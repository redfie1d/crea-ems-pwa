/*
Originator: Moses
Date: 2 Jan 2019
Component to render toolbar options button
*/
// Import external resources
import React, { Component } from "react";
import {
  Button,
  Menu,
  MenuItem
} from "@material-ui/core";
import { Person } from '@material-ui/icons';
// Import services
import auth from "../services/authenticateService";

class ToolbarButton extends Component {
  constructor(props) {
    super(props);

    const user = auth.getCurrentUser();
    this.state = {
      anchorEl: null,
      accountType: user.accountType
    }
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleNav = (e) => {
    e.preventDefault();
    let location = "/" + e.currentTarget.id;
    window.location = location;
  }

  render() {
    const { anchorEl, accountType } = this.state;
    return (
      <React.Fragment>
        <Button
          variant="text"
          aria-owns={anchorEl ? "simple-menu" : null}
          color="inherit"
          aria-haspopup="true"
          onClick={this.handleClick}
        >
          <Person />
        </Button>
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {
            accountType === "Student" ?
              <MenuItem id="profile" onClick={this.handleNav}>Profile</MenuItem>
            :
              <MenuItem id="adminProfile" onClick={this.handleNav}>Profile</MenuItem>
          }
          <MenuItem id="logout" onClick={this.handleNav}>Logout</MenuItem>
        </Menu>
      </React.Fragment>
    );
  }
}

export default ToolbarButton;
