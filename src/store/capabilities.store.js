import { getFacebookCapabilities } from "../api/facebook.capabilities.api";

let cache = null;

export const loadCapabilities = async () => {
  if (!cache) {
    cache = await getFacebookCapabilities();
  }
  return cache;
};

export const getCapabilities = () => cache;

export const isFacebookConnected = () => {
  return cache?.connected === true;
};

export const hasActivePage = () => {
  return cache?.hasActivePage === true;
};
