A multi-layered settings menu using `videojs-plus`.

### How to add more settings to the menu
 
1. Create a new menu-item component inside `./menuItems`.
    - Extend from any of the base types in `./Components/SettingMenu/Item/.Setting*Item.js`.
    - Register the component to `SettingMenuButton.options_.entries`. See the bottom of any existing settings as an example.
2. Import the component in `./plugin.js` to run it.
3. Profit.

### Design suggestions

1. It's best to refactor the business logic for a particular videojs feature into one place, so that it can be accessed by different forms of GUI (e.g. button vs menu). 
    - The playback-rate is one good example, where the functionality is already encapsulated and exposed through `player.playbackRate()`. Both the Button and Menu implementation can access it independently.
2. If refactoring is not feasible, then a quick workaround is to hide the existing Button and make the Menu implementation programmatically click the Button. Communication can be done through videojs's event system. See `AutoPlayNextMenuItem` or `SnapshotMenuItem` as an example.
