// Import external resources
import React from "react";
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
  Row,
  Col,
  Table
} from "reactstrap";
import { toast } from "react-toastify";
import moment from "moment";

// Import services
import { saveUser } from "../../services/userService";
import auth from "../../services/authenticateService";

class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      edit: {
        password: "",
        confirmPassword: "",
        catsExpiryDate: "",
        contactNumber: ""
      },
      user:{},
      errors: {},
      modal: false
    };
  }

  toggleEdit = () => {
    let modal = this.state.modal;
    if(modal){
      this.setState({
        modal: false,
        edit:{
          password:"",
          confirmPassword: "",
          catsExpiryDate:"",
          contactNumber:""
        }
      });
    } else {
      let edit = {...this.state.edit};
      let user = {...this.state.user};
      edit.contactNumber = user.contactNumber;
      if(user.catsExpiryDate === null) {
        edit.catsExpiryDate = null;
      } else {
        edit.catsExpiryDate = moment(user.catsExpiryDate).format("YYYY-MM-DD");
      }
      this.setState({
        modal: !this.state.modal,
        edit: edit
      });
    };
  }

  componentDidMount() {
    var user = auth.getCurrentUser();
    this.setState({ user });
  }

  handleChange = e => {
    var edit = {...this.state.edit};
    edit[e.target.id] = e.target.value;
    this.setState({ edit });
  };

  closeModal = () => {
    this.setState({ modal: false });
  };

  handleFormSubmit = async () => {
    try {
      var { password, catsExpiryDate, contactNumber, confirmPassword } = this.state.edit;
      await saveUser(password, confirmPassword, catsExpiryDate, contactNumber);
      toast.info("Saved successfully");
      this.closeModal();
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      if (ex === "NotMatched") {
        toast.error("Password fields do not match");
      }
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  };

  render() {
    const { user, edit } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{fontSize:'50px', marginLeft:'15px'}}>Hello, {user.name}</h2>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <Table responsive style={{ backgroundColor: "#ffffff" }}>
                <tbody>
                  <tr>
                    <td style={{width: "25%"}}><b>Email:</b></td>
                    <td>{user.email}</td>
                  </tr>
                  <tr>
                    <td style={{width: "25%"}}><b>Account Type:</b></td>
                    <td>{user.accountType}</td>
                  </tr>
                  <tr>
                    <td style={{width: "25%"}}><b>Contact Number:</b></td>
                    <td>{!user.contactNumber ? ("-") : user.contactNumber}</td>
                  </tr>
                  <tr>
                    <td style={{width: "25%"}}><b>Cats Expiry Date:</b></td>
                    <td>{user.catsExpiryDate === null ? ("-")
                          :(<div>{moment(user.catsExpiryDate).format("DD/MM/YYYY")} </div>
                          )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{width: "25%"}}><b>WSG Scheme:</b></td>
                    <td>{user.isWsg ? ("Yes")
                          :("No"
                          )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 3, offset: 8 }}>
              <Button style={{float:"right", backgroundColor:'#52658F',borderColor:'#52658F'}} color="info" onClick={e => {
                this.toggleEdit();
              }}>
                Change your details
              </Button>
            </Col>
          </Row>
          <Modal
            size="lg"
            isOpen={this.state.modal}
            container={this}
            aria-labelledby="contained-modal-title"
            centered
            zIndex="1302"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={e => {
                this.toggleEdit();
              }}>Change your details</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label for="password">New Password</Label>
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter new password"
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="password">Confirm Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    placeholder="Enter confirm password"
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <Row>
                  <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                    <hr/>
                  </Col>
                </Row>
                <FormGroup style={{marginTop:'20px'}}>
                  <Label for="contactNumber">Contact Number</Label>
                  <Input
                    type="number"
                    name="contactNumber"
                    id="contactNumber"
                    placeholder="Contact Number"
                    value={edit.contactNumber || ""}
                    onChange={this.handleChange}
                  />
                </FormGroup>
                <hr/>
                <FormGroup style={{marginTop:'20px'}}>
                  <Label for="catExpiryDate">Cats Expiry Date</Label>
                  <Input
                    type="date"
                    name="date"
                    id="catsExpiryDate"
                    value={edit.catsExpiryDate || ""}
                    onChange={this.handleChange}
                  />
                </FormGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button style={{backgroundColor:'#52658F',borderColor:'#52658F'}} onClick={this.handleFormSubmit} data-dismiss="modal">
                Save
              </Button>{" "}
            </ModalFooter>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default Profile;
