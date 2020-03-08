/*
Originator: Brandon
Date: 27 Mar 2019
Subcomponent to render qr attendance loggger configurations
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Form } from "reactstrap";

class LoggerContent extends Component {
  render() {
    var data = this.props.data;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col>
              <Form>
              <FormGroup row>
                <Label for="creaAddress" sm={2}>CREA Office Postal Code: </Label>
                <Col sm={4}>
                  <Input type="text" name="creaAddress" id="creaAddress" value={data.creaAddress} onChange={this.props.handleChangeEvent} />
                </Col>
                <Label for="maxDistanceFromCrea" sm={2}>Max Distance Away (metres): </Label>
                <Col sm={4}>
                  <Input type="number" name="maxDistanceFromCrea" id="maxDistanceFromCrea" value={data.maxDistanceFromCrea} onChange={this.props.handleChangeEvent} />
                </Col>
              </FormGroup>
              </Form>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default LoggerContent;
