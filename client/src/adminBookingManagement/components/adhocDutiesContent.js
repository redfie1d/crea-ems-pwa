/*
Originator: Hidayatullah
Date: 30 Dec 2018
Component to render booking management page for admins
*/
// Import external resources
import React, { Component } from "react";
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
  Row,
  Col,
  Form
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";
import SearchBox from "../../common/searchBox";

// Import services
import adhoc from "../../services/adhocDutiesService";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";


class AdhocDutiesContent extends Component {
  state = {
    data: {
      adhoc: [],
      week: {}
    },
    edit: {
      id: "",
      user: {},
      date: "",
      startTime: "",
      endTime: "",
      remarks: "",
    },
    modalDelete: false,
    delete: "",
    weeksSorted: [],
    selectedWeek: "",
    errors: {},
    currentPage: 1,
    pageSize: 5,
    searchQuery: "",
    deleteLoading: false,
    allowDelete: true,
    editLoading: false,
    allowEdit: true,
  }

  async componentDidMount() {
    try {
      // Retrieve list of weeks to display
      // ------------------------------------------------------------
      var weeksSorted = await adhoc.getAdhocDutiesWeeksSorted();
      // ------------------------------------------------------------
      var currentWeek = moment().subtract(1, 'd').week();

      var data = this.state.data;
      var selectedWeek = this.state.selectedWeek;
      // Get latest week (first in the list)
      if(weeksSorted.length > 0) {
        data.week = weeksSorted[0];
        selectedWeek = weeksSorted[0]._id;

        for (var i = 0; i < weeksSorted.length; i++) {
          if (currentWeek === moment(weeksSorted[i].fromDate).week()) {
            data.week = weeksSorted[i];
            break;
          }
        }

        // ------------------------------------------------------------
        data.adhoc = await adhoc.getAdhocDutiesByWeek(data.week._id);
        // ------------------------------------------------------------

      }

      this.setState({
        data,
        weeksSorted,
        selectedWeek
      });

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
          <th>Name</th>
          <th>Day</th>
          <th>Time</th>
          <th>Remarks</th>
          <th colSpan="2"></th>
        </tr>
      </thead>
    );
  }

  deleteAdhoc = async () => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const id = this.state.delete;
      const result = await adhoc.deleteAdhocDuty(id);
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
  }

  editAdhoc = async e => {
    this.setState({ editLoading: true, allowEdit: false });
    try {
      // ------------------------------------------------------------
      const result = await adhoc.updateAdhocByAdmin(this.state.edit);
      // ------------------------------------------------------------
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
        this.setState({ editLoading: false, allowEdit: true });
      }, 1500);
    }
  }

  toggleDelete = (id) => {
    const { modalDelete } = this.state;
    if(modalDelete) {
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
  }

  toggleEdit = async (id) => {
    const { modalEdit } = this.state;
    try {
      if (modalEdit) {
        this.setState({
          modalEdit: false,
          edit: {
            id: "",
            user: {},
            date: "",
            startTime: "",
            endTime: "",
            remarks: "",
          }
        });
      } else {
        const result = await adhoc.getAdhocDuty(id);
        let edit = {...this.state.edit}
        edit.id = id;
        edit.user = result.user;
        edit.date = result.date;
        edit.startTime = result.startTime;
        edit.endTime = result.endTime;
        edit.remarks = result.remarks;
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

  handleWeekChange = async ({ currentTarget: input }) => {
    var data = this.state.data;
    var selectedWeek = this.state.selectedWeek;
    selectedWeek = input.value;
    // ---------------------------------------------------------
    data.adhoc = await adhoc.getAdhocDutiesByWeek(selectedWeek);
    // ---------------------------------------------------------
    var weeksSorted = this.state.weeksSorted;
    for(var i = 0; i < weeksSorted.length; i++) {
      if(weeksSorted[i]._id === selectedWeek) {
        data.week = weeksSorted[i];
      }
    }

    this.setState({
      data,
      selectedWeek,
      currentPage: 1
    });
  }

  handleEditChange = e => {
    var edit = {...this.state.edit};
    edit[e.target.id] = e.target.value;
    this.setState({ edit });
  };

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  handleSearch = query => {
    this.setState({ searchQuery: query, selectedName: null, currentPage: 1});
  };

  render() {
    const Headers = this.renderHeaders;
    const adhoc = this.state.data.adhoc;
    const { weeksSorted, data, pageSize, currentPage, searchQuery, deleteLoading, allowDelete, editLoading, allowEdit } = this.state;

    let filtered = adhoc;
    if (searchQuery)
      filtered = adhoc.filter(b =>
        b.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const displayAdhoc = paginate(filtered, currentPage, pageSize);

    return (
      <React.Fragment>
        <div>
          <Row>
            <Col>
              <FormGroup>
                <Label>Shift Week</Label>
                <Input
                  type="select"
                  id="selectedWeek"
                  onChange={this.handleWeekChange}
                >
                {
                  weeksSorted.length === 0 ?
                    <option key="weekPlaceholder" value="weekPlaceholder" id="weekPlaceholder">There are no adhoc duties created this weeks</option>
                  :
                    <option value={data.week._id} id={data.week._id} hidden>
                    {
                      moment(data.week.fromDate).format("DD MMM, YYYY --- ") +
                      moment(data.week.toDate).format("DD MMM, YYYY")
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
            <Col xs="12" sm="12" md={{ size: 4, offset: 8 }}>
              <SearchBox placeholder= {"Search by Name..."} value={searchQuery} onChange={this.handleSearch} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Table hover bordered style={{"backgroundColor":"#ffffff"}}>
              <Headers />
                <tbody id="table-body">
                  {
                    displayAdhoc.length > 0 ?
                      displayAdhoc.map((row) => (
                        <tr id={row._id} key={row._id}>
                          <td>{row.user.name}</td>
                          <td>{moment(row.startTime).format("dddd DD/MM")}</td>
                          <td>
                            {
                              moment(row.startTime).format("h:mma -") +
                              moment(row.endTime).format(" h:mma")
                            }
                          </td>
                          <td>{row.remarks}</td>
                          <td colSpan= "1"><Button color="info" onClick={() => {this.toggleEdit(row._id)}} block>Edit</Button></td>
                          <td colSpan= "1"><Button color="danger" onClick={() => {this.toggleDelete(row._id)}} block>Delete</Button></td>
                        </tr>
                      ))
                    :
                      <tr>
                        <td colSpan="6">There are no adhoc duties for this week</td>
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

          {/*Modal for Deleting Adhoc Duties*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalDelete} toggle={this.toggleDelete} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleDelete}>Delete Adhoc Duty</ModalHeader>
            <ModalBody>
              <h5>Are you sure you want to delete?</h5>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                onClick={this.deleteAdhoc}
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

          {/*Modal for Editing Adhoc Duties*/}
          <Modal isOpen={this.state.modalEdit} toggle={this.toggleEdit} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleEdit}>Edit {this.state.edit.user.name}'s Adhoc Duty</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label for="startTime">Start Time</Label>
                  <Input type="time" name="startTime" id="startTime" value={this.state.edit.startTime || ""} onChange={this.handleEditChange}/>
                </FormGroup>
                <FormGroup>
                  <Label for="endTime">End Time</Label>
                  <Input type="time" name="endTime" id="endTime" value={this.state.edit.endTime || ""} onChange={this.handleEditChange}/>
                </FormGroup>
                <FormGroup>
                  <Label for="remarks">Remarks</Label>
                  <Input type="text" name="remarks" id="remarks" value={this.state.edit.remarks || ""} onChange={this.handleEditChange}/>
                </FormGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="info"
                onClick={this.editAdhoc}
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

export default AdhocDutiesContent;
