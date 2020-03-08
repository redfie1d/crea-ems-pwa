/*
Originator: Brandon
Date: 21 Jan 2019
Common functional component for select forms
*/

import React from 'react';

const CommonSelect = ({ name, label, options, error, dataName, ...rest }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select name={name} id={name} {...rest} className="form-control">
        <option value="" disabled hidden >Select...</option>
        {options.map(option => (
          <option key={option._id} value={option._id}>
            {option[dataName]}
          </option>
        ))}
      </select>
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default CommonSelect;
