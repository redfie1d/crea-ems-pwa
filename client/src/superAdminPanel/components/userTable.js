// Import external resources
// This page is used particularly for the superadmin
import React, { Component } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import { toast } from "react-toastify";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";

// Import custom components
import Table from "../../common/table";

// Import services
import { adminEditUser } from "../../services/userService";

class UserTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      edit: {
        id: "",
        name: "",
        accountType: "",
        isWsg: "",
        catsExpiryDate: "",
        status: "",
        contactNumber: ""
      },
      user: "",
      delete: {},
      modal: false,
      errors: {},
      editLoading: false,
      allowEdit: true,
    };
  }

  handleFormSubmit = async () => {
    this.setState({ editLoading: true, allowEdit: false });
    try {
      var name = this.state.edit.name;
      var isWsg = this.state.edit.isWsg;
      var catsExpiryDate = this.state.edit.catsExpiryDate;
      var status = this.state.edit.status;
      var contactNumber = this.state.edit.contactNumber;
      await adminEditUser(
        this.state.user._id,
        name,
        isWsg,
        catsExpiryDate,
        status,
        contactNumber
      );
      toast.info("Saved successfully");
      this.toggleclose();
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
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

  // functions for all the onChange
  handleChange = e => {
    var edit = this.state.edit;
    edit[e.target.id] = e.target.value;
    this.setState({ edit });
  };

  toggleclose = () => {
    this.setState({
      modal: !this.state.modal
    });
  };

  toggleEdit = (
    e,
    user,
    id,
    name,
    accountType,
    isWsg,
    catsExpiryDate,
    status,
    contactNumber
  ) => {
    e.preventDefault();
    if (this.state.modal) {
      this.setState({
        modal: false,
        edit: {
          id: "",
          name: "",
          accountType: "",
          isWsg: "",
          catsExpiryDate: "",
          status: "",
          contactNumber: ""
        }
      });
    } else {
      let edit = this.state.edit;

      edit.id = id;
      edit.name = name;
      edit.accountType = accountType;
      if (catsExpiryDate === null) {
        edit.catsExpiryDate = null;
      } else {
        edit.catsExpiryDate = moment(catsExpiryDate).format("YYYY-MM-DD");
      }
      if (isWsg) {
        edit.isWsg = "Yes";
      } else {
        edit.isWsg = "No";
      }

      edit.status = status;
      edit.contactNumber = contactNumber;
      this.setState({
        modal: !this.state.modal,
        edit: edit,
        user: user
      });
    }
  };

  columns = [
    {
      path: "User",
      label: "Name",
      content: user => <h5>{user.name}</h5>
    },
    { path: "email", label: "Email" },
    { path: "accountType", label: "Account Type" },
    {
      path: "isWsg",
      label: "WSG Scheme",
      content: user => (
        <div>
          {user.accountType === "Super Admin" ||
          user.accountType === "Admin" ? (
            <p> Not Applicable</p>
          ) : (
            <div>{user.isWsg ? <p>Yes</p> : <p>No</p>}</div>
          )}
        </div>
      )
    },
    {
      path: "catsExpiryDate",
      label: "Cats Expiry Date",
      content: user => (
        <div>
          {user.accountType === "Student" ? (
            <div>
              {user.catsExpiryDate === null ? (
                <p />
              ) : (
                <p> {moment(user.catsExpiryDate).format("DD/MM/YYYY")} </p>
              )}
            </div>
          ) : (
            <p> Not Applicable</p>
          )}
        </div>
      )
    },
    {
      path: "status",
      label: "Status"
    },
    {
      path: "contactNumber",
      label: "Contact Number"
    },
    {
      path: "editUser",
      content: user => (
        <div>
          {user.accountType === "Super Admin" ? (
            <Button
              color="info"
              disabled
              onClick={e => {
                this.toggleEdit(
                  e,
                  user,
                  user._id,
                  user.name,
                  user.accountType,
                  user.isWsg,
                  user.catsExpiryDate,
                  user.status,
                  user.contactNumber
                );
              }}
            >
              Edit
            </Button>
          ) : (
            <Button
              color="info"
              onClick={e => {
                this.toggleEdit(
                  e,
                  user,
                  user._id,
                  user.name,
                  user.accountType,
                  user.isWsg,
                  user.catsExpiryDate,
                  user.status,
                  user.contactNumber
                );
              }}
            >
              Edit
            </Button>
          )}
        </div>
      )
    }
  ];

  render() {
    const { users, onSort, sortColumn } = this.props;
    const { allowEdit, editLoading } = this.state;

    return (
      <React.Fragment>
        <div>
          <Table
            hover
            style={{ backgroundColor: "#ffffff" }}
            columns={this.columns}
            data={users}
            sortColumn={sortColumn}
            onSort={onSort}
          />
          <Modal
            size="lg"
            isOpen={this.state.modal}
            container={this}
            aria-labelledby="contained-modal-title"
            centered
            zIndex="1302"
            style={{
              fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
            }}
          >
            <ModalHeader
              toggle={e => {
                this.toggleEdit(e, "");
              }}
            >
              Edit {this.state.edit.name}'s Details
            </ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={this.state.edit.name || ""}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                {this.state.edit.accountType === "Admin" ||
                this.state.edit.accountType === "Super Admin" ? (
                  <FormGroup>
                    <Label for="isWsg">WSG Scheme</Label>
                    <Input
                      type="select"
                      name="select"
                      id="isWsg"
                      onChange={this.handleChange}
                      value={this.state.edit.isWsg || ""}
                      disabled
                    >
                      <option value="">Select</option>
                    </Input>
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <Label for="isWsg">WSG Scheme</Label>
                    <Input
                      type="select"
                      name="select"
                      id="isWsg"
                      value={this.state.edit.isWsg}
                      onChange={this.handleChange}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </Input>
                  </FormGroup>
                )}
                {this.state.edit.accountType === "Admin" ||
                this.state.edit.accountType === "Super Admin" ? (
                  <FormGroup>
                    <Label for="catsExpiryDate">Cats Expiry Date</Label>
                    <Input
                      type="date"
                      name="date"
                      id="catsExpiryDate"
                      placeholder="catsExpiryDate"
                      value={this.state.catsExpiryDate || ""}
                      onChange={this.handleChange}
                      disabled
                    />
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <Label for="catsExpiryDate">Cats Expiry Date</Label>
                    <Input
                      type="date"
                      name="date"
                      id="catsExpiryDate"
                      value={this.state.edit.catsExpiryDate || ""}
                      onChange={this.handleChange}
                    />
                  </FormGroup>
                )}
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    type="select"
                    name="select"
                    id="status"
                    value={this.state.edit.status || ""}
                    onChange={this.handleChange}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="contactNumber">Contact Number</Label>
                  <Input
                    type="number"
                    name="number"
                    id="contactNumber"
                    placeholder="Contact Number"
                    value={this.state.edit.contactNumber || ""}
                    onChange={this.handleChange}
                  />
                </FormGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="info"
                onClick={this.handleFormSubmit}
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

export default UserTable;
