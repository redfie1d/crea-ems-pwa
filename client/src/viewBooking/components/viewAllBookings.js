/*
Originator: Hidayatullah
Date: 7 Jan 2019
Component to render bookings from all users
*/
// Import external resources
import React, { Component } from "react";
import {
  Row,
  Col,
  FormGroup,
  Input,
  Label,
  Table
} from "reactstrap";
import moment from "moment";

// Import services
import booking from "../../services/bookingService";
import configService from "../../services/configService";

class ViewAllBookings extends Component {
  state = {
    data: {
      weeksSorted: [],
      week: {
        workingDays: []
      },
      bookings: {},
      currentDay: "",
      currentDayStr: "",
      numStations: 11,
      rows: {
        0: "09:00-10:00",
        1: "10:00-11:00",
        2: "11:00-12:00",
        3: "12:00-13:00",
        4: "13:00-14:00",
        5: "14:00-15:00",
        6: "15:00-16:00",
        7: "16:00-17:00",
        8: "17:00-18:00",
        9: "18:00-19:00",
        10: "19:00-20:00",
        11: "20:00-21:00"
      },
      name: ""
    },
    errors: {},
    color: {
      primary: "rgb(23, 162, 184)",
      secondary: "rgb(108, 117, 125)",
      success: "rgb(45, 173, 74)",
      blank: ""
    }
  }

  async componentDidMount() {
    var data = this.state.data;
    try {
      // get config
      const config = await configService.getAllConfigurations();

      // get weeks sorted
      const weeksSorted = await booking.getShiftBookingWeeksSorted();
      var currentWeek = moment().subtract(1, 'd').week();

      if(weeksSorted.length === 0) {
        return;
      }

      var firstWeek = weeksSorted[0];

      for (var i = 0; i < weeksSorted.length; i++) {
        if (currentWeek === moment(weeksSorted[i].fromDate).week()) {
          firstWeek = weeksSorted[i];
          break;
        }
      }

      const bookings = await booking.getAllUserBookings(firstWeek._id);
      this.getCurrentDay(firstWeek);
      data.weeksSorted = weeksSorted;
      data.week = firstWeek;
      data.bookings = bookings;
      data.numStations = config.noOfWorkStations;

      this.setState({ data });
      this.updateTable();
    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
      }
    }
  }

  // handler function to manage week changes
  handleWeekChange = async ({ currentTarget: input }) => {
    var data = this.state.data;
    if(input.value === "weekPlaceholder") {
      data.week = {};
      this.setState({ data });
      return;
    }
    const bookings = await booking.getAllUserBookings(input.value);
    var week = {};
    for(var i = 0; i < data.weeksSorted.length; i++) {
      if(data.weeksSorted[i]._id === input.value) {
        week = data.weeksSorted[i];
      }
    }
    this.getCurrentDay(week);
    data.week = week;
    data.bookings = bookings;
    this.setState({ data });
    this.removeElements();
    this.updateTable();
  }

  // handler function to manage day changes
  handleDayChange = ({ currentTarget: input }) => {
    var data = this.state.data;
    data.currentDayStr = input.value;
    switch(input.value) {
      case "Monday":
        data.currentDay = "1";
        break;
      case "Tuesday":
        data.currentDay = "2";
        break;
      case "Wednesday":
        data.currentDay = "3";
        break;
      case "Thursday":
        data.currentDay = "4";
        break;
      case "Friday":
        data.currentDay = "5";
        break;
      default:
        return;
    }
    this.setState({ data });
    this.removeElements();
    this.updateTable();
  }

  // helper function to get current day from the week parameter
  getCurrentDay = (week) => {
    let data = this.state.data;
    let workingDays = week.workingDays;
    let firstDay = "";
    let firstDayStr = "";
    for(let i = 0; i <= workingDays.length; i++) {
      if(workingDays[i].isWorkingDay) {
        firstDay = `${i+1}`;
        firstDayStr = workingDays[i].day;
        break;
      }
    }
    data.currentDay = firstDay;
    data.currentDayStr = firstDayStr;
    this.setState({data});
  }

  // function to populate the table with the shift bookings
  updateTable = () => {
    // retrieve table DOM element
    var table = document.getElementById("bookingsTable");

    // retrieve all bookings and the selected day
    var { bookings, currentDay } = this.state.data;

    // retrieve bookings in the selected day
    var dayBookings = bookings[currentDay];

    // for each row, starting 1 to avoid headers
    for(var row = 1; row < table.rows.length; row++) {
      // retrieve row as cells
      let cells = table.rows[row].cells;

      // for each cell in the row, starting from 1 to avoid the time column
      for(var col = 1; col < cells.length; col++) {
        // get the current cell DOM element and its id
        let cell = cells[col];
        let cellId = cell.id;

        // if there are bookings assigned to the workstation
        if(dayBookings[col-1] !== undefined) {

          // if the cellId key is present in dayBookings
          if(cellId in dayBookings[col-1]) {
            // retrieve booking
            let booking = dayBookings[col-1][cellId];

            // merge cell based on duration
            cell.rowSpan = booking.duration;

            // get duration of booking and hide cells
            let cellsToRemove = booking.duration - 1;
            let cellBelowStartTime = Number(cellId.substring(2,4)) + 1;
            let cellStation = cell.id.substring(0, 1);

            if(col > 10) {
              cellBelowStartTime = Number(cellId.substring(3,5)) + 1;
              cellStation = cell.id.substring(0, 2);
            }

            for(let i = cellBelowStartTime; i < cellBelowStartTime+cellsToRemove; i++) {
              let cellIdToHide = cellStation + "-" + i + ":00-" + (i+1) + ":00";
              document.getElementById(cellIdToHide).style.display = "none";
            }

            // add initials
            var initials = booking.user.name.match(/\b\w/g) || [];
            initials = ((initials.shift() || '') + (initials.shift() || '') + (initials.shift() || '') + (initials.shift() || '')).toUpperCase();
            cell.innerHTML = "<span>"+initials+"</span>"

            // change color of cell
            cell.style.backgroundColor = booking.color;

            cell.setAttribute("data-name", booking.user.name);
          }
        }
      }
    }
  }

  // helper function to clear the timetable
  removeElements = () => {
    // retrieve timetable DOM element
    var table = document.getElementById("bookingsTable");

    // for each row, starting from 1 to skip headers
    for(var row = 1; row < table.rows.length; row++) {
      // retrieve row as cells
      let cells = table.rows[row].cells;

      // for each cell, starting from 1 to skip time column
      for(var col = 1; col < cells.length; col++) {
        // retrieve current cell DOM element
        let cell = cells[col];

        // if the cell is a merged cell, set rowSpan to 1
        if(cell.rowSpan > 1) {
          cell.rowSpan = 1;
        }

        // if cell has initials, remove it
        while(cell.firstChild) {
          cell.removeChild(cell.firstChild);
        }

        // if the cell's display is set to "none", reset it
        if(cell.style.display === "none") {
          cell.style.display = "";
        }

        // change color
        cell.style.backgroundColor = "";
      }
    }
  }

  // component function to render timetable headers
  renderHeaders = () => {
    const StationHeaders = this.renderStationHeaders;
    return (
      <thead align="center" style={{backgroundColor:'#52658F',color:'#fff'}}>
        <tr>
          <th width="13%">Time</th>
          <StationHeaders />
        </tr>
      </thead>
    );
  }

  // component function to render workstations as headers
  renderStationHeaders = () => {
    let headers = [];
    let { numStations } = this.state.data;
    let percentageWidth = 87/numStations;
    for(let i = 0; i < numStations; i++) {
      headers.push(<th width={percentageWidth+"%"} key={i} id={i}>{i+1}</th>)
    }
    return headers;
  }

  // component function to render the body of the timetable
  renderBody = () => {
    const { rows, numStations } = this.state.data;
    let body = [];
    let tbody = [];
    for(let i = 0; i < Object.keys(rows).length; i++) {
      var children = [];
      children.push(<th key={"time-"+i} scope="row">{rows[i]}</th>);
      for(let y = 0; y < numStations; y++) {
        children.push(
          <td
            className="align-middle"
            style={{cursor:"pointer"}}
            title={rows[i]}
            key={y}
            id={y+"-"+rows[i]}
            data-name={y}
            onMouseOver={this.onHover}
            onMouseLeave={this.onHoverOff}
            onClick={this.handleTap}
          ></td>
        )
      }
      tbody.push(<tr key={"row-"+i}>{children}</tr>);
    }
    body.push(<tbody align="center" key="body">{tbody}</tbody>);
    return body;
  }

  // handler function to display names on tap
  onTap = ({currentTarget}) => {
    var data = this.state.data;
    data.name = currentTarget.getAttribute("data-name");
    this.setState({
      data
    });
  }

  // handler function to display names on mouse hover
  onHover = ({currentTarget}) => {
    if(currentTarget.style.backgroundColor !== "") {
      var data = this.state.data;
      data.name = currentTarget.getAttribute("data-name");
      this.setState({
        data
      });
    }
  }

  // handler function to clear the name when the mouse hovers away
  onHoverOff = () => {
    let data = this.state.data;
    data.name = "";
    this.setState({
      data
    });
  }

  render() {
    const { bookings, currentDay, currentDayStr, weeksSorted, week, name } = this.state.data;
    const Headers = this.renderHeaders;
    const Body = this.renderBody;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{"marginBottom":"30px"}}>View Bookings</h2>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <FormGroup>
                <Label>Select Week</Label>
                <Input
                  type="select"
                  id="week"
                  onChange={this.handleWeekChange}
                  placeholder="Select a Shift Week..."
                >
                  {
                    weeksSorted.length === 0 ?
                      <option key="weekPlaceholder" value="weekPlaceholder" id="weekPlaceholder">There are no shift booking weeks</option>
                    :
                      <option value={week._id} id={week._id} hidden>
                      {
                        moment(week.fromDate).format("DD MMM, YYYY --- ") +
                        moment(week.toDate).format("DD MMM, YYYY")
                      }
                      </option>
                  }
                  {
                      weeksSorted.map((week) => (
                        <option key={week._id} value={week._id} id={week._id}>{
                          moment(week.fromDate).format("DD MMM, YYYY --- ") +
                          moment(week.toDate).format("DD MMM, YYYY")
                        }</option>
                      ))
                  }
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <FormGroup>
                <Label>Select Day</Label>
                <Input
                  type="select"
                  id="currentDay"
                  onChange={this.handleDayChange}
                  value={currentDayStr}
                  placeholder="Select Day of Shift Week..."
                >
                  {
                    week.workingDays.map(day => (
                      day.isWorkingDay ?
                        <option key={day.day} value={day.day} id={day.day}>{day.day}</option>
                      :
                        <option disabled key={day.day} value="disabled" id={day.day}>{day.day}</option>
                    ))
                  }
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <hr/>
            </Col>
          </Row>
          {
            !bookings[currentDay] ?
              <Row>
                <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                 <p>There are no shift bookings</p>
                </Col>
              </Row>
            :
              <div style={{marginTop:"25px"}}>
                <Row align="center">
                  <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                    {
                      !name ?
                        <h4>Mouse over/tap bookings for name of user</h4>
                      :
                        <h4>{name}</h4>
                    }
                  </Col>
                </Row>
                <Row>
                  <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                    <Table bordered responsive id="bookingsTable" size="sm" style={{"backgroundColor":"#ffffff"}} className="mt-2">
                      <Headers />
                      <Body />
                    </Table>
                  </Col>
                </Row>
              </div>
          }
        </div>
      </React.Fragment>
    );
  }
}

export default ViewAllBookings;
