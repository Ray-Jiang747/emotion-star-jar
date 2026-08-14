const VIEWS = new Set(['home', 'write', 'open', 'archive']);

export function createViewState(initialView = 'home') {
  if (!VIEWS.has(initialView)) throw new Error(`未知界面：${initialView}`);
  let activeView = initialView;
  const subscribers = new Set();

  const navigate = (view) => {
    if (!VIEWS.has(view)) throw new Error(`未知界面：${view}`);
    activeView = view;
    subscribers.forEach((subscriber) => subscriber(view));
    return activeView;
  };

  const subscribe = (subscriber) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  };

  return {
    current: () => activeView,
    navigate,
    subscribe
  };
}
