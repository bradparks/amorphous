import * as React from 'react';

// TODO: Make these better defaults so you don't need a parent provider? 😬
// Or at least present an error message
const StateContext = React.createContext({});
const SetStateContext = React.createContext(() => null);

const wrapMethod = (lifeCycleMethod, methodWrapper) => {
  if (typeof lifeCycleMethod !== 'function') {
    return lifeCycleMethod;
  }

  return function(...args) {
    return methodWrapper.call(this, lifeCycleMethod, args);
  }
};

export class AppComponent extends React.Component {

  constructor(props) {
    super(props);
    this.appState = null;

    this.render = wrapMethod(this.render, AppComponent.prototype.wrapRender);
  }

  wrapShouldComponentUpdate(shouldComponentUpdate, args) {
    // TODO: how to do this?
    return shouldComponentUpdate.apply(this, args);
  }

  wrapRender(render, args) {
    return <SetStateContext.Consumer>
      {setAppState => (
        <StateContext.Consumer>
          {appState => {
            this.appState = appState;
            this.setAppState = setAppState;
            // TODO: check shouldComponentUpdate here?
            return render.apply(this, args);
          }}
        </StateContext.Consumer>
      )}
    </SetStateContext.Consumer>;
  }
}


const setAppStateRecursive = (path, i, subState, update) => {
  if (i === path.length) {
    return Object.assign({}, subState,
      (typeof update === 'function') ? update(subState) : update
    );
  }
  return Object.assign({}, setAppStateRecursive(
    path,
    i + 1,
    subState[path[i]],
    update
  ));
};

export class AppStateContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.appState || {};
    this.setAppState = this.setAppState.bind(this);
  }

  render() {
    return <SetStateContext.Provider value={this.setAppState}>
      <StateContext.Provider value={this.state}>
        {this.props.children}
      </StateContext.Provider>
    </SetStateContext.Provider>
  }

  setAppState(...args) {
    let path = [];
    let i = 0;
    while (i < args.length && (typeof args[i] === 'string')) {
      path.push(args[i]);
      i++;
    }
    const update = args[i];
    const callback = args[i + 1];
    this.setState(
      state => setAppStateRecursive(path, 0, state, update),
      callback
    );
  }
}

