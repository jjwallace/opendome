//LIB
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

//STORE
// import store from './tools/Store.js';
// import { toJS } from "mobx";
// import { observer } from "mobx-react";

//COMPONENTS
//import DomeCalculator from './components/calculator/DomeCalculator';

//STYLE
import css from './style.css';

var totalMaterial = 0;

export default class DomeCalculator extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: 7,
			value80: 4.95,
			value55: 4.84,
			value30: 1.02,
			valueD: 24,
			valueR: 12.0,
			valueA: 401.21,
			valueC: 75.4,
			valueH: 14.06,
			total: 0
		};

		this.handleChange80 = this.handleChange80.bind(this);
		this.handleChange55 = this.handleChange55.bind(this);
		this.handleChange30 = this.handleChange30.bind(this);
		this.handleChangeD = this.handleChangeD.bind(this);
		this.handleChangeR = this.handleChangeR.bind(this);
		this.handleChangeA = this.handleChangeA.bind(this);
		this.handleChangeC = this.handleChangeC.bind(this);
		this.handleChangeH = this.handleChangeH.bind(this);
	}

	handleFocus(event) {
		event.target.select();
	}

	handleChange80(event) {
		this.setState({ value80: event.target.value });
		this.calculateGeoDome("80", (event.target.value / 0.41241) * 2);
	}
	handleChange55(event) {
		this.setState({ value55: event.target.value });
		this.calculateGeoDome("55", (event.target.value / 0.40355) * 2);
	}
	handleChange30(event) {
		this.setState({ value30: event.target.value });
		this.calculateGeoDome("30", event.target.value / 0.34862);
	}
	handleChangeD(event) {
		this.setState({ valueD: event.target.value });
		this.calculateGeoDome("D", event.target.value);
	}
	handleChangeR(event) {
		this.setState({ valueR: event.target.value });
		this.calculateGeoDome("R", event.target.value / 2);
	}
	handleChangeA(event) {
		this.setState({ valueA: event.target.value });
		this.calculateGeoDome("A", Math.sqrt(event.target.value / 2.7862) * 2);
	}
	handleChangeC(event) {
		this.setState({ valueC: event.target.value });
		this.calculateGeoDome("C", event.target.value / Math.PI);
	}
	handleChangeH(event) {
		this.setState({ valueH: event.target.value });
		this.calculateGeoDome("H", (event.target.value / 1.172) * 2);
	}

	calculateGeoDome(exclude, myDiameter) {
		var diameter = myDiameter;
		var radius = diameter / 2;
		var area = 2.7862 * (diameter / 2) * (diameter / 2);
		var strut30 = radius * 0.34862;
		var strut55 = radius * 0.40355;
		var strut80 = radius * 0.41241;
		var total = 30 * strut30 + 55 * strut55 + 80 * strut80;
		var circumference = Math.PI * diameter;
		var height = radius * 1.172;

		if (exclude != "D") {
			diameter = diameter.toFixed(2);
		}
		radius = radius.toFixed(2);
		area = area.toFixed(2);
		strut30 = strut30.toFixed(2);
		strut55 = strut55.toFixed(2);
		strut80 = strut80.toFixed(2);
		total = total.toFixed(2);
		circumference = circumference.toFixed(2);
		height = height.toFixed(2);

		totalMaterial = total;

		if (exclude != "80") {
			this.setState({ value80: strut80 });
		}
		if (exclude != "55") {
			this.setState({ value55: strut55 });
		}
		if (exclude != "30") {
			this.setState({ value30: strut30 });
		}

		if (exclude != "D") {
			this.setState({ valueD: diameter });
		}
		if (exclude != "R") {
			this.setState({ valueR: radius });
		}
		if (exclude != "A") {
			this.setState({ valueA: area });
		}
		if (exclude != "C") {
			this.setState({ valueC: circumference });
		}
		if (exclude != "H") {
			this.setState({ valueH: height });
		}
	}

	render() {
		return (
			<div>

						<form>
							<div className="lblCals80 lblCalAll">
								80 x &nbsp;
								<input
									type="text"
									value={this.state.value80}
									onChange={this.handleChange80}
									onFocus={this.handleFocus}
									className="customInputText customInput80"
								/>
							</div>
							<div className="lblCals55 lblCalAll">
								55 x &nbsp;
								<input
									type="text"
									value={this.state.value55}
									onChange={this.handleChange55}
									onFocus={this.handleFocus}
									className="customInputText customInput55"
								/>
							</div>
							<div className="lblCals30 lblCalAll">
								30 x &nbsp;
								<input
									type="text"
									value={this.state.value30}
									onChange={this.handleChange30}
									onFocus={this.handleFocus}
									name="customInput30"
									className="customInputText customInput30"
								/>
							</div>
						</form>

						<form>
							<div className="lblCalD lblCalAll">
								Diameter &nbsp;
								<input
									type="text"
									value={this.state.valueD}
									onChange={this.handleChangeD}
									onFocus={this.handleFocus}
									className="customInputText customInputDiameter"
								/>
							</div>
							<div className="lblCalR lblCalAll">
								Radius &nbsp;
								<input
									type="text"
									value={this.state.valueR}
									onChange={this.handleChangeR}
									onFocus={this.handleFocus}
									className="customInputText customInputRadius"
								/>
							</div>
							<div className="lblCalA lblCalAll">
								Area &nbsp;
								<input
									type="text"
									value={this.state.valueA}
									onChange={this.handleChangeA}
									onFocus={this.handleFocus}
									className="customInputText customInputArea"
								/>
							</div>
							<div className="lblCalC lblCalAll">
								Circumference &nbsp;
								<input
									type="text"
									value={this.state.valueC}
									onChange={this.handleChangeC}
									onFocus={this.handleFocus}
									className="customInputText customInputCir"
								/>
							</div>
							<div className="lblCalH lblCalAll">
								Height &nbsp;
								<input
									type="text"
									value={this.state.valueH}
									onChange={this.handleChangeH}
									onFocus={this.handleFocus}
									className="customInputText customInputHeight"
								/>
							</div>

						</form>
			</div>
		);
	}
}