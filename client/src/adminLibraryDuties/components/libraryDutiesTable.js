/*
Originator: Brandon
Date: 13 Jan 2019
Component to render library duties table
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
} from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";

// Import external components
import Pagination from "react-js-pagination";
import { paginate } from "../../utils/paginate";

// Import services
import libraryDuties from "../../services/libraryDutiesService";

class LibraryDutiesTable extends Component {
  state = {
    rows: [],
    delete: "",
    modal: false,
    currentPage: 1,
    pageSize: 5,
    deleteLoading: false,
    allowDelete: true
  };

  async componentDidMount() {
    // retrieve existing library duties and display in a table
    try {
      // retrieve existing weeks and display in a table
      const data = await libraryDuties.getLibraryDuties();
      var rows = this.state.rows;
      rows = data;

      this.setState({ rows });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
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
          <th>Date</th>
          <th>Time</th>
          <th></th>
        </tr>
      </thead>
    );
  }

  deleteLibraryDuties = async e => {
    this.setState({ deleteLoading: true, allowDelete: false });
    try {
      const result = await libraryDuties.deleteLibraryDuties(this.state.delete);
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

  toggle = id => {
    const { modal } = this.state;
    if (modal) {
      this.setState({
        modal: false,
        delete: ""
      });
    } else {
      this.setState({
        modal: true,
        delete: id
      });
    }
  };

  handlePageChange = page => {
    this.setState({ currentPage: page});
  };

  render() {
    const Headers = this.renderHeaders;
    const { pageSize, currentPage, rows, deleteLoading, allowDelete } = this.state;

    const duties = paginate(rows, currentPage, pageSize);
    return (
      <React.Fragment>
        <div>
          <Table responsive hover bordered style={{ backgroundColor: "#ffffff" }}>
            {rows.length > 0 && <Headers />}
            <tbody id="table-body">
              {duties.length > 0 ? (
                duties.map(row => (
                  <tr id={row._id} key={row._id}>
                    <td>{row.location.locationName}</td>
                    <td>{row.location.address + ", S" + row.location.postalCode}</td>
                    <td>{moment(row.libraryDutyStart).format("dddd, DD MMM, YYYY")}</td>
                    <td>{moment(row.libraryDutyStart).format("h:mma - ") +
                        moment(row.libraryDutyEnd).format("h:mma")}
                    </td>
                    <td><Button color="danger" onClick={() => {this.toggle(row._id);}} block>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">There are no library duties created</td>
                </tr>
              )}
            </tbody>
          </Table>
          <Modal
            isOpen={this.state.modal}
            toggle={this.toggle}
            className={this.props.className}
            centered
            zIndex="1300"
            size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggle}>Delete Library Duty</ModalHeader>
            <ModalBody>
              <h5>Are you sure you want to delete?</h5>
              <br/>
              <div>
                <b style={{ color: "red" }}>*Warning* All subsequent appointments created with this library duty will be deleted.</b>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                onClick={this.deleteLibraryDuties}
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
          <Pagination
            innerClass="pagination justify-content-center"
            itemClass="page-item"
            linkClass="page-link"
            activePage={currentPage}
            totalItemsCount={rows.length}
            itemsCountPerPage={pageSize}
            pageRangeDisplayed={5}
            onChange={this.handlePageChange}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default LibraryDutiesTable;
