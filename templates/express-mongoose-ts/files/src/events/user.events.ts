import { eventBus } from "./eventBus";

export const USER_CREATED_EVENT = "user.created";

export const publishUserCreated = (user: any) => {
  eventBus.emit(USER_CREATED_EVENT, user);
};

export const subscribeToUserCreated = (callback: (user: any) => void) => {
  eventBus.on(USER_CREATED_EVENT, callback);
};
