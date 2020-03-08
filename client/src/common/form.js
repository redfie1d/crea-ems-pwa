/*
Originator: Hidayatullah
Date: 2 Sep 2018
Common functional component for forms
*/
import React, { Component } from "react";
import Joi from "joi-browser";
import CommonInput from "./input";
import CommonSelect from "./select";
import CircularProgress from '@material-ui/core/CircularProgress';

class CommonForm extends Component {
  state = {
    data: {},
    errors: {}
  };

  validate = () => {
    const options = { abortEarly: false };
    const { error } = Joi.validate(this.state.data, this.schema, options);
    if(!error) return null;

    const errors = {};
    for(let item of error.details) errors[item.path[0]] = item.message;
    return errors;
  };

  validateProperty = ({ name, value }) => {
    const obj = { [name]: value };
    const schema = { [name]: this.schema[name] };
    const { error } = Joi.validate(obj, schema);
    return error ? error.details[0].message : null;
  };

  handleSubmit = e => {
    e.preventDefault();
    // get our form data out of state

    const errors = this.validate();
    this.setState({ errors: errors || {} });
    if (errors) return;

    this.doSubmit();
  };

  // on change event to form inputs
  handleChange = ({ currentTarget: input }) => {
    const errors = {...this.state.errors};
    const errorMessage = this.validateProperty(input);
    if(errorMessage) errors[input.name] = errorMessage;
    else delete errors[input.name];

    const data = {...this.state.data};
    data[input.name] = input.value;

    this.setState({ data, errors });
  };

  renderButton(label, width, loading=false, allow=true) {
    return <button
              className="btn btn-primary"
              style={{width: width,backgroundColor:'#52658F',borderColor:'#52658F'}}
              disabled={this.validate() || !allow}
            >
              {
                loading ?
                  <div>
                    <CircularProgress size={20} />{" "}
                    {label}
                  </div>
                :
                  label
              }
            </button>
  }

  renderInput(name, label, type = "text", text = "") {
    const { data, errors } = this.state;

    return (
      <CommonInput
        name={name}
        type={type}
        label={label}
        onChange={this.handleChange}
        value={data[name]}
        error={errors[name]}
        text={text}
      />
    );
  }

  renderSelect(name, label, dataName, options) {
    const { data, errors } = this.state;

    return (
      <CommonSelect
        name={name}
        value={data[name]}
        label={label}
        options={options}
        onChange={this.handleChange}
        error={errors[name]}
        dataName={dataName}
      />
    );
  }
}

export default CommonForm;
