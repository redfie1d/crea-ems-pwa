/*
Originator: Brandon
Date: 27 Mar 2019
Subcomponent to render computations configurations
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Form, Button } from "reactstrap"
import { toast } from "react-toastify";

class ComputationsContent extends Component {
  state = {
    selectedCase: "",
    showUnsuccessfulButton: false,
    selectedUnsuccessful: ""
  }

  addUnsuccessful = () => {
    var data = this.props.data;
    var { selectedUnsuccessful } = this.state;
    let isPresent = false;

    for(var i = 0; i < data.unsuccessfulCases.length; i++) {
      if(data.unsuccessfulCases[i] === selectedUnsuccessful) {
        isPresent = true;
        break;
      }
    }

    if (!isPresent) {
      data.unsuccessfulCases.push(selectedUnsuccessful);
      toast.info("Successfully added, Proceed to apply changes");
    } else {
      toast.error("Selected case is already present in Unsuccessful Call Type");
    }

  };

  removeUnsuccessful = () => {
    var data = this.props.data;
    var { selectedUnsuccessful } = this.state;
    let isPresent = false;

    for(var i = 0; i < data.unsuccessfulCases.length; i ++) {
      if(data.unsuccessfulCases[i] === selectedUnsuccessful) {
        isPresent = true;
        break;
      }
    }

    if (isPresent && data.unsuccessfulCases.length > 1) {
      var n = data.unsuccessfulCases.indexOf(selectedUnsuccessful);
      data.unsuccessfulCases.splice(n,1);
      toast.info("Successfully removed, Proceed to apply changes");
    } else if (data.unsuccessfulCases.length <= 1) {
      toast.error("There should be at least 1 unsuccessful call type");
    } else {
      toast.error("Selected case is not present in unsuccessful call type, Unable to remove");
    }

  };

  handleUnsuccessfulSelect = ({ currentTarget: input }) => {
    var {selectedUnsuccessful} = this.state;
    selectedUnsuccessful = input.value;

    this.setState({ selectedUnsuccessful, showUnsuccessfulButton: true });
  };

  render() {
    var data = this.props.data;
    var { showUnsuccessfulButton } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col>
              <Form>
                {/*FORM FOR UNSUCCESSFUL CALL TYPES*/}
                <FormGroup row>
                  <Label for="unsuccessfulCases" sm={2}>Unsuccessful Call Types: </Label>
                  <Col sm={4}>
                    <Input type="textarea" name="unsuccessfulCases" id="unsuccessfulCases" value={data.unsuccessfulCases} onChange={this.props.handleChangeEvent} disabled/>
                  </Col>
                  <Col sm={3}>
                    <Input
                      type="select"
                      id="allCases"
                      name="allCases"
                      onChange={this.handleUnsuccessfulSelect}
                    >
                    {<option value="" hidden >Select...</option>}
                    {
                      data.allCases.length > 0 ?
                        data.allCases.map(row => (
                          <option key={row} value={row}>{row}</option>
                        ))
                      :
                        ""
                    }
                    </Input>
                  </Col>
                  <Col sm={3}>
                    {
                      showUnsuccessfulButton ?
                      <div>
                        <Button color="danger" style={{float:"right", marginBottom: "10px", marginLeft: "10px"}} onClick={this.removeUnsuccessful}>
                          Remove
                        </Button>
                        <Button color="info" style={{ float:"right", marginBottom: "10px"}} onClick={this.addUnsuccessful}>
                          Add
                        </Button>
                      </div>
                      :
                        ""
                    }
                  </Col>
                </FormGroup>

                {/*FORM FOR KPI*/}
                <FormGroup row style={{ marginBottom: "20px", marginTop: "20px"}}>
                  <Label for="kpi" sm={2}>KPI (Number of Calls / Hr): </Label>
                  <Col sm={10}>
                    <Input type="number" name="kpi" id="kpi" value={data.kpi} onChange={this.props.handleChangeEvent} />
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

export default ComputationsContent;
