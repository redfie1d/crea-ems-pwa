/*
Originator: Hidayatullah
Date: 26 Feb 2019
Subcomponent to render timesheet tab contents
*/
// Import external resources
import React, { Component } from "react";
import {
  Row,
  Col,
  FormGroup,
  Input,
  Label,
  Button,
  Table
} from "reactstrap"
import { toast } from "react-toastify";
import moment from "moment";

// Import services
import timesheetService from "../../services/timesheetService";
import config from "../../services/configService";

class TimesheetTabContent extends Component {
  state = {
    data: {
      searchUser: "",
      searchStatus: "",
      records: [],
      statusList: [],
      users: []
    },
    errors: {}
  }

  async componentDidMount() {
    let data = this.state.data
    try {
      // get status list from config
      let configs = await config.getAllConfigurations();
      data.statusList = configs.statusList;

      // get all users with open records
      data.users = await timesheetService.getAllUsersWithOpenRecords();
    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data });
    }
  }

  handleSearchChange = ({ currentTarget: input }) => {
    var data = this.state.data;
    data[input.name] = input.value;
    this.setState({ data });
  }

  handleSearch = async () => {
    var data = this.state.data;
    if(!data.searchUser || !data.searchStatus) {
      toast.error("Please fill in both search fields");
      return;
    }
    try {
      // call search endpoint by user id
      data.records = await timesheetService.searchUserRecordsWithStatus(data.searchUser, data.searchStatus);

    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data });
    }
  }

  render() {
    const { users, records, statusList } = this.state.data;
    return (
      <React.Fragment>
        <Row>
          <Col>
            <FormGroup>
              <Label for="searchUser">Search by user</Label>
              <Input
                type="select"
                id="searchUser"
                name="searchUser"
                onChange={this.handleSearchChange}
              >
                {users.length > 0 && <option key="userPlaceholder" value="">Select user</option>}
                {
                  users.length > 0 ?
                    users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))
                  :
                    <option key="userPlaceholder" value="">No users with "open" timesheet</option>
                }
              </Input>
            </FormGroup>
          </Col>
          <Col>
            <FormGroup>
              <Label for="searchStatus">Status</Label>
              <Input
                type="select"
                id="searchStatus"
                name="searchStatus"
                onChange={this.handleSearchChange}
              >
                {statusList.length > 0 && <option key="statusPlaceholder" value="">Select status</option>}
                {
                  statusList.length > 0 ?
                    statusList.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))
                  :
                    <option key="statusPlaceholder" value="">Status not available</option>
                }
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <Row align="right">
          <Col>
            <Button
              color="info"
              onClick={this.handleSearch}
            >
              Search
            </Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <hr />
          </Col>
        </Row>
        <Row>
          <Col>
            <Table hover responsive bordered>
              <thead style={{backgroundColor:'#52658F',color:'#fff'}}>
                <tr>
                  <th>Name</th>
                  <th>Day</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Shift Type</th>
                </tr>
              </thead>
              <tbody>
                {
                  records.length > 0 ?
                    records.map(record => (
                      <tr key={record._id}>
                        <td>{record.user.name}</td>
                        <td>{moment(record.recordStart).format("dddd, DD MMM, YYYY")}</td>
                        <td>{moment(record.recordStart).format("HH:mma")}</td>
                        <td>{moment(record.recordEnd).format("HH:mma")}</td>
                        <td>{record.recordType}</td>
                      </tr>
                    ))
                  :
                    <tr>
                      <td colSpan="5">Select a user and status to search for</td>
                    </tr>
                }
              </tbody>
            </Table>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default TimesheetTabContent;
