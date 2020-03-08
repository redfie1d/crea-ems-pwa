/*
Originator: Hidayatullah
Date: 6 Mar 2019
Subcomponent to render computation tab contents
*/
// Import external resources
import React from "react";
import Joi from "joi-browser";
import {
  Row,
  Col,
  Form
} from "reactstrap";
import { toast } from "react-toastify";

// import services
import computationService from "../../services/computationService";

// Import custom components
import CommonForm from '../../common/form';
import ComputationResultsContent from "./computationResultsContent";

class ComputationTabContent extends CommonForm {
  state = {
    data: {
      fromDate: "",
      toDate: "",
    },
    results: [],
    errors: {},
    allowCompute: true,
    computeLoading: false
  }

  schema = {
    fromDate: Joi.string().required().label("From Date"),
    toDate: Joi.string().required().label("To Date")
  }

  doSubmit = async e => {
    // submit logic here
    e.preventDefault();
    this.setState({ computeLoading: true, allowCompute: false });
    var results = this.state.results;
    var { fromDate, toDate } = this.state.data;
    try {
      // retrieve results after computation
      results = await computationService.computeByDate(fromDate, toDate);

    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      if(results.length > 0) {
        this.setState({
          results,
          computeLoading: false,
          allowCompute: false
        });
      } else {
        this.setState({
          results,
          computeLoading: false,
          allowCompute: true
        });
      }
    }
  }

  render() {
    const { allowCompute, computeLoading } = this.state;
    const { results } = this.state;
    return (
      <React.Fragment>
        <Form onSubmit={this.doSubmit}>
          <Row>
            <Col>
              {this.renderInput("fromDate", "From", "date", "")}
            </Col>
            <Col>
              {this.renderInput("toDate", "To", "date", "")}
            </Col>
          </Row>
          <Row align="right">
            <Col>
              {this.renderButton("Compute", "", computeLoading, allowCompute)}
            </Col>
          </Row>
        </Form>
        {
          results.length > 0 &&
            <Row className="mt-4">
              <Col>
                <ComputationResultsContent results={results} />
              </Col>
            </Row>
        }
      </React.Fragment>
    );
  }
}

export default ComputationTabContent;
