/*
Originator: Hidayatullah
Date: 8 Mar 2019
Subcomponent to render computation results contents
*/
// Import external resources
import React, { Component } from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormText,
  Label,
  Input,
  Card,
  CardHeader,
  CardBody
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import { toast } from "react-toastify";
import moment from "moment";

// import services
import computationService from "../../services/computationService";

class ComputationResultsContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {
        results: props.results,
        selectedBooking: "",
        selectedIndex: "",
        comment: ""
      },
      errors: {},
      commentModal: false,
      successModal: false,
      allowComments: true,
      commentsLoading: false
    }
  }

  renderHeaders = (user) => {
    return (
      <thead key={user._id._id} style={{backgroundColor:'#52658F',color:'#fff'}}>
        <tr>
          <th>Date</th>
          <th>Start time</th>
          <th>End time</th>
          <th>Status</th>
          <th>Review</th>
        </tr>
      </thead>
    );
  }

  renderBody = (user) => {
    let body = [];
    let inner = [];
    user.bookings.forEach(booking => {
      let index = 0;
      booking.split.forEach(splitBooking => {
        inner.push(
          <tr key={booking.bookingId + "-" + index}>
            <td>{moment(splitBooking.startTime).format("dddd, DD MMM, YYYY")}</td>
            <td>{moment(splitBooking.startTime).format("h:mma")}</td>
            <td>{moment(splitBooking.endTime).format("h:mma")}</td>
            <td>
              {
                splitBooking.review === "Flagged" ?
                  <b style={{ color: "red" }}>{splitBooking.review}</b>
                :
                  <b style={{ color: "green" }}>{splitBooking.review}</b>
              }
            </td>
            <td>
              <Button
                color={
                  splitBooking.review === "Resolved" ?
                    "success"
                  :
                    "info"
                }
                id={booking.bookingId}
                value={index}
                onClick={this.toggleInputComments}
                disabled={
                  splitBooking.review === "Resolved" ?
                    true
                  :
                    false
                }
              >
                {
                  splitBooking.review === "Resolved" ?
                    "Resolved"
                  :
                    "Resolve"
                }
              </Button>
            </td>
          </tr>
        );
        index++;
      });
    });
    body.push(<tbody key={user._id._id}>{inner}</tbody>);
    return body;
  }

  renderCards = () => {
    const { results } = this.state.data;
    let cards = [];
    results.forEach(user => {
      cards.push(
        <Row key={user._id._id}>
          <Col key={user._id._id}>
            <Card key={"C-"+user._id._id}>
              <CardHeader key={"CH-"+user._id._id}>{user._id.name}</CardHeader>
              <CardBody key={"CB-"+user._id._id}>
                <Table key={user._id._id} hover responsive bordered>
                  {this.renderHeaders(user)}
                  {this.renderBody(user)}
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      );
    });
    return cards;
  }

  toggleInputComments = ({ currentTarget: target }) => {
    var commentModal = this.state.commentModal;
    var data = this.state.data;
    if(commentModal) { // if true, close modal and reset selected booking and comment
      data.selectedBooking = "";
      data.selectedIndex = "";
      data.comment = "";
      this.setState({
        data,
        commentModal: false
      });
    } else { // else, open modal
      data.selectedBooking = target.id;
      data.selectedIndex = target.value;
      this.setState({
        data,
        commentModal: true
      });
    }
  }

  toggleSuccess = () => {
    this.setState({ successModal: !this.state.successModal });
  }

  handleChange = ({ currentTarget: input }) => {
    var data = this.state.data;
    data[input.name] = input.value;
    this.setState({ data });
  }

  saveComments = async () => {
    this.setState({ allowComments: false, commentsLoading: true });
    var data = this.state.data;

    // validate comment input
    if(data.comment === "") {
      this.setState({
        allowComments: true,
        commentsLoading: false
      });
      toast.error("Please fill in comments field");
      return;
    }

    data.results.forEach(user => {
      user.bookings.forEach(booking => {
        if(booking.bookingId === data.selectedBooking) {
          let split = booking.split;
          let splitBooking = split[Number(data.selectedIndex)];
          splitBooking.comment = data.comment;
          splitBooking.review = "Resolved";
        }
      });
    });

    // reset values
    data.selectedBooking = "";
    data.selectedIndex = "";
    data.comment = "";

    this.setState({
      data,
      commentModal: false,
      allowComments: true,
      commentsLoading: false
    });
  }

  handleConfirm = async () => {
    var data = this.state.data;
    try {
      var response = await computationService.confirmComputation(data.results);
      toast.info(response);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  render() {
    const Cards = this.renderCards;
    const { allowComments, commentsLoading } = this.state;
    return (
      <React.Fragment>
        <Cards />
        <Row align="right" className="mt-3">
          <Col>
            <Button
              color="info"
              onClick={this.handleConfirm}
            >
              Confirm
            </Button>
          </Col>
        </Row>

        {/* COMMENT MODAL */}
        <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.commentModal} toggle={this.toggleInputComments} className={this.props.className} centered zIndex="1300" size="md">
          <ModalHeader toggle={this.toggleInputComments}>Resolve Flagged Hour</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label for="comment">Comments</Label>
              <Input type="textarea" name="comment" id="comment" bsSize="sm" onChange={this.handleChange}/>
              <FormText>Provide a comment to the user's booking before resolving it</FormText>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button
              color="info"
              onClick={this.saveComments}
              disabled={!allowComments}
            >
              {
                commentsLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Resolving
                  </div>
                :
                  "Resolve"
              }
            </Button>
          </ModalFooter>
        </Modal>

        {/* SUCCESS MODAL */}
        <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.successModal} toggle={this.toggleSuccess} className={this.props.className} centered zIndex="1300" size="md">
          <ModalHeader toggle={this.toggleSuccess}>Computation Successful</ModalHeader>
          <ModalBody>
            Computation of KPI confirmed.
          </ModalBody>
        </Modal>
      </React.Fragment>
    );
  }
}

export default ComputationResultsContent;
