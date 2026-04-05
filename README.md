# oneko-react

[oneko.js](https://github.com/adryd325/oneko.js) as a React component. Follows the DOM structure.

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

| Name         | Description                                    | Type     | Default |
| ------------ | ---------------------------------------------- | -------- | ------- |
| `speed`      | Movement speed (px/frame)                      | `number` | `10`    |
| `offsetX`    | Starting horizontal offset (px)                | `number` | `0`     |
| `idleAfter`  | Time before idle animation after stopping (ms) | `number` | `5000`  |
| `sleepAfter` | Time before sleep after stopping (ms)          | `number` | `10000` |
