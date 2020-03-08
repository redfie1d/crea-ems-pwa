/*
Originator: Hidayatullah
Date: 31 Dec 2018
Component to render user navs
*/
// Import external resources
import React, { Component } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography
} from '@material-ui/core';

import { Search, CalendarToday, LocalLibrary, 
  // Toc, AlarmAdd 
} from '@material-ui/icons';

class UserNavs extends Component {
  state = {
    path: ""
  }

  handleNav = (e) => {
    e.preventDefault();
    let location = "/" + e.currentTarget.id;
    window.location = location;
  }

  style = {
    icon: {
      fill: "#fff"
    },
    typography: {
      color:'#ffff',
      fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
    }
  }

  componentDidMount() {
    let path = window.location.pathname.substring(1);
    this.setState({path});
  }

  render() {
    const style = this.style;
    const path = this.state.path;
    return (
      <List>
        <ListItem
          button
          id="shiftBooking"
          onClick={this.handleNav}
          selected={
            path === "shiftBooking" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><CalendarToday style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Shifts</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="viewBookings"
          onClick={this.handleNav}
          selected={
            path === "viewBookings" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Search style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>View Bookings</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="libraryDuties"
          onClick={this.handleNav}
          selected={
            path === "libraryDuties" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><LocalLibrary style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Book Library Duties</Typography>} />
        </ListItem>
        {/*<ListItem
          button
          id="timesheet"
          onClick={this.handleNav}
          selected={
            path === "timesheet" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Toc style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Timesheet</Typography>} />
        </ListItem>*/}
        {/*<ListItem
          button
          id="attendance"
          onClick={this.handleNav}
          selected={
            path === "attendance" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><AlarmAdd style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Log Attendance</Typography>} />
        </ListItem>*/}
    </List>
    );
  }
}

export default UserNavs;
