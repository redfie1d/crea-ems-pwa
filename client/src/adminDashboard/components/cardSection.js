/*
Originator: Brandon
Date: 01 Feb 2019
Subcomponent to render cards
*/
import React, { Component } from "react";
import { Col, Row, Card, CardBody, CardHeader, CardText } from "reactstrap";
import { Person, Work } from '@material-ui/icons';

import { toast } from "react-toastify";

// Import services
import dashboard from "../../services/dashboardService";

class CardSection extends Component {
  style = {
    icon: {
      fill: "#fff",
      fontSize: "45px",
      float: "right"
    },
    typography: {
      color:'#ffff',
      fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif",
      marginBottom: "0px"
    },
    card: {
      border: "0",
      marginBottom: "30px",
      marginTop: "30px",
      borderRadius: "6px",
      color: "rgba(0, 0, 0, 0.87)",
      background: "#fff",
      width: "100%",
      boxShadow: "2px 2px 4px 0 rgba(0, 0, 0, 0.14)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minWidth: "0",
      wordWrap: "break-word",
      fontSize: ".875rem"
    }
  }

  state = {
    userCount: "",
    hoursBookedWeek: "",
    hoursBookedMonth: "",
    current: []
  };

  async componentDidMount() {
    try {
      var { userCount, hoursBookedWeek, hoursBookedMonth, current } = this.state;
      userCount = await dashboard.getUsersThisWeek();
      hoursBookedWeek = await dashboard.getShiftsTotalHoursThisWeek();

      // ------------------------------------------------------------------
      hoursBookedMonth = await dashboard.getShiftsTotalHoursThisMonth();
      // ------------------------------------------------------------------

      current = await dashboard.getCurrent();

      this.setState({ userCount, hoursBookedWeek, hoursBookedMonth, current });

    } catch(ex) {
      if(ex.response && ex.response.status === 404) {
        const errors = { ...this.state.errors };
        errors.data = ex.response.data;
        this.setState({ errors });
      } else if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  render() {
    const style = this.style;
    const { userCount, hoursBookedWeek, hoursBookedMonth, current } = this.state;
    return(
      <React.Fragment>
        <div>
          <Row>
            {/* Weekly Total Users Booked */}
            <Col xs="12" sm="12" md="4">
              <Card style={style.card}>
                <CardHeader style={{ marginRight:'0px', backgroundColor: "#F08080", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                    <Person style={style.icon}/>
                    <h4 style={style.typography}>NO. USERS</h4>
                    <p style={style.typography}>that made bookings</p>
                </CardHeader>
                  <CardBody style={{color:"#F08080"}}>
                    <p>{current[0]} --- {current[1]}</p>
                    <CardText className="text-right" tag="h2" style={{fontSize:"50px"}}><b>{userCount}</b></CardText>
                  </CardBody>
              </Card>
            </Col>
            {/* Weekly Total Hours */}
            <Col xs="12" sm="12" md="4">
              <Card style={style.card}>
                <CardHeader style={{ backgroundColor: "#20B2AA", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                    <Work style={style.icon}/>
                    <h4 style={style.typography}>WEEKLY HOURS</h4>
                    <p style={style.typography}>of shifts booked</p>
                </CardHeader>
                  <CardBody style={{color:"#20B2AA"}}>
                    <p>{current[0]} --- {current[1]}</p>
                    <CardText className="text-right" tag="h2" style={{fontSize:"50px"}}><b>{hoursBookedWeek}{" Hrs"}</b></CardText>
                  </CardBody>
              </Card>
            </Col>
            {/* Monthly Total Hours */}
            <Col xs="12" sm="12" md="4">
              <Card style={style.card}>
                <CardHeader style={{ backgroundColor: "#9370DB", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                    <Work style={style.icon}/>
                    <h4 style={style.typography}>MONTHLY HOURS</h4>
                    <p style={style.typography}>of shifts booked</p>
                </CardHeader>
                  <CardBody style={{color:"#9370DB"}}>
                    <p>{current[2]}</p>
                    <CardText className="text-right" tag="h2" style={{fontSize:"50px"}}><b>{hoursBookedMonth}{" Hrs"}</b></CardText>
                  </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default CardSection;
