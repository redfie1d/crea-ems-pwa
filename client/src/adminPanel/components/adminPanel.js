/*
Originator: Moses
Date: 29 Oct 2018
Main component to for the superadmin to add users and to view the users
*/
// Import external resources
import React, { Component } from "react";
import {
  Collapse,
  Button,
  Row,
  Col
} from "reactstrap";
import _ from "lodash";
import { toast } from "react-toastify"; //notifications

// Import custom components
import Pagination from "react-js-pagination";
import UserNewFormSuperAdmin from "../../common/userNewForm"; // creating the new user
import UserTableForAdmins from "./userTableForAdmins";
import SearchBox from "../../common/searchBox";

// Import utils
import { paginate } from "../../utils/paginate";

// Import services
import {
  getAllUsers,
  getAllAdmins,
  transferSuperAdmin
} from "../../services/userService"; //getting all the usernames
import auth from "../../services/authenticateService"; // getting the token to retrieve the user details

export default class AdminPanel extends Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      admin: {
        id: ""
      },
      user: {
        id: "",
        accountType: ""
      },
      collapse: false,
      users: [],
      admins: [],
      errors: {},
      currentPage: 1,
      pageSize: 5,
      sortColumn: { path: "name", order: "asc" },
      searchQuery: ""
    };
  }
  //toggling of the create new user tab
  toggle() {
    this.setState({ collapse: !this.state.collapse });
  }

  // getting all the users in the table
  async componentDidMount() {
    const user = auth.getCurrentUser();
    const { data: users } = await getAllUsers();
    const { data: admins } = await getAllAdmins();
    this.setState({ users, admins, user });
  }

  handleSubmit = async() => {
    try{
        var id = this.state.admin.id;
        await transferSuperAdmin(id);
        toast.info("Saved Successfully");
        this.toggleTransfer();
        setTimeout(function(){document.location.reload(true);},1500);
      }catch(ex){
        if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  };

  handleChange = e => {
    var admin = this.state.admin;
    admin[e.target.id] = e.target.value;
    this.setState({ admin });
  };

  handlePageChange = page => {
    this.setState({ currentPage: page });
  };

  handleSearch = query => {
    this.setState({ searchQuery: query, selectedName: null, currentPage: 1});
  };

  handleSort = sortColumn => {
    this.setState({ sortColumn });
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      sortColumn,
      searchQuery,
      users: allUsers
    } = this.state;

    let filtered = allUsers;

    if (searchQuery)
      filtered = allUsers.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const users = paginate(sorted, currentPage, pageSize);

    return { totalCount: filtered.length, data: users };
  };

  updateFormState = user => {
    this.toggle();
    this.refs.form.updateWithUser(user);
  };

  render() {
    const { pageSize, currentPage, sortColumn, user, searchQuery } = this.state;
    const { totalCount, data: users } = this.getPagedData();

    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{marginBottom:"30px"}}>User Management</h2>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 3, offset: 1 }}>
              {user.accountType === "Super Admin" ? (
                <Button style={{ marginBottom: "20px", width: "100%" }} color="info" onClick={this.toggleTransfer}>
                  Transfer Admin Rights
                </Button>
              ) : (
                <Button style={{ marginBottom: "20px", width: "100%" }} color="info" onClick={this.toggleTransfer} disabled>
                  Transfer Admin Rights
                </Button>
              )}
            </Col>
            <Col xs="12" sm="12" md={{ size: 3 }}>
              <Button style={{ marginBottom: "20px", width: "100%", backgroundColor: "#52658F", borderColor: "#52658F" }} color="primary" onClick={this.toggle}>
                Create New User
              </Button>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <Collapse isOpen={this.state.collapse}>
                <UserNewFormSuperAdmin />
              </Collapse>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <p>
                Showing {totalCount} users in the database.
              </p>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 3, offset: 8 }}>
              <SearchBox placeholder= {"Search by User..."} value={searchQuery} onChange={this.handleSearch} />
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <UserTableForAdmins
                users={users}
                sortColumn={sortColumn}
                onSort={this.handleSort}
                triggerForm={user => {
                  this.updateFormState(user);
                }}
              />
              <Pagination
                innerClass="pagination justify-content-center"
                itemClass="page-item"
                linkClass="page-link"
                activePage={currentPage}
                totalItemsCount={totalCount}
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
