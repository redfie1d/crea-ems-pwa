/*
Originator: Hidayatullah
Date: 31 Dec 2018
Component to render admin navs
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
import { Dashboard, Create, Search, CalendarToday, LocalLibrary, People, Toc, CloudUpload, ImportExport, Settings } from '@material-ui/icons';

// Import services
import auth from "../services/authenticateService";

class AdminNavs extends Component {
  constructor(props) {
    super(props);

    const user = auth.getCurrentUser();
    this.state = {
      accountType: user.accountType,
      path: ""
    }
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
          id="dashboard"
          onClick={this.handleNav}
          selected={
            path === "dashboard" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Dashboard style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Dashboard</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="weekManagement"
          onClick={this.handleNav}
          selected={
            path === "weekManagement" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Create style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Create Schedule</Typography>}/>
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
          id="shiftsManagement"
          onClick={this.handleNav}
          selected={
            path === "shiftsManagement" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><CalendarToday style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Shifts</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="libraryDutiesManagement"
          onClick={this.handleNav}
          selected={
            path === "libraryDutiesManagement" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><LocalLibrary style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Library Duties</Typography>}/>
        </ListItem>
        {
          this.state.accountType === "Super Admin" ?
            <ListItem
              button
              id="superAdminPanel"
              onClick={this.handleNav}
              selected={
                path === "superAdminPanel" ? true : false
              }
            >
              <ListItemIcon style={{marginRight:'0px'}}><People style={style.icon}/></ListItemIcon>
              <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Users</Typography>}/>
            </ListItem>
          :
            <ListItem
              button
              id="adminPanel"
              onClick={this.handleNav}
              selected={
                path === "adminPanel" ? true : false
              }
            >
              <ListItemIcon style={{marginRight:'0px'}}><People style={style.icon}/></ListItemIcon>
              <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Users</Typography>}/>
            </ListItem>
        }
        <ListItem
          button
          id="payrollAdmin"
          onClick={this.handleNav}
          selected={
            path === "payrollAdmin" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Toc style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Manage Payroll</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="upload"
          onClick={this.handleNav}
          selected={
            path === "upload" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><CloudUpload style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Upload Call logs</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="export"
          onClick={this.handleNav}
          selected={
            path === "export" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><ImportExport style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Export</Typography>}/>
        </ListItem>
        <ListItem
          button
          id="configurations"
          onClick={this.handleNav}
          selected={
            path === "configurations" ? true : false
          }
        >
          <ListItemIcon style={{marginRight:'0px'}}><Settings style={style.icon}/></ListItemIcon>
          <ListItemText disableTypography primary={<Typography type="body2" style={style.typography}>Configurations</Typography>}/>
        </ListItem>
      </List>
    );
  }
}

export default AdminNavs;
