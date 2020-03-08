/*
Originator: Brandon
Date: 15 Jan 2019
Component to render all appointments booked by user page for admins
*/
import React, { Component } from 'react';
import {
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Input,
  Label,
  FormText,
  Row,
  Col,
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";
//import services
import libraryDuties from "../../services/libraryDutiesService";

class AdminAppointmentsMgmt extends Component {
  state = {
    appointments: [],
    delete: "",
    confirm: "",
    months: [],
    selectedMonth: "",
    locations: [],
    selectedLocation: "",
    errors: {},
    modalDelete: false,
    modalConfirm: false,
    currentPage: 1,
    pageSize: 5,
    remarks: "",
    deleteLoading: false,
    allowDelete: true,
    confirmLoading: false,
    allowConfirm: true
  }

  async componentDidMount() {
    try {
      // get all appointments
      var { appointments, months, locations } = this.state;
      let currentMonth = moment().format("MMM-YY");

      var allAppointments = await libraryDuties.getAppointments();
      appointments = allAppointments;

      //get all months of appointments
      var allMonths = await libraryDuties.getMonthsOfAppointments();
      months = allMonths;
      var selectedMonth = this.state.selectedMonth;
      // Get latest month (first in the list)
      if(allMonths.length > 0) {
        selectedMonth = allMonths[0];

        for (var i = 0; i < months.length; i++) {
          if(currentMonth === months[i]) {
            selectedMonth = months[i];
            break;
          }
        }
      }

      // set state
      this.setState({ appointments, months, locations, selectedMonth });

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
          <th>User</th>
          <th>Location Name</th>
          <th>Date</th>
          <th>Time</th>
          <th>Date Booked</th>
          <th>Status</th>
          <th colSpan="2"></th>
        </tr>
      </thead>
    );
  };

  confirmAppointment = async e => {
    this.setState({ confirmLoading: true, allowConfirm: false });
    try {
      const id = this.state.confirm;
      const result = await libraryDuties.updateAppointmentByAdmin(id);
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
        this.setState({ confirmLoading: false, allowConfirm: true });
      }, 1500);
    }
  };

  deleteAppointment = async e => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const id = this.state.delete;
      const remarks = this.state.remarks;
      const result = await libraryDuties.deleteAppointmentByAdmin(id, remarks);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if(ex === "NeedRemarks") {
        toast.error("Please input remarks");
      }
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

  toggleConfirm = (id) => {
    const { modalConfirm } = this.state;
    if(modalConfirm) {
      this.setState({
        modalConfirm: false,
        confirm: ""
      });
    } else {
      this.setState({
        modalConfirm: true,
        confirm: id
      });
    }
  };

  toggleDelete = (id) => {
    const { modalDelete } = this.state;
    if(modalDelete) {
      this.setState({
        modalDelete: false,
        delete: "",
        remarks: ""
      });
    } else {
      this.setState({
        modalDelete: true,
        delete: id
      });
    }
  };

  handleChange = ({ currentTarget: input }) => {
    var remarks = this.state.remarks;
    remarks = input.value;
    this.setState({ remarks });
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

  render() {
    const Headers = this.renderHeaders;
    const { pageSize, currentPage, appointments, months, selectedMonth, deleteLoading, allowDelete, confirmLoading, allowConfirm } = this.state;

    let filtered = appointments;
    if (selectedMonth)
      filtered = appointments.filter(
        a => (moment(a.libraryDuty.libraryDutyStart).format("MMM-YY")) === selectedMonth
      );

    const appt = paginate(filtered, currentPage, pageSize);

    return (
      <React.Fragment>
        <div>
          <Row>
            <Col>
            <FormGroup>
              {/* Dropdown List for Months */}
              <Label>Select Month</Label>
              <Input
                type="select"
                id="selectedMonth"
                onChange={this.handleMonthSelect}
                placeholder={"Select a Month..."}>
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
            <Col>
              <Table responsive hover bordered style={{ backgroundColor: "#ffffff", marginTop:"40px" }}>
                <Headers />
                {/* Table view for appointments booked */}
                <tbody id="table-body">
                {
                  appt.length > 0 ?
                    appt.map((row) => (
                      <tr id={row._id} key={row._id}>
                        <td>{row.user.name}</td>
                        <td>{row.libraryDuty.location.locationName}</td>
                        <td>{moment(row.libraryDuty.libraryDutyStart).format("dddd, DD MMM, YYYY")}</td>
                        <td>{moment(row.libraryDuty.libraryDutyStart).format("h:mma - ") +
                        moment(row.libraryDuty.libraryDutyEnd).format("h:mma")}</td>
                        <td>{moment(row.dateCreated).format("dddd, DD MMM, YYYY | h:mma")}</td>
                        <td>{row.status === "pending" ? "Pending" : "Confirmed"}</td>
                        {
                          row.status === "pending" &&
                            <td colSpan="1"><Button color="info" onClick={() => {this.toggleConfirm(row._id)}} block>Confirm</Button></td>
                        }
                        {
                          row.status === "confirmed" ?
                            <td colSpan="2"><Button color="danger" onClick={() => {this.toggleDelete(row._id)}} block>Cancel</Button></td>
                          :
                            <td colSpan="1"><Button color="danger" onClick={() => {this.toggleDelete(row._id)}} block>Cancel</Button></td>
                        }
                      </tr>
                    ))
                  :
                      <tr>
                        <td colSpan="6">There are no library duties booked for this month/location</td>
                      </tr>
                }
                </tbody>
              </Table>
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
          {/*Modal for Delete*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalDelete} toggle={this.toggleDelete} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleDelete}>Cancel Appointment?</ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label for="remarks">Remarks</Label>
                <Input type="textarea" name="remarks" id="remarks" bsSize="sm" onChange={this.handleChange}/>
                <FormText>Provide reasons for cancelling the student's library duty appointment</FormText>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                onClick={this.deleteAppointment}
                disabled={!allowDelete}
              >
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
          {/*Modal for Confirm*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalConfirm} toggle={this.toggleConfirm} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleConfirm}>Confirm Booking?</ModalHeader>
            <ModalBody>Are you sure you want to confirm?</ModalBody>
            <ModalFooter>
              <Button
                color="info"
                onClick={this.confirmAppointment}
                disabled={!allowConfirm}
              >
                {
                  confirmLoading ?
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
        </div>
      </React.Fragment>
    );
  }
}

export default AdminAppointmentsMgmt;
