import { Route, Switch } from 'wouter';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetails from './pages/DeviceDetails';
import Schedules from './pages/Schedules';
import Firmware from './pages/Firmware';
import Logs from './pages/Logs';

export function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/devices" component={Devices} />
        <Route path="/device/:id" component={DeviceDetails} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/firmware" component={Firmware} />
        <Route path="/logs" component={Logs} />
      </Switch>
    </Layout>
  );
}
