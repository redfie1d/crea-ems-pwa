/*
Originator: Brandon
Date: 25 Feb 2019
Component to render timesheet input
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, Table, Button, Form, FormGroup, Label, Input, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { toast } from "react-toastify";
import moment from "moment";
import CircularProgress from '@material-ui/core/CircularProgress';

// Import services
import timesheetService from "../../services/timesheetService";

// Import custom components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";

class ViewTimesheetContent extends Component {
  state = {
    edit: {
      id: "",
      date: "",
      startTime: "",
      endTime: "",
      shiftType: ""
    },
    records: [],
    months: [],
    errors: {},
    currentPage: 1,
    pageSize: 5,
    deleteLoading: false,
    allowDelete: true,
    editLoading: false,
    allowEdit: true,
    delete: "",
    modalEdit: false,
    modalDelete: false,
    selectedMonth: ""
  }

  async componentDidMount() {
    try {
      var { records, months, selectedMonth } = this.state;
      records = await timesheetService.getAllRecords();
      months = await timesheetService.getMonthsOfRecords();

      if(months.length > 0) {
        selectedMonth = months[0];
      }

      this.setState({ records, selectedMonth, months });
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

  renderHeaders = () => {
    return (
      <thead>
        <tr style={{backgroundColor:'#52658F',color:"#fff"}}>
          <th>Date</th>
          <th>Time</th>
          <th>Shift Type</th>
          <th colSpan="2"></th>
        </tr>
      </thead>
    )
  }

  deleteTimesheet = async e => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const result = await timesheetService.deleteRecord(this.state.delete);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
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

  editTimesheet = async e => {
    this.setState({ editLoading: true, allowEdit: false });
    try {
      const result = await timesheetService.updateRecord(this.state.edit);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      setTimeout(() => {
        this.setState({ editLoading: false, allowEdit: true });
      }, 1500);
    }
  };

  handleMonthSelect = async ({ currentTarget: input }) => {
    var {selectedMonth} = this.state;
    selectedMonth = input.value;

    if(selectedMonth === "monthPlaceholder") {
      return;
    }

    this.setState({ selectedMonth, currentPage: 1 });
  };

  handleEditChange = e => {
    var edit = {...this.state.edit};
    edit[e.target.id] = e.target.value;
    this.setState({ edit });
  };

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  toggleEdit = async (id) => {
    const { modalEdit } = this.state;
    try {
      if (modalEdit) {
        this.setState({
          modalEdit: false,
          edit: {
            id: "",
            date: "",
            startTime: "",
            endTime: "",
            shiftType: ""
          }
        });
      } else {
        const result = await timesheetService.retrieveRecord(id);
        let edit = {...this.state.edit}
        edit.id = id;
        edit.date = result.date;
        edit.startTime = result.startTime;
        edit.endTime = result.endTime;
        edit.shiftType = result.shiftType;
        this.setState({
          modalEdit: true,
          edit: edit
        });
      }
    } catch (ex) {
      const errors = { ...this.state.errors };
      this.setState({ errors });
      toast.error(ex.response.data);
    }
  };

  toggleDelete = id => {
    const { modalDelete } = this.state;
    if (modalDelete) {
      this.setState({
        modalDelete: false,
        delete: ""
      });
    } else {
      this.setState({
        modalDelete: true,
        delete: id
      });
    }
  };

  render() {
    const Headers = this.renderHeaders;
    const { records, pageSize, currentPage, months, selectedMonth, deleteLoading, allowDelete, editLoading, allowEdit} = this.state;

    let filtered = records;
    if (selectedMonth)
      filtered = records.filter(
        a => (moment(a.recordStart).format("MMM-YY")) === selectedMonth
      );

    const displayRecords = paginate(filtered, currentPage, pageSize);

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
                    months.length > 0 ?
                      months.map((month) => (
                        <option key={month} value={month} id={month}>
                          {month}
                        </option>
                      ))
                    :
                    <option key="monthPlaceholder" value="monthPlaceholder" id="monthPlaceholder">
                      There are no timesheets created for this month
                    </option>
                  }
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table responsive hover bordered style={{ backgroundColor: "#ffffff" }}>
                {filtered.length > 0 && <Headers />}
                <tbody id="table-body">
                  {displayRecords.length > 0 ? (
                    displayRecords.map(row => (
                      <tr id={row._id} key={row._id}>
                        <td>{moment(row.recordStart).format("dddd, DD MMM, YYYY")}</td>
                        {row.recordEnd === null ?
                          <td>{"Present"}</td>
                        :
                          <td>{moment(row.recordStart).format("h:mma - ") +
                            moment(row.recordEnd).format("h:mma")
                            }
                          </td>
                        }
                        <td>{row.recordType === "shift" ? "Shift Work" : "Library Duty"}</td>
                          {
                            row.isManual ?
                              <td colSpan="1">
                                <Button color="info" onClick={() => {this.toggleEdit(row._id)}} block>
                                  Edit
                                </Button>
                              </td>
                            :
                              <td colSpan="2">
                                <Button style={{backgroundColor:'#52658F',color:"#fff"}} block disabled>
                                  Attendance Logged
                                </Button>
                              </td>
                          }
                          {
                            row.isManual &&
                            <td>
                                <Button color="danger" onClick={() => {this.toggleDelete(row._id)}} block>
                                  Delete
                                </Button>
                            </td>
                          }
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">There are no timesheet created</td>
                    </tr>
                  )}
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

          {/*Modal for deleting record*/}
          <Modal isOpen={this.state.modalDelete} toggle={this.toggleDelete} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleDelete}>Delete Timesheet</ModalHeader>
            <ModalBody><h5>Are you sure you want to delete?</h5></ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                onClick={this.deleteTimesheet}
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

          {/*Modal for editing record*/}
          <Modal isOpen={this.state.modalEdit} toggle={this.toggleEdit} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleEdit}>Edit Timesheet</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label for="date">Date</Label>
                  <Input type="date" name="date" id="date" value={this.state.edit.date || ""} onChange={this.handleEditChange}/>
                </FormGroup>
                <FormGroup>
                  <Label for="startTime">Start Time</Label>
                  <Input type="time" name="startTime" id="startTime" value={this.state.edit.startTime || ""} onChange={this.handleEditChange}/>
                </FormGroup>
                <FormGroup>
                  <Label for="endTime">End Time</Label>
                  <Input type="time" name="endTime" id="endTime" value={this.state.edit.endTime || ""} onChange={this.handleEditChange}/>
                </FormGroup>
                <FormGroup>
                  <Label for="shiftType">Shift Type</Label>
                  <Input type="select" name="shiftType" id="shiftType" value={this.state.edit.shiftType || ""} onChange={this.handleEditChange}>
                    <option value="shift">Shift</option>
                    <option value="lib">Library Duty</option>
                  </Input>
                </FormGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="info"
                onClick={this.editTimesheet}
                disabled={!allowEdit}
              >
                {
                  editLoading ?
                    <div>
                      <CircularProgress size= {20} />{" "}
                      Updating
                    </div>
                  :
                    "Update"
                }
              </Button>{' '}
            </ModalFooter>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default ViewTimesheetContent;
