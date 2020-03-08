/*
Originator: Brandon
Date: 27 Mar 2019
Subcomponent to render shift configurations
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Form } from "reactstrap"

class ShiftContent extends Component {
  render() {
    var data = this.props.data;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col>
              <Form>
                <FormGroup row>
                  <Label for="minHoursPerWeek" sm={2}>Minimum Hours / Week (Per Student): </Label>
                  <Col sm={4}>
                    <Input type="number" name="minHoursPerWeek" id="minHoursPerWeek" value={data.minHoursPerWeek} onChange={this.props.handleChangeEvent} />
                  </Col>
                  <Label for="maxHoursPerDay" sm={2}>Maximum Hours / Day: </Label>
                  <Col sm={4}>
                    <Input type="number" name="maxHoursPerDay" id="maxHoursPerDay" value={data.maxHoursPerDay} onChange={this.props.handleChangeEvent} />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Label for="noOfWorkStations" sm={2}>No. of Workstations: </Label>
                  <Col sm={10}>
                    <Input type="number" name="noOfWorkStations" id="noOfWorkStations" value={data.noOfWorkStations} onChange={this.props.handleChangeEvent} />
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

export default ShiftContent;
