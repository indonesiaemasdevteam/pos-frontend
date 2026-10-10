import { APIClient } from "../api_helper";

const api = new APIClient();

// Gets the logged in user data from local session
// Gets the logged in user data from local session (client-side only)

// Calendar
// get Events
const fetchAllRoles = () => api.get("apps/roles/panel");
export default { fetchAllRoles };
