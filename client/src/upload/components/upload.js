// import external resources
import React from "react";
import { toast } from "react-toastify";
import { Button, Table, Row, Col, Modal, ModalHeader, ModalFooter, ModalBody } from "reactstrap";
import CircularProgress from "@material-ui/core/CircularProgress";

// import services
import { uploadFile, getData } from "../../services/uploadService";

class Upload extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
      loading: false,
      currentData: [],
      year: "",
      modal: false,
      timeCompleted: ""
    };
  }

  onChange = event => {
    this.setState({
      selectedFile: event.target.files[0]
    });
  };

  async componentDidMount() {
    var currentData = await getData();
    this.setState({ currentData });
  }

  toggle = (timeCompleted) => {
    const { modal } = this.state;
    if(modal) {
      this.setState({
        modal: false,
        timeCompleted: ""
      });
      setTimeout(function() {
        document.location.reload(true);
      }, 500);
    } else {
      this.setState({
        modal: true,
        timeCompleted: timeCompleted
      });
    }
  }

  handleSubmit = async e => {
    try {
      if (this.state.selectedFile !== null) {
        this.setState({ loading: true });
      }
      e.preventDefault();
      let fd = new FormData();
      fd.append("file", this.state.selectedFile, this.state.selectedFile.name);
      var result = await uploadFile(fd);
      this.toggle(result);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        this.setState({ loading: false });
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  };

  renderHeaders = () => {
    return (
      <thead>
        <tr style={{ backgroundColor: "#52658F", color: "#fff" }}>
          <th>Year</th>
          <th>Months</th>
        </tr>
      </thead>
    );
  };

  renderInnerTableBody = () => {
    const currentData = this.state.currentData;
    let body = [];
    let tbody = [];

    currentData.forEach(obj => {
      var row = [];
      row.push(
        <tr id={obj.year} key={obj.year}>
          <td rowSpan={obj.months.length}>{obj.year}</td>
          <td>{obj.months[0]}</td>
        </tr>
      );
      if (obj.months.length > 1) {
        for (var inner = 1; inner < obj.months.length; inner++) {
          row.push(
            <tr key={inner}>
              <td>{obj.months[inner]}</td>
            </tr>
          );
        }
      }
      tbody.push(row);
    });
    body.push(<tbody key="body">{tbody}</tbody>);
    return body;
  };

  render() {
    const { loading, currentData, timeCompleted } = this.state;
    const Headers = this.renderHeaders;
    const InnerTableBody = this.renderInnerTableBody;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{marginBottom:"30px"}}>Upload Call Logs</h2>
            </Col>
          </Row>
          <Row style={{ marginBottom: "20px" }}>
            <Col xs="12" sm="12" md={{ size: 3, offset: 1 }}>
              <form>
                <input type="file" name="file" onChange={this.onChange} />
              </form>
            </Col>
          </Row>
          <Row style={{ marginBottom: "20px" }}>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <p style={{ color: "red" }}>Please ensure CSV Header Columns are in this format before uploading</p>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Created By</th>
                    <th>Updated By</th>
                    <th>Respondent ID</th>
                    <th>Wave</th>
                    <th>Contact List</th>
                    <th>Contact List Type</th>
                    <th>Mode of Contact</th>
                    <th>Case Type</th>
                    <th>Follow Up</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody/>
              </Table>
            </Col>
          </Row>
          <Row style={{ marginBottom: "20px" }}>
            <Col xs="12" sm="12" md={{ size: 3, offset: 1 }}>
              <Button
                style={{
                  width: "100%"
                }}
                color="info"
                onClick={this.handleSubmit}
                disabled={loading}
              >
                {loading && <CircularProgress size={20} />}
                {loading && <span> Sending data to server</span>}
                {!loading && <span>Upload</span>}
              </Button>
            </Col>
          </Row>

          <hr />
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h3 style={{ fontSize: "20px" }}>Records in the database</h3>
              <Table responsive bordered style={{ backgroundColor: "#ffffff" }}>
                <Headers />
                {Object.keys(currentData).length > 0 ? (
                  <InnerTableBody />
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan="2"> There are no records</td>
                    </tr>
                  </tbody>
                )}
              </Table>
            </Col>
          </Row>
        </div>
        <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modal} toggle={this.toggle} className={this.props.className} centered zIndex="1300" size="md">
          <ModalHeader toggle={this.toggle}>Upload Status</ModalHeader>
          <ModalBody>{timeCompleted}</ModalBody>
          <ModalFooter>
            <Button color="info" onClick={this.toggle}>
              OK
            </Button>{' '}
          </ModalFooter>
        </Modal>
      </React.Fragment>
    );
  }
}

export default Upload;
