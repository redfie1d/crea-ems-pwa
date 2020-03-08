/*
Originator: Brandon
Date: 19 Mar 2019
Component to render export shift booking into CSV
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Button, } from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import { toast } from "react-toastify";

// Import services
import exportCSV from "../../services/exportService";

class ExportCSV extends Component {
  state = {
    date: {
      fromDate: "",
      toDate: ""
    },
    errors: {},
    generateLoading: false,
    allowGenerate: true
  }

  handleExport = async () => {
    this.setState({ generateLoading: true, allowGenerate: false });
    var { date } = this.state;
    try {
      var file = await exportCSV.exportCsv(date.fromDate, date.toDate);
      const blob = new Blob([file.data], {type:'text/csv'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden','');
      a.setAttribute('href', url);
      a.setAttribute('download', 'exportShiftBookings.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch(ex) {
      if(ex === "missingDates") {
        toast.error("Please enter a start and end date");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
        this.setState({  generateLoading: false, allowGenerate: true });
      }
  };

  handleChange = ({ currentTarget: input }) => {
    let {date} = this.state;
    date[input.name] = input.value;
    this.setState({ date });
  }

  render() {
    const { generateLoading, allowGenerate } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row style={{marginTop: "20px"}}>
            <Col>
              <FormGroup>
                <Label className="mb-0">From</Label>
                <Input
                  type="date"
                  name="fromDate"
                  onChange={this.handleChange}
                />
              </FormGroup>
            </Col>
            <Col>
              <FormGroup>
                <Label className="mb-0">To</Label>
                <Input
                  type="date"
                  name="toDate"
                  onChange={this.handleChange}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row align="right">
            <Col>
              <Button
                style={{ width: "30%", marginTop: "20px" }}
                color="info"
                onClick={this.handleExport}
                disabled={!allowGenerate}
              >
              {
                generateLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Exporting..
                  </div>
                :
                  "Export CSV"
              }
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <hr/>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default ExportCSV;
