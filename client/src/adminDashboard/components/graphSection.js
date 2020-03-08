/*
Originator: Brandon
Date: 01 Feb 2019
Subcomponent to render graphs
*/
import React, { Component } from "react";
import { Col, Row, Card, CardBody, CardHeader, ListGroup, ListGroupItem, Badge } from "reactstrap";
import { Line, Bar, defaults } from 'react-chartjs-2';
import merge from 'lodash.merge';
import { ShowChart, Place, BarChart } from '@material-ui/icons';

import { toast } from "react-toastify";

// Import services
import dashboard from "../../services/dashboardService";

class GraphSection extends Component {
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
      fontSize: ".875rem",
      "& p": {
        marginTop: "0px",
        paddingTop: "0px"
      }
    }
  }

  state = {
    weeksBookings: [],
    calls: [],
    monthAppointments: [],
    currentMonth: []
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  async componentDidMount() {
    try {
      var { weeksBookings, calls, monthAppointments, currentMonth } = this.state;
      weeksBookings = await dashboard.getTotalHoursForShiftsWeek();
      calls = await dashboard.getCalls();
      monthAppointments = await dashboard.getAppointmentsOfCurrentMonth();
      currentMonth = await dashboard.getCurrent();

      this.setState({ weeksBookings, calls, monthAppointments, currentMonth });

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
    const { weeksBookings, calls, monthAppointments, currentMonth } = this.state;

    var maxCount = Math.max.apply(Math,monthAppointments.map(function(o){return o.count;}))
    var minCount = Math.min.apply(Math,monthAppointments.map(function(o){return o.count;}))

    const dataLine = {
        labels: weeksBookings[0],
        datasets: [
          {
            label: 'Shift Booked Hours',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,0.4)', // fill color under the line
            borderColor: 'rgba(75,192,192,1)', // color of the line
            borderCapStyle: 'butt', // cap style of the line
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(75,192,192,1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(75,192,192,1)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: weeksBookings[1]
          }
        ]
    };

    merge(defaults, {
    	     global: {
      		          fontFamily: 'Lato',
    		            fontSize: '18',
                    fontColor: '#777'
    	},
    });
    const dataBarCalls = {
        labels: calls[0],
        datasets: [
        {
            label: 'Successful Calls',
            data: calls[1],
            backgroundColor: '#20B2AA',
            borderWidth: 1,
            hoverBorderWidth: 3,
            hoverBorderColor: '#000'
        }, {
            label: 'Unsuccessful Calls',
            data: calls[2],
            backgroundColor: '#F08080',
            borderWidth: 1,
            hoverBorderWidth: 3,
            hoverBorderColor: '#000'
        }
      ]
    };

    const barChartCallsOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
        xAxes: [{
            barPercentage: 1,
            gridLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
            }
        }],
        yAxes: [{
            gridLines: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
            beginAtZero: true
            }
        }]
        }
    }

    return(
      <React.Fragment>
        <Row>
          <Col xs="12" sm="12" md="9">
            <Card style={style.card}>
              <CardHeader style={{ marginRight:'0px', backgroundColor: "#20B2AA", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                <ShowChart style={style.icon}/>
                <h4 style={style.typography}>SHIFT BOOKINGS</h4>
                <p style={style.typography}>total hours booked per week (up to six weeks)</p>
              </CardHeader>
              <CardBody className="text-right">
                <Line data={dataLine} options={{responsive: true }} />
              </CardBody>
            </Card>
          </Col>

          <Col xs="12" sm="12" md="3">
            <Card style={style.card}>
              <CardHeader style={{ marginRight:'0px', backgroundColor: "#9370DB", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                <Place style={style.icon}/>
                <h4 style={style.typography}>LIBRARY DUTIES</h4>
                <p style={style.typography}>{currentMonth[2]}</p>
              </CardHeader>
              <CardBody>
                <ListGroup flush>
                {
                  monthAppointments.map((row) => (
                    <ListGroupItem id={row._id} key={row._id}>
                      {row.location.locationName}
                      <Badge style={{fontSize: "20px"}} pill
                        color={row.count === minCount ? "danger"
                          : row.count === maxCount ? "success"
                          : "info"
                        }
                        className="float-right">
                          {row.count}
                      </Badge>
                    </ListGroupItem>
                  ))
                }
                </ListGroup>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col xs="12" sm="12" md="12">
            <Card style={style.card}>
              <CardHeader style={{ marginRight:'0px', backgroundColor: "#F08080", borderRadius: "10px", boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.14)"}}>
                <BarChart style={style.icon}/>
                <h4 style={style.typography}>SUCCESSFUL & UNSUCCESSFUL CALLS</h4>
                <p style={style.typography}>total no. of successful/unsuccessful calls per month (up to six months)</p>
              </CardHeader>
              <CardBody className="text-right">
                <Bar data={dataBarCalls} height={500} options={barChartCallsOptions} />
              </CardBody>
            </Card>
          </Col>
        </Row>

      </React.Fragment>
    );
  }
}

export default GraphSection;
