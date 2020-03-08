/*
Originator: Brandon
Date: 20 Jan 2019
Component to render create new location form for admins
*/
// Import external resourcess

import React from "react";
import Joi from "joi-browser";
import { Form } from "reactstrap";
import { toast } from "react-toastify";

// Import services
import libraryDuties from "../../services/libraryDutiesService";

// Import custom components
import CommonForm from '../../common/form';

class LocationForm extends CommonForm {
    state = {
      data: {
        locationName: "",
        address: "",
        postalCode: ""
      },
      allowCreate: true,
      locCreateLoading: false,
      errors: {},
    }

  schema = {
    locationName: Joi.string().required().label("Location Name"),
    address: Joi.string().required().label("Address"),
    postalCode: Joi.string().required().label("Postal Code"),
  };

  doSubmit = async e => {
    this.setState({ locCreateLoading: true, allowCreate: false });
    var { data } = this.state;
    e.preventDefault();
    try {
      const result = await libraryDuties.createLocation(data);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      const errors = { ...this.state.errors };
      this.setState({ errors });
      toast.error(ex.response.data);
    } finally {
      setTimeout(() => {
        this.setState({ locCreateLoading: false, allowCreate: true });
      }, 1500);
    }
  }

  render() {
    const { allowCreate, locCreateLoading } = this.state;
    return (
      <React.Fragment>
        <Form onSubmit={this.doSubmit}>
          {this.renderInput("locationName", "Location Name", "text", "")}
          {this.renderInput("address", "Address", "text", "")}
          {this.renderInput("postalCode", "Postal Code", "text", "")}
          {this.renderButton("Create Location", "40%", locCreateLoading, allowCreate)}
        </Form>
      </React.Fragment>
    );
  }

}

export default LocationForm;
