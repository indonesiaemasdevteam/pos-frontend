import { APIClient } from "../api_helper";

const api = new APIClient();

// Gets the logged in user data from local session
// Gets the logged in user data from local session (client-side only)

// Calendar
// get Events
const fetchAllUsers = () => api.get("users");
const insertNewData = (event: any) => api.create("apps/users/panel", event);

export default { fetchAllUsers, insertNewData };
