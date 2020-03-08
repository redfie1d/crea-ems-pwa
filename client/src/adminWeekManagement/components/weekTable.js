/*
Originator: Hidayatullah
Date: 5 Nov 2018
Component to render weeks table
*/
// Import external resources
import React, { Component } from "react";
import {
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";

// Import services
import booking from "../../services/bookingService";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";

class WeekTable extends Component {
  state = {
    rows: [],
    edit: {
      maxHoursPerDay: 0,
      minHoursPerWeek: 0,
      bookingDeadline: "",
      bookingDeadlineTime: "",
      fromDate: "",
      toDate: "",
      workingDays: {
        monday: {isWorkingDay: true, color: "primary"},
        tuesday: {isWorkingDay: true, color: "primary"},
        wednesday: {isWorkingDay: true, color: "primary"},
        thursday: {isWorkingDay: true, color: "primary"},
        friday: {isWorkingDay: true, color: "primary"}
      }
    },
    modal: false,
    deleteId: "",
    deleteLoading: false,
    allowDelete: true,
    currentPage: 1,
    pageSize: 5

  }

  async componentDidMount() {
    try {
      // retrieve existing weeks and display in a table
      await booking.getAllShiftBookingWeeks()
      .then((data) => {
        var rows = this.state.rows;
        rows = data;
        rows.forEach((row) => {
          var nonWorkingDays = [];
          row.workingDays.forEach((day) => {
            if(!day.isWorkingDay) {
              nonWorkingDays.push(day.day);
            }
          });
          row.nonWorkingDays = nonWorkingDays;
        });
        this.setState({rows});
      })
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  renderHeaders = () => {
    return (
      <thead style={{backgroundColor:'#52658F',color:'#fff'}}>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Booking Deadline</th>
          <th>Non-Working Days</th>
          <th></th>
        </tr>
      </thead>
    );
  }

  deleteWeek = async () => {
    var id = this.state.deleteId;
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      await booking.deleteShiftBookingWeek(id);
      toast.info("Shift bookings week has been deleted");
      setTimeout(function(){document.location.reload(true);},1500);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      setTimeout(() => {
        this.setState({ deleteLoading: false, allowDelete: true });
      }, 1500);
    }
  }

  toggle = (id) => {
    var modal = this.state.modal;
    modal ?
      this.setState({
        modal: false,
        deleteId: ""
      })
    :
      this.setState({
        modal: true,
        deleteId: id
      })
  }

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  render() {
    const Headers = this.renderHeaders;
    const data = this.state.rows;
    const { deleteLoading, allowDelete, currentPage, pageSize } = this.state;

    const displayShifts = paginate(data, currentPage, pageSize);
    return (
      <React.Fragment>
        <Table hover responsive bordered>
          {displayShifts.length > 0 && <Headers />}
          <tbody id="table-body">
            {displayShifts.map((row) => (
              <tr id={row._id} key={row._id}>
                <td>{moment(row.fromDate).format("DD MMM, YYYY")}</td>
                <td>{moment(row.toDate).format("DD MMM, YYYY")}</td>
                <td>{moment(row.bookingDeadline).format("dddd, DD MMM, YYYY | h:mma")}</td>
                <td>{row.nonWorkingDays.toString()}</td>
                <td><Button color="danger" onClick={() => {this.toggle(row._id)}} block>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          innerClass="pagination justify-content-center"
          itemClass="page-item"
          linkClass="page-link"
          activePage={currentPage}
          totalItemsCount={data.length}
          itemsCountPerPage={pageSize}
          pageRangeDisplayed={5}
          onChange={this.handlePageChange}
        />
        <Modal centered style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} zIndex="1300" isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}>Delete Shift Booking Week</ModalHeader>
          <ModalBody>
            <h5>Are you sure you want to delete?</h5>
            <br/>
            <div>
              <b style={{ color: "red" }}>*Warning* All subsequent shifts booked with this shift week will be deleted.</b>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              onClick={this.deleteWeek}
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
      </React.Fragment>
    );
  }
}

export default WeekTable;
