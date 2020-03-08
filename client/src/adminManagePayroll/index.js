/*
Originator: Moses
Date: ?
Main component to render the navbars
*/
// Import external resources
import React from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  CssBaseline,
  Divider,
  Drawer,
  Hidden,
  IconButton,
  Toolbar
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import { withStyles } from "@material-ui/core/styles";

// Import custom components
import UserNavs from "../common/userNavs";
import AdminNavs from "../common/adminNavs";
import ToolbarButton from "../common/toolbarButton";
import ManagePayroll from "./components/managePayroll";

// Import services
import auth from "../services/authenticateService";

const drawerWidth = 170;

const styles = theme => ({
  root: {
    display: 'flex',
    fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif",
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    backgroundColor: '#333A56',
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#52658F',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
  },
});

class AdminManagePayroll extends React.Component {
  constructor(props) {
    super(props);

    const user = auth.getCurrentUser();
    this.state = {
      mobileOpen: false,
      accountType: user.accountType
    };
  }

  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  render() {
    const { classes, theme } = this.props;

    const drawer = (
      <div>
        <div className={classes.toolbar} >
          <img
            style={{marginTop:"10px", padding:"10px 10px"}}
            src="../../crea-logo-remake-words-only2.png"
            className="img-fluid"
            alt=""
          />
        </div>
        <Divider />
        {this.state.accountType === "Student" ? <UserNavs /> : <AdminNavs />}
      </div>
    );

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
            <div style={{ position: "absolute", right: "10px" }}>
              <ToolbarButton accountType={this.state.accountType} />
            </div>
          </Toolbar>
        </AppBar>
        <nav className={classes.drawer}>
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Hidden smUp implementation="css">
            <Drawer
              container={this.props.container}
              variant="temporary"
              anchor={theme.direction === "rtl" ? "right" : "left"}
              open={this.state.mobileOpen}
              onClose={this.handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper
              }}
              variant="permanent"
              open
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <ManagePayroll />
        </main>
      </div>
    );
  }
}

AdminManagePayroll.propTypes = {
  classes: PropTypes.object.isRequired,
  // Injected by the documentation to work in an iframe.
  // You won't need it on your project.
  container: PropTypes.object,
  theme: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(AdminManagePayroll);
