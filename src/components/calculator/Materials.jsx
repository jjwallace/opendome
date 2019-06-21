

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

//ASSETS
import bolts from './img/bolt.png';

var totalMaterial = 0;



export default class Materials extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			pipe05: 3.52,
			pipe75: 6.20,
			pipe10: 10.40,
			pipe20: 20.40,
			pipeLength: 10
		}
	}

	handleChange05(event) {
		this.setState({ pipe05: event.target.value });
		//this.calculateGeoDome("80", (event.target.value / 0.41241) * 2);
	}

	render() {
		return (
			<div className="infoPanel lblCalAll">
                <form>
					<div className="lblCalD lblCalAll">
						EMT 1/2" &nbsp;
						<input
							type="text"
							value={pipe05}
							onChange={this.handleChange05}
							onFocus={this.handleFocus}
							className="customInputText customInputDiameter"
						/>
					</div>
					<div className="lblCalR lblCalAll">
						EMT 3/4" &nbsp;
						<input
							type="text"
							value={pipe75}
							onChange={this.handleChange75}
							onFocus={this.handleFocus}
							className="customInputText customInputRadius"
						/>
					</div>
					<div className="lblCalR lblCalAll">
						EMT 1" &nbsp;
						<input
							type="text"
							value={pipe10}
							onChange={this.handleChange10}
							onFocus={this.handleFocus}
							className="customInputText customInputRadius"
						/>
					</div>
				</form>
			</div>
		);
	}
}