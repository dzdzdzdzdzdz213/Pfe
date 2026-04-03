export let demoModeActive = false;

export const setDemoMode = (active) => {
  demoModeActive = active;
};

export const isDemoMode = () => demoModeActive;

export const getMockData = (key, defaultData = []) => {
  try {
    return JSON.parse(localStorage.getItem(`demo_mock_${key}`) || JSON.stringify(defaultData));
  } catch (e) {
    return defaultData;
  }
};

export const saveMockData = (key, data) => {
  localStorage.setItem(`demo_mock_${key}`, JSON.stringify(data));
};
