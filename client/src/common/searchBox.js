import React from 'react';
import { InputGroup, InputGroupAddon } from "reactstrap";
import { Search } from '@material-ui/icons';

const SearchBox = ({ value, placeholder, onChange }) => {

  return (
    <InputGroup>
      <InputGroupAddon addonType="prepend" style={{marginTop:"22px", marginRight:"8px"}}><Search style={{fill:"#52658F"}}/></InputGroupAddon>
      <input
        type="text"
        name="query"
        className="form-control my-3"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
      />
    </InputGroup>
  );
};

export default SearchBox;
