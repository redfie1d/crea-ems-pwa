/*
Originator: Brandon
Date: 17 Jan 2019
Component to render locations for library duties
*/
// Import external resources
import React, {Component} from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Input,
  Table
} from "reactstrap";
import { toast } from "react-toastify";
import CircularProgress from '@material-ui/core/CircularProgress';

// Import services
import libraryDuties from "../../services/libraryDutiesService";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";

// Import custom components
import LocationForm from "./locationForm";

class LocationManagement extends Component {
  state = {
    locations: [],
    selectedLocation: "",
    errors: {},
    modal: false,
    modalDelete: false,
    deleteLoading: false,
    allowDelete: true,
    currentPage: 1,
    pageSize: 5
  }

  async componentDidMount() {
    try {
      var locationsResult = await libraryDuties.getLocations();
      var { locations } = this.state;
      locations = locationsResult;

      this.setState({ locations });

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
          <th>Location Name</th>
          <th>Address</th>
        </tr>
      </thead>
    );
  }

  handleDeleteLocationSelect = async ({ currentTarget: input }) => {
    var {selectedLocation, locations} = this.state;
    selectedLocation = input.value;

    var results = await libraryDuties.getLocations()
    for(var i = 0; i < results.length; i++) {
      if(results[i]._id === selectedLocation) {
        locations.locationId = results[i]._id;
        locations.address = results[i].address;
        locations.postalCode = results[i].postalCode;
      }
    }

    if(selectedLocation === "locPlaceholder") {
      return;
    }

    this.setState({ locations, selectedLocation });
  };

  handleDeleteLocation = async e => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const result = await libraryDuties.deleteLocation(this.state.selectedLocation);
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
  }

  toggle = () => {
    const { modal } = this.state;
    if(modal) {
      this.setState({
        modal: false
      });
    } else {
      this.setState({
        modal: true
      });
    }
  }

  toggleDelete = () => {
    var { modalDelete } = this.state;
    if(modalDelete) {
      this.setState({
        modalDelete: false,
        selectedLocation: ""
      });
    } else {
      this.setState({
        modalDelete: true
      });
    }
  }

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  render() {
    const Headers = this.renderHeaders;
    const { locations, deleteLoading, allowDelete, pageSize, currentPage } = this.state;

    const displayLocations = paginate(locations, currentPage, pageSize);
    return (
      <React.Fragment>
        <div>
          {/* Create Location */}
          {/* Modal */}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modal} toggle={this.toggle} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggle}>Create Location</ModalHeader>
            <ModalBody>
              <LocationForm />
            </ModalBody>
          </Modal>
          {/* Delete Location */}
          {/* Modal */}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalDelete} toggle={this.toggleDelete} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleDelete}>Delete Location</ModalHeader>
            <ModalBody>
              <Input
                type="select"
                id="selectedLocation"
                onChange={this.handleDeleteLocationSelect}>
                <option value="" hidden>
                  Select...
                </option>
                {
                  locations.length > 0 ?
                    locations.map((loc) => (
                      <option key={loc._id} value={loc._id} id={loc._id}>
                        {loc.locationName}
                      </option>
                    ))
                  :
                  <option key="locPlaceholder" value="locPlaceholder" id="locPlaceholder">
                    There are no locations created
                  </option>
                }
              </Input>
              <div>
              {
                this.state.selectedLocation ?
                  <Table borderless style={{ marginTop: "20px" }}>
                    <tbody>
                      <tr>
                        <th>Address:</th>
                        <td>{this.state.locations.address}</td>
                      </tr>
                      <tr>
                        <th>Postal Code:</th>
                        <td>{this.state.locations.postalCode}</td>
                      </tr>
                    </tbody>
                  </Table>
                :
                  ""
              }
              </div>
              <br />
              <b style={{ color: "red" }}>*Warning* All subsequent library duties and appointments created with this location will be deleted.</b>
              <br />
            </ModalBody>
            <ModalFooter>
            {
              locations.length > 0 ?
                <Button
                  color="danger"
                  onClick={this.handleDeleteLocation}
                  disabled={!allowDelete}
                >
                  {
                    deleteLoading ?
                      <div>
                        <CircularProgress size= {20} />{" "}
                        Deleting
                      </div>
                    :
                      "Delete "
                  }
                </Button>
              :
              ""
            }
            </ModalFooter>
          </Modal>
          <Row style={{ marginBottom: "20px", marginTop: "10px" }}>
            <Col xs="12" sm="12" md={{ size: 6 }} style={{ marginBottom: "20px" }}>
              <Button style={{ width: "100%" }} color="info" onClick={this.toggle}>
                Create New Location
              </Button>
            </Col>
            <Col xs="12" sm="12" md={{ size: 6 }} style={{ marginBottom: "20px" }}>
              <Button style={{ width: "100%" }} color="danger" onClick={this.toggleDelete}>
                Delete Locations
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <hr/>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table responsive hover bordered style={{ backgroundColor: "#ffffff" }}>
                {locations.length > 0 && <Headers />}
                <tbody id="table-body">
                  {displayLocations.length > 0 ? (
                    displayLocations.map(row => (
                      <tr id={row._id} key={row._id}>
                        <td>{row.locationName}</td>
                        <td>{row.address + ", S" + row.postalCode}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">There are no locations created</td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <Pagination
                innerClass="pagination justify-content-center"
                itemClass="page-item"
                linkClass="page-link"
                activePage={currentPage}
                totalItemsCount={locations.length}
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

export default LocationManagement;
