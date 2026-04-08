# oneko-react

A React port of [oneko.js](https://github.com/adryd325/oneko.js) with a few new features:

- Anchors to the DOM while asleep
- Clicking on it while awake puts it to sleep and keeps it in place
- Optionally wakes up automatically when it goes out of view, e.g after scrolling (`wakeOutOfView` prop)
- Additional props to control movement speed and animations

### Installation

`npm install @varthe/oneko-react`

### Usage example

```js
import { Oneko } from "@varthe/oneko-react"

export const MyComponent = () => {
  return (
    // Use anywhere in the DOM
    <Oneko />
  )
}
```

### Props

| Name            | Description                                                    | Type      | Default |
| --------------- | -------------------------------------------------------------- | --------- | ------- |
| `speed`         | Movement speed (px/frame)                                      | `number`  | `10`    |
| `wakeOutOfView` | Automatically wake up when out of view (unless manually slept) | `boolean` | `false` |
| `idleAfter`     | Time before idle animation after stopping (ms)                 | `number`  | `5000`  |
| `sleepAfter`    | Time before sleep after stopping (ms)                          | `number`  | `10000` |
