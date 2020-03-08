//this page is used for super admins to create new admins or users
import React from "react";
import { Form, Input, Button } from "reactstrap";
import { toast } from "react-toastify";

import { registerAdmin, registerUser } from "../services/userService";

class UserNewFormSuperAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newUser: {
        name: "",
        email: "",
        password: "password",
        accountType: ""
      },
      errors: {}
    };
    this.baseState = this.state;
    this.handleInput = this.handleInput.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleFormSubmit2 = this.handleFormSubmit2.bind(this);
  }
  resetForm = () => {
    this.setState(this.baseState);
  };
  handleInput(e) {
    let value = e.target.value;
    let name = e.target.name;
    this.setState(prevState => ({
      newUser: {
        ...prevState.newUser,
        [name]: value
      }
    }));
  }
  async handleFormSubmit(e) {
    try {
      e.preventDefault();
      let userData = this.state.newUser;
      await registerAdmin(userData);
      this.resetForm();
      toast.info("Registration successful");
      setTimeout(function(){document.location.reload(true);},1500);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }
  async handleFormSubmit2(e) {
    try {
      e.preventDefault();
      let userData = this.state.newUser;
      await registerUser(userData);
      this.resetForm();
      toast.info("Registration successful");
      setTimeout(function(){document.location.reload(true);},1500);

    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }
  render() {
    return (
      <div className="cr-content container-fluid">
        <h2 style={{marginLeft:"15px"}}>New User</h2>
        <hr/>
        <br/>
        <Form className="container-fluid" onSubmit={this.handleFormSubmit}>
          <Input
            inputtype="text"
            title="Name"
            name="name"
            placeholder="Enter name"
            value={this.state.newUser.name}
            onChange={this.handleInput}
          />
          <br />
          <Input
            name={"email"}
            title={"email"}
            placeholder={"Email"}
            onChange={this.handleInput}
            value={this.state.newUser.email}
          />
          <br />
          <Input type="select"
            name="accountType"
            id="accountType"
            onChange={this.handleInput}
            placeholder="Select User Type">
            <option value="" hidden>
              Select...
            </option>
            <option>Admin</option>
            <option>Student</option>
          </Input>
          <br />
          {this.state.newUser.accountType === "Admin"?
          <Button
            color="primary"
            onClick={this.handleFormSubmit}
            style={{ float:"right", marginBottom: "1rem", backgroundColor:"#52658F", borderColor:"#52658F" }}
          >
            Create
          </Button>
          :
          //this button is for the admin to make students
          <Button
            color="primary"
            onClick={this.handleFormSubmit2}
            style={{ float:"right", marginBottom: "1rem", backgroundColor:"#52658F", borderColor:"#52658F" }}
          >
            Create
          </Button>
          }
          <br/>
          <br/>
          <hr/>
        </Form>
      </div>
    );
  }
}
export default UserNewFormSuperAdmin;
