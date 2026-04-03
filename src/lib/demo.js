export let demoModeActive = false;

// Simple in-memory storage, mimicking a database session temporarily without using localStorage.
// All mock states reset per refresh to prevent liability leaks.
const memoryStore = {};

export const setDemoMode = (active) => {
  demoModeActive = active;
};

export const isDemoMode = () => demoModeActive;

export const getMockData = (key, defaultData = []) => {
  if (memoryStore[`demo_mock_${key}`] !== undefined) {
    return JSON.parse(JSON.stringify(memoryStore[`demo_mock_${key}`]));
  }
  return JSON.parse(JSON.stringify(defaultData));
};

export const saveMockData = (key, data) => {
  memoryStore[`demo_mock_${key}`] = JSON.parse(JSON.stringify(data));
};
