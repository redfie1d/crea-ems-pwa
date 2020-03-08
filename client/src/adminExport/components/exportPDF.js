/*
Originator: Brandon
Date: 17 Mar 2019
Component to render export payroll into PDF
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Button, Table, Card, CardHeader, CardBody, CardTitle } from "reactstrap";
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from "moment";
import { toast } from "react-toastify";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import services
import exportPDF from "../../services/exportService";

class ExportPDF extends Component {
  state = {
    data: [],
    date: {
      fromDate: "",
      toDate: ""
    },
    errors: {},
    showPDF: false,
    generateLoading: false,
    allowGenerate: true
  }

  handleSearch = async () => {
    let {data, date} = this.state;
    try {
      data = await exportPDF.getComputedBookings(date.fromDate, date.toDate);
      this.setState({ data, showPDF:true });
    } catch(ex) {
      if(ex === "missingDates") {
        toast.error("Please enter a start and end date");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  handleGeneratePDF = async () => {
    this.setState({ generateLoading: true, allowGenerate: false });
    const doc = new jsPDF("p", "mm", 'a4');
    let cards = document.querySelectorAll(".card")

    for(const card of cards) {
      await html2canvas(card).then((canvas) => {
          var imgData = canvas.toDataURL('image/png');
          var imgWidth = 210;
          var pageHeight = 295;
          var imgHeight = canvas.height * imgWidth / canvas.width;
          var heightLeft = imgHeight;
          var position = 0;

          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          doc.addPage();
         });
     }
     var pageCount = doc.internal.getNumberOfPages();
     doc.deletePage(pageCount);
     doc.save('exportPayroll.pdf');﻿
     this.setState({ generateLoading: false, allowGenerate: true, showPDF: false});
  }

  handleChange = ({ currentTarget: input }) => {
    let {date} = this.state;
    date[input.name] = input.value;
    this.setState({ date });
  }

  renderHeaders = (computed) => {
    return (
      <thead key={computed.user._id}>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Remarks</th>
          <th>Respondent ID</th>
        </tr>
      </thead>
    );
  }

  renderBody = (computed) => {
    let body = [];
    let inner = [];
    let index = 0;
    computed.split.forEach(splitBooking => {
      inner.push(
        <tr key={index}>
          <td>{moment(splitBooking.startTime).format("DD/MM/YY")}</td>
          <td>{moment(splitBooking.startTime).format("h:mma -") +
          moment(splitBooking.endTime).format(" h:mma")}</td>
          <td>{splitBooking.successTypeString.length > 0 ?
                  splitBooking.successTypeString
                :
                  splitBooking.comment
                }
          </td>
          <td>{splitBooking.successfulLogsString}</td>
        </tr>
      );
      index++;
    });
    body.push(<tbody key={computed.user._id}>{inner}</tbody>);
    return body;
  }

  renderCards = () => {
    const { data } = this.state;
    let cards = [];
    data.forEach(computed => {
      cards.push(
        <Row key={computed.user._id}>
          <Col key={computed.user._id}>
            <Card key={"C-" + computed.user._id}>
              <CardHeader key={"CH-"+ computed.user._id}>{computed.user.name}</CardHeader>
              <CardBody key={"CB-"+ computed.user._id}>
                <CardTitle key={"CT-"+ computed.user._id}>
                  Successful: {computed.successfulCalls}{"  |  "}
                  Unsuccessful: {computed.unSuccessfulCalls}{"  |  "}
                  Total: {computed.totalCalls}
                </CardTitle>
                <Table key={computed.user._id} hover responsive bordered>
                  {this.renderHeaders(computed)}
                  {this.renderBody(computed)}
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      );
    });
    return cards;
  }

  render() {
    const Cards = this.renderCards;
    const {showPDF, generateLoading, allowGenerate } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row style={{marginBottom: "20px"}}>
            <Col>
              <p style={{color: "red"}}> Note: Export only when call logs has been uploaded & shift bookings has been computed and resolved for the specified date range below</p>
            </Col>
          </Row>
          <Row>
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
                style={{backgroundColor:'#52658F', borderColor:'#52658F', width: "30%" }}
                onClick={this.handleSearch}
              >
                Search
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <hr/>
            </Col>
          </Row>
          <br/>
          <Row align="right">
            <Col>
            {
              showPDF ?
                <Button
                  style={{marginBottom:"30px", width: "30%" }}
                  color="info"
                  onClick={this.handleGeneratePDF}
                  disabled={!allowGenerate}
                >
                {
                  generateLoading ?
                    <div>
                      <CircularProgress size= {20} />{" "}
                      Generating..
                    </div>
                  :
                    "Generate PDF"
                }
                </Button>
              :
                ""
            }
            </Col>
          </Row>
          <Row>
            <Col>
              <Cards />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default ExportPDF;
