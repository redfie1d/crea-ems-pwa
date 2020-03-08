/*
Originator: Hidayatullah
Date: 2 Sep 2018
Common component to render input fields for forms
*/
import React from "react";
import { FormGroup, FormText, Input, Label, Alert} from "reactstrap";

const CommonInput = ({ name, label, error, text, ...rest }) => {
  return (
    <FormGroup>
      <Label for={name} className="mb-0">{label}</Label>
      {text.length > 0 && <FormText>{text}</FormText>}
      <Input
        {...rest}
        name={name}
        id={name}
        className=""
      />
      {error && <Alert color="danger">{error}</Alert>}
    </FormGroup>
  );
}

export default CommonInput;
