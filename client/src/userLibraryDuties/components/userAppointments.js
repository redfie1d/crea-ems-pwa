/*
Originator: Brandon
Date: 14 Jan 2019
Component to render library duties page for user
*/
// Import external resources
import React, { Component } from "react";
import {
  Table,
  Button,
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";

// Import services
import libraryDuties from "../../services/libraryDutiesService";

class UserAppointments extends Component {
  state = {
    rows: [],
    appointments: [],
    book: "",
    delete: "",
    months: [],
    selectedMonth: "",
    errors: {},
    modal: false,
    modalDelete: false,
    currentPage: 1,
    pageSize: 5,
    libDutyLoading: false,
    allowLibDuty: true,
    deleteLoading: false,
    allowDelete: true
  };

  async componentDidMount() {
    try {
      // get all months with library duties created
      var mthResult = await libraryDuties.getMonthsOfLibraryDuties();
      let currentMonth = moment().format("MMM-YY");

      var months = this.state.months;
      months = mthResult;

      var selectedMonth = this.state.selectedMonth;
      // Get latest month (first in the list)
      if(mthResult.length > 0) {
        selectedMonth = mthResult[0];

        for (var i = 0; i < mthResult.length; i++) {
          if(currentMonth === mthResult[i]) {
            selectedMonth = mthResult[i];
            break;
          }
        }
      }
      // get all library duties created
      var dutiesResult = await libraryDuties.getLibraryDuties();

      var rows = this.state.rows;
      rows = dutiesResult;

      var appointments = this.state.appointments;
      appointments = await libraryDuties.getAppointmentsByUser();

      // set state
      this.setState({ months, rows, appointments, selectedMonth });

    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
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

  renderHeaders = () => {
    return (
      <thead>
        <tr style={{backgroundColor:'#52658F',color:"#fff"}}>
          <th>Location Name</th>
          <th>Address</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          <th colSpan= "2"></th>
        </tr>
      </thead>
    );
  };

  bookAppointment = async e => {
    this.setState({ libDutyLoading: true, allowLibDuty: false });
    try {
      const result = await libraryDuties.bookAppointment(
        this.state.book
      );
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      setTimeout(() => {
        this.setState({ allowLibDuty: true, libDutyLoading: false })
      }, 1500);
    }
  };

  deleteAppointment = async e => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const result = await libraryDuties.deleteAppointment(
        this.state.delete
      );
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
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
  };

  toggleBook = (id) => {
    const { modal } = this.state;
    if(modal) {
      this.setState({
        modal: false,
        book: "",
      });
    } else {
      this.setState({
        modal: true,
        book: id
      });
    }
  }

  toggleDelete = (id) => {
    const { modalDelete } = this.state;
    var appointments = this.state.appointments;
    var appId = "";
    for(var i = 0; i < appointments.length; i++) {
      if (id === appointments[i].libraryDuty._id) {
        appId = appointments[i]._id;
        break;
      }
    }
    if(modalDelete) {
      this.setState({
        modalDelete: false,
        delete: "",
      });
    } else {
      this.setState({
        modalDelete: true,
        delete: appId
      });
    }
  }

  handleMonthSelect = async ({ currentTarget: input }) => {
    var {selectedMonth} = this.state;
    selectedMonth = input.value;

    if(selectedMonth === "monthPlaceholder") {
      return;
    }
    this.setState({ selectedMonth, currentPage: 1 });
  };

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  isBooked = (id) => {
    var appointments = this.state.appointments;
    var status = "";

    if (appointments.length === 0) {
      status = "";
    } else {
      for (var i = 0; i < appointments.length; i++) {
        if(id === appointments[i].libraryDuty._id) {
          status = appointments[i].status
        }
      }
    }

    return status;
  }

  render() {
    const Headers = this.renderHeaders;
    const { pageSize, currentPage, selectedMonth, rows, months, libDutyLoading, allowLibDuty, deleteLoading, allowDelete } = this.state;
    let filtered = rows

    if (selectedMonth)
      filtered = rows.filter(
          r => (moment(r.libraryDutyStart).format("MMM-YY")) === selectedMonth
        );

    const duties = paginate(filtered, currentPage, pageSize);

    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{ marginBottom: "30px" }}>Book Library Duties</h2>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <p>
                <b>{filtered.length}</b> library duties available in {selectedMonth}.
              </p>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <FormGroup>
                {/* Dropdown List for Months */}
                <Input
                  type="select"
                  id="selectedMonth"
                  onChange={this.handleMonthSelect}>
                  {
                    months.length === 0 ?
                      <option key="monthPlaceholder" value="monthPlaceholder" id="monthPlaceholder">
                        There are no library duties this month
                      </option>
                    :
                      <option value={selectedMonth} id={selectedMonth} hidden>
                        {selectedMonth}
                      </option>
                  }
                  {
                    months.map((month) => (
                      <option key={month} value={month} id={month}>
                        {month}
                      </option>
                    ))
                  }
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <Table responsive hover bordered style={{ backgroundColor: "#ffffff" }}>
                {/* Table for Library Duties */}
                <Headers />
                <tbody id="table-body">
                  {duties.length > 0 ? (
                    duties.map(row => (
                      <tr id={row._id} key={row._id}>
                        <td>{row.location.locationName}</td>
                        <td>{row.location.address + ", S" + row.location.postalCode}</td>
                        <td>{moment(row.libraryDutyStart).format("dddd, DD MMM, YYYY")}</td>
                        <td>{moment(row.libraryDutyStart).format("h:mma - ") +
                            moment(row.libraryDutyEnd).format("h:mma")}</td>
                        {
                            this.isBooked(row._id) === "confirmed" ?
                              <td style={{"color":"#008000"}}><b>Confirmed</b></td>
                          :
                            this.isBooked(row._id) === "pending" ?
                              <td style={{"color":"red"}}><b>Pending</b></td>
                          :
                              <td style={{"color":"#17a2b8"}}><b>Open</b></td>
                        }
                        {
                            this.isBooked(row._id) === "confirmed" ?
                              <td><Button style={{backgroundColor:'#008000',color:"#fff"}} block disabled>Confirmed</Button></td>
                          :
                            this.isBooked(row._id) === "pending" ?
                              <td><Button color="danger" onClick={() => {this.toggleDelete(row._id)}} block>Cancel</Button></td>
                          :
                              <td><Button color="info" onClick={() => {this.toggleBook(row._id)}} block>Book</Button></td>

                        }
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        There are no library duties for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modal} toggle={this.toggleBook} className={this.props.className} centered zIndex="1300" size="md">
                <ModalHeader toggle={this.toggleBook}>Book Library Duty</ModalHeader>
                <ModalBody>Are you sure you want to book?</ModalBody>
                <ModalFooter>
                  <Button color="info" onClick={this.bookAppointment} disabled={!allowLibDuty}>
                    {
                      libDutyLoading ?
                        <div>
                          <CircularProgress size= {20} />{" "}
                          Confirming
                        </div>
                      :
                        "Confirm"
                    }
                  </Button>{' '}
                </ModalFooter>
              </Modal>

              <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalDelete} toggle={this.toggleDelete} className={this.props.className} centered zIndex="1300" size="md">
                <ModalHeader toggle={this.toggleDelete}>Cancel Library Duty Appointment</ModalHeader>
                <ModalBody>Are you sure you want to cancel?</ModalBody>
                <ModalFooter>
                  <Button color="danger" onClick={this.deleteAppointment} disabled={!allowDelete}>
                    {
                      deleteLoading ?
                        <div>
                          <CircularProgress size= {20} />{" "}
                          Cancelling
                        </div>
                      :
                        "Cancel"
                    }
                  </Button>{' '}
                </ModalFooter>
              </Modal>
              <Pagination
                innerClass="pagination justify-content-center"
                itemClass="page-item"
                linkClass="page-link"
                activePage={currentPage}
                totalItemsCount={filtered.length}
                itemsCountPerPage={pageSize}
                pageRangeDisplayed={5}
                onChange={this.handlePageChange}
              />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default UserAppointments;
