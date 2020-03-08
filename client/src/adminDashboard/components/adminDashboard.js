/*
Originator: Brandon
Date: 01 Feb 2019
Component to render all components for dashboard
*/
import React, {Component} from "react";
import CardSection from "./cardSection";
import GraphSection from "./graphSection";

class Dashboard extends Component {
  render() {
    return (
      <React.Fragment>
        <h2 style={{ marginBottom: "30px" }}>Dashboard</h2>
        <CardSection />
        <GraphSection />
      </React.Fragment>
    );
  }
}

export default Dashboard;
