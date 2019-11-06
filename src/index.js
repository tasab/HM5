import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { object } from "prop-types";

let accessProperties = [];
const derivationGraph = {};

function observable(targetObject) {
  const ObserableObject = {};

  const keys = Object.keys(targetObject);

  const id = Math.random();

  function getId(key) {
    return `Observable(${id}:${key})`;
  }

  keys.forEach(key => {
    const id = getId(key);

    ObserableObject[key] = targetObject[key];

    if (typeof targetObject !== "function") {
      Object.defineProperty(ObserableObject, key, {
        get() {
          accessProperties.push(id);
          return targetObject[key];
        },
        set(val) {
          targetObject[key] = val;

          if (derivationGraph[id]) {
            derivationGraph[id].forEach(fn => {
              fn();
            });
          }
        }
      });
    }
  });
  return ObserableObject;
}

function createReaction(whatSholdWeRunOnChange) {
  return {
    track(functionWhereWeUseObservables) {
      accessProperties = [];
      functionWhereWeUseObservables();

      console.log(derivationGraph);
      console.log(accessProperties);

      accessProperties.forEach(id => {
        derivationGraph[id] = derivationGraph[id] || [];
        if (derivationGraph[id].indexOf(whatSholdWeRunOnChange) < 0) {
          derivationGraph[id].push(whatSholdWeRunOnChange);
        }
      });
    }
  };
}

function autorun(cb) {
  const reaction = createReaction(cb);

  reaction.track(cb);
}

const store = observable({
  count: 0,
  somethingElse: 0,

  increment() {
    this.count += 1;
  }
});

autorun(() => {
  console.log("count Autorun", store.count);
});

function useForceUpdate() {
  const [, set] = useState(0);

  return () => set(val => val + 1);
}

function observer(baseComponent) {
  const wrapper = () => {
    const ForceUpdate = useForceUpdate();
    const reaction = useRef(null);

    if (!reaction.current) {
      reaction.current = createReaction(ForceUpdate);
    }
    let result;

    reaction.current.track(() => {
      result = baseComponent();
    });
    return result;
  };

  return wrapper;
}

store.count = 1;

function App() {
  return (
    <div className="App">
      <h1>Counter {store.count}</h1>
      <button onClick={() => store.increment()}>Increment</button>
    </div>
  );
}
const ObserveApp = observer(App);
const rootElement = document.getElementById("root");
ReactDOM.render(<ObserveApp />, rootElement);
