/*
Originator: Hidayatullah
Date: 7 Jan 2019
Main component to render the shift booking page
*/
// Import external libraries
import React, { Component } from "react";
import {
  Table,
  Input,
  Label,
  FormGroup,
  FormText,
  Row,
  Col,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "reactstrap";
import { toast } from "react-toastify";
import moment from "moment";
import CircularProgress from '@material-ui/core/CircularProgress';
import { Lens } from '@material-ui/icons';

// Import services
import booking from "../../services/bookingService";

class ShiftBooking extends Component {
  state = {
    data: {
      selectedTimes: [],
      selectedWeek: "",
      weeksSorted: [],
      week: {},
      bookingPointer: {},
      allowBookings: false,
      predicted: []
    },
    color: {
      primary: "rgb(0, 206, 221)",
      secondary: "rgb(108, 117, 125)",
      success: "rgb(45, 173, 74)",
      predicted: "rgb(0, 80, 255)"
    },
    modal: false,
    legendModal: false,
    deleteId: "",
    submitLoading: false,
    deleteLoading: false,
    allowDelete: true,
    allowPredicted: true,
    showPredicted: false,
    rows: [
      {
        key: "0",
        slot: "09:00-10:00",
        mon: "0-09-10",
        tue: "1-09-10",
        wed: "2-09-10",
        thu: "3-09-10",
        fri: "4-09-10"
      },
      {
        key: "1",
        slot: "10:00-11:00",
        mon: "0-10-11",
        tue: "1-10-11",
        wed: "2-10-11",
        thu: "3-10-11",
        fri: "4-10-11"
      },
      {
        key: "2",
        slot: "11:00-12:00",
        mon: "0-11-12",
        tue: "1-11-12",
        wed: "2-11-12",
        thu: "3-11-12",
        fri: "4-11-12"
      },
      {
        key: "3",
        slot: "12:00-13:00",
        mon: "0-12-13",
        tue: "1-12-13",
        wed: "2-12-13",
        thu: "3-12-13",
        fri: "4-12-13"
      },
      {
        key: "4",
        slot: "13:00-14:00",
        mon: "0-13-14",
        tue: "1-13-14",
        wed: "2-13-14",
        thu: "3-13-14",
        fri: "4-13-14"
      },
      {
        key: "5",
        slot: "14:00-15:00",
        mon: "0-14-15",
        tue: "1-14-15",
        wed: "2-14-15",
        thu: "3-14-15",
        fri: "4-14-15"
      },
      {
        key: "6",
        slot: "15:00-16:00",
        mon: "0-15-16",
        tue: "1-15-16",
        wed: "2-15-16",
        thu: "3-15-16",
        fri: "4-15-16"
      },
      {
        key: "7",
        slot: "16:00-17:00",
        mon: "0-16-17",
        tue: "1-16-17",
        wed: "2-16-17",
        thu: "3-16-17",
        fri: "4-16-17"
      },
      {
        key: "8",
        slot: "17:00-18:00",
        mon: "0-17-18",
        tue: "1-17-18",
        wed: "2-17-18",
        thu: "3-17-18",
        fri: "4-17-18"
      },
      {
        key: "9",
        slot: "18:00-19:00",
        mon: "0-18-19",
        tue: "1-18-19",
        wed: "2-18-19",
        thu: "3-18-19",
        fri: "4-18-19"
      },
      {
        key: "10",
        slot: "19:00-20:00",
        mon: "0-19-20",
        tue: "1-19-20",
        wed: "2-19-20",
        thu: "3-19-20",
        fri: "4-19-20"
      },
      {
        key: "11",
        slot: "20:00-21:00",
        mon: "0-20-21",
        tue: "1-20-21",
        wed: "2-20-21",
        thu: "3-20-21",
        fri: "4-20-21"
      },
    ],
    errors: {}
  }

  async componentDidMount() {
    var data = this.state.data;
    try {
      data.weeksSorted = await booking.getShiftBookingWeeksSorted();
      var currentWeek = moment().subtract(1, 'd').week();

      if(data.weeksSorted.length > 0) {
        let weekSelected = data.weeksSorted[0];
        data.selectedWeek = weekSelected._id;
        data.week = weekSelected;
        for (var i = 0; i < data.weeksSorted.length; i++) {
          if (currentWeek+1 === moment(data.weeksSorted[i].fromDate).week()) {
            weekSelected = data.weeksSorted[i];
            data.selectedWeek = weekSelected._id;
            data.week = weekSelected;
            break;
          }
        }

        data.allowBookings = true;
        data.bookingPointer = await booking.getShiftBookingPointer(data.selectedWeek);
        data.predicted = await booking.getPredictedBookings();

        // if date now is past week's deadline, disable predicted checkbox
        if(moment().isAfter(moment(data.week.bookingDeadline))) {
          this.setState({ allowPredicted: false, showPredicted: false });
        }

        this.populateTable(data.week.workingDays, data.bookingPointer);
      }

    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data });
    }
  }

  // handler for change in week
  handleWeekChange = async ({ currentTarget: input }) => {
    this.clearTable();
    var data = this.state.data;
    data.selectedWeek = input.value;

    // retrieve the selected week object
    var week = {};
    data.weeksSorted.forEach(i => {
      if(i._id === data.selectedWeek) {
        week = i;
      }
    });
    data.week = week;

    // if date now is past week's deadline, disable predicted checkbox
    if(moment().isAfter(moment(data.week.bookingDeadline))) {
      this.setState({ allowPredicted: false, showPredicted: false });
    } else {
      this.setState({ allowPredicted: true, showPredicted: false });
    }

    try {
      data.bookingPointer = await booking.getShiftBookingPointer(data.selectedWeek);
      this.populateTable(week.workingDays, data.bookingPointer);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data });
    }
  }

  // handler for clicking checkbox
  handleCheckbox = (e) => {
    var showPredicted = this.state.showPredicted;
    if(showPredicted) {
      this.clearPredicted();
      this.setState({ showPredicted: false });
    } else {
      this.populatePredicted();
      this.setState({ showPredicted: true });
    }
  }

  // handler for clicking on cells
  handleClick = (e) => {
    const currentColor = e.target.style.backgroundColor;
    if(currentColor === "") {
      e.target.style.backgroundColor = this.state.color.primary;
      this.highlightCell(e.target.id, false);
    } else if(currentColor === this.state.color.primary || currentColor === this.state.color.predicted) {
      e.target.style.backgroundColor = "";
      this.highlightCell(e.target.id, true);
    }
  }

  // helper function to highlight the cell
  highlightCell = (id, isRemove) => {
    var data = this.state.data;
    if(isRemove) {
      data.selectedTimes.splice(data.selectedTimes.indexOf(id),1);
      this.setState({data});
    } else {
      data.selectedTimes.push(id);
      this.setState({data});
    }
  }

  // handler function to populate the table with existing bookings for the week
  populateTable = (workingDays, bookingPointer) => {
    // get array of non working day ids
    let nonWorkingDays = [];
    for(var key in workingDays) {
      if(!workingDays[key].isWorkingDay) {
        nonWorkingDays.push(key);
      }
    }

    // retrieve table
    var table = document.getElementById("timetable");

    // for each row, starting from 2nd row to avoid headers
    for(let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
      // retrieve the row as cells
      let cells = table.rows[rowIndex].cells;

      // for each column of row (cells), starting from 2nd column to avoid time column
      for(let cellIndex = 1; cellIndex < cells.length; cellIndex++) {
        // retrieve current cell at index
        let cell = cells[cellIndex];

        // get cellDay id as string
        let cellDay = cell.id.substring(0,1);

        // if non working day, shade secondary color
        if(nonWorkingDays.indexOf(cellDay) !== -1) {
          cell.style.backgroundColor = this.state.color.secondary;
        }

        // if working day, shade success color
        if(cell.id in bookingPointer) {
          // retrieve booking from bookingPointer
          let booking = bookingPointer[cell.id];

          // merge cells
          cell.rowSpan = booking.duration;

          // create button and append to innerHTML
          cell.innerHTML = "<button style=float:right;font-size:15px;padding-top:0.1rem;padding-bottom:0.1rem;padding-right:0.55rem;padding-left:0.55rem id=btn-"+cell.id+" class=\"btn btn-outline-dark\">X</button>";

          // retrieve button and add onclick property
          var btn = document.getElementById("btn-"+cell.id);

          // use arrow function to bind the function
          btn.onclick = (e) => {
            // toggle delete modal
            var bookingId = e.target.id.substring(4);
            this.toggle(bookingId);
          }

          let cellsToRemove = booking.duration - 1;
          let cellBelowStartTime = Number(cell.id.substring(2,4)) + 1;

          for(let i = cellBelowStartTime; i < cellBelowStartTime+cellsToRemove; i++) {
            let cellIdToHide = cellDay + "-" + i + "-" + (i+1);
            document.getElementById(cellIdToHide).style.display = "none";
          }

          // set cell color
          cell.style.backgroundColor = this.state.color.success;
        }
      }
    }
  }

  //  helper function to populate the table with predicted bookings
  populatePredicted = () => {
    // get timetable
    var table = document.getElementById("timetable");

    // get predicted bookings
    var data = this.state.data;

    // for each row, starting from 2nd row to avoid headers
    for(let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
      // retrieve the row as cells
      let cells = table.rows[rowIndex].cells;

      // for each column of row (cells), starting from 2nd column to avoid time column
      for(let cellIndex = 1; cellIndex < cells.length; cellIndex++) {
        // retrieve current cell at index
        let cell = cells[cellIndex];

        // if cell id in predicted bookings, highlight it
        if(data.predicted.includes(cell.id) && cell.style.backgroundColor === "" && cell.style.display === "") {
          // highlight cell
          cell.style.backgroundColor = this.state.color.predicted;

          // add predicted booking to selected times
          data.selectedTimes.push(cell.id);
        }
      }
    }

    this.setState({ data });
  }

  // helper function to clear predicted bookings
  clearPredicted = () => {
    // get timetable
    var table = document.getElementById("timetable");

    // get data
    var data = this.state.data;

    // for each row, starting from 2nd row to avoid headers
    for(let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
      // retrieve the row as cells
      let cells = table.rows[rowIndex].cells;

      // for each column of row (cells), starting from 2nd column to avoid time column
      for(let cellIndex = 1; cellIndex < cells.length; cellIndex++) {
        // retrieve current cell at index
        let cell = cells[cellIndex];

        if(cell.style.backgroundColor === this.state.color.predicted) {
          cell.style.backgroundColor = "";

          // remove from selected
          data.selectedTimes.splice(data.selectedTimes.indexOf(cell.id),1);
        }
      }
    }
  }

  // handler function to re-render the table after an event (delete or submit)
  reRenderTable = async () => {
    var data = this.state.data;
    try {
      data.bookingPointer = await booking.getShiftBookingPointer(data.selectedWeek);
      this.clearTable();
      this.populateTable(data.week.workingDays, data.bookingPointer);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data });
    }
  }

  // helper function to clear the table of existing bookings and mergers
  clearTable = () => {
    // clear predicted
    this.clearPredicted();
    this.setState({ showPredicted: false });

    // retrieve table
    var table = document.getElementById("timetable");

    // for each row, starting from 2nd row to skip headers
    for(let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
      // retrieve row as cells
      let cells = table.rows[rowIndex].cells;

      // row each column in row (cells), starting from 2nd column to skip time column
      for(let cellIndex = 1; cellIndex < cells.length; cellIndex++) {
        // retrieve current cell
        let cell = cells[cellIndex];

        // if cell has rowSpan > 1, set to 1
        if(cell.rowSpan > 1) {
          cell.rowSpan = 1;
        }

        // if cell has button, remove it
        while(cell.firstChild) {
          cell.removeChild(cell.firstChild);
        }

        // if cell display is none, set display to ""
        if(cell.style.display === "none") {
          cell.style.display = "";
        }

        // reset cell color
        cell.style.backgroundColor = "";
      }
    }
  }

  // handler function to submit shifts
  submitShifts = async () => {
    var data = this.state.data;
    data.allowBookings = false;
    this.setState({ submitLoading: true });
    try {
      await booking.createBookings(data.selectedTimes, data.week);
      toast.info("Shift bookings have been created successfully");
      data.selectedTimes = [];
      this.reRenderTable();
    } catch(ex) {
      if(ex === "Deadline") {
        toast.error("Past the deadline for booking!");
      } else if(ex === "noBookings") {
        toast.error("Select timeslots for bookings");
      } else if(ex.response.status === 400 && ex.response.data[0] === "overlap") {
        toast.error("There is an overlap in shift bookings!");
      } else {
        const errors = {...this.state.errors};
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      data.allowBookings = true;
      this.setState({ data, submitLoading: false });
    }
  }

  // component function to render the timetable
  renderTimetable = () => {
    const Headers = this.renderTimetableHeaders;
    const Body = this.renderTimetableBody;
    return (
      <Table responsive bordered id="timetable" style={{"backgroundColor":"#ffffff"}}>
        <Headers />
        <Body />
      </Table>
    );
  }

  // subcomponent function to render timetable headers
  renderTimetableHeaders = () => {
    var week = this.state.data.week;
    return (
      <thead style={{backgroundColor:'#52658F',color:'#fff'}}>
        <tr>
          <th>Time</th>
          <th>Monday [{moment(week.fromDate).format("DD/MM")}]</th>
          <th>Tuesday [{moment(week.fromDate).add(1, "days").format("DD/MM")}]</th>
          <th>Wednesday [{moment(week.fromDate).add(2, "days").format("DD/MM")}]</th>
          <th>Thursday [{moment(week.fromDate).add(3, "days").format("DD/MM")}]</th>
          <th>Friday [{moment(week.toDate).format("DD/MM")}]</th>
        </tr>
      </thead>
    );
  }

  // subcomponent function to render timetable body
  renderTimetableBody = () => {
    var rows = this.state.rows;
    return (
      <tbody>
        {
          rows.map(row => (
            <tr id={row.key} key={row.key}>
              <th scope="row">{row.slot}</th>
              <td id={row.mon} onClick={this.handleClick}></td>
              <td id={row.tue} onClick={this.handleClick}></td>
              <td id={row.wed} onClick={this.handleClick}></td>
              <td id={row.thu} onClick={this.handleClick}></td>
              <td id={row.fri} onClick={this.handleClick}></td>
            </tr>
          ))
        }
      </tbody>
    );
  }

  // toggle function to open/close delete modal
  toggle = (id) => {
    const modal = this.state.modal;
    if(modal) {
      this.setState({
        modal: false,
        deleteId: ""
      });
    } else {
      this.setState({
        modal: true,
        deleteId: id
      });
    }
  }

  // toggle function to open/close legend modal
  toggleLegend = () => {
    this.setState({ legendModal: !this.state.legendModal });
  }

  // handler function to delete a booking
  deleteBooking = async () => {
    const deleteId = this.state.deleteId;
    const data = this.state.data;
    const id = data.bookingPointer[deleteId]._id;
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      await booking.deleteBookingByUser(id);
      await this.toggle();
      toast.info("Shift booking deleted");
      this.reRenderTable();
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ deleteLoading: false, allowDelete: true });
    }
  }

  render() {
    const Timetable = this.renderTimetable;
    const { weeksSorted, allowBookings, week } = this.state.data;
    const { submitLoading, deleteLoading, allowDelete, allowPredicted, showPredicted, color } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{marginBottom:"30px"}}>Manage Shifts</h2>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <FormGroup>
                <Label className="mb-0">Shift Week</Label>
                <FormText>Select a shift week before proceeding to make shift bookings</FormText>
                <Input
                  type="select"
                  id="selectedWeek"
                  onChange={this.handleWeekChange}
                  defaultValue={week._id}
                >
                  {
                    weeksSorted.length === 0 ?
                      <option disabled id="noWeeks" name="noWeeks">There are no shift booking weeks</option>
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
              <p className="mb-4 text-danger">Deadline for booking: <strong>{moment(week.bookingDeadline).format("ddd, MMM D, YYYY h:mma")}</strong></p>
            </Col>
          </Row>
          <Row style={{marginTop:"20px"}}>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <p><u style={{cursor:"pointer", color:"blue"}} onClick={this.toggleLegend}>Click here</u> for the timetable legend</p>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox" disabled={!allowPredicted} value={showPredicted} checked={showPredicted} onChange={this.handleCheckbox}/>{' '}
                  Enable/disable recommended shifts
                </Label>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 3, offset: 8 }}>
              <Button
                style={{backgroundColor:'#52658F', borderColor:'#52658F', width: "100%", marginTop: "20px" }}
                onClick={this.submitShifts}
                disabled={!allowBookings}
              >
                {
                  submitLoading ?
                    <div>
                      <CircularProgress size={20} />{" "}
                      Submitting
                    </div>
                  :
                    "Submit Shifts"
                }
              </Button>
            </Col>
          </Row>
          <Row style={{marginBottom:"20px", marginTop:"20px"}}>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <Timetable />
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 3, offset: 8 }}>
              <Button
                style={{backgroundColor:'#52658F', borderColor:'#52658F', width: "100%" }}
                onClick={this.submitShifts}
                disabled={!allowBookings}
              >
                {
                  submitLoading ?
                    <div>
                      <CircularProgress size={20} />{" "}
                      Submitting
                    </div>

                  :
                    "Submit Shifts"
                }
              </Button>
            </Col>
          </Row>

          <Modal centered isOpen={this.state.modal} toggle={this.toggle} zIndex="1300" style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}>
            <ModalHeader toggle={this.toggle}>Delete Shift Booking</ModalHeader>
            <ModalBody>
              Confirm deletion of shift booking?
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                onClick={this.deleteBooking}
                disabled={!allowDelete}
              >
                {
                  deleteLoading ?
                    <div>
                      <CircularProgress size= {20} />{" "}
                      Deleting
                    </div>
                  :
                    "Delete"
                }
              </Button>{' '}
            </ModalFooter>
          </Modal>

          <Modal centered isOpen={this.state.legendModal} toggle={this.toggleLegend} zIndex="1300" style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}>
            <ModalHeader toggle={this.toggleLegend}>Timetable Legend</ModalHeader>
            <ModalBody>
              <Row>
                <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                  <Lens sm="1" style={{ fill: color.primary }}/>
                  <Label style={{ color: color.primary, marginLeft: "5px" }}> - Selected Bookings</Label>
                </Col>
              </Row>
              <Row>
                <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                  <Lens sm="1" style={{ fill: color.predicted }}/>
                  <Label style={{ color: color.predicted, marginLeft: "5px" }}>- Recommended Bookings</Label>
                </Col>
              </Row>
              <Row>
                <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                  <Lens sm="1" style={{ fill: color.success }}/>
                  <Label style={{ color: color.success, marginLeft: "5px" }}>- Existing Bookings</Label>
                </Col>
              </Row>
            </ModalBody>
          </Modal>
        </div>
      </React.Fragment>
    );
  };
}

export default ShiftBooking;
