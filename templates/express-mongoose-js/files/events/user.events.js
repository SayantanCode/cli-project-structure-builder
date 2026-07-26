import { eventBus } from "./eventBus.js";

export const USER_CREATED_EVENT = "user.created";

export const publishUserCreated = (user) => {
  eventBus.emit(USER_CREATED_EVENT, user);
};

export const subscribeToUserCreated = (callback) => {
  eventBus.on(USER_CREATED_EVENT, callback);
};
