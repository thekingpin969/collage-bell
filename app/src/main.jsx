import { render } from 'preact';
import { Router, Route } from './router';
import './index.css';
import { Dashboard } from "./pages/Dashboard"
import { Schedules } from "./pages/Schedules"
import { Configure } from "./pages/Configure"
import { Settings } from "./pages/Settings"
import { Maintenance } from "./pages/Maintenance"



export function App() {
  return (
    <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/configure" component={Configure} />
        <Route path="/settings" component={Settings} />
        <Route path="/maintenance" component={Maintenance} />
    </Router>
  );
}

render(<App />, document.getElementById('app'));
